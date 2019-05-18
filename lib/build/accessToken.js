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
const error_1 = require("./error");
const dbQueries_1 = require("./helpers/dbQueries");
const JWT = require("./helpers/jwt");
const mysql_1 = require("./helpers/mysql");
const utils_1 = require("./helpers/utils");
function init() {
    return __awaiter(this, void 0, void 0, function* () {
        let config = config_1.default.get();
        yield SigningKey.init(config);
    });
}
exports.init = init;
function getInfoFromAccessToken(token) {
    return __awaiter(this, void 0, void 0, function* () {
        let signingKey = yield SigningKey.getKey();
        try {
            let payload = JWT.verifyJWTAndGetPayload(token, signingKey);
            let sessionHandle = utils_1.sanitizeStringInput(payload.sessionHandle);
            let userId = utils_1.sanitizeStringInput(payload.userId);
            let refreshTokenHash1 = utils_1.sanitizeStringInput(payload.rt);
            let expiryTime = utils_1.sanitizeNumberInput(payload.expiryTime);
            let parentRefreshTokenHash1 = utils_1.sanitizeStringInput(payload.prt);
            if (sessionHandle === undefined || userId === undefined ||
                refreshTokenHash1 === undefined || expiryTime === undefined) {
                throw Error("invalid access token payload");
            }
            if (expiryTime < Date.now()) {
                throw Error("expired access token");
            }
            return {
                sessionHandle, userId, refreshTokenHash1,
                expiryTime, parentRefreshTokenHash1
            };
        }
        catch (err) {
            throw error_1.generateError(error_1.AuthError.TRY_REFRESH_TOKEN, err);
        }
    });
}
exports.getInfoFromAccessToken = getInfoFromAccessToken;
function createNewAccessToken(sessionHandle, userId, refreshTokenHash1, parentRefreshTokenHash1) {
    return __awaiter(this, void 0, void 0, function* () {
        let config = config_1.default.get();
        let signingKey = yield SigningKey.getKey();
        let expiry = Date.now() + config.tokens.accessToken.validity;
        let token = JWT.createJWT({
            sessionHandle,
            userId,
            rt: refreshTokenHash1,
            prt: parentRefreshTokenHash1,
            expiryTime: expiry
        }, signingKey);
        return { token, expiry };
    });
}
exports.createNewAccessToken = createNewAccessToken;
const ACCESS_TOKEN_SIGNING_KEY_NAME_IN_DB = "access_token_signing_key";
class SigningKey {
    constructor(config) {
        this.getKeyFromInstance = () => __awaiter(this, void 0, void 0, function* () {
            if (this.getKeyFromUser !== undefined) {
                try {
                    return yield this.getKeyFromUser();
                }
                catch (err) {
                    throw error_1.generateError(error_1.AuthError.GENERAL_ERROR, err);
                }
            }
            if (this.key === undefined) {
                this.key = yield this.generateNewKeyAndUpdateInDb();
            }
            if (this.dynamic && Date.now() > (this.key.createdAtTime + this.updateInterval)) {
                // key has expired.
                this.key = yield this.generateNewKeyAndUpdateInDb();
            }
            return this.key.keyValue;
        });
        this.generateNewKeyAndUpdateInDb = () => __awaiter(this, void 0, void 0, function* () {
            let connection = yield mysql_1.getConnection();
            try {
                yield connection.startTransaction();
                let keys = yield dbQueries_1.getKeyValueFromKeyName(connection, ACCESS_TOKEN_SIGNING_KEY_NAME_IN_DB);
                let generateNewKey = keys.length === 0;
                if (!generateNewKey) {
                    if (this.dynamic && Date.now() > (keys[0].createdAtTime + this.updateInterval)) {
                        generateNewKey = true;
                    }
                }
                if (generateNewKey) {
                    let keyValue = yield utils_1.generateNewSigningKey();
                    keys = [{
                            keyValue,
                            createdAtTime: Date.now()
                        }];
                    yield dbQueries_1.insertKeyValueForKeyName(connection, ACCESS_TOKEN_SIGNING_KEY_NAME_IN_DB, keys[0].keyValue, keys[0].createdAtTime);
                }
                yield connection.commit();
                return keys[0];
            }
            finally {
                connection.closeConnection();
            }
        });
        this.dynamic = config.tokens.accessToken.signingKey.dynamic;
        this.updateInterval = config.tokens.accessToken.signingKey.updateInterval;
        this.getKeyFromUser = config.tokens.accessToken.signingKey.get;
    }
}
SigningKey.init = (config) => __awaiter(this, void 0, void 0, function* () {
    if (SigningKey.instance === undefined) {
        SigningKey.instance = new SigningKey(config);
        yield SigningKey.getKey();
    }
});
SigningKey.getKey = () => __awaiter(this, void 0, void 0, function* () {
    if (SigningKey.instance === undefined) {
        throw error_1.generateError(error_1.AuthError.GENERAL_ERROR, new Error("please call init function of access token signing key"));
    }
    return yield SigningKey.instance.getKeyFromInstance();
});
//# sourceMappingURL=accessToken.js.map