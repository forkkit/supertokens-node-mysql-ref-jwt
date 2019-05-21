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
const cronjobs_1 = require("./cronjobs");
const error_1 = require("./error");
const dbQueries_1 = require("./helpers/dbQueries");
const mysql_1 = require("./helpers/mysql");
const utils_1 = require("./helpers/utils");
const refreshToken_1 = require("./refreshToken");
const session_1 = require("./session");
/**
 * @description: to be called by user of the library. This initiates all the modules necessary for this library to work.
 * @throws AuthError GENERAL_ERROR in case anything fails.
 */
function init(config) {
    return __awaiter(this, void 0, void 0, function* () {
        config_1.default.init(config);
        yield mysql_1.Mysql.init();
        yield accessToken_1.init();
        yield refreshToken_1.init();
        cronjobs_1.default.init();
    });
}
exports.init = init;
var error_2 = require("./error");
exports.Error = error_2.AuthError;
/**
 * @description call this to "login" a user. This overwrites any existing session that exists.
 * To check if a session exists, call getSession function.
 * @throws GENERAL_ERROR in case anything fails.
 * @sideEffect sets cookies in res
 */
function createNewSession(res, userId, jwtPayload, sessionData) {
    return __awaiter(this, void 0, void 0, function* () {
        let sessionHandle = utils_1.generateUUID();
        // generate tokens:
        let refreshToken = yield refreshToken_1.createNewRefreshToken(sessionHandle, userId, undefined);
        let accessToken = yield accessToken_1.createNewAccessToken(sessionHandle, userId, utils_1.hash(refreshToken.token), undefined, jwtPayload);
        // create new session in db
        let connection = yield mysql_1.getConnection();
        try {
            // we store hashed versions of what we send over to the client so that in case the database is compromised, it's still OK.
            yield dbQueries_1.createNewSession(connection, utils_1.hash(sessionHandle), userId, utils_1.hash(utils_1.hash(refreshToken.token)), sessionData, refreshToken.expiry, jwtPayload);
        }
        finally {
            connection.closeConnection();
        }
        // attach tokens to cookies
        cookie_1.attachAccessTokenToCookie(res, accessToken.token, accessToken.expiry);
        cookie_1.attachRefreshTokenToCookie(res, refreshToken.token, refreshToken.expiry);
        return new session_1.Session(sessionHandle, userId, jwtPayload, res);
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
        let config = config_1.default.get();
        if (!cookie_1.requestHasSessionCookies(req)) {
            // means ID refresh token is not available. Which means that refresh token is not going to be there either.
            // so the session does not exist.
            cookie_1.clearSessionFromCookie(res);
            throw error_1.generateError(error_1.AuthError.UNAUTHORISED, new Error("missing auth tokens in cookies"));
        }
        let accessToken = cookie_1.getAccessTokenFromCookie(req);
        let accessTokenInfo = yield accessToken_1.getInfoFromAccessToken(accessToken); // if access token is invalid, this will throw TRY_REFRESH_TOKEN error.
        // at this point, we have a valid access token.
        if (accessTokenInfo.parentRefreshTokenHash1 === undefined) {
            // this means that the refresh token associated with this access token is already the parent - most probably.
            return new session_1.Session(accessTokenInfo.sessionHandle, accessTokenInfo.userId, accessTokenInfo.userPayload, res);
        }
        // we must attempt to promote this child refresh token now
        let connection = yield mysql_1.getConnection();
        try {
            // we start a transaction so that we can later lock that particular row for updating.
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
                // at this point, the sent access token's refresh token is either a parent or child
                if (promote) {
                    // we now have to promote to make the child a parent since we now know that the frontend has these tokens for sure.
                    yield dbQueries_1.updateSessionInfo_Transaction(connection, utils_1.hash(sessionHandle), utils_1.hash(accessTokenInfo.refreshTokenHash1), sessionInfo.sessionData, Date.now() + config.tokens.refreshToken.validity);
                }
                yield connection.commit();
                // at this point, this access token's refresh token is a parent for sure.
                // we need to remove PRT from JWT so that next time this JWT is used, it does not look at the DB.
                let newAccessToken = yield accessToken_1.createNewAccessToken(sessionHandle, accessTokenInfo.userId, accessTokenInfo.refreshTokenHash1, undefined, accessTokenInfo.userPayload);
                cookie_1.attachAccessTokenToCookie(res, newAccessToken.token, newAccessToken.expiry);
                return new session_1.Session(sessionHandle, accessTokenInfo.userId, accessTokenInfo.userPayload, res);
            }
            // here it means that this access token's refresh token is old and not in the db at the moment.
            // maybe here we can all token theft too.
            yield connection.commit();
            cookie_1.clearSessionFromCookie(res);
            throw error_1.generateError(error_1.AuthError.UNAUTHORISED, new Error("using access token whose refresh token is no more."));
        }
        finally {
            connection.closeConnection(); // this will also make sure to destroy connection if not commited.
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
        let refreshTokenInfo;
        try {
            // here we decrypt and verify the refresh token. If this fails, it means either the key has changed. Or that someone is sending a "fake" refresh token.
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
/**
 * @description this function exists since we need to recurse on it. It has the actual logic for creating child tokens given the parent refresh token.
 * @throws AuthError, GENERAL_ERROR, UNAUTHORISED
 * @sideEffects may remove cookies, or change the accessToken and refreshToken.
 */
function refreshSessionHelper(res, refreshToken, refreshTokenInfo) {
    return __awaiter(this, void 0, void 0, function* () {
        let config = config_1.default.get();
        let connection = yield mysql_1.getConnection();
        try {
            let sessionHandle = refreshTokenInfo.sessionHandle;
            // we start a transaction so that we can later lock that particular row for updating.
            yield connection.startTransaction();
            let sessionInfo = yield dbQueries_1.getSessionInfo_Transaction(connection, utils_1.hash(sessionHandle));
            if (sessionInfo === undefined || sessionInfo.expiresAt < Date.now()) {
                yield connection.commit();
                cookie_1.clearSessionFromCookie(res);
                throw error_1.generateError(error_1.AuthError.UNAUTHORISED, new Error("session does not exist or has expired"));
            }
            if (sessionInfo.userId !== refreshTokenInfo.userId) {
                // TODO: maybe refresh token key has been compromised since the validation part checked out. And the row is in the table. 
                // The only way this is possible is if there is a bug somewhere, or the client somehow generated a valid refresh token and changed the userId in it. 
                yield connection.commit();
                cookie_1.clearSessionFromCookie(res);
                throw error_1.generateError(error_1.AuthError.UNAUTHORISED, new Error("userId for session does not match the userId in the refresh token"));
            }
            if (sessionInfo.refreshTokenHash2 === utils_1.hash(utils_1.hash(refreshToken))) {
                // at this point, the input refresh token is the parent one.
                yield connection.commit();
                // we create children token for this refresh token. The child tokens have a refrence to the current refresh token which will enable them to become parents when they are used.
                // notice that we do not need to store them in the database since their parent (current refresh token) is already stored.
                let newRefreshToken = yield refreshToken_1.createNewRefreshToken(sessionHandle, refreshTokenInfo.userId, utils_1.hash(refreshToken));
                let newAccessToken = yield accessToken_1.createNewAccessToken(sessionHandle, refreshTokenInfo.userId, utils_1.hash(newRefreshToken.token), utils_1.hash(refreshToken), sessionInfo.jwtPayload);
                cookie_1.attachAccessTokenToCookie(res, newAccessToken.token, newAccessToken.expiry);
                cookie_1.attachRefreshTokenToCookie(res, newRefreshToken.token, newRefreshToken.expiry);
                return new session_1.Session(sessionHandle, refreshTokenInfo.userId, sessionInfo.jwtPayload, res);
            }
            if (refreshTokenInfo.parentRefreshTokenHash1 !== undefined &&
                utils_1.hash(refreshTokenInfo.parentRefreshTokenHash1) === sessionInfo.refreshTokenHash2) {
                // At this point, the input refresh token is a child and its parent is in the database. Normally, this part of the code
                // will be reached only when the client uses a refresh token to request a new refresh token before 
                // using its access token. This would happen in case client recieves a new set of tokens and right before the next 
                // API call, the app is killed. and when the app opens again, the client's access token is expired.
                // Since this is used by the client, we know that the client has this set of tokens, so we can make them the parent.
                // Here we set the expiry based on the current time and not the time this refresh token was created. This may
                // result in refresh tokens living on for a longer period of time than what is expected. But that is OK, since they keep changing
                // based on access token's expiry anyways. 
                // This can be solved fairly easily by keeping the expiry time in the refresh token payload as well.
                yield dbQueries_1.updateSessionInfo_Transaction(connection, utils_1.hash(sessionHandle), utils_1.hash(utils_1.hash(refreshToken)), sessionInfo.sessionData, Date.now() + config.tokens.refreshToken.validity);
                yield connection.commit();
                // now we can generate children tokens for the current input token.
                return yield refreshSessionHelper(res, refreshToken, refreshTokenInfo);
            }
            // If it reaches here, it means the client used a refresh token that is valid and has a session
            // but that refresh token is neither a child, nor a parent. This would happen only in the case of token theft since the frontend
            // synchronises calls to refresh token API.
            yield connection.commit();
            cookie_1.clearSessionFromCookie(res);
            config.onTokenTheftDetection(refreshTokenInfo.userId, refreshTokenInfo.sessionHandle);
            throw error_1.generateError(error_1.AuthError.UNAUTHORISED, new Error("token has been stolen!?"));
        }
        finally {
            connection.closeConnection();
        }
    });
}
/**
 * @description deletes session info of a user from db. This only invalidates the refresh token. Not the access token.
 * Access tokens cannot be immediately invalidated. Unless we add a bloacklisting method. Or changed the private key to sign them.
 * @throws AuthError, GENERAL_ERROR
 */
function revokeAllSessionsForUser(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        let connection = yield mysql_1.getConnection();
        try {
            let sessionHandleHash1List = yield dbQueries_1.getAllHash1SessionHandlesForUser(connection, userId);
            for (let i = 0; i < sessionHandleHash1List.length; i++) {
                yield revokeSessionUsingSessionHandleHelper(sessionHandleHash1List[i]);
            }
        }
        finally {
            connection.closeConnection();
        }
    });
}
exports.revokeAllSessionsForUser = revokeAllSessionsForUser;
/**
 * @description Called by client normally when token theft is detected.
 * @throws AuthError, GENERAL_ERROR
 */
function revokeSessionUsingSessionHandle(sessionHandle) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield revokeSessionUsingSessionHandleHelper(utils_1.hash(sessionHandle));
    });
}
exports.revokeSessionUsingSessionHandle = revokeSessionUsingSessionHandle;
function revokeSessionUsingSessionHandleHelper(sessionHandleHash1) {
    return __awaiter(this, void 0, void 0, function* () {
        let connection = yield mysql_1.getConnection();
        try {
            yield dbQueries_1.deleteSession(connection, sessionHandleHash1);
        }
        finally {
            connection.closeConnection();
        }
    });
}
//# sourceMappingURL=index.js.map