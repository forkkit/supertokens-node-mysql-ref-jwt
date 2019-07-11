"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
const error_1 = require("./error");
const accessTokenCookieKey = "sAccessToken";
const refreshTokenCookieKey = "sRefreshToken";
const idRefreshTokenCookieKey = "sIdRefreshToken"; // if you change this name and are using supertokens-website or anything that uses is, then be sure to also change the name of this cookie there. To find the usage of this in those packages, you can simply search for "sIdRefreshToken"
const antiCsrfHeaderKey = "anti-csrf";
/**
 * @description clears all the auth cookies from the response
 */
function clearSessionFromCookie(res) {
    let config = config_1.default.get();
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
exports.clearSessionFromCookie = clearSessionFromCookie;
/**
 * @param expiry: must be time in milliseconds from epoch time.
 */
function attachAccessTokenToCookie(res, token, expiry) {
    let config = config_1.default.get();
    setCookie(res, accessTokenCookieKey, token, config.cookie.domain, config.cookie.secure, true, expiry, "/");
}
exports.attachAccessTokenToCookie = attachAccessTokenToCookie;
/**
 * @param expiry: must be time in milliseconds from epoch time.
 */
function attachRefreshTokenToCookie(res, token, expiry) {
    let config = config_1.default.get();
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
exports.attachRefreshTokenToCookie = attachRefreshTokenToCookie;
/**
 * @param expiry: must be time in milliseconds from epoch time.
 */
function attachIdRefreshTokenToCookie(res, token, expiry) {
    let config = config_1.default.get();
    setCookie(res, idRefreshTokenCookieKey, token, config.cookie.domain, false, false, expiry, "/");
}
exports.attachIdRefreshTokenToCookie = attachIdRefreshTokenToCookie;
function getAccessTokenFromCookie(req) {
    return getCookieValue(req, accessTokenCookieKey);
}
exports.getAccessTokenFromCookie = getAccessTokenFromCookie;
function getRefreshTokenFromCookie(req) {
    return getCookieValue(req, refreshTokenCookieKey);
}
exports.getRefreshTokenFromCookie = getRefreshTokenFromCookie;
function getIdRefreshTokenFromCookie(req) {
    return getCookieValue(req, idRefreshTokenCookieKey);
}
exports.getIdRefreshTokenFromCookie = getIdRefreshTokenFromCookie;
function getAntiCsrfTokenFromHeaders(req) {
    return getHeader(req, antiCsrfHeaderKey);
}
exports.getAntiCsrfTokenFromHeaders = getAntiCsrfTokenFromHeaders;
function setAntiCsrfTokenInHeaders(res, antiCsrfToken) {
    setHeader(res, antiCsrfHeaderKey, antiCsrfToken);
}
exports.setAntiCsrfTokenInHeaders = setAntiCsrfTokenInHeaders;
function getHeader(req, key) {
    let value = req.headers[key];
    if (value === undefined) {
        return undefined;
    }
    if (Array.isArray(value)) {
        return value[0];
    }
    return value;
}
exports.getHeader = getHeader;
function setHeader(res, key, value) {
    try {
        res.header(key, value);
    } catch (err) {
        throw error_1.generateError(error_1.AuthError.GENERAL_ERROR, err);
    }
}
exports.setHeader = setHeader;
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
function setCookie(res, key, value, domain, secure, httpOnly, expires, path) {
    if (path === undefined) {
        path = "/";
    }
    let cookieOptions = {
        domain,
        secure,
        httpOnly,
        expires: new Date(expires),
        path
    };
    try {
        res.cookie(key, value, cookieOptions);
    } catch (err) {
        throw error_1.generateError(error_1.AuthError.GENERAL_ERROR, err);
    }
}
exports.setCookie = setCookie;
/**
 *
 * @param throws AuthError GENERAL_ERROR
 */
function getCookieValue(req, key) {
    if (req.cookies === undefined) {
        throw error_1.generateError(
            error_1.AuthError.GENERAL_ERROR,
            new Error(
                "did you forget to use cookie-parser middleware? Also please make sure that you use cookieParser BEFORE any of your API routes."
            )
        );
    }
    return req.cookies[key];
}
exports.getCookieValue = getCookieValue;
//# sourceMappingURL=cookieAndHeaders.js.map
