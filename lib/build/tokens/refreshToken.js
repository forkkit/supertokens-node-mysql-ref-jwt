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
const tokens_1 = require("../db/tokens");
const cookie_1 = require("../helpers/cookie");
const config_1 = require("../config");
const utils_1 = require("../helpers/utils");
const errors_1 = require("../helpers/errors");
const crypto_1 = require("../helpers/crypto");
/**
 * @class
 */
class SigningKey {
    constructor() { }
    static init() {
        if (SigningKey.instance === undefined) {
            SigningKey.instance = new SigningKey();
        }
    }
    static getSigningKey(mysqlConnection) {
        return __awaiter(this, void 0, void 0, function* () {
            if (SigningKey.instance === undefined) {
                throw errors_1.MiscellaneousErrors.refreshTokenSigningKeyTableNotInitialized;
            }
            if (SigningKey.instance.key === undefined) {
                let key = yield tokens_1.getSigningKeyForRefreshToken(mysqlConnection);
                if (key === null) {
                    key = yield utils_1.generateNewKey();
                    yield tokens_1.newSigningKeyForRefreshToken(mysqlConnection, key, Date.now());
                }
                SigningKey.instance.key = key;
            }
            return SigningKey.instance.key;
        });
    }
}
exports.SigningKey = SigningKey;
/**
 *
 * @param mysqlConnection
 */
function getRefreshTokenSigningKey(mysqlConnection) {
    return SigningKey.getSigningKey(mysqlConnection);
}
exports.getRefreshTokenSigningKey = getRefreshTokenSigningKey;
/**
 *
 * @param refreshTokenHash
 * @param mysqlConnection
 */
function getRefreshTokenInfo(refreshTokenHash, mysqlConnection) {
    return __awaiter(this, void 0, void 0, function* () {
        const refreshTokenInDB = utils_1.hash(refreshTokenHash);
        return yield tokens_1.getInfoForRefreshToken(mysqlConnection, refreshTokenInDB);
    });
}
exports.getRefreshTokenInfo = getRefreshTokenInfo;
/**
 *
 * @param userId
 * @param metaInfo
 * @param parentToken
 * @param sessionId
 * @param mysqlConnection
 */
function getNewRefreshToken(userId, metaInfo, parentToken, sessionId, mysqlConnection) {
    return __awaiter(this, void 0, void 0, function* () {
        const randomString = utils_1.generate44ChararctersRandomString();
        sessionId = sessionId === null ? utils_1.generate32CharactersRandomString() : sessionId;
        let stringToEncrypt = `${randomString}.${userId}.${sessionId}`;
        if (parentToken !== null) {
            stringToEncrypt += `.${parentToken}`;
        }
        const signingKey = yield getRefreshTokenSigningKey(mysqlConnection);
        const encryptedPart = yield crypto_1.encrypt(stringToEncrypt, signingKey);
        const refreshToken = `${encryptedPart}.${randomString}`;
        const refreshTokenToStoreInDB = utils_1.hash(utils_1.hash(refreshToken));
        metaInfo = utils_1.serializeMetaInfoToString(metaInfo);
        if (parentToken === null) {
            yield tokens_1.insertIntoRefreshToken(mysqlConnection, refreshTokenToStoreInDB, userId, utils_1.hash(sessionId), metaInfo, Date.now());
        }
        return refreshToken;
    });
}
exports.getNewRefreshToken = getNewRefreshToken;
/**
 *
 * @param childToken
 * @param parentToken
 * @param mysqlConnection
 */
function promoteChildRefreshTokenToMainTable(childToken, parentToken, mysqlConnection) {
    return __awaiter(this, void 0, void 0, function* () {
        const config = config_1.Config.get();
        const childTokenCreatedAt = Date.now();
        const childTokenExpiresAt = childTokenCreatedAt + config.tokens.refreshToken.validity;
        yield tokens_1.promoteRefreshToken(mysqlConnection, utils_1.hash(childToken), childTokenExpiresAt, childTokenCreatedAt, utils_1.hash(parentToken));
        const childInfoInMainTable = yield tokens_1.getInfoForRefreshToken(mysqlConnection, utils_1.hash(childToken));
        if (childInfoInMainTable === undefined) {
            throw errors_1.SessionErrors.invalidRefreshToken;
        }
    });
}
exports.promoteChildRefreshTokenToMainTable = promoteChildRefreshTokenToMainTable;
/**
 *
 * @param refreshToken
 * @param response
 */
function updateRefershTokenInHeaders(refreshToken, response) {
    return __awaiter(this, void 0, void 0, function* () {
        const config = config_1.Config.get();
        cookie_1.setCookie(response, config.cookie.refreshTokenCookieKey, refreshToken, config.cookie.domain, config.cookie.secure, true, config.tokens.refreshToken.validity, config.tokens.refreshToken.renewTokenURL);
    });
}
exports.updateRefershTokenInHeaders = updateRefershTokenInHeaders;
function updateMetaInfo(refreshToken, metaInfo, mysqlConnection) {
    return __awaiter(this, void 0, void 0, function* () {
        metaInfo = utils_1.serializeMetaInfoToString(metaInfo);
        yield tokens_1.updateMetaInfoForRefreshToken(mysqlConnection, refreshToken, metaInfo);
    });
}
exports.updateMetaInfo = updateMetaInfo;
/**
 *
 * @param request
 */
function getRefreshTokenFromRequest(request) {
    const config = config_1.Config.get();
    const refreshToken = cookie_1.getCookieValue(request, config.cookie.refreshTokenCookieKey);
    if (refreshToken === undefined) {
        return null;
    }
    return refreshToken;
}
exports.getRefreshTokenFromRequest = getRefreshTokenFromRequest;
/**
 *
 * @param refreshToken
 * @param mysqlConnection
 */
function verifyAndDecryptRefreshToken(refreshToken, mysqlConnection) {
    return __awaiter(this, void 0, void 0, function* () {
        const splittedRefreshToken = refreshToken.split(".");
        if (splittedRefreshToken.length !== 2) {
            throw errors_1.SessionErrors.invalidRefreshToken;
        }
        const signingKey = yield getRefreshTokenSigningKey(mysqlConnection);
        const randomStringOutside = splittedRefreshToken[1];
        const encryptedPart = splittedRefreshToken[0];
        const decryptedRefreshToken = yield crypto_1.decrypt(encryptedPart, signingKey);
        const splittedDecryptedRefreshToken = decryptedRefreshToken.split(".");
        if (splittedDecryptedRefreshToken.length !== 3 && splittedDecryptedRefreshToken.length !== 4) {
            throw errors_1.SessionErrors.invalidRefreshToken;
        }
        const randomStringInside = splittedDecryptedRefreshToken[0];
        const userId = splittedDecryptedRefreshToken[1];
        const sessionId = splittedDecryptedRefreshToken[2];
        const parentToken = splittedDecryptedRefreshToken.length === 3 ? null : splittedDecryptedRefreshToken[3];
        if (randomStringInside !== randomStringOutside) {
            throw errors_1.SessionErrors.invalidRefreshToken;
        }
        refreshToken = utils_1.hash(refreshToken);
        return {
            parentToken,
            userId,
            sessionId
        };
    });
}
exports.verifyAndDecryptRefreshToken = verifyAndDecryptRefreshToken;
/**
 *
 * @param mysqlConnection
 * @param sessionId
 */
function checkIfSessionIdExistsAndNotifyForTokenTheft(sessionId, mysqlConnection) {
    return __awaiter(this, void 0, void 0, function* () {
        if (yield tokens_1.checkIfSessionIdInDB(mysqlConnection, sessionId)) {
            /**
             * @todo token theft module
             */
        }
    });
}
exports.checkIfSessionIdExistsAndNotifyForTokenTheft = checkIfSessionIdExistsAndNotifyForTokenTheft;
function removeAllRefreshTokensForUserId(userId, mysqlConnection) {
    return __awaiter(this, void 0, void 0, function* () {
        yield tokens_1.deleteAllRefreshTokensForUserId(mysqlConnection, userId);
    });
}
exports.removeAllRefreshTokensForUserId = removeAllRefreshTokensForUserId;
//# sourceMappingURL=refreshToken.js.map