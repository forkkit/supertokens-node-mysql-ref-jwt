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
const cronjobs_1 = require("./cronjobs");
const mysql_1 = require("./db/mysql");
const cookie_1 = require("./helpers/cookie");
const errors_1 = require("./helpers/errors");
const utils_1 = require("./helpers/utils");
const accessToken_1 = require("./tokens/accessToken");
const refreshToken_1 = require("./tokens/refreshToken");
function init(config) {
    return __awaiter(this, void 0, void 0, function* () {
        config_1.Config.set(config);
        yield mysql_1.Mysql.init();
        accessToken_1.SigningKey.init();
        refreshToken_1.SigningKey.init();
        cronjobs_1.Cronjob.init();
    });
}
exports.init = init;
class Session {
    constructor(userId, expiresAt, rTHash, metaInfo) {
        this.getUserId = () => {
            return this.userId;
        };
        this.getMetaInfo = () => __awaiter(this, void 0, void 0, function* () {
            if (this.metaInfo !== undefined) {
                return this.metaInfo;
            }
            const mysqlConnection = yield mysql_1.getConnection();
            try {
                const refreshTokenInfo = yield refreshToken_1.getRefreshTokenInfo(this.rTHash, mysqlConnection);
                if (refreshTokenInfo === undefined) {
                    throw errors_1.SessionErrors.refrehTokenInfoForSessionNotFound;
                }
                return refreshTokenInfo.metaInfo;
            }
            catch (err) {
                mysqlConnection.setDestroyConnection();
                throw err;
            }
            finally {
                mysqlConnection.closeConnection();
            }
        });
        this.getExpiryTime = () => {
            return this.expiresAt;
        };
        this.updateMetaInfo = (metaInfo) => __awaiter(this, void 0, void 0, function* () {
            const mysqlConnection = yield mysql_1.getConnection();
            try {
                yield refreshToken_1.updateMetaInfo(this.rTHash, metaInfo, mysqlConnection);
                this.metaInfo = metaInfo;
            }
            catch (err) {
                mysqlConnection.setDestroyConnection();
                throw err;
            }
            finally {
                mysqlConnection.closeConnection();
            }
        });
        this.userId = userId;
        this.metaInfo = metaInfo;
        this.expiresAt = expiresAt;
        this.rTHash = rTHash;
    }
}
/*
type TypeGetSessionErrors = ( TypeNewSessionErrors | {
    errCode: 10001,
    message: "no access token found in headers"
} | {
    errCode: 20001,
    message: "invalid jwt"
} | {
    errCode: 20002,
    message: "jwt header mismatch"
} | {
    errCode: 20003,
    message: "jwt verification failed"
} | {
    errCode: 20004,
    message: "jwt expired"
} | {
    errCode: 20005,
    message: "invalid payload"
} | {
    errCode: 40002,
    message: "error during query execution",
    error: Error
} | {
    errCode: 31001,
    message: "no config set, please use init function at the start"
} | {
    errCode: 10003,
    message: "session expired"
});
*/
/**
 *
 * @param request
 * @param response
 * @throws TypeGetSessionErrors
 */
function getSession(request, response) {
    return __awaiter(this, void 0, void 0, function* () {
        const mysqlConnection = yield mysql_1.getConnection();
        try {
            const accessToken = accessToken_1.getAccessTokenFromRequest(request);
            if (accessToken === null) {
                throw errors_1.SessionErrors.noAccessTokenInHeaders;
            }
            let jwtPayload = yield accessToken_1.verifyTokenAndGetPayload(accessToken, mysqlConnection);
            if (jwtPayload.pRTHash !== undefined) {
                let parentRefreshTokenInfo = yield refreshToken_1.getRefreshTokenInfo(jwtPayload.pRTHash, mysqlConnection);
                if (parentRefreshTokenInfo !== undefined && jwtPayload.userId === parentRefreshTokenInfo.userId) {
                    yield refreshToken_1.promoteChildRefreshTokenToMainTable(jwtPayload.rTHash, jwtPayload.pRTHash, mysqlConnection);
                }
                else {
                    parentRefreshTokenInfo = yield refreshToken_1.getRefreshTokenInfo(jwtPayload.rTHash, mysqlConnection);
                    if (parentRefreshTokenInfo === undefined || parentRefreshTokenInfo.userId !== jwtPayload.userId) {
                        throw errors_1.SessionErrors.refrehTokenInfoForSessionNotFound;
                    }
                }
                jwtPayload = {
                    userId: jwtPayload.userId,
                    exp: jwtPayload.exp,
                    rTHash: jwtPayload.rTHash
                };
                yield accessToken_1.updateAccessTokenInHeaders(jwtPayload, response, mysqlConnection);
            }
            return new Session(jwtPayload.userId, jwtPayload.exp, jwtPayload.rTHash);
        }
        catch (err) {
            mysqlConnection.setDestroyConnection();
            throw err;
        }
        finally {
            mysqlConnection.closeConnection();
        }
    });
}
exports.getSession = getSession;
/*
type TypeCreateNewSessionErrors = ( TypeNewSessionErrors | {
    errCode: 10004,
    message: "userId without dots currently not supported"
});
*/
/**
 *
 * @param response
 * @param userId
 * @param metaInfo
 * @throws TypeCreateNewSessionErrors
 */
function createNewSession(response, userId, metaInfo) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!utils_1.checkUserIdContainsNoDot(userId)) {
            throw errors_1.SessionErrors.dotInPassedUserId;
        }
        return yield newSession(response, userId, null, null, metaInfo);
    });
}
exports.createNewSession = createNewSession;
/*
type TypeNewSessionErrors = ({
    errCode: 50001,
    message: "invalid JSON. expected JSON Object"
} | {
    errCode: 40001,
    message: "error in connecting to mysql"
} | {
    errCode: 40002,
    message: "error during query execution",
    error: Error
} | {
    errCode: 31001,
    message: "no config set, please use init function at the start"
} | {
    errCode: 50002,
    message: "access token module has not been initialized correctly"
} | {
    errCode: 50003,
    message: "refresh token module has not been initialized correctly"
});
*/
/**
 *
 * @param response
 * @param userId
 * @param parentRefreshToken
 * @param sessionId
 * @param metaInfo
 * @throws TypeNewSessionErrors
 */
function newSession(response, userId, parentRefreshToken, sessionId, metaInfo) {
    return __awaiter(this, void 0, void 0, function* () {
        const mysqlConnection = yield mysql_1.getConnection();
        try {
            const serializedMetaInfo = utils_1.validateJSONObj(metaInfo);
            const config = config_1.Config.get();
            const refreshToken = yield refreshToken_1.getNewRefreshToken(userId, serializedMetaInfo, parentRefreshToken, sessionId, mysqlConnection);
            const accessTokenExpiry = Date.now() + config.tokens.accessToken.validity;
            let jwtPayload = {
                userId,
                rTHash: utils_1.hash(refreshToken),
                exp: accessTokenExpiry
            };
            if (parentRefreshToken !== null) {
                jwtPayload.pRTHash = parentRefreshToken;
            }
            const idRefreshToken = utils_1.generate32CharactersRandomString();
            yield accessToken_1.updateAccessTokenInHeaders(jwtPayload, response, mysqlConnection);
            yield refreshToken_1.updateRefershTokenInHeaders(refreshToken, response);
            cookie_1.setCookie(response, config.cookie.idRefreshTokenCookieKey, idRefreshToken, config.cookie.domain, false, false, config.tokens.refreshToken.validity, null);
            return new Session(userId, accessTokenExpiry, refreshToken, serializedMetaInfo);
        }
        catch (err) {
            mysqlConnection.setDestroyConnection();
            throw err;
        }
        finally {
            mysqlConnection.closeConnection();
        }
    });
}
/*
type TypeRefreshSessionErrors = ( TypeNewSessionErrors | {
    errCode: 10002,
    message: "no refresh token found in headers"
} | {
    errCode: 10005,
    message: "invalid refresh token"
} | {
    errCode: 50003,
    message: "refresh token module has not been initialized correctly"
} | {
    errCode: 40002,
    message: "error during query execution",
    error: Error
});
*/
/**
 *
 * @param request
 * @param response
 * @throws TypeRefreshSessionErrors
 */
function refreshSession(request, response) {
    return __awaiter(this, void 0, void 0, function* () {
        const mysqlConnection = yield mysql_1.getConnection();
        try {
            const refreshToken = refreshToken_1.getRefreshTokenFromRequest(request);
            if (refreshToken === null) {
                throw errors_1.SessionErrors.noRefreshTokenInHeaders;
            }
            const decryptedInfoForRefreshToken = yield refreshToken_1.verifyAndDecryptRefreshToken(refreshToken, mysqlConnection);
            let parentToken = utils_1.hash(refreshToken);
            let parentRefreshTokenInfo = yield refreshToken_1.getRefreshTokenInfo(parentToken, mysqlConnection);
            if (parentRefreshTokenInfo === undefined || decryptedInfoForRefreshToken.userId !== parentRefreshTokenInfo.userId || utils_1.hash(decryptedInfoForRefreshToken.sessionId) !== parentRefreshTokenInfo.sessionId) {
                if (parentRefreshTokenInfo !== undefined) {
                    // NOTE: this part will never really be called. this is just precaution
                    /**
                     * i.e. userId mismatch OR sessionId mismatch
                     * @todo throw Error
                     */
                    throw Error();
                }
                if (decryptedInfoForRefreshToken.parentToken !== null) {
                    parentRefreshTokenInfo = yield refreshToken_1.getRefreshTokenInfo(decryptedInfoForRefreshToken.parentToken, mysqlConnection);
                    if (parentRefreshTokenInfo === undefined || parentRefreshTokenInfo.userId !== decryptedInfoForRefreshToken.userId) {
                        yield refreshToken_1.checkIfSessionIdExistsAndNotifyForTokenTheft(utils_1.hash(decryptedInfoForRefreshToken.sessionId), mysqlConnection);
                        /**
                         * @todo
                         */
                        throw Error();
                    }
                    yield refreshToken_1.promoteChildRefreshTokenToMainTable(parentToken, decryptedInfoForRefreshToken.parentToken, mysqlConnection);
                }
                else {
                    throw errors_1.SessionErrors.invalidRefreshToken;
                }
            }
            return yield newSession(response, parentRefreshTokenInfo.userId, parentToken, decryptedInfoForRefreshToken.sessionId, parentRefreshTokenInfo.metaInfo);
        }
        catch (err) {
            mysqlConnection.setDestroyConnection();
            throw err;
        }
        finally {
            mysqlConnection.closeConnection();
        }
    });
}
exports.refreshSession = refreshSession;
/**
 *
 * @param userId
 */
function revokeAllRefreshTokenForUser(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const mysqlConnection = yield mysql_1.getConnection();
        try {
            yield refreshToken_1.removeAllRefreshTokensForUserId(userId, mysqlConnection);
        }
        catch (err) {
            mysqlConnection.setDestroyConnection();
            throw err;
        }
        finally {
            mysqlConnection.closeConnection();
        }
    });
}
exports.revokeAllRefreshTokenForUser = revokeAllRefreshTokenForUser;
//# sourceMappingURL=index.js.map