"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
const error_1 = require("./error");
const accessTokenCookieKey = "sAccessToken";
const refreshTokenCookieKey = "sRefreshToken";
const idRefreshTokenCookieKey = "sIdRefreshToken";
/**
 * @description clears all the auth cookies from the response
 */
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
function attachRefreshTokenToCookie(res, token, expiry) {
    let config = config_1.default.get();
    setCookie(res, refreshTokenCookieKey, token, config.cookie.domain, config.cookie.secure, true, expiry, config.tokens.refreshToken.renewTokenPath);
}
exports.attachRefreshTokenToCookie = attachRefreshTokenToCookie;
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
 * @param throws AuthError GENERAL_ERROR
 */
function getCookieValue(req, key) {
    if (req.cookies === undefined) {
        throw error_1.generateError(error_1.AuthError.GENERAL_ERROR, new Error("did you forget to use cookie-parser middleware?"));
    }
    return req.cookies[key];
}
exports.getCookieValue = getCookieValue;
//# sourceMappingURL=cookie.js.map