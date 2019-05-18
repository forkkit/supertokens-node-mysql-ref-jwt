"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
const error_1 = require("./error");
const utils_1 = require("./helpers/utils");
const accessTokenCookieKey = "sAccessToken";
const refreshTokenCookieKey = "sRefreshToken";
const idRefreshTokenCookieKey = "sIdRefreshToken";
function clearSessionFromCookie(res) {
    let config = config_1.default.get();
    setCookie(res, accessTokenCookieKey, "", config.cookie.domain, config.cookie.secure, true, 0, "/");
    setCookie(res, idRefreshTokenCookieKey, "", config.cookie.domain, false, false, 0, "/");
    setCookie(res, refreshTokenCookieKey, "", config.cookie.domain, config.cookie.secure, true, 0, config.tokens.refreshToken.renewTokenPath);
}
exports.clearSessionFromCookie = clearSessionFromCookie;
function attachAccessTokenToCookie(res, token, expiry) {
    let config = config_1.default.get();
    setCookie(res, accessTokenCookieKey, token, config.cookie.domain, config.cookie.secure, true, expiry, "/");
}
exports.attachAccessTokenToCookie = attachAccessTokenToCookie;
// also attach id refresh token
function attachRefreshTokenToCookie(res, token, expiry) {
    let config = config_1.default.get();
    setCookie(res, idRefreshTokenCookieKey, utils_1.generateUUID(), config.cookie.domain, false, false, expiry, "/");
    setCookie(res, refreshTokenCookieKey, token, config.cookie.domain, config.cookie.secure, true, expiry, config.tokens.refreshToken.renewTokenPath);
}
exports.attachRefreshTokenToCookie = attachRefreshTokenToCookie;
function requestHasSessionCookies(req) {
    return getCookieValue(req, idRefreshTokenCookieKey) !== undefined;
}
exports.requestHasSessionCookies = requestHasSessionCookies;
function getAccessTokenFromCookie(req) {
    let value = getCookieValue(req, accessTokenCookieKey);
    if (value === undefined) {
        throw error_1.generateError(error_1.AuthError.TRY_REFRESH_TOKEN, new Error("No access token found in cookies"));
    }
    return value;
}
exports.getAccessTokenFromCookie = getAccessTokenFromCookie;
function getRefreshTokenFromCookie(req) {
    let value = getCookieValue(req, refreshTokenCookieKey);
    if (value === undefined) {
        throw error_1.generateError(error_1.AuthError.UNAUTHORISED, new Error("No refresh token found in cookies"));
    }
    return value;
}
exports.getRefreshTokenFromCookie = getRefreshTokenFromCookie;
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
    res.cookie(key, value, cookieOptions);
}
exports.setCookie = setCookie;
/**
 *
 * @param req
 * @param key
 */
function getCookieValue(req, key) {
    return req.cookies[key];
}
exports.getCookieValue = getCookieValue;
//# sourceMappingURL=cookie.js.map