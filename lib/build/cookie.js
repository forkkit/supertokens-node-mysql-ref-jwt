"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function clearSessionFromCookie(res) {
}
exports.clearSessionFromCookie = clearSessionFromCookie;
function attachAccessTokenToCookie(res, token) {
}
exports.attachAccessTokenToCookie = attachAccessTokenToCookie;
// also attach id refresh token
function attachRefreshTokenToCookie(res, token) {
}
exports.attachRefreshTokenToCookie = attachRefreshTokenToCookie;
function doesRequestHaveSessionCookies(req) {
}
exports.doesRequestHaveSessionCookies = doesRequestHaveSessionCookies;
function getAccessTokenFromCookie(req) {
}
exports.getAccessTokenFromCookie = getAccessTokenFromCookie;
function getRefreshTokenFromCookie(req) {
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
function setCookie(res, key, value, domain, secure, httpOnly, maxAge, path) {
    if (path === undefined) {
        path = "/";
    }
    let cookieOptions = {
        domain,
        secure,
        httpOnly,
        maxAge,
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