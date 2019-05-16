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
const cookie_1 = require("../cookie");
const config_1 = require("../config");
const utils_1 = require("../utils");
exports.DB_KEY_FOR_SIGNING_KEY_REFRESH_TOKEN = "";
class SigningKey {
    constructor() { }
    static init() {
        return __awaiter(this, void 0, void 0, function* () {
            if (SigningKey.instance === undefined) {
                SigningKey.instance = new SigningKey();
            }
        });
    }
    static getSigningKey(connection) {
        return __awaiter(this, void 0, void 0, function* () {
            if (SigningKey.instance === undefined) {
                throw Error(); // @todo
            }
            if (SigningKey.instance.key === undefined) {
                let key = yield tokens_1.getSigningKeyForRefreshToken(connection);
                if (key === null) {
                    key = utils_1.generate40CharactersRandomString();
                    yield tokens_1.newSigningKeyForRefreshToken(connection, key, Date.now());
                }
                SigningKey.instance.key = key;
            }
            return SigningKey.instance.key;
        });
    }
}
exports.SigningKey = SigningKey;
function getRefreshTokenSigningKey(connection) {
    return SigningKey.getSigningKey(connection);
}
exports.getRefreshTokenSigningKey = getRefreshTokenSigningKey;
function getRefreshTokenInfo(refreshToken, connection) {
    return __awaiter(this, void 0, void 0, function* () {
        refreshToken = utils_1.hash(utils_1.hash(refreshToken));
        return yield tokens_1.getInfoForRefreshToken(connection, refreshToken);
    });
}
exports.getRefreshTokenInfo = getRefreshTokenInfo;
function getNewRefreshToken(userId, metaInfo, parentToken, connection) {
    return __awaiter(this, void 0, void 0, function* () {
        /**
         * @todo
         */
        const randomString = ""; // @todo some randome string
        return "";
    });
}
exports.getNewRefreshToken = getNewRefreshToken;
function promoteChildRefreshTokenToMainTable(childToken, parentToken, connection) {
    return __awaiter(this, void 0, void 0, function* () {
        const config = config_1.Config.get();
        const childTokenCreatedAt = Date.now();
        const childTokenExpiresAt = childTokenCreatedAt + config.tokens.refreshToken.validity;
        yield tokens_1.promoteRefreshToken(connection, childToken, childTokenExpiresAt, childTokenCreatedAt, parentToken);
        const childInfoInMainTable = yield tokens_1.getInfoForRefreshToken(connection, childToken);
        if (childInfoInMainTable === undefined) {
            /**
             * @todo
             * if after the promotion query, childToken not in main table
             */
            throw Error();
        }
    });
}
exports.promoteChildRefreshTokenToMainTable = promoteChildRefreshTokenToMainTable;
function updateRefershTokenInHeaders(refreshToken, response) {
    return __awaiter(this, void 0, void 0, function* () {
        const config = config_1.Config.get();
        cookie_1.setCookie(response, config.cookie.refreshTokenCookieKey, refreshToken, config.cookie.domain, config.cookie.secure, true, config.tokens.refreshToken.validity, config.tokens.refreshToken.renewTokenURL);
    });
}
exports.updateRefershTokenInHeaders = updateRefershTokenInHeaders;
function updateMetaInfo(refreshToken, metaInfo, connection) {
    return __awaiter(this, void 0, void 0, function* () {
        metaInfo = utils_1.serializeMetaInfoToString(metaInfo);
        yield tokens_1.updateMetaInfoForRefreshToken(connection, refreshToken, metaInfo);
    });
}
exports.updateMetaInfo = updateMetaInfo;
function getRefreshTokenFromRequest(request) {
    const config = config_1.Config.get();
    const refreshToken = cookie_1.getCookieValue(request, config.cookie.refreshTokenCookieKey);
    if (refreshToken === undefined) {
        return null;
    }
    return refreshToken;
}
exports.getRefreshTokenFromRequest = getRefreshTokenFromRequest;
function verifyAndDecryptRefreshToken(refreshToken, connection) {
    return __awaiter(this, void 0, void 0, function* () {
        /**
         * @todo
         */
        refreshToken = utils_1.hash(refreshToken);
        return {
            parentToken: "",
            userId: ""
        };
    });
}
exports.verifyAndDecryptRefreshToken = verifyAndDecryptRefreshToken;
//# sourceMappingURL=refreshToken.js.map