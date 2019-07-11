import * as express from "express";

import Config from "./config";
import { AuthError, generateError } from "./error";

const accessTokenCookieKey = "sAccessToken";
const refreshTokenCookieKey = "sRefreshToken";
const idRefreshTokenCookieKey = "sIdRefreshToken"; // if you change this name and are using supertokens-website or anything that uses is, then be sure to also change the name of this cookie there. To find the usage of this in those packages, you can simply search for "sIdRefreshToken"
const antiCsrfHeaderKey = "anti-csrf";

/**
 * @description clears all the auth cookies from the response
 */
export function clearSessionFromCookie(res: express.Response) {
    let config = Config.get();
    setCookie(res, accessTokenCookieKey, "", config.cookie.domain, config.cookie.secure, true, 0, "/");
    setCookie(res, idRefreshTokenCookieKey, "", config.cookie.domain, false, false, 0, "/");
    setCookie(
        res,
        refreshTokenCookieKey,
        "",
        config.cookie.domain,
        config.cookie.secure,
        true,
        0,
        config.tokens.refreshToken.renewTokenPath
    );
}

/**
 * @param expiry: must be time in milliseconds from epoch time.
 */
export function attachAccessTokenToCookie(res: express.Response, token: string, expiry: number) {
    let config = Config.get();
    setCookie(
        res,
        accessTokenCookieKey,
        token,
        config.cookie.domain,
        config.cookie.secure,
        true,
        expiry,
        config.tokens.accessToken.accessTokenPath
    );
}

/**
 * @param expiry: must be time in milliseconds from epoch time.
 */
export function attachRefreshTokenToCookie(res: express.Response, token: string, expiry: number) {
    let config = Config.get();
    setCookie(
        res,
        refreshTokenCookieKey,
        token,
        config.cookie.domain,
        config.cookie.secure,
        true,
        expiry,
        config.tokens.refreshToken.renewTokenPath
    );
}

/**
 * @param expiry: must be time in milliseconds from epoch time.
 */
export function attachIdRefreshTokenToCookie(res: express.Response, token: string, expiry: number) {
    let config = Config.get();
    setCookie(res, idRefreshTokenCookieKey, token, config.cookie.domain, false, false, expiry, "/");
}

export function getAccessTokenFromCookie(req: express.Request): string | undefined {
    return getCookieValue(req, accessTokenCookieKey);
}

export function getRefreshTokenFromCookie(req: express.Request): string | undefined {
    return getCookieValue(req, refreshTokenCookieKey);
}

export function getIdRefreshTokenFromCookie(req: express.Request): string | undefined {
    return getCookieValue(req, idRefreshTokenCookieKey);
}

export function getAntiCsrfTokenFromHeaders(req: express.Request): string | undefined {
    return getHeader(req, antiCsrfHeaderKey);
}

export function setAntiCsrfTokenInHeaders(res: express.Response, antiCsrfToken: string) {
    let config = Config.get();
    if (config.tokens.accessToken.antiCsrf) {
        setHeader(res, antiCsrfHeaderKey, antiCsrfToken);
    }
}

export function getHeader(req: express.Request, key: string): string | undefined {
    let value = req.headers[key];
    if (value === undefined) {
        return undefined;
    }
    if (Array.isArray(value)) {
        return value[0];
    }
    return value;
}

export function setHeader(res: express.Response, key: string, value: string) {
    try {
        res.header(key, value);
    } catch (err) {
        throw generateError(AuthError.GENERAL_ERROR, err);
    }
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
export function setCookie(
    res: express.Response,
    key: string,
    value: string,
    domain: string,
    secure: boolean,
    httpOnly: boolean,
    expires: number,
    path: string | undefined
) {
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
    try {
        res.cookie(key, value, cookieOptions);
    } catch (err) {
        throw generateError(AuthError.GENERAL_ERROR, err);
    }
}

/**
 *
 * @param throws AuthError GENERAL_ERROR
 */
export function getCookieValue(req: express.Request, key: string): string | undefined {
    if (req.cookies === undefined) {
        throw generateError(
            AuthError.GENERAL_ERROR,
            new Error(
                "did you forget to use cookie-parser middleware? Also please make sure that you use cookieParser BEFORE any of your API routes."
            )
        );
    }
    return req.cookies[key];
}
