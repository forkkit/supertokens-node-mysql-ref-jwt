"use strict";
var __awaiter =
    (this && this.__awaiter) ||
    function(thisArg, _arguments, P, generator) {
        return new (P || (P = Promise))(function(resolve, reject) {
            function fulfilled(value) {
                try {
                    step(generator.next(value));
                } catch (e) {
                    reject(e);
                }
            }
            function rejected(value) {
                try {
                    step(generator["throw"](value));
                } catch (e) {
                    reject(e);
                }
            }
            function step(result) {
                result.done
                    ? resolve(result.value)
                    : new P(function(resolve) {
                          resolve(result.value);
                      }).then(fulfilled, rejected);
            }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
const error_1 = require("./error");
const dbQueries_1 = require("./helpers/dbQueries");
const mysql_1 = require("./helpers/mysql");
const utils_1 = require("./helpers/utils");
/**
 * @description given a token, it verifies it with the stored signature and returns the payload contained in it
 * @throws AuthError GENERAL_ERROR UNAUTHORISED
 */
function getInfoFromRefreshToken(token) {
    return __awaiter(this, void 0, void 0, function*() {
        let connection = yield mysql_1.getConnection();
        try {
            let info = yield dbQueries_1.getInfoFromAllTokens(connection, utils_1.hash(utils_1.hash(token)));
            if (info === undefined) {
                throw Error("session info not found in all tokens info");
            }
            return info;
        } catch (err) {
            throw error_1.generateError(error_1.AuthError.UNAUTHORISED, err);
        } finally {
            connection.closeConnection();
        }
    });
}
exports.getInfoFromRefreshToken = getInfoFromRefreshToken;
/**
 * @description given token payload, it creates a new token that is signed by a key stored in the DB.
 * Note: The expiry time of the token is not in the token itself. This may result in the token being alive for a longer duration
 * than what is desired. We can easily fix this by adding the expiry time in the token
 * @throws AuthError GENERAL_ERROR
 */
function createNewRefreshToken(sessionHandle, parentRefreshTokenHash2) {
    return __awaiter(this, void 0, void 0, function*() {
        // token = key1({funcArgs + nonce}).nonce where key1(a) = a encrypted using key1
        // we have the nonce for 2 reasons: given same arguments, the token would be different,
        // and it can be used to verify that the token was indeed created by us.
        let connection = yield mysql_1.getConnection();
        try {
            let config = config_1.default.get();
            let refreshToken = utils_1.generateUUID();
            let refreshTokenHash2 = utils_1.hash(utils_1.hash(refreshToken));
            parentRefreshTokenHash2 = parentRefreshTokenHash2 || refreshTokenHash2;
            yield dbQueries_1.insertIntoAllTokens(
                connection,
                sessionHandle,
                parentRefreshTokenHash2,
                refreshTokenHash2
            );
            return {
                token: refreshToken,
                expiry: Date.now() + config.tokens.refreshToken.validity
            };
        } finally {
            connection.closeConnection();
        }
    });
}
exports.createNewRefreshToken = createNewRefreshToken;
//# sourceMappingURL=refreshToken.js.map
