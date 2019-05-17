"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 *
 * @param req
 * @param key
 */
function getCookieValue(req, key) {
    return req.cookies[key];
}
exports.getCookieValue = getCookieValue;
/**
 *
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
    if (path === null) {
        path = "/";
    }
    let cookieOptions = { domain,
        secure,
        httpOnly,
        maxAge,
        path
    };
    res.cookie(key, value, cookieOptions);
}
exports.setCookie = setCookie;
//# sourceMappingURL=cookie.js.map