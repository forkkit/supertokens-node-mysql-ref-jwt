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
const cronjobs_1 = require("./cronjobs");
const cookie_1 = require("./helpers/cookie");
const mysql_1 = require("./db/mysql");
const config_1 = require("./config");
const accessToken_1 = require("./tokens/accessToken");
const refreshToken_1 = require("./tokens/refreshToken");
const utils_1 = require("./helpers/utils");
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
    constructor(userId, metaInfo, expiresAt, rTHash) {
        this.getUserId = () => {
            return this.userId;
        };
        this.getMetaInfo = () => {
            return this.metaInfo;
        };
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
                /**
                 * @todo
                 */
                throw Error();
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
function getSession(request, response) {
    return __awaiter(this, void 0, void 0, function* () {
        const mysqlConnection = yield mysql_1.getConnection();
        try {
            const accessToken = accessToken_1.getAccessTokenFromRequest(request);
            if (accessToken === null) {
                throw Error(utils_1.SessionErrors.noAccessTokenInHeaders);
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
                        /**
                         * @todo error message
                         */
                        throw Error();
                    }
                }
                yield refreshToken_1.updateRefershTokenInHeaders(jwtPayload.rTHash, response);
                jwtPayload = {
                    userId: jwtPayload.userId,
                    metaInfo: parentRefreshTokenInfo.metaInfo,
                    exp: jwtPayload.exp,
                    rTHash: jwtPayload.rTHash
                };
                yield accessToken_1.updateAccessTokenInHeaders(jwtPayload, response, mysqlConnection);
            }
            return new Session(jwtPayload.userId, jwtPayload.metaInfo, jwtPayload.exp, jwtPayload.rTHash);
        }
        catch (err) {
            mysqlConnection.setDestroyConnection();
            /**
             * @todo error
             */
            throw Error();
        }
        finally {
            mysqlConnection.closeConnection();
        }
    });
}
exports.getSession = getSession;
function createNewSession(request, response, userId, metaInfo) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!utils_1.checkUserIdContainsNoDot(userId)) {
            /**
             * @todo
             */
            throw Error();
        }
        return yield newSession(request, response, userId, null, null, metaInfo);
    });
}
exports.createNewSession = createNewSession;
function newSession(request, response, userId, parentRefreshToken, sessionId, metaInfo) {
    return __awaiter(this, void 0, void 0, function* () {
        const mysqlConnection = yield mysql_1.getConnection();
        try {
            const serializedMetaInfo = utils_1.validateJSONObj(metaInfo);
            const config = config_1.Config.get();
            const refreshToken = yield refreshToken_1.getNewRefreshToken(userId, serializedMetaInfo, parentRefreshToken, sessionId, mysqlConnection);
            const accessTokenExpiry = Date.now() + config.tokens.accessToken.validity;
            const jwtPayload = {
                userId,
                metaInfo: JSON.stringify(serializedMetaInfo),
                rTHash: utils_1.hash(refreshToken),
                exp: accessTokenExpiry
            };
            const idRefreshToken = utils_1.generate32CharactersRandomString();
            yield accessToken_1.updateAccessTokenInHeaders(jwtPayload, response, mysqlConnection);
            yield refreshToken_1.updateRefershTokenInHeaders(refreshToken, response);
            cookie_1.setCookie(response, config.cookie.idRefreshTokenCookieKey, idRefreshToken, config.cookie.domain, false, false, config.tokens.refreshToken.validity, null);
            return new Session(userId, serializedMetaInfo, accessTokenExpiry, refreshToken);
        }
        catch (err) {
            mysqlConnection.setDestroyConnection();
            /**
             * @todo error
             */
            throw Error();
        }
        finally {
            mysqlConnection.closeConnection();
        }
    });
}
function refreshSession(request, response) {
    return __awaiter(this, void 0, void 0, function* () {
        const mysqlConnection = yield mysql_1.getConnection();
        try {
            const refreshToken = refreshToken_1.getRefreshTokenFromRequest(request);
            if (refreshToken === null) {
                /**
                 * @todo Error for refresh token not found in headers
                 */
                throw Error();
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
                }
                else {
                    /**
                     * @todo throw Error
                     */
                    throw Error();
                }
            }
            return yield newSession(request, response, parentRefreshTokenInfo.userId, parentToken, parentRefreshTokenInfo.sessionId, parentRefreshTokenInfo.metaInfo);
        }
        catch (err) {
            mysqlConnection.setDestroyConnection();
            /**
             * @todo error
             */
            throw Error();
        }
        finally {
            mysqlConnection.closeConnection();
        }
    });
}
exports.refreshSession = refreshSession;
function revokeAllRefreshTokenForUser(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const mysqlConnection = yield mysql_1.getConnection();
        try {
            yield refreshToken_1.removeAllRefreshTokensForUserId(userId, mysqlConnection);
        }
        catch (err) {
            mysqlConnection.setDestroyConnection();
            /**
             * @todo error
             */
            throw Error();
        }
        finally {
            mysqlConnection.closeConnection();
        }
    });
}
exports.revokeAllRefreshTokenForUser = revokeAllRefreshTokenForUser;
//# sourceMappingURL=index.js.map