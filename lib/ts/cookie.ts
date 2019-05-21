import * as express from 'express';

import Config from './config';
import { AuthError, generateError } from './error';
import { generateUUID } from './helpers/utils';

const accessTokenCookieKey = "sAccessToken";
const refreshTokenCookieKey = "sRefreshToken";
const idRefreshTokenCookieKey = "sIdRefreshToken";

/**
 * @description clears all the auth cookies from the response
 */
export function clearSessionFromCookie(res: express.Response) {
    let config = Config.get();
    setCookie(res, accessTokenCookieKey, "", config.cookie.domain,
        config.cookie.secure, true, 0, "/");
    setCookie(res, idRefreshTokenCookieKey, "", config.cookie.domain,
        false, false, 0, "/");
    setCookie(res, refreshTokenCookieKey, "", config.cookie.domain,
        config.cookie.secure, true, 0, config.tokens.refreshToken.renewTokenPath);
}

export function attachAccessTokenToCookie(res: express.Response, token: string, expiry: number) {
    let config = Config.get();
    setCookie(res, accessTokenCookieKey, token, config.cookie.domain,
        config.cookie.secure, true, expiry, "/");
}

/**
 * @sideEffect also attach id refresh token
 * */
export function attachRefreshTokenToCookie(res: express.Response, token: string, expiry: number) {
    let config = Config.get();
    setCookie(res, idRefreshTokenCookieKey, generateUUID(), config.cookie.domain,
        false, false, expiry, "/");
    setCookie(res, refreshTokenCookieKey, token, config.cookie.domain,
        config.cookie.secure, true, expiry, config.tokens.refreshToken.renewTokenPath);
}

/**
 * @description if this returns true, then there is a chance that the session may still be alive
 * because the user may have the refresh token.
 */
export function requestHasSessionCookies(req: express.Request): boolean {
    return getCookieValue(req, idRefreshTokenCookieKey) !== undefined;
}

/**
 * @throws AuthError TRY_REFRESH_TOKEN
 */
export function getAccessTokenFromCookie(req: express.Request): string {
    let value = getCookieValue(req, accessTokenCookieKey);
    if (value === undefined) {
        throw generateError(AuthError.TRY_REFRESH_TOKEN, new Error("No access token found in cookies"));
    }
    return value;
}

/**
 * @throws AuthError UNAUTHORISED
 */
export function getRefreshTokenFromCookie(req: express.Request): string {
    let value = getCookieValue(req, refreshTokenCookieKey);
    if (value === undefined) {
        throw generateError(AuthError.UNAUTHORISED, new Error("No refresh token found in cookies"));
    }
    return value;
}

/**
 * @param res 
 * @param key 
 * @param value 
 * @param domain 
 * @param secure 
 * @param httpOnly 
 * @param maxAge 
 * @param path 
 */
export function setCookie(res: express.Response, key: string, value: string, domain: string,
    secure: boolean, httpOnly: boolean,
    expires: number, path: string | undefined) {
    if (path === undefined) {
        path = "/";
    }
    let cookieOptions: express.CookieOptions = {
        domain,
        secure,
        httpOnly,
        expires: new Date(expires),
        path
    };
    res.cookie(key, value, cookieOptions);
}

/**
 * 
 * @param throws AuthError GENERAL_ERROR
 */
export function getCookieValue(req: express.Request, key: string): string | undefined {
    if (req.cookies === undefined) {
        throw generateError(AuthError.GENERAL_ERROR, new Error("did you forget to use cookie-parser middleware?"));
    }
    return req.cookies[key];
}