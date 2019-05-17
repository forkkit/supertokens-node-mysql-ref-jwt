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
const refreshToken_1 = require("../tokens/refreshToken");
const config_1 = require("../config");
const DB_KEY_FOR_SIGNING_KEY_ACCESS_TOKEN = 'access-token-signing-key';
function newSigningKeyForAccessToken(mysqlConnection, signingKey, createdAt) {
    return __awaiter(this, void 0, void 0, function* () {
        const config = config_1.Config.get();
        const signingKeyTableName = config.mysql.tables.signingKey;
        const query = `INSERT INTO ${signingKeyTableName} (key_name, key_value, created_at) VALUES (?, ?, ?);`;
        yield mysqlConnection.executeQuery(query, [DB_KEY_FOR_SIGNING_KEY_ACCESS_TOKEN, signingKey, createdAt]);
    });
}
exports.newSigningKeyForAccessToken = newSigningKeyForAccessToken;
function getSigningKeyForAccessToken(mysqlConnection) {
    return __awaiter(this, void 0, void 0, function* () {
        const config = config_1.Config.get();
        const signingKeyTableName = config.mysql.tables.signingKey;
        const query = `SELECT key_value, created_at FROM ${signingKeyTableName} WHERE key_name = ?;`;
        const results = yield mysqlConnection.executeQuery(query, [DB_KEY_FOR_SIGNING_KEY_ACCESS_TOKEN]);
        if (results.length === 0) {
            return undefined;
        }
        return {
            value: (results[0].key_value).toString(),
            createdAt: Number(results[0].created_at)
        };
    });
}
exports.getSigningKeyForAccessToken = getSigningKeyForAccessToken;
function updateSingingKeyForAccessToken(mysqlConnection, signingKey, createdAt) {
    return __awaiter(this, void 0, void 0, function* () {
        const config = config_1.Config.get();
        const signingKeyTableName = config.mysql.tables.signingKey;
        const query = `UPDATE ${signingKeyTableName} SET key_value = ?, created_at = ? WHERE key_name = ?;`;
        yield mysqlConnection.executeQuery(query, [signingKey, createdAt, DB_KEY_FOR_SIGNING_KEY_ACCESS_TOKEN]);
    });
}
exports.updateSingingKeyForAccessToken = updateSingingKeyForAccessToken;
function getSigningKeyForRefreshToken(mysqlConnection) {
    return __awaiter(this, void 0, void 0, function* () {
        const config = config_1.Config.get();
        const signingKeyTableName = config.mysql.tables.signingKey;
        const query = `SELECT key_value FROM ${signingKeyTableName} WHERE key_name = ?;`;
        const results = yield mysqlConnection.executeQuery(query, [refreshToken_1.DB_KEY_FOR_SIGNING_KEY_REFRESH_TOKEN]);
        if (results.length === 0) {
            return null;
        }
        return (results[0].key_value).toString();
    });
}
exports.getSigningKeyForRefreshToken = getSigningKeyForRefreshToken;
function newSigningKeyForRefreshToken(mysqlConnection, signingKey, createdAt) {
    return __awaiter(this, void 0, void 0, function* () {
        const config = config_1.Config.get();
        const signingKeyTableName = config.mysql.tables.signingKey;
        const query = `INSERT INTO ${signingKeyTableName} (key_name, key_value, created_at) VALUES (?, ?, ?);`;
        yield mysqlConnection.executeQuery(query, [refreshToken_1.DB_KEY_FOR_SIGNING_KEY_REFRESH_TOKEN, signingKey, createdAt]);
    });
}
exports.newSigningKeyForRefreshToken = newSigningKeyForRefreshToken;
function getInfoForRefreshToken(mysqlConnection, refreshToken) {
    return __awaiter(this, void 0, void 0, function* () {
        const config = config_1.Config.get();
        const refreshTokenTableName = config.mysql.tables.refreshTokens;
        const query = `SELECT user_id, meta_info, expires_at, created_at, session_id FROM ${refreshTokenTableName} WHERE token = ?;`;
        const results = yield mysqlConnection.executeQuery(query, [refreshToken]);
        if (results.length === 0) {
            return undefined;
        }
        return {
            userId: (results[0].user_id).toString(),
            metaInfo: JSON.parse(results[0].meta_info),
            createdAt: Number(results[0].created_at),
            expiresAt: Number(results[0].expires_at),
            sessionId: (results[0].session_id).toString()
        };
    });
}
exports.getInfoForRefreshToken = getInfoForRefreshToken;
function deleteRefreshToken(mysqlConnection, refreshToken) {
    return __awaiter(this, void 0, void 0, function* () {
        const config = config_1.Config.get();
        const refreshTokenTableName = config.mysql.tables.refreshTokens;
        const query = `DELETE FROM ${refreshTokenTableName} WHERE token = ?;`;
        yield mysqlConnection.executeQuery(query, [refreshToken]);
    });
}
exports.deleteRefreshToken = deleteRefreshToken;
function promoteRefreshToken(mysqlConnection, childToken, childTokenExpiresAt, childTokenCreatedAt, parentToken) {
    return __awaiter(this, void 0, void 0, function* () {
        const config = config_1.Config.get();
        const refreshTokenTableName = config.mysql.tables.refreshTokens;
        const query = `UPDATE ${refreshTokenTableName} SET token = ?, expires_at = ?, created_at = ? WHERE token = ?;`;
        yield mysqlConnection.executeQuery(query, [childToken, childTokenExpiresAt, childTokenCreatedAt, parentToken]);
    });
}
exports.promoteRefreshToken = promoteRefreshToken;
function updateMetaInfoForRefreshToken(mysqlConnection, refreshToken, metaInfo) {
    return __awaiter(this, void 0, void 0, function* () {
        const config = config_1.Config.get();
        const refreshTokenTableName = config.mysql.tables.refreshTokens;
        const query = `UPDATE ${refreshTokenTableName} SET meta_info = ? WHERE token = ?`;
        yield mysqlConnection.executeQuery(query, [metaInfo, refreshToken]);
    });
}
exports.updateMetaInfoForRefreshToken = updateMetaInfoForRefreshToken;
function insertIntoRefreshToken(mysqlConnection, refreshToken, userId, sessionId, metaInfo, createdAt) {
    return __awaiter(this, void 0, void 0, function* () {
        const config = config_1.Config.get();
        const refreshTokenTableName = config.mysql.tables.refreshTokens;
        const query = `INSERT INTO ${refreshTokenTableName} (token, user_id, meta_info, session_id, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?);`;
        yield mysqlConnection.executeQuery(query, [refreshToken, userId, metaInfo, sessionId, createdAt, (createdAt + config.tokens.refreshToken.validity)]);
    });
}
exports.insertIntoRefreshToken = insertIntoRefreshToken;
function checkIfSessionIdInDB(mysqlConnection, sessionId) {
    return __awaiter(this, void 0, void 0, function* () {
        const config = config_1.Config.get();
        const refreshTokenTableName = config.mysql.tables.refreshTokens;
        const query = `SELECT session_id FROM ${refreshTokenTableName} WHERE session_id = ?;`;
        const results = yield mysqlConnection.executeQuery(query, [sessionId]);
        return results.length !== 0;
    });
}
exports.checkIfSessionIdInDB = checkIfSessionIdInDB;
function deleteAllExpiredRefreshTokens(mysqlConnection) {
    return __awaiter(this, void 0, void 0, function* () {
        const config = config_1.Config.get();
        const refreshTokenTableName = config.mysql.tables.refreshTokens;
        const query = `DELETE FROM ${refreshTokenTableName} WHERE expired_at <= ?;`;
        yield mysqlConnection.executeQuery(query, [Date.now()]);
    });
}
exports.deleteAllExpiredRefreshTokens = deleteAllExpiredRefreshTokens;
function deleteAllRefreshTokensForUserId(mysqlConnection, userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const config = config_1.Config.get();
        const refreshTokenTableName = config.mysql.tables.refreshTokens;
        const query = `DELETE FROM ${refreshTokenTableName} WHERE user_id = ?`;
        yield mysqlConnection.executeQuery(query, [userId]);
    });
}
exports.deleteAllRefreshTokensForUserId = deleteAllRefreshTokensForUserId;
//# sourceMappingURL=tokens.js.map