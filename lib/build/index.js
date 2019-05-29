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
const config_1 = require("./config");
const cookie_1 = require("./cookie");
const error_1 = require("./error");
const SessionFunctions = require("./session");
var error_2 = require("./error");
exports.Error = error_2.AuthError;
/**
 * @description: to be called by user of the library. This initiates all the modules necessary for this library to work.
 * Please create a database in your mysql instance before calling this function
 * @throws AuthError GENERAL_ERROR in case anything fails.
 */
function init(config) {
    return __awaiter(this, void 0, void 0, function* () {
        yield SessionFunctions.init(config);
    });
}
exports.init = init;
/**
 * @description call this to "login" a user. This overwrites any existing session that exists.
 * To check if a session exists, call getSession function.
 * @throws GENERAL_ERROR in case anything fails.
 * @sideEffect sets cookies in res
 */
function createNewSession(res, userId, jwtPayload, sessionData) {
    return __awaiter(this, void 0, void 0, function* () {
        let response = yield SessionFunctions.createNewSession(userId, jwtPayload, sessionData);
        // attach tokens to cookies
        cookie_1.attachAccessTokenToCookie(res, response.accessToken.value, response.accessToken.expires);
        cookie_1.attachRefreshTokenToCookie(res, response.refreshToken.value, response.refreshToken.expires);
        cookie_1.attachIdRefreshTokenToCookie(res, response.idRefreshToken.value, response.idRefreshToken.expires);
        return new Session(response.session.handle, response.session.userId, response.session.jwtPayload, res);
    });
}
exports.createNewSession = createNewSession;
/**
 * @description authenticates a session. To be used in APIs that require authentication
 * @throws AuthError, GENERAL_ERROR, UNAUTHORISED and TRY_REFRESH_TOKEN
 * @sideEffects may remove cookies, or change the accessToken.
 */
function getSession(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let idRefreshToken = cookie_1.getIdRefreshTokenFromCookie(req);
        if (idRefreshToken === undefined) {
            // This means refresh token is not going to be there either, so the session does not exist.
            cookie_1.clearSessionFromCookie(res);
            throw error_1.generateError(error_1.AuthError.UNAUTHORISED, new Error("missing auth tokens in cookies"));
        }
        let accessToken = cookie_1.getAccessTokenFromCookie(req);
        if (accessToken === undefined) {
            // maybe the access token has expired.
            throw error_1.generateError(error_1.AuthError.TRY_REFRESH_TOKEN, new Error("access token missing in cookies"));
        }
        try {
            let response = yield SessionFunctions.getSession(idRefreshToken, accessToken);
            if (response.newAccessToken !== undefined) {
                cookie_1.attachAccessTokenToCookie(res, response.newAccessToken.value, response.newAccessToken.expires);
            }
            return new Session(response.session.handle, response.session.userId, response.session.jwtPayload, res);
        }
        catch (err) {
            if (error_1.AuthError.isErrorFromAuth(err) && err.errType === error_1.AuthError.UNAUTHORISED) {
                cookie_1.clearSessionFromCookie(res);
            }
            throw err;
        }
    });
}
exports.getSession = getSession;
/**
 * @description generates new access and refresh tokens for a given refresh token. Called when client's access token has expired.
 * @throws AuthError, GENERAL_ERROR, UNAUTHORISED
 * @sideEffects may remove cookies, or change the accessToken and refreshToken.
 */
function refreshSession(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        let config = config_1.default.get();
        let refreshToken = cookie_1.getRefreshTokenFromCookie(req);
        let idRefreshToken = cookie_1.getIdRefreshTokenFromCookie(req);
        if (refreshToken === undefined || idRefreshToken === undefined) {
            cookie_1.clearSessionFromCookie(res);
            throw error_1.generateError(error_1.AuthError.UNAUTHORISED, new Error("missing auth tokens in cookies"));
        }
        try {
            let response = yield SessionFunctions.refreshSession(idRefreshToken, refreshToken);
            if (response.sessionTheftDetected) {
                // cookies clearing happens when catching unauthorised error
                config.onTokenTheftDetection(response.session.userId, response.session.handle);
                throw error_1.generateError(error_1.AuthError.UNAUTHORISED, new Error("session theft detected"));
            }
            else {
                // attach tokens to cookies
                cookie_1.attachAccessTokenToCookie(res, response.newAccessToken.value, response.newAccessToken.expires);
                cookie_1.attachRefreshTokenToCookie(res, response.newRefreshToken.value, response.newRefreshToken.expires);
                cookie_1.attachIdRefreshTokenToCookie(res, response.newIdRefreshToken.value, response.newIdRefreshToken.expires);
                return new Session(response.session.handle, response.session.userId, response.session.jwtPayload, res);
            }
        }
        catch (err) {
            if (error_1.AuthError.isErrorFromAuth(err) && err.errType === error_1.AuthError.UNAUTHORISED) {
                cookie_1.clearSessionFromCookie(res);
            }
            throw err;
        }
    });
}
exports.refreshSession = refreshSession;
/**
 * @description deletes session info of a user from db. This only invalidates the refresh token. Not the access token.
 * Access tokens cannot be immediately invalidated. Unless we add a bloacklisting method. Or changed the private key to sign them.
 * @throws AuthError, GENERAL_ERROR
 */
function revokeAllSessionsForUser(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield SessionFunctions.revokeAllSessionsForUser(userId);
    });
}
exports.revokeAllSessionsForUser = revokeAllSessionsForUser;
/**
 * @description Called by client normally when token theft is detected.
 * @throws AuthError, GENERAL_ERROR
 */
function revokeSessionUsingSessionHandle(sessionHandle) {
    return __awaiter(this, void 0, void 0, function* () {
        yield SessionFunctions.revokeSessionUsingSessionHandle(sessionHandle);
    });
}
exports.revokeSessionUsingSessionHandle = revokeSessionUsingSessionHandle;
/**
 * @class Session
 * @description an instance of this is created when a session is valid.
 */
class Session {
    constructor(sessionHandle, userId, jwtUserPayload, res) {
        /**
         * @description call this to logout the current user.
         * This only invalidates the refresh token. The access token can still be used after
         * @sideEffect may clear cookies from response.
         * @throw AuthError GENERAL_ERROR
         */
        this.revokeSession = () => __awaiter(this, void 0, void 0, function* () {
            if (yield SessionFunctions.revokeSessionUsingSessionHandle(this.sessionHandle)) {
                cookie_1.clearSessionFromCookie(this.res);
            }
        });
        /**
         * @description: this function reads from the database every time. It provides no locking mechanism in case other processes are updating session data for this session as well, so please take of that by yourself.
         * @returns session data as provided by the user earlier
         * @sideEffect may clear cookies from response.
         * @throws AuthError GENERAL_ERROR, UNAUTHORISED.
         */
        this.getSessionData = () => __awaiter(this, void 0, void 0, function* () {
            try {
                return yield SessionFunctions.getSessionData(this.sessionHandle);
            }
            catch (err) {
                if (error_1.AuthError.isErrorFromAuth(err) && err.errType === error_1.AuthError.UNAUTHORISED) {
                    cookie_1.clearSessionFromCookie(this.res);
                }
                throw err;
            }
        });
        /**
         * @description: It provides no locking mechanism in case other processes are updating session data for this session as well.
         * @param newSessionData this can be anything: an array, a promitive type, object etc etc. This will overwrite the current value stored in the database.
         * @sideEffect may clear cookies from response.
         * @throws AuthError GENERAL_ERROR, UNAUTHORISED.
         */
        this.updateSessionData = (newSessionData) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield SessionFunctions.updateSessionData(this.sessionHandle, newSessionData);
            }
            catch (err) {
                if (error_1.AuthError.isErrorFromAuth(err) && err.errType === error_1.AuthError.UNAUTHORISED) {
                    cookie_1.clearSessionFromCookie(this.res);
                }
                throw err;
            }
        });
        this.getUserId = () => {
            return this.userId;
        };
        this.getJWTPayload = () => {
            return this.jwtUserPayload;
        };
        this.sessionHandle = sessionHandle;
        this.userId = userId;
        this.jwtUserPayload = jwtUserPayload;
        this.res = res;
    }
}
exports.Session = Session;
//# sourceMappingURL=index.js.map