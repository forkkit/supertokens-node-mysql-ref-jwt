"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const accessToken_1 = require("./accessToken");
const config_1 = require("./config");
const cookie_1 = require("./cookie");
const error_1 = require("./error");
const dbQueries_1 = require("./helpers/dbQueries");
const mysql_1 = require("./helpers/mysql");
const utils_1 = require("./helpers/utils");
const refreshToken_1 = require("./refreshToken");
const session_1 = require("./session");
function init(config) {
    return __awaiter(this, void 0, void 0, function* () {
        config_1.default.init(config);
        yield mysql_1.Mysql.init();
        yield accessToken_1.init();
        yield refreshToken_1.init();
    });
}
exports.init = init;
var error_2 = require("./error");
exports.Error = error_2.AuthError;
function createNewSession(res, userId, jwtPayload, sessionData) {
    return __awaiter(this, void 0, void 0, function* () {
        let sessionHandle = utils_1.generateUUID();
        // generate tokens:
        let refreshToken = yield refreshToken_1.createNewRefreshToken(sessionHandle, userId, undefined);
        let accessToken = yield accessToken_1.createNewAccessToken(sessionHandle, userId, utils_1.hash(refreshToken.token), undefined, jwtPayload);
        // create new session in db
        let connection = yield mysql_1.getConnection();
        try {
            yield dbQueries_1.createNewSession(connection, utils_1.hash(sessionHandle), userId, utils_1.hash(utils_1.hash(refreshToken.token)), sessionData, refreshToken.expiry, jwtPayload);
        }
        finally {
            connection.closeConnection();
        }
        // attach tokens to cookies
        cookie_1.attachAccessTokenToCookie(res, accessToken.token, accessToken.expiry);
        cookie_1.attachRefreshTokenToCookie(res, refreshToken.token, refreshToken.expiry);
        // send reply to user
        return new session_1.Session(sessionHandle, userId, jwtPayload, res);
    });
}
exports.createNewSession = createNewSession;
function getSession(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let config = config_1.default.get();
        if (!cookie_1.requestHasSessionCookies(req)) {
            // means ID refresh token is not available. Which means that refresh token is not going to be there either.
            // so the session does not exist.
            cookie_1.clearSessionFromCookie(res);
            throw error_1.generateError(error_1.AuthError.UNAUTHORISED, new Error("missing auth tokens in cookies"));
        }
        // get access token info from request
        let accessToken = cookie_1.getAccessTokenFromCookie(req);
        let accessTokenInfo = yield accessToken_1.getInfoFromAccessToken(accessToken);
        // at this point, we have a valid access token.
        if (accessTokenInfo.parentRefreshTokenHash1 === undefined) {
            return new session_1.Session(accessTokenInfo.sessionHandle, accessTokenInfo.userId, accessTokenInfo.userPayload, res);
        }
        // we must attempt to promote this child now
        let connection = yield mysql_1.getConnection();
        try {
            yield connection.startTransaction();
            let sessionHandle = accessTokenInfo.sessionHandle;
            let sessionInfo = yield dbQueries_1.getSessionInfo_Transaction(connection, utils_1.hash(sessionHandle));
            if (sessionInfo === undefined) {
                yield connection.commit();
                cookie_1.clearSessionFromCookie(res);
                throw error_1.generateError(error_1.AuthError.UNAUTHORISED, new Error("missing auth tokens in cookies"));
            }
            let promote = sessionInfo.refreshTokenHash2 === utils_1.hash(accessTokenInfo.parentRefreshTokenHash1);
            if (promote || sessionInfo.refreshTokenHash2 === utils_1.hash(accessTokenInfo.refreshTokenHash1)) {
                if (promote) {
                    // we now have to promote:
                    yield dbQueries_1.updateSessionInfo_Transaction(connection, utils_1.hash(sessionHandle), utils_1.hash(accessTokenInfo.refreshTokenHash1), sessionInfo.sessionData, Date.now() + config.tokens.refreshToken.validity);
                }
                yield connection.commit();
                // we need to remove PRT from JWT.
                let newAccessToken = yield accessToken_1.createNewAccessToken(sessionHandle, accessTokenInfo.userId, accessTokenInfo.refreshTokenHash1, undefined, accessTokenInfo.userPayload);
                cookie_1.attachAccessTokenToCookie(res, newAccessToken.token, newAccessToken.expiry);
                return new session_1.Session(sessionHandle, accessTokenInfo.userId, accessTokenInfo.userPayload, res);
            }
            // here it means that this access token is old..
            yield connection.commit();
            cookie_1.clearSessionFromCookie(res);
            throw error_1.generateError(error_1.AuthError.UNAUTHORISED, new Error("missing auth tokens in cookies"));
        }
        finally {
            connection.closeConnection();
        }
    });
}
exports.getSession = getSession;
function refreshSession(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let config = config_1.default.get();
        let refreshToken = cookie_1.getRefreshTokenFromCookie(req);
        let refreshTokenInfo;
        try {
            refreshTokenInfo = yield refreshToken_1.getInfoFromRefreshToken(refreshToken);
        }
        catch (err) {
            cookie_1.clearSessionFromCookie(res);
            throw err;
        }
        return yield refreshSessionHelper(res, refreshToken, refreshTokenInfo);
    });
}
exports.refreshSession = refreshSession;
function refreshSessionHelper(res, refreshToken, refreshTokenInfo) {
    return __awaiter(this, void 0, void 0, function* () {
        let connection = yield mysql_1.getConnection();
        try {
            let sessionHandle = refreshTokenInfo.sessionHandle;
            yield connection.startTransaction();
            let sessionInfo = yield dbQueries_1.getSessionInfo_Transaction(connection, utils_1.hash(sessionHandle));
            if (sessionInfo === undefined || sessionInfo.expiresAt < Date.now()) {
                yield connection.commit();
                cookie_1.clearSessionFromCookie(res);
                throw error_1.generateError(error_1.AuthError.UNAUTHORISED, new Error("session does not exist or has expired"));
            }
            if (sessionInfo.userId !== refreshTokenInfo.userId) {
                // TODO: maybe refresh token key has been stolen?
                yield connection.commit();
                cookie_1.clearSessionFromCookie(res);
                throw error_1.generateError(error_1.AuthError.UNAUTHORISED, new Error("userId for session does not match that in refresh token"));
            }
            if (sessionInfo.refreshTokenHash2 === utils_1.hash(utils_1.hash(refreshToken))) {
                yield connection.commit();
                let newRefreshToken = yield refreshToken_1.createNewRefreshToken(sessionHandle, refreshTokenInfo.userId, utils_1.hash(refreshToken));
                let newAccessToken = yield accessToken_1.createNewAccessToken(sessionHandle, refreshTokenInfo.userId, utils_1.hash(newRefreshToken.token), utils_1.hash(refreshToken), sessionInfo.jwtPayload);
                cookie_1.attachAccessTokenToCookie(res, newAccessToken.token, newAccessToken.expiry);
                cookie_1.attachRefreshTokenToCookie(res, newRefreshToken.token, newRefreshToken.expiry);
                return new session_1.Session(sessionHandle, refreshTokenInfo.userId, sessionInfo.jwtPayload, res);
            }
            if (refreshTokenInfo.parentRefreshTokenHash1 !== undefined &&
                utils_1.hash(refreshTokenInfo.parentRefreshTokenHash1) === sessionInfo.refreshTokenHash2) {
                yield dbQueries_1.updateSessionInfo_Transaction(connection, utils_1.hash(sessionHandle), utils_1.hash(utils_1.hash(refreshToken)), sessionInfo.sessionData, sessionInfo.expiresAt);
                yield connection.commit();
                return yield refreshSessionHelper(res, refreshToken, refreshTokenInfo);
            }
            yield connection.commit();
            cookie_1.clearSessionFromCookie(res);
            let config = config_1.default.get();
            config.onTokenTheftDetection(refreshTokenInfo.userId, refreshTokenInfo.sessionHandle);
            throw error_1.generateError(error_1.AuthError.UNAUTHORISED, new Error("token has been stolen!?"));
        }
        finally {
            connection.closeConnection();
        }
    });
}
function revokeAllSessionsForUser(userId) {
    return __awaiter(this, void 0, void 0, function* () {
    });
}
exports.revokeAllSessionsForUser = revokeAllSessionsForUser;
function revokeSessionUsingSessionHandle(sessionHandle) {
    return __awaiter(this, void 0, void 0, function* () {
    });
}
exports.revokeSessionUsingSessionHandle = revokeSessionUsingSessionHandle;
//# sourceMappingURL=index.js.map