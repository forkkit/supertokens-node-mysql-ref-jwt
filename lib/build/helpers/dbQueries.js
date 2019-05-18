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
const error_1 = require("../error");
/**
 * @param connection
 * @param tableName
 * @description: this function will throw an error if the tables don't exist.
 */
function checkIfTableExists(connection, tableName) {
    return __awaiter(this, void 0, void 0, function* () {
        const query = `SELECT 1 FROM ${tableName} LIMIT 1`;
        yield connection.executeQuery(query, []);
    });
}
exports.checkIfTableExists = checkIfTableExists;
/**
 * @param connection
 * @param signingKeyTableName
 * @param refreshTokensTableName
 */
function createTablesIfNotExists(connection, signingKeyTableName, refreshTokensTableName) {
    return __awaiter(this, void 0, void 0, function* () {
        /**
         * @todo add proper query. these are just dummy ones + optimise the length of VARCHAR
         */
        const signKeyTableQuery = `
            CREATE TABLE IF NOT EXISTS ${signingKeyTableName} (
                key_name VARCHAR(128),
                key_value VARCHAR(255),
                created_at_time BIGINT UNSIGNED,
                PRIMARY KEY(key_name, key_value)
            );
        `;
        const refreshTokensTableQuery = `
            CREATE TABLE IF NOT EXISTS ${refreshTokensTableName} (
                session_handle VARCHAR(255) NOT NULL,
                user_id VARCHAR(128) NOT NULL,
                refresh_token_hash_2 VARCHAR(128) NOT NULL,
                session_info TEXT,
                expires_at BIGINT UNSIGNED NOT NULL,
                PRIMARY KEY(session_handle)
            );
        `;
        const signKeyTableQueryPromise = connection.executeQuery(signKeyTableQuery, []);
        const refreshTokensTableQueryPromise = connection.executeQuery(refreshTokensTableQuery, []);
        yield signKeyTableQueryPromise;
        yield refreshTokensTableQueryPromise;
    });
}
exports.createTablesIfNotExists = createTablesIfNotExists;
function getKeyValueFromKeyName_Transaction(connection, keyName) {
    return __awaiter(this, void 0, void 0, function* () {
        const config = config_1.default.get();
        connection.throwIfTransactionIsNotStarted("expected to be in transaction when reading signing keys");
        let query = `SELECT key_value, created_at_time FROM ${config.mysql.tables.signingKey} WHERE key_name = ? FOR UPDATE`;
        let result = yield connection.executeQuery(query, [keyName]);
        if (result.length === 0) {
            return [];
        }
        return result.map((i) => ({
            keyValue: i.key_value.toString(),
            createdAtTime: Number(i.created_at_time)
        }));
    });
}
exports.getKeyValueFromKeyName_Transaction = getKeyValueFromKeyName_Transaction;
function insertKeyValueForKeyName_Transaction(connection, keyName, keyValue, createdAtTime) {
    return __awaiter(this, void 0, void 0, function* () {
        const config = config_1.default.get();
        connection.throwIfTransactionIsNotStarted("expected to be in transaction when reading signing keys");
        let query = `INSERT INTO ${config.mysql.tables.signingKey}(key_name, key_value, created_at_time) VALUES (?, ?, ?)`;
        yield connection.executeQuery(query, [keyName, keyValue, createdAtTime]);
    });
}
exports.insertKeyValueForKeyName_Transaction = insertKeyValueForKeyName_Transaction;
function updateSessionData(connection, sessionHandle, sessionData) {
    return __awaiter(this, void 0, void 0, function* () {
        const config = config_1.default.get();
        let query = `UPDATE ${config.mysql.tables.refreshTokens} SET session_info = ? WHERE session_handle = ?`;
        yield connection.executeQuery(query, [serialiseSessionData(sessionData), sessionHandle]);
    });
}
exports.updateSessionData = updateSessionData;
function getSessionData(connection, sessionHandle) {
    return __awaiter(this, void 0, void 0, function* () {
        const config = config_1.default.get();
        let query = `SELECT session_info FROM ${config.mysql.tables.refreshTokens} WHERE session_handle = ?`;
        let result = yield connection.executeQuery(query, [sessionHandle]);
        if (result.length === 0) {
            return {
                found: false
            };
        }
        return {
            found: true,
            data: unserialiseSessionData(result[0].session_info.toString())
        };
    });
}
exports.getSessionData = getSessionData;
function deleteSession(connection, sessionHandle) {
    return __awaiter(this, void 0, void 0, function* () {
        const config = config_1.default.get();
        let query = `DELETE FROM ${config.mysql.tables.refreshTokens} WHERE session_handle = ?`;
        let result = yield connection.executeQuery(query, [sessionHandle]);
        return result.affectedRows;
    });
}
exports.deleteSession = deleteSession;
function createNewSession(connection, sessionHandle, userId, refreshTokenHash2, sessionData, expiresAt) {
    return __awaiter(this, void 0, void 0, function* () {
        const config = config_1.default.get();
        let query = `INSERT INTO ${config.mysql.tables.refreshTokens} 
    (session_handle, user_id, refresh_token_hash_2,
    session_info, expires_at) VALUES (?, ?, ?, ?, ?)`;
        yield connection.executeQuery(query, [sessionHandle, userId, refreshTokenHash2, serialiseSessionData(sessionData), expiresAt]);
    });
}
exports.createNewSession = createNewSession;
function getSessionInfo_Transaction(connection, sessionHandle) {
    return __awaiter(this, void 0, void 0, function* () {
        const config = config_1.default.get();
        connection.throwIfTransactionIsNotStarted("expected to be in transaction when reading session data");
        let query = `SELECT session_handle, user_id,
    refresh_token_hash_2, session_info,
    expires_at FROM ${config.mysql.tables.refreshTokens} WHERE session_handle = ? FOR UPDATE`;
        let result = yield connection.executeQuery(query, [sessionHandle]);
        if (result.length === 0) {
            return undefined;
        }
        let row = result[0];
        return {
            sessionHandle: row.session_handle.toString(),
            userId: row.user_id.toString(),
            refreshTokenHash2: row.refresh_token_hash_2,
            sessionData: unserialiseSessionData(row.session_info.toString()),
            expiresAt: Number(row.expires_at)
        };
    });
}
exports.getSessionInfo_Transaction = getSessionInfo_Transaction;
function updateSessionInfo_Transaction(connection, sessionHandle, refreshTokenHash2, sessionData, expiresAt) {
    return __awaiter(this, void 0, void 0, function* () {
        const config = config_1.default.get();
        connection.throwIfTransactionIsNotStarted("expected to be in transaction when updating session data");
        let query = `UPDATE ${config.mysql.tables.refreshTokens} SET refresh_token_hash_2 = ?, 
    session_info = ?, expires_at = ? WHERE session_handle = ?`;
        let result = yield connection.executeQuery(query, [refreshTokenHash2, serialiseSessionData(sessionData),
            expiresAt, sessionHandle]);
        return result.affectedRows;
    });
}
exports.updateSessionInfo_Transaction = updateSessionInfo_Transaction;
function serialiseSessionData(data) {
    if (data === undefined) {
        return "";
    }
    else {
        return JSON.stringify(data);
    }
}
function unserialiseSessionData(data) {
    if (data === "") {
        return undefined;
    }
    else {
        try {
            return JSON.parse(data);
        }
        catch (err) {
            throw error_1.generateError(error_1.AuthError.GENERAL_ERROR, err);
        }
    }
}
//# sourceMappingURL=dbQueries.js.map