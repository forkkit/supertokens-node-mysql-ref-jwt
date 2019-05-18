import * as express from 'express';

import { createNewAccessToken, getInfoFromAccessToken, init as accessTokenInit } from './accessToken';
import Config from './config';
import {
    attachAccessTokenToCookie,
    attachRefreshTokenToCookie,
    clearSessionFromCookie,
    getAccessTokenFromCookie,
    getRefreshTokenFromCookie,
    requestHasSessionCookies,
} from './cookie';
import { AuthError, generateError } from './error';
import {
    createNewSession as createNewSessionInDB,
    deleteSession,
    getAllHash1SessionHandlesForUser,
    getSessionInfo_Transaction,
    updateSessionInfo_Transaction,
} from './helpers/dbQueries';
import { getConnection, Mysql } from './helpers/mysql';
import { TypeInputConfig } from './helpers/types';
import { generateUUID, hash } from './helpers/utils';
import { createNewRefreshToken, getInfoFromRefreshToken, init as refreshTokenInit } from './refreshToken';
import { Session } from './session';

export async function init(config: TypeInputConfig) {
    Config.init(config);
    await Mysql.init();
    await accessTokenInit();
    await refreshTokenInit();
}

export { AuthError as Error } from "./error";

export async function createNewSession(res: express.Response, userId: string,
    jwtPayload: any, sessionData?: { [key: string]: any }): Promise<Session> {
    let sessionHandle = generateUUID();

    // generate tokens:
    let refreshToken = await createNewRefreshToken(sessionHandle, userId, undefined);
    let accessToken = await createNewAccessToken(sessionHandle, userId, hash(refreshToken.token),
        undefined, jwtPayload);

    // create new session in db
    let connection = await getConnection();
    try {
        await createNewSessionInDB(connection, hash(sessionHandle), userId, hash(hash(refreshToken.token)), sessionData, refreshToken.expiry,
            jwtPayload);
    } finally {
        connection.closeConnection();
    }

    // attach tokens to cookies
    attachAccessTokenToCookie(res, accessToken.token, accessToken.expiry);
    attachRefreshTokenToCookie(res, refreshToken.token, refreshToken.expiry);

    // send reply to user
    return new Session(sessionHandle, userId, jwtPayload, res);
}

export async function getSession(req: express.Request, res: express.Response): Promise<Session> {
    let config = Config.get();
    if (!requestHasSessionCookies(req)) {
        // means ID refresh token is not available. Which means that refresh token is not going to be there either.
        // so the session does not exist.
        clearSessionFromCookie(res);
        throw generateError(AuthError.UNAUTHORISED, new Error("missing auth tokens in cookies"));
    }
    // get access token info from request
    let accessToken = getAccessTokenFromCookie(req);
    let accessTokenInfo = await getInfoFromAccessToken(accessToken);
    // at this point, we have a valid access token.
    if (accessTokenInfo.parentRefreshTokenHash1 === undefined) {
        return new Session(accessTokenInfo.sessionHandle, accessTokenInfo.userId, accessTokenInfo.userPayload, res);
    }

    // we must attempt to promote this child now
    let connection = await getConnection();
    try {
        await connection.startTransaction();
        let sessionHandle = accessTokenInfo.sessionHandle;
        let sessionInfo = await getSessionInfo_Transaction(connection, hash(sessionHandle));

        if (sessionInfo === undefined) {    // this session no longer exists.
            await connection.commit();
            clearSessionFromCookie(res);
            throw generateError(AuthError.UNAUTHORISED, new Error("missing auth tokens in cookies"));
        }

        let promote = sessionInfo.refreshTokenHash2 === hash(accessTokenInfo.parentRefreshTokenHash1);
        if (promote || sessionInfo.refreshTokenHash2 === hash(accessTokenInfo.refreshTokenHash1)) {
            if (promote) {
                // we now have to promote:
                await updateSessionInfo_Transaction(connection, hash(sessionHandle), hash(accessTokenInfo.refreshTokenHash1),
                    sessionInfo.sessionData, Date.now() + config.tokens.refreshToken.validity);
            }
            await connection.commit();

            // we need to remove PRT from JWT.
            let newAccessToken = await createNewAccessToken(sessionHandle, accessTokenInfo.userId, accessTokenInfo.refreshTokenHash1,
                undefined, accessTokenInfo.userPayload);
            attachAccessTokenToCookie(res, newAccessToken.token, newAccessToken.expiry);
            return new Session(sessionHandle, accessTokenInfo.userId, accessTokenInfo.userPayload, res);
        }

        // here it means that this access token is old..
        await connection.commit();
        clearSessionFromCookie(res);
        throw generateError(AuthError.UNAUTHORISED, new Error("missing auth tokens in cookies"));
    } finally {
        connection.closeConnection();
    }
}

export async function refreshSession(req: express.Request, res: express.Response): Promise<Session> {
    let config = Config.get();
    let refreshToken = getRefreshTokenFromCookie(req);
    let refreshTokenInfo;
    try {
        refreshTokenInfo = await getInfoFromRefreshToken(refreshToken);
    } catch (err) {
        clearSessionFromCookie(res);
        throw err;
    }
    return await refreshSessionHelper(res, refreshToken, refreshTokenInfo);
}

async function refreshSessionHelper(res: express.Response, refreshToken: string, refreshTokenInfo: {
    sessionHandle: string,
    userId: string,
    parentRefreshTokenHash1: string | undefined
}): Promise<Session> {
    let connection = await getConnection();
    try {
        let sessionHandle = refreshTokenInfo.sessionHandle;
        await connection.startTransaction();

        let sessionInfo = await getSessionInfo_Transaction(connection, hash(sessionHandle));

        if (sessionInfo === undefined || sessionInfo.expiresAt < Date.now()) {
            await connection.commit();
            clearSessionFromCookie(res);
            throw generateError(AuthError.UNAUTHORISED, new Error("session does not exist or has expired"));
        }

        if (sessionInfo.userId !== refreshTokenInfo.userId) {
            // TODO: maybe refresh token key has been stolen?
            await connection.commit();
            clearSessionFromCookie(res);
            throw generateError(AuthError.UNAUTHORISED, new Error("userId for session does not match that in refresh token"));
        }

        if (sessionInfo.refreshTokenHash2 === hash(hash(refreshToken))) {
            await connection.commit();
            let newRefreshToken = await createNewRefreshToken(sessionHandle, refreshTokenInfo.userId, hash(refreshToken));
            let newAccessToken = await createNewAccessToken(sessionHandle, refreshTokenInfo.userId, hash(newRefreshToken.token),
                hash(refreshToken), sessionInfo.jwtPayload);
            attachAccessTokenToCookie(res, newAccessToken.token, newAccessToken.expiry);
            attachRefreshTokenToCookie(res, newRefreshToken.token, newRefreshToken.expiry);
            return new Session(sessionHandle, refreshTokenInfo.userId, sessionInfo.jwtPayload, res);
        }

        if (refreshTokenInfo.parentRefreshTokenHash1 !== undefined &&
            hash(refreshTokenInfo.parentRefreshTokenHash1) === sessionInfo.refreshTokenHash2) {
            await updateSessionInfo_Transaction(connection, hash(sessionHandle),
                hash(hash(refreshToken)), sessionInfo.sessionData, sessionInfo.expiresAt);
            await connection.commit();
            return await refreshSessionHelper(res, refreshToken, refreshTokenInfo);
        }

        await connection.commit();
        clearSessionFromCookie(res);
        let config = Config.get();
        config.onTokenTheftDetection(refreshTokenInfo.userId, refreshTokenInfo.sessionHandle);
        throw generateError(AuthError.UNAUTHORISED, new Error("token has been stolen!?"));
    } finally {
        connection.closeConnection();
    }
}

export async function revokeAllSessionsForUser(userId: string) {
    let connection = await getConnection();
    try {
        let sessionHandleHash1List = await getAllHash1SessionHandlesForUser(connection, userId);
        for (let i = 0; i < sessionHandleHash1List.length; i++) {
            await revokeSessionUsingSessionHandleHelper(sessionHandleHash1List[i]);
        }
    } finally {
        connection.closeConnection();
    }
}

export async function revokeSessionUsingSessionHandle(sessionHandle: string) {
    return await revokeSessionUsingSessionHandleHelper(hash(sessionHandle));
}

async function revokeSessionUsingSessionHandleHelper(sessionHandleHash1: string) {
    let connection = await getConnection();
    try {
        await deleteSession(connection, sessionHandleHash1);
    } finally {
        connection.closeConnection();
    }
}