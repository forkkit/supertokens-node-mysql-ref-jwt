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
const cookie_1 = require("../helpers/cookie");
const errors_1 = require("../helpers/errors");
const tokens_1 = require("../db/tokens");
const jwt_1 = require("../helpers/jwt");
const utils_1 = require("../helpers/utils");
/**
 * @class
 */
class SigningKey {
    constructor(config) {
        this.dynamic = config.dynamic;
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
            SigningKey.instance = new SigningKey(config.tokens.accessToken.signingKey);
        }
    }
    static getSigningKey(mysqlConnection) {
        return __awaiter(this, void 0, void 0, function* () {
            if (SigningKey.instance === undefined) {
                throw Error(); // TODO: some message!
            }
            if (SigningKey.instance.isUserFunction) {
                return yield SigningKey.instance.get();
            }
            return yield SigningKey.instance.get(mysqlConnection);
        });
    }
    getKey(mysqlConnection) {
        return __awaiter(this, void 0, void 0, function* () {
            const createdAt = Date.now();
            if (this.key === undefined) {
                // TODO: transaction!
                const key = yield tokens_1.getSigningKeyForAccessToken(mysqlConnection);
                if (key === undefined) {
                    const value = yield utils_1.generateNewKey(); // TODO: variable name value?! what does this represent? This is not signing key!? no..
                    yield tokens_1.newSigningKeyForAccessToken(mysqlConnection, value, createdAt);
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
                const value = yield utils_1.generateNewKey();
                yield tokens_1.updateSingingKeyForAccessToken(mysqlConnection, value, createdAt);
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
/**
 *
 * @param mysqlConnection
 */
function getAccessTokenSigningKey(mysqlConnection) {
    return SigningKey.getSigningKey(mysqlConnection);
}
exports.getAccessTokenSigningKey = getAccessTokenSigningKey;
/**
 *
 * @param request
 */
function getAccessTokenFromRequest(request) {
    const config = config_1.Config.get(); // NOTE: remember this can throw error!
    const accessToken = cookie_1.getCookieValue(request, config.cookie.accessTokenCookieKey);
    if (accessToken === undefined) {
        return null;
    }
    return accessToken;
}
exports.getAccessTokenFromRequest = getAccessTokenFromRequest;
/**
 *
 * @param token
 * @param mysqlConnection
 */
function verifyTokenAndGetPayload(token, mysqlConnection) {
    return __awaiter(this, void 0, void 0, function* () {
        let payload = yield jwt_1.verifyAndGetPayload(token, getAccessTokenSigningKey, mysqlConnection);
        payload = validatePayload(payload);
        if (payload.exp < Date.now()) {
            throw errors_1.JWTErrors.jwtExpired;
        }
        return payload;
    });
}
exports.verifyTokenAndGetPayload = verifyTokenAndGetPayload;
/**
 *
 * @param payload
 * @param response
 * @param mysqlConnection
 */
function updateAccessTokenInHeaders(payload, response, mysqlConnection) {
    return __awaiter(this, void 0, void 0, function* () {
        const accessToken = yield jwt_1.createNewJWT(payload, mysqlConnection);
        const config = config_1.Config.get();
        cookie_1.setCookie(response, config.cookie.accessTokenCookieKey, accessToken, config.cookie.domain, config.cookie.secure, true, config.tokens.accessToken.validity, null);
    });
}
exports.updateAccessTokenInHeaders = updateAccessTokenInHeaders;
/**
 *
 * @param payload
 */
function validatePayload(payload) {
    const exp = utils_1.sanitizeNumberInput(payload.exp);
    const userId = utils_1.sanitizeStringInput(payload.userId);
    const rTHash = utils_1.sanitizeStringInput(payload.rTHash);
    const pRTHash = utils_1.sanitizeStringInput(payload.pRTHash);
    if (exp === undefined || userId === undefined || rTHash === undefined) {
        throw errors_1.JWTErrors.invalidPaylaod;
    }
    return {
        exp,
        userId,
        rTHash,
        pRTHash
    };
}
//# sourceMappingURL=accessToken.js.map