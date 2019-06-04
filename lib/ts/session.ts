import {
    createNewAccessToken,
    getInfoFromAccessToken,
    init as accessTokenInit
} from "./accessToken";
import Config from "./config";
import CronJob from "./cronjobs";
import { AuthError, generateError } from "./error";
import {
    createNewSession as createNewSessionInDB,
    deleteSession,
    getAllHash1SessionHandlesForUser,
    getSessionData as getSessionDataFromDB,
    getSessionInfo_Transaction,
    updateSessionData as updateSessionDataInDB,
    updateSessionInfo_Transaction
} from "./helpers/dbQueries";
import { getConnection, Mysql } from "./helpers/mysql";
import { TypeInputConfig } from "./helpers/types";
import { generateUUID, hash } from "./helpers/utils";
import {
    createNewRefreshToken,
    getInfoFromRefreshToken,
    init as refreshTokenInit
} from "./refreshToken";

/**
 * @description: to be called by user of the library. This initiates all the modules necessary for this library to work.
 * Please create a database in your mysql instance before calling this function
 * @throws AuthError GENERAL_ERROR in case anything fails.
 */
export async function init(config: TypeInputConfig) {
    Config.init(config);
    await Mysql.init();
    await accessTokenInit();
    await refreshTokenInit();
    CronJob.init();
}

/**
 * @description call this to "login" a user.
 * @throws GENERAL_ERROR in case anything fails.
 */
export async function createNewSession(
    userId: string,
    jwtPayload?: any,
    sessionData?: any
): Promise<{
    session: {
        handle: string;
        userId: string;
        jwtPayload: any;
    };
    accessToken: { value: string; expires: number };
    refreshToken: {
        value: string;
        expires: number;
    };
    idRefreshToken: { value: string; expires: number };
}> {
    let sessionHandle = generateUUID();

    // generate tokens:
    let refreshToken = await createNewRefreshToken(
        sessionHandle,
        userId,
        undefined
    );
    let accessToken = await createNewAccessToken(
        sessionHandle,
        userId,
        hash(refreshToken.token),
        undefined,
        jwtPayload
    );

    // create new session in db
    let connection = await getConnection();
    try {
        // we store hashed versions of what we send over to the client so that in case the database is compromised, it's still OK.
        await createNewSessionInDB(
            connection,
            hash(sessionHandle),
            userId,
            hash(hash(refreshToken.token)),
            sessionData,
            refreshToken.expiry,
            jwtPayload
        );
    } finally {
        connection.closeConnection();
    }

    return {
        session: {
            handle: sessionHandle,
            userId,
            jwtPayload
        },
        accessToken: { value: accessToken.token, expires: accessToken.expiry },
        refreshToken: {
            value: refreshToken.token,
            expires: refreshToken.expiry
        },
        idRefreshToken: { value: generateUUID(), expires: refreshToken.expiry }
    };
}

/**
 * @description authenticates a session. To be used in APIs that require authentication
 * @throws AuthError, GENERAL_ERROR, UNAUTHORISED and TRY_REFRESH_TOKEN
 */
export async function getSession(
    idRefreshToken: string,
    accessToken: string
): Promise<{
    session: {
        handle: string;
        userId: string;
        jwtPayload: any;
    };
    newAccessToken: { value: string; expires: number } | undefined;
}> {
    let config = Config.get();

    let accessTokenInfo = await getInfoFromAccessToken(accessToken); // if access token is invalid, this will throw TRY_REFRESH_TOKEN error.

    // at this point, we have a valid access token.
    if (accessTokenInfo.parentRefreshTokenHash1 === undefined) {
        // this means that the refresh token associated with this access token is already the parent - most probably.
        return {
            session: {
                handle: accessTokenInfo.sessionHandle,
                userId: accessTokenInfo.userId,
                jwtPayload: accessTokenInfo.userPayload
            },
            newAccessToken: undefined
        };
    }

    // we must attempt to promote this child refresh token now
    let connection = await getConnection();
    try {
        // we start a transaction so that we can later lock that particular row for updating.
        await connection.startTransaction();
        let sessionHandle = accessTokenInfo.sessionHandle;
        let sessionInfo = await getSessionInfo_Transaction(
            connection,
            hash(sessionHandle)
        );

        if (sessionInfo === undefined) {
            // this session no longer exists in db
            await connection.commit();
            throw generateError(
                AuthError.UNAUTHORISED,
                new Error("missing session in db")
            );
        }

        let promote =
            sessionInfo.refreshTokenHash2 ===
            hash(accessTokenInfo.parentRefreshTokenHash1);
        if (
            promote ||
            sessionInfo.refreshTokenHash2 ===
                hash(accessTokenInfo.refreshTokenHash1)
        ) {
            // at this point, the sent access token's refresh token is either a parent or child
            if (promote) {
                // we now have to promote to make the child a parent since we now know that the frontend has these tokens for sure.
                await updateSessionInfo_Transaction(
                    connection,
                    hash(sessionHandle),
                    hash(accessTokenInfo.refreshTokenHash1),
                    sessionInfo.sessionData,
                    Date.now() + config.tokens.refreshToken.validity
                );
            }
            await connection.commit();

            // at this point, this access token's refresh token is a parent for sure.
            // we need to remove PRT from JWT so that next time this JWT is used, it does not look at the DB.
            let newAccessToken = await createNewAccessToken(
                sessionHandle,
                accessTokenInfo.userId,
                accessTokenInfo.refreshTokenHash1,
                undefined,
                accessTokenInfo.userPayload
            );
            return {
                session: {
                    handle: sessionHandle,
                    userId: accessTokenInfo.userId,
                    jwtPayload: accessTokenInfo.userPayload
                },
                newAccessToken: {
                    value: newAccessToken.token,
                    expires: newAccessToken.expiry
                }
            };
        }

        // here it means that this access token's refresh token is old and not in the db at the moment.
        // maybe here we can call token theft too.
        await connection.commit();
        throw generateError(
            AuthError.UNAUTHORISED,
            new Error("using access token whose refresh token is no more.")
        );
    } finally {
        connection.closeConnection(); // this will also make sure to destroy connection if not commited.
    }
}

/**
 * @description generates new access and refresh tokens for a given refresh token. Called when client's access token has expired.
 * @throws AuthError, GENERAL_ERROR, UNAUTHORISED
 */
export async function refreshSession(
    idRefreshToken: string,
    refreshToken: string
): Promise<
    | {
          sessionTheftDetected: false;
          session: {
              handle: string;
              userId: string;
              jwtPayload: any;
          };
          newAccessToken: { value: string; expires: number };
          newRefreshToken: { value: string; expires: number };
          newIdRefreshToken: { value: string; expires: number };
      }
    | {
          sessionTheftDetected: true;
          session: {
              handle: string;
              userId: string;
          };
      }
> {
    let config = Config.get();

    // here we decrypt and verify the refresh token. If this fails, it means either the key has changed. Or that someone is sending a "fake" refresh token.
    let refreshTokenInfo = await getInfoFromRefreshToken(refreshToken);

    return await refreshSessionHelper(refreshToken, refreshTokenInfo);
}

/**
 * @description this function exists since we need to recurse on it. It has the actual logic for creating child tokens given the parent refresh token.
 * @throws AuthError, GENERAL_ERROR, UNAUTHORISED
 */
async function refreshSessionHelper(
    refreshToken: string,
    refreshTokenInfo: {
        sessionHandle: string;
        userId: string;
        parentRefreshTokenHash1: string | undefined;
    }
): Promise<
    | {
          sessionTheftDetected: false;
          session: {
              handle: string;
              userId: string;
              jwtPayload: any;
          };
          newAccessToken: { value: string; expires: number };
          newRefreshToken: { value: string; expires: number };
          newIdRefreshToken: { value: string; expires: number };
      }
    | {
          sessionTheftDetected: true;
          session: {
              handle: string;
              userId: string;
          };
      }
> {
    let config = Config.get();
    let connection = await getConnection();
    try {
        let sessionHandle = refreshTokenInfo.sessionHandle;
        // we start a transaction so that we can later lock that particular row for updating.
        await connection.startTransaction();

        let sessionInfo = await getSessionInfo_Transaction(
            connection,
            hash(sessionHandle)
        );

        if (sessionInfo === undefined || sessionInfo.expiresAt < Date.now()) {
            await connection.commit();
            throw generateError(
                AuthError.UNAUTHORISED,
                new Error("session does not exist or has expired")
            );
        }

        if (sessionInfo.userId !== refreshTokenInfo.userId) {
            // TODO: maybe refresh token key has been compromised since the validation part checked out. And the row is in the table.
            // The only way this is possible is if there is a bug somewhere, or the client somehow generated a valid refresh token and changed the userId in it.
            await connection.commit();
            throw generateError(
                AuthError.UNAUTHORISED,
                new Error(
                    "userId for session does not match the userId in the refresh token"
                )
            );
        }

        if (sessionInfo.refreshTokenHash2 === hash(hash(refreshToken))) {
            // at this point, the input refresh token is the parent one.
            await connection.commit();
            // we create children token for this refresh token. The child tokens have a refrence to the current refresh token which will enable them to become parents when they are used.
            // notice that we do not need to store them in the database since their parent (current refresh token) is already stored.
            let newRefreshToken = await createNewRefreshToken(
                sessionHandle,
                refreshTokenInfo.userId,
                hash(refreshToken)
            );
            let newAccessToken = await createNewAccessToken(
                sessionHandle,
                refreshTokenInfo.userId,
                hash(newRefreshToken.token),
                hash(refreshToken),
                sessionInfo.jwtPayload
            );
            return {
                sessionTheftDetected: false,
                session: {
                    handle: sessionHandle,
                    userId: refreshTokenInfo.userId,
                    jwtPayload: sessionInfo.jwtPayload
                },
                newAccessToken: {
                    value: newAccessToken.token,
                    expires: newAccessToken.expiry
                },
                newRefreshToken: {
                    value: newRefreshToken.token,
                    expires: newRefreshToken.expiry
                },
                newIdRefreshToken: {
                    value: generateUUID(),
                    expires: newRefreshToken.expiry
                }
            };
        }

        if (
            refreshTokenInfo.parentRefreshTokenHash1 !== undefined &&
            hash(refreshTokenInfo.parentRefreshTokenHash1) ===
                sessionInfo.refreshTokenHash2
        ) {
            // At this point, the input refresh token is a child and its parent is in the database. Normally, this part of the code
            // will be reached only when the client uses a refresh token to request a new refresh token before
            // using its access token. This would happen in case client recieves a new set of tokens and right before the next
            // API call, the app is killed. and when the app opens again, the client's access token is expired.

            // Since this is used by the client, we know that the client has this set of tokens, so we can make them the parent.
            // Here we set the expiry based on the current time and not the time this refresh token was created. This may
            // result in refresh tokens living on for a longer period of time than what is expected. But that is OK, since they keep changing
            // based on access token's expiry anyways.
            // This can be solved fairly easily by keeping the expiry time in the refresh token payload as well.
            await updateSessionInfo_Transaction(
                connection,
                hash(sessionHandle),
                hash(hash(refreshToken)),
                sessionInfo.sessionData,
                Date.now() + config.tokens.refreshToken.validity
            );
            await connection.commit();

            // now we can generate children tokens for the current input token.
            return await refreshSessionHelper(refreshToken, refreshTokenInfo);
        }

        // If it reaches here, it means the client used a refresh token that is valid and has a session
        // but that refresh token is neither a child, nor a parent. This would happen only in the case of token theft since the frontend
        // synchronises calls to refresh token API.
        await connection.commit();

        return {
            sessionTheftDetected: true,
            session: {
                handle: refreshTokenInfo.sessionHandle,
                userId: refreshTokenInfo.userId
            }
        };
    } finally {
        connection.closeConnection();
    }
}

/**
 * @description deletes session info of a user from db. This only invalidates the refresh token. Not the access token.
 * Access tokens cannot be immediately invalidated. Unless we add a bloacklisting method. Or changed the private key to sign them.
 * @throws AuthError, GENERAL_ERROR
 */
export async function revokeAllSessionsForUser(userId: string) {
    let connection = await getConnection();
    try {
        let sessionHandleHash1List = await getAllHash1SessionHandlesForUser(
            connection,
            userId
        );
        for (let i = 0; i < sessionHandleHash1List.length; i++) {
            await revokeSessionUsingSessionHandleHelper(
                sessionHandleHash1List[i]
            );
        }
    } finally {
        connection.closeConnection();
    }
}

/**
 * @description call to destroy one session
 * @returns true if session was deleted from db. Else false in case there was nothing to delete
 * @throws AuthError, GENERAL_ERROR
 */
export async function revokeSessionUsingSessionHandle(
    sessionHandle: string
): Promise<boolean> {
    return await revokeSessionUsingSessionHandleHelper(hash(sessionHandle));
}

async function revokeSessionUsingSessionHandleHelper(
    sessionHandleHash1: string
): Promise<boolean> {
    let connection = await getConnection();
    try {
        let numberOfAffectedRows = await deleteSession(
            connection,
            sessionHandleHash1
        );
        return numberOfAffectedRows === 1;
    } finally {
        connection.closeConnection();
    }
}

/**
 * @description: this function reads from the database every time. It provides no locking mechanism in case other processes are updating session data for this session as well, so please take of that by yourself.
 * @returns session data as provided by the user earlier
 * @throws AuthError GENERAL_ERROR, UNAUTHORISED.
 */
export async function getSessionData(sessionHandle: string): Promise<any> {
    let connection = await getConnection();
    try {
        let result = await getSessionDataFromDB(
            connection,
            hash(sessionHandle)
        );
        if (!result.found) {
            throw generateError(
                AuthError.UNAUTHORISED,
                new Error("session does not exist anymore")
            );
        } else {
            return result.data;
        }
    } finally {
        connection.closeConnection();
    }
}

/**
 * @description: It provides no locking mechanism in case other processes are updating session data for this session as well.
 * @throws AuthError GENERAL_ERROR, UNAUTHORISED.
 */
export async function updateSessionData(
    sessionHandle: string,
    newSessionData: any
) {
    let connection = await getConnection();
    try {
        let numberOfAffectedRows = await updateSessionDataInDB(
            connection,
            hash(sessionHandle),
            newSessionData
        );
        if (numberOfAffectedRows !== 1) {
            // did not update anything, which means there was nothing to update, which means the session does not exist.
            throw generateError(
                AuthError.UNAUTHORISED,
                new Error("session does not exist anymore")
            );
        }
    } finally {
        connection.closeConnection();
    }
}
