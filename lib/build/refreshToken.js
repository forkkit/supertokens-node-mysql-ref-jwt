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
const mysql_1 = require("./helpers/mysql");
const utils_1 = require("./helpers/utils");
function init() {
    return __awaiter(this, void 0, void 0, function* () {
        let config = config_1.default.get();
        yield Key.init();
    });
}
exports.init = init;
function getInfoFromRefreshToken(token) {
    return __awaiter(this, void 0, void 0, function* () {
        let key = yield Key.getKey();
        try {
            let splittedToken = token.split(".");
            if (splittedToken.length !== 2) {
                throw Error("invalid refresh token");
            }
            let nonce = splittedToken[1];
            let payload = JSON.parse(yield utils_1.decrypt(splittedToken[0], key));
            let sessionHandle = utils_1.sanitizeStringInput(payload.sessionHandle);
            let userId = utils_1.sanitizeStringInput(payload.userId);
            let prt = utils_1.sanitizeStringInput(payload.prt);
            let nonceFromEnc = utils_1.sanitizeStringInput(payload.nonce);
            if (sessionHandle === undefined || userId === undefined ||
                nonceFromEnc !== nonce) {
                throw Error("invalid refresh token");
            }
            return {
                sessionHandle,
                userId, parentRefreshTokenHash1: prt
            };
        }
        catch (err) {
            throw error_1.generateError(error_1.AuthError.UNAUTHORISED, err);
        }
    });
}
exports.getInfoFromRefreshToken = getInfoFromRefreshToken;
function createNewRefreshToken(sessionHandle, userId, parentRefreshTokenHash1) {
    return __awaiter(this, void 0, void 0, function* () {
        let config = config_1.default.get();
        let key = yield Key.getKey();
        let nonce = utils_1.hash(utils_1.generateUUID());
        let payloadSerialised = JSON.stringify({
            sessionHandle, userId,
            prt: parentRefreshTokenHash1,
            nonce
        });
        let encryptedPart = yield utils_1.encrypt(payloadSerialised, key);
        return {
            token: encryptedPart + "." + nonce,
            expiry: Date.now() + config.tokens.refreshToken.validity
        };
    });
}
exports.createNewRefreshToken = createNewRefreshToken;
const REFRESH_TOKEN_KEY_NAME_IN_DB = "refresh_token_key";
class Key {
    constructor() {
        this.getKeyFromInstance = () => __awaiter(this, void 0, void 0, function* () {
            if (this.key === undefined) {
                this.key = yield this.generateNewKeyAndUpdateInDb();
            }
            return this.key;
        });
        this.generateNewKeyAndUpdateInDb = () => __awaiter(this, void 0, void 0, function* () {
            let connection = yield mysql_1.getConnection();
            try {
                yield connection.startTransaction();
                let keys = yield dbQueries_1.getKeyValueFromKeyName_Transaction(connection, REFRESH_TOKEN_KEY_NAME_IN_DB);
                if (keys.length === 0) {
                    let keyValue = yield utils_1.generateNewSigningKey();
                    keys = [{
                            keyValue,
                            createdAtTime: Date.now()
                        }];
                    yield dbQueries_1.insertKeyValueForKeyName_Transaction(connection, REFRESH_TOKEN_KEY_NAME_IN_DB, keys[0].keyValue, keys[0].createdAtTime);
                }
                yield connection.commit();
                return keys[0].keyValue;
            }
            finally {
                connection.closeConnection();
            }
        });
    }
}
Key.init = () => __awaiter(this, void 0, void 0, function* () {
    if (Key.instance === undefined) {
        Key.instance = new Key();
        yield Key.getKey();
    }
});
Key.getKey = () => __awaiter(this, void 0, void 0, function* () {
    if (Key.instance === undefined) {
        throw error_1.generateError(error_1.AuthError.GENERAL_ERROR, new Error("please call init function of refresh token key"));
    }
    return yield Key.instance.getKeyFromInstance();
});
//# sourceMappingURL=refreshToken.js.map