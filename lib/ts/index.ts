import * as express from 'express';

import Config from './config';
import {
    attachAccessTokenToCookie,
    attachIdRefreshTokenToCookie,
    attachRefreshTokenToCookie,
    clearSessionFromCookie,
    getAccessTokenFromCookie,
    getIdRefreshTokenFromCookie,
    getRefreshTokenFromCookie,
} from './cookie';
import { AuthError, generateError } from './error';
import { TypeInputConfig } from './helpers/types';
import * as SessionFunctions from './session';

export { AuthError as Error } from "./error";

/**
 * @description: to be called by user of the library. This initiates all the modules necessary for this library to work.
 * Please create a database in your mysql instance before calling this function
 * @throws AuthError GENERAL_ERROR in case anything fails.
 */
export async function init(config: TypeInputConfig) {
    await SessionFunctions.init(config);
}

/**
 * @description call this to "login" a user. This overwrites any existing session that exists.
 * To check if a session exists, call getSession function.
 * @throws GENERAL_ERROR in case anything fails.
 * @sideEffect sets cookies in res
 */
export async function createNewSession(res: express.Response, userId: string,
    jwtPayload?: any, sessionData?: any): Promise<Session> {
    let response = await SessionFunctions.createNewSession(userId, jwtPayload, sessionData);

    // attach tokens to cookies
    attachAccessTokenToCookie(res, response.accessToken.value, response.accessToken.expires);
    attachRefreshTokenToCookie(res, response.refreshToken.value, response.refreshToken.expires);
    attachIdRefreshTokenToCookie(res, response.idRefreshToken.value, response.idRefreshToken.expires);

    return new Session(response.session.handle, response.session.userId, response.session.jwtPayload, res);
}

/**
 * @description authenticates a session. To be used in APIs that require authentication
 * @throws AuthError, GENERAL_ERROR, UNAUTHORISED and TRY_REFRESH_TOKEN
 * @sideEffects may remove cookies, or change the accessToken.
 */
export async function getSession(req: express.Request, res: express.Response): Promise<Session> {
    let idRefreshToken = getIdRefreshTokenFromCookie(req);
    if (idRefreshToken === undefined) {
        // This means refresh token is not going to be there either, so the session does not exist.
        clearSessionFromCookie(res);
        throw generateError(AuthError.UNAUTHORISED, new Error("missing auth tokens in cookies"));
    }

    let accessToken = getAccessTokenFromCookie(req);
    if (accessToken === undefined) {
        // maybe the access token has expired.
        throw generateError(AuthError.TRY_REFRESH_TOKEN, new Error("access token missing in cookies"));
    }

    try {
        let response = await SessionFunctions.getSession(idRefreshToken, accessToken);
        if (response.newAccessToken !== undefined) {
            attachAccessTokenToCookie(res, response.newAccessToken.value, response.newAccessToken.expires);
        }
        return new Session(response.session.handle, response.session.userId, response.session.jwtPayload, res);
    } catch (err) {
        if (AuthError.isErrorFromAuth(err) && err.errType === AuthError.UNAUTHORISED) {
            clearSessionFromCookie(res);
        }
        throw err;
    }

}

/**
 * @description generates new access and refresh tokens for a given refresh token. Called when client's access token has expired.
 * @throws AuthError, GENERAL_ERROR, UNAUTHORISED
 * @sideEffects may remove cookies, or change the accessToken and refreshToken.
 */
export async function refreshSession(req: express.Request, res: express.Response): Promise<Session> {
    let config = Config.get();

    let refreshToken = getRefreshTokenFromCookie(req);
    let idRefreshToken = getIdRefreshTokenFromCookie(req);
    if (refreshToken === undefined || idRefreshToken === undefined) {
        clearSessionFromCookie(res);
        throw generateError(AuthError.UNAUTHORISED, new Error("missing auth tokens in cookies"));
    }

    try {
        let response = await SessionFunctions.refreshSession(idRefreshToken, refreshToken);
        if (response.sessionTheftDetected) {
            clearSessionFromCookie(res);
            config.onTokenTheftDetection(response.session.userId, response.session.handle);
            throw generateError(AuthError.UNAUTHORISED, new Error("session theft detected"));
        } else {

            // attach tokens to cookies
            attachAccessTokenToCookie(res, response.newAccessToken.value, response.newAccessToken.expires);
            attachRefreshTokenToCookie(res, response.newRefreshToken.value, response.newRefreshToken.expires);
            attachIdRefreshTokenToCookie(res, response.newIdRefreshToken.value, response.newIdRefreshToken.expires);

            return new Session(response.session.handle, response.session.userId, response.session.jwtPayload, res);
        }
    } catch (err) {
        if (AuthError.isErrorFromAuth(err) && err.errType === AuthError.UNAUTHORISED) {
            clearSessionFromCookie(res);
        }
        throw err;
    }
}

/**
 * @description deletes session info of a user from db. This only invalidates the refresh token. Not the access token.
 * Access tokens cannot be immediately invalidated. Unless we add a bloacklisting method. Or changed the private key to sign them.
 * @throws AuthError, GENERAL_ERROR
 */
export async function revokeAllSessionsForUser(userId: string) {
    return await SessionFunctions.revokeAllSessionsForUser(userId);
}

/**
 * @description Called by client normally when token theft is detected.
 * @throws AuthError, GENERAL_ERROR
 */
export async function revokeSessionUsingSessionHandle(sessionHandle: string) {
    await SessionFunctions.revokeSessionUsingSessionHandle(sessionHandle);
}

/**
 * @class Session
 * @description an instance of this is created when a session is valid.
 */
export class Session {
    private sessionHandle: string;
    private userId: string;
    private jwtUserPayload: any;
    private res: express.Response;

    constructor(sessionHandle: string, userId: string,
        jwtUserPayload: any, res: express.Response) {
        this.sessionHandle = sessionHandle;
        this.userId = userId;
        this.jwtUserPayload = jwtUserPayload;
        this.res = res;
    }

    /**
     * @description call this to logout the current user. 
     * This only invalidates the refresh token. The access token can still be used after
     * @sideEffect may clear cookies from response.
     * @throw AuthError GENERAL_ERROR
     */
    revokeSession = async () => {
        if (await SessionFunctions.revokeSessionUsingSessionHandle(this.sessionHandle)) {
            clearSessionFromCookie(this.res);
        }
    }

    /**
     * @description: this function reads from the database every time. It provides no locking mechanism in case other processes are updating session data for this session as well, so please take of that by yourself.
     * @returns session data as provided by the user earlier
     * @sideEffect may clear cookies from response.
     * @throws AuthError GENERAL_ERROR, UNAUTHORISED. 
     */
    getSessionData = async (): Promise<any> => {
        try {
            return await SessionFunctions.getSessionData(this.sessionHandle);
        } catch (err) {
            if (AuthError.isErrorFromAuth(err) && err.errType === AuthError.UNAUTHORISED) {
                clearSessionFromCookie(this.res);
            }
            throw err;
        }
    }

    /**
     * @description: It provides no locking mechanism in case other processes are updating session data for this session as well.
     * @param newSessionData this can be anything: an array, a promitive type, object etc etc. This will overwrite the current value stored in the database.
     * @sideEffect may clear cookies from response.
     * @throws AuthError GENERAL_ERROR, UNAUTHORISED. 
     */
    updateSessionData = async (newSessionData: any) => {
        try {
            await SessionFunctions.updateSessionData(this.sessionHandle, newSessionData);
        } catch (err) {
            if (AuthError.isErrorFromAuth(err) && err.errType === AuthError.UNAUTHORISED) {
                clearSessionFromCookie(this.res);
            }
            throw err;
        }
    }

    getUserId = () => {
        return this.userId;
    }

    getJWTPayload = () => {
        return this.jwtUserPayload;
    }
}
