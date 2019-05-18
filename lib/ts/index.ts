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
        await createNewSessionInDB(connection, hash(sessionHandle), userId, hash(hash(refreshToken.token)), sessionData, refreshToken.expiry);
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
    await refreshSessionHelper(res, refreshToken, refreshTokenInfo);
}

async function refreshSessionHelper(res: express.Response, refreshToken: string, refreshTokenInfo: {
    sessionHandle: string,
    userId: string,
    parentRefreshTokenHash1: string | undefined
}) {
    let connection = await getConnection();
    try {
        connection.startTransaction();
        // we first read session info from DB
        // TODO:

        connection.closeConnection();
    } finally {
        connection.closeConnection();
    }
}

export async function revokeAllSessionsForUser(userId: string) {

}

export async function revokeSessionUsingSessionHandle(sessionHandle: string) {

}