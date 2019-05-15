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
const mysql_1 = require("./db/mysql");
const accessToken_1 = require("./tokens/accessToken");
const refreshToken_1 = require("./tokens/refreshToken");
const utils_1 = require("./utils");
const cookie_1 = require("./cookie");
function init(config) {
    config_1.Config.set(config);
    mysql_1.Mysql.init().then(() => {
        accessToken_1.SigningKey.init();
        refreshToken_1.SigningKey.init();
    }).catch(err => {
        /**
         * @todo
         */
    });
}
exports.init = init;
class Session {
    constructor(userId, metaInfo, expiresAt, rTHash) {
        this.getUserId = () => {
            return this.userId;
        };
        this.getMetaInfo = () => __awaiter(this, void 0, void 0, function* () {
            return this.metaInfo;
        });
        this.getExpiryTime = () => {
            return this.expiresAt;
        };
        this.updateMetaInfo = (metaInfo) => __awaiter(this, void 0, void 0, function* () {
            const connection = yield mysql_1.getConnection();
            try {
                yield refreshToken_1.updateMetaInfo(this.rTHash, metaInfo, connection);
                this.metaInfo = metaInfo;
            }
            catch (err) {
                connection.setDestroyConnection();
                /**
                 * @todo
                 */
                throw Error();
            }
            finally {
                connection.closeConnection();
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
        const connection = yield mysql_1.getConnection();
        try {
            const accessToken = accessToken_1.getAccessTokenFromRequest(request);
            if (accessToken === null) {
                throw Error(utils_1.SessionErrors.noAccessTokenInHeaders);
            }
            let jwtPayload = yield accessToken_1.verifyTokenAndPayload(accessToken, connection);
            if (jwtPayload.pRTHash !== undefined) {
                let parentRefreshTokenInfo = yield refreshToken_1.getRefreshTokenInfo(jwtPayload.pRTHash, connection);
                if (parentRefreshTokenInfo !== undefined && jwtPayload.userId === parentRefreshTokenInfo.userId) {
                    yield refreshToken_1.promoteChildRefreshTokenToMainTable(jwtPayload.rTHash, jwtPayload.pRTHash, connection);
                }
                else {
                    parentRefreshTokenInfo = yield refreshToken_1.getRefreshTokenInfo(jwtPayload.rTHash, connection);
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
                yield accessToken_1.updateAccessTokenInHeaders(jwtPayload, response, connection);
            }
            return new Session(jwtPayload.userId, jwtPayload.metaInfo, jwtPayload.exp, jwtPayload.rTHash);
        }
        catch (err) {
            connection.setDestroyConnection();
            /**
             * @todo error
             */
            throw Error();
        }
        finally {
            connection.closeConnection();
        }
    });
}
exports.getSession = getSession;
function newSession(request, response, userId, metaInfo) {
    return __awaiter(this, void 0, void 0, function* () {
        const connection = yield mysql_1.getConnection();
        try {
            metaInfo = utils_1.serializeMetaInfo(metaInfo);
            const config = config_1.Config.get();
            const refreshToken = yield refreshToken_1.getNewRefreshToken(userId, metaInfo, connection);
            const accessTokenExpiry = Date.now() + config.tokens.accessTokens.validity;
            const jwtPayload = {
                userId,
                metaInfo,
                rTHash: refreshToken,
                exp: accessTokenExpiry
            };
            const idRefreshToken = ""; // @todo: random string
            yield accessToken_1.updateAccessTokenInHeaders(jwtPayload, response, connection);
            yield refreshToken_1.updateRefershTokenInHeaders(refreshToken, response);
            cookie_1.setCookie(response, config.cookie.idRefreshTokenCookieKey, idRefreshToken, config.cookie.domain, config.cookie.secure, false, config.tokens.refreshToken.validity, null);
            return new Session(userId, metaInfo, accessTokenExpiry, refreshToken);
        }
        catch (err) {
            connection.setDestroyConnection();
            /**
             * @todo error
             */
            throw Error();
        }
        finally {
            connection.closeConnection();
        }
    });
}
exports.newSession = newSession;
//# sourceMappingURL=index.js.map