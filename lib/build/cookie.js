"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getCookieValue(req, key) {
    return req.cookies[key];
}
exports.getCookieValue = getCookieValue;
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