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
const config_1 = require("../config");
const error_1 = require("../error");
/**
 * @description contains all the mysql queries.
 * @throws AuthError GENERAL_ERROR
 */
/**
 * @param connection
 * @param tableName
 * @throws error if the tables don't exist.
 */
function checkIfTableExists(connection, tableName) {
    return __awaiter(this, void 0, void 0, function*() {
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
    return __awaiter(this, void 0, void 0, function*() {
        const signKeyTableQuery = `
            CREATE TABLE IF NOT EXISTS ${signingKeyTableName} (
                key_name VARCHAR(128),
                key_value VARCHAR(255),
                created_at_time BIGINT UNSIGNED,
                PRIMARY KEY(key_name)
            );
        `;
        const refreshTokensTableQuery = `
            CREATE TABLE IF NOT EXISTS ${refreshTokensTableName} (
                session_handle_hash_1 VARCHAR(255) NOT NULL,
                user_id VARCHAR(128) NOT NULL,
                refresh_token_hash_2 VARCHAR(128) NOT NULL,
                session_info TEXT,
                expires_at BIGINT UNSIGNED NOT NULL,
                jwt_user_payload TEXT,
                PRIMARY KEY(session_handle_hash_1)
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
    return __awaiter(this, void 0, void 0, function*() {
        const config = config_1.default.get();
        connection.throwIfTransactionIsNotStarted("expected to be in transaction when reading signing keys");
        let query = `SELECT key_value, created_at_time FROM ${
            config.mysql.tables.signingKey
        } WHERE key_name = ? FOR UPDATE`;
        let result = yield connection.executeQuery(query, [keyName]);
        if (result.length === 0) {
            return undefined;
        }
        return {
            keyValue: result[0].key_value.toString(),
            createdAtTime: Number(result[0].created_at_time)
        };
    });
}
exports.getKeyValueFromKeyName_Transaction = getKeyValueFromKeyName_Transaction;
function insertKeyValueForKeyName_Transaction(connection, keyName, keyValue, createdAtTime) {
    return __awaiter(this, void 0, void 0, function*() {
        const config = config_1.default.get();
        connection.throwIfTransactionIsNotStarted("expected to be in transaction when reading signing keys");
        let query = `INSERT INTO ${
            config.mysql.tables.signingKey
        }(key_name, key_value, created_at_time) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE key_value = ?, created_at_time = ?`;
        yield connection.executeQuery(query, [keyName, keyValue, createdAtTime, keyValue, createdAtTime]);
    });
}
exports.insertKeyValueForKeyName_Transaction = insertKeyValueForKeyName_Transaction;
function updateSessionData(connection, sessionHandleHash1, sessionData) {
    return __awaiter(this, void 0, void 0, function*() {
        const config = config_1.default.get();
        let query = `UPDATE ${config.mysql.tables.refreshTokens} SET session_info = ? WHERE session_handle_hash_1 = ?`;
        let result = yield connection.executeQuery(query, [serialiseSessionData(sessionData), sessionHandleHash1]);
        return result.affectedRows;
    });
}
exports.updateSessionData = updateSessionData;
function getSessionData(connection, sessionHandleHash1) {
    return __awaiter(this, void 0, void 0, function*() {
        const config = config_1.default.get();
        let query = `SELECT session_info FROM ${config.mysql.tables.refreshTokens} WHERE session_handle_hash_1 = ?`;
        let result = yield connection.executeQuery(query, [sessionHandleHash1]);
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
function deleteSession(connection, sessionHandleHash1) {
    return __awaiter(this, void 0, void 0, function*() {
        const config = config_1.default.get();
        let query = `DELETE FROM ${config.mysql.tables.refreshTokens} WHERE session_handle_hash_1 = ?`;
        let result = yield connection.executeQuery(query, [sessionHandleHash1]);
        return result.affectedRows;
    });
}
exports.deleteSession = deleteSession;
function createNewSession(
    connection,
    sessionHandleHash1,
    userId,
    refreshTokenHash2,
    sessionData,
    expiresAt,
    jwtPayload
) {
    return __awaiter(this, void 0, void 0, function*() {
        const config = config_1.default.get();
        let query = `INSERT INTO ${config.mysql.tables.refreshTokens} 
    (session_handle_hash_1, user_id, refresh_token_hash_2,
    session_info, expires_at, jwt_user_payload) VALUES (?, ?, ?, ?, ?, ?)`;
        yield connection.executeQuery(query, [
            sessionHandleHash1,
            userId,
            refreshTokenHash2,
            serialiseSessionData(sessionData),
            expiresAt,
            serialiseSessionData(jwtPayload)
        ]);
    });
}
exports.createNewSession = createNewSession;
function getSessionInfo_Transaction(connection, sessionHandleHash1) {
    return __awaiter(this, void 0, void 0, function*() {
        const config = config_1.default.get();
        connection.throwIfTransactionIsNotStarted("expected to be in transaction when reading session data");
        let query = `SELECT user_id,
    refresh_token_hash_2, session_info,
    expires_at, jwt_user_payload FROM ${config.mysql.tables.refreshTokens} WHERE session_handle_hash_1 = ? FOR UPDATE`;
        let result = yield connection.executeQuery(query, [sessionHandleHash1]);
        if (result.length === 0) {
            return undefined;
        }
        let row = result[0];
        return {
            userId: row.user_id.toString(),
            refreshTokenHash2: row.refresh_token_hash_2,
            sessionData: unserialiseSessionData(row.session_info.toString()),
            expiresAt: Number(row.expires_at),
            jwtPayload: unserialiseSessionData(row.jwt_user_payload.toString())
        };
    });
}
exports.getSessionInfo_Transaction = getSessionInfo_Transaction;
function updateSessionInfo_Transaction(connection, sessionHandleHash1, refreshTokenHash2, sessionData, expiresAt) {
    return __awaiter(this, void 0, void 0, function*() {
        const config = config_1.default.get();
        connection.throwIfTransactionIsNotStarted("expected to be in transaction when updating session data");
        let query = `UPDATE ${config.mysql.tables.refreshTokens} SET refresh_token_hash_2 = ?, 
    session_info = ?, expires_at = ? WHERE session_handle_hash_1 = ?`;
        let result = yield connection.executeQuery(query, [
            refreshTokenHash2,
            serialiseSessionData(sessionData),
            expiresAt,
            sessionHandleHash1
        ]);
        return result.affectedRows;
    });
}
exports.updateSessionInfo_Transaction = updateSessionInfo_Transaction;
function getAllHash1SessionHandlesForUser(connection, userId) {
    return __awaiter(this, void 0, void 0, function*() {
        const config = config_1.default.get();
        let query = `SELECT session_handle_hash_1 FROM ${config.mysql.tables.refreshTokens} WHERE user_id = ?`;
        let result = yield connection.executeQuery(query, [userId]);
        return result.map(i => i.session_handle_hash_1.toString());
    });
}
exports.getAllHash1SessionHandlesForUser = getAllHash1SessionHandlesForUser;
function deleteAllExpiredSessions(connection) {
    return __awaiter(this, void 0, void 0, function*() {
        const config = config_1.default.get();
        const query = `DELETE FROM ${config.mysql.tables.refreshTokens} WHERE expires_at <= ?;`;
        yield connection.executeQuery(query, [Date.now()]);
    });
}
exports.deleteAllExpiredSessions = deleteAllExpiredSessions;
function serialiseSessionData(data) {
    if (data === undefined) {
        return "";
    } else {
        return JSON.stringify(data);
    }
}
function unserialiseSessionData(data) {
    if (data === "") {
        return undefined;
    } else {
        try {
            return JSON.parse(data);
        } catch (err) {
            throw error_1.generateError(error_1.AuthError.GENERAL_ERROR, err);
        }
    }
}
function resetTables(connection) {
    return __awaiter(this, void 0, void 0, function*() {
        if (process.env.TEST_MODE !== "testing") {
            throw Error("call this function only during testing");
        }
        const config = config_1.default.get();
        let query = `DROP TABLE IF EXISTS ${config.mysql.tables.refreshTokens}, ${config.mysql.tables.signingKey};`;
        yield connection.executeQuery(query, []);
    });
}
exports.resetTables = resetTables;
//# sourceMappingURL=dbQueries.js.map
