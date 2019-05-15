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
const config_1 = require("../config");
const cookie_1 = require("../cookie");
const tokens_1 = require("../db/tokens");
const jwt_1 = require("../jwt");
const utils_1 = require("../utils");
exports.DB_KEY_FOR_SIGNING_KEY_ACCESS_TOKEN = 'access-token-signing-key';
class SigningKey {
    constructor(config) {
        this.dynamic = config.dynamic;
        this.length = config.length;
        this.updateInterval = config.updateInterval;
        if (config.get === undefined) {
            this.get = this.getKey;
            this.isUserFunction = false;
        }
        else {
            this.get = config.get;
            this.isUserFunction = true;
        }
    }
    static init() {
        if (SigningKey.instance === undefined) {
            const config = config_1.Config.get();
            SigningKey.instance = new SigningKey(config.tokens.accessTokens.signingKey);
        }
    }
    static getSigningKey(connection) {
        return __awaiter(this, void 0, void 0, function* () {
            if (SigningKey.instance === undefined) {
                throw Error();
            }
            if (SigningKey.instance.isUserFunction) {
                connection = undefined;
            }
            return yield SigningKey.instance.get(connection);
        });
    }
    getKey(connection) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.key === undefined) {
                let key = yield tokens_1.getSigningKeyForAccessToken(connection);
                if (key === undefined) {
                    const value = utils_1.generate40CharactersRandomString();
                    const createdAt = Date.now();
                    yield tokens_1.newSigningKeyForAccessToken(connection, value, createdAt);
                    this.key = {
                        value,
                        createdAt
                    };
                }
                else {
                    this.key = key;
                }
            }
            if (this.dynamic && Date.now() > (this.key.createdAt + this.updateInterval)) {
                const value = utils_1.generate40CharactersRandomString();
                const createdAt = Date.now();
                yield tokens_1.updateSingingKeyForAccessToken(connection, value, createdAt);
                this.key = {
                    value,
                    createdAt
                };
            }
            return this.key.value;
        });
    }
}
exports.SigningKey = SigningKey;
function getAccessTokenSigningKey(connection) {
    return SigningKey.getSigningKey(connection);
}
exports.getAccessTokenSigningKey = getAccessTokenSigningKey;
function getAccessTokenFromRequest(request) {
    const config = config_1.Config.get();
    const accessToken = cookie_1.getCookieValue(request, config.cookie.accessTokenCookieKey);
    if (accessToken === undefined) {
        return null;
    }
    return accessToken;
}
exports.getAccessTokenFromRequest = getAccessTokenFromRequest;
function verifyTokenAndPayload(token, connection) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield jwt_1.verifyAccessTokenJWTAndGetPayload(token, connection);
    });
}
exports.verifyTokenAndPayload = verifyTokenAndPayload;
function updateAccessTokenInHeaders(payload, response, connection) {
    return __awaiter(this, void 0, void 0, function* () {
        const accessToken = yield jwt_1.createNewAccessTokenJWT(payload, connection);
        const config = config_1.Config.get();
        cookie_1.setCookie(response, config.cookie.accessTokenCookieKey, accessToken, config.cookie.domain, config.cookie.secure, true, config.tokens.accessTokens.validity, null);
    });
}
exports.updateAccessTokenInHeaders = updateAccessTokenInHeaders;
//# sourceMappingURL=accessToken.js.map