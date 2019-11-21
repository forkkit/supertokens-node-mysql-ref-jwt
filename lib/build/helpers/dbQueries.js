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
const mysql_1 = require("./mysql");
const utils_1 = require("./utils");
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
function createTablesIfNotExists(connection, signingKeyTableName, refreshTokensTableName, allTokensTableName) {
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
            session_handle VARCHAR(255) NOT NULL,
            user_id VARCHAR(128) NOT NULL,
            refresh_token_hash_2 VARCHAR(128) NOT NULL,
            session_info TEXT,
            expires_at BIGINT UNSIGNED NOT NULL,
            jwt_user_payload TEXT,
            PRIMARY KEY(session_handle)
        );
    `;
        const allTokensTableQuery = `
        CREATE TABLE IF NOT EXISTS ${allTokensTableName} (
            refresh_token_hash_2 VARCHAR(128) NOT NULL,
            parent_refresh_token_hash_2 VARCHAR(128) NOT NULL,
            session_handle VARCHAR(255) NOT NULL,
            created_time BIGINT UNSIGNED NOT NULL,
            PRIMARY KEY(refresh_token_hash_2)
        );
    `;
        const signKeyTableQueryPromise = connection.executeQuery(signKeyTableQuery, []);
        const refreshTokensTableQueryPromise = connection.executeQuery(refreshTokensTableQuery, []);
        const allTokensTableQueryPromise = connection.executeQuery(allTokensTableQuery, []);
        yield signKeyTableQueryPromise;
        yield refreshTokensTableQueryPromise;
        yield allTokensTableQueryPromise;
    });
}
exports.createTablesIfNotExists = createTablesIfNotExists;
function getKeyValueFromKeyName_Transaction(connection, keyName) {
    return __awaiter(this, void 0, void 0, function*() {
        const config = config_1.default.get();
        connection.throwIfTransactionIsNotStarted("expected to be in transaction when reading signing keys");
        let query = `
        SELECT
            key_value, created_at_time
        FROM ${config.mysql.tables.signingKey}
        WHERE
            key_name = ?
        FOR UPDATE`;
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
        let query = `
        INSERT INTO
            ${config.mysql.tables.signingKey}(key_name, key_value, created_at_time)
        VALUES
            (?, ?, ?)
        ON DUPLICATE KEY UPDATE
            key_value = ?, created_at_time = ?
    `;
        yield connection.executeQuery(query, [keyName, keyValue, createdAtTime, keyValue, createdAtTime]);
    });
}
exports.insertKeyValueForKeyName_Transaction = insertKeyValueForKeyName_Transaction;
function updateSessionInfo(connection, sessionHandle, sessionInfo) {
    return __awaiter(this, void 0, void 0, function*() {
        const config = config_1.default.get();
        let query = `
        UPDATE ${config.mysql.tables.refreshTokens}
        SET
            session_info = ?
        WHERE
            session_handle = ?`;
        let result = yield connection.executeQuery(query, [serializeSessionInfo(sessionInfo), sessionHandle]);
        return result.affectedRows;
    });
}
exports.updateSessionInfo = updateSessionInfo;
function getSessionInfo(connection, sessionHandle) {
    return __awaiter(this, void 0, void 0, function*() {
        const config = config_1.default.get();
        let query = `
        SELECT
            session_info
        FROM
            ${config.mysql.tables.refreshTokens}
        WHERE
            session_handle = ?
    `;
        let result = yield connection.executeQuery(query, [sessionHandle]);
        if (result.length === 0) {
            return {
                found: false
            };
        }
        return {
            found: true,
            data: unserializeSessionInfo(result[0].session_info)
        };
    });
}
exports.getSessionInfo = getSessionInfo;
function deleteSession(connection, sessionHandle) {
    return __awaiter(this, void 0, void 0, function*() {
        const config = config_1.default.get();
        let query = `
        DELETE FROM ${config.mysql.tables.refreshTokens}
        WHERE
            session_handle = ?
    `;
        let result = yield connection.executeQuery(query, [sessionHandle]);
        return result.affectedRows;
    });
}
exports.deleteSession = deleteSession;
function createNewSession(connection, sessionHandle, userId, refreshTokenHash2, sessionInfo, expiresAt, jwtPayload) {
    return __awaiter(this, void 0, void 0, function*() {
        userId = utils_1.stringifyUserId(userId);
        const config = config_1.default.get();
        let query = `
        INSERT INTO
            ${config.mysql.tables.refreshTokens}(session_handle, user_id, refresh_token_hash_2,
                                                session_info, expires_at, jwt_user_payload)
        VALUES
            (?, ?, ?, ?, ?, ?);
    `;
        yield connection.executeQuery(query, [
            sessionHandle,
            userId,
            refreshTokenHash2,
            serializeSessionInfo(sessionInfo),
            expiresAt,
            serializeSessionInfo(jwtPayload)
        ]);
    });
}
exports.createNewSession = createNewSession;
function insertIntoAllTokens(connection, sessionHandle, parentRefreshTokenHash2, refreshTokenHash2) {
    return __awaiter(this, void 0, void 0, function*() {
        const config = config_1.default.get();
        let query = `
        INSERT INTO
            ${
                config.mysql.tables.allTokens
            }(refresh_token_hash_2, parent_refresh_token_hash_2, session_handle, created_time)
        VALUES
            (?, ?, ?, ?)
    `;
        yield connection.executeQuery(query, [refreshTokenHash2, parentRefreshTokenHash2, sessionHandle, Date.now()]);
    });
}
exports.insertIntoAllTokens = insertIntoAllTokens;
function getInfoFromAllTokens(connection, refreshTokenHash2) {
    return __awaiter(this, void 0, void 0, function*() {
        const config = config_1.default.get();
        let query = `
        SELECT
            session_handle,
            parent_refresh_token_hash_2
        FROM
            ${config.mysql.tables.allTokens}
        WHERE
        refresh_token_hash_2 = ?;
    `;
        let result = yield connection.executeQuery(query, [refreshTokenHash2]);
        if (result.length === 0) {
            return undefined;
        }
        let row = result[0];
        return {
            sessionHandle: row.session_handle,
            parentRefreshTokenHash2: row.parent_refresh_token_hash_2
        };
    });
}
exports.getInfoFromAllTokens = getInfoFromAllTokens;
function isSessionBlacklisted(connection, sessionHandle) {
    return __awaiter(this, void 0, void 0, function*() {
        const config = config_1.default.get();
        let query = `
        SELECT
            session_handle
        FROM
            ${config.mysql.tables.refreshTokens}
        WHERE
            session_handle = ?
    `;
        let result = yield connection.executeQuery(query, [sessionHandle]);
        return result.length === 0;
    });
}
exports.isSessionBlacklisted = isSessionBlacklisted;
function getSessionObject_Transaction(connection, sessionHandle) {
    return __awaiter(this, void 0, void 0, function*() {
        const config = config_1.default.get();
        connection.throwIfTransactionIsNotStarted("expected to be in transaction when reading session data");
        let query = `
        SELECT
            user_id, refresh_token_hash_2, session_info,
            expires_at, jwt_user_payload
        FROM
            ${config.mysql.tables.refreshTokens}
        WHERE
            session_handle = ?
        FOR UPDATE
    `;
        let result = yield connection.executeQuery(query, [sessionHandle]);
        if (result.length === 0) {
            return undefined;
        }
        let row = result[0];
        return {
            userId: utils_1.parseUserIdToCorrectFormat(row.user_id),
            refreshTokenHash2: row.refresh_token_hash_2,
            sessionInfo: unserializeSessionInfo(row.session_info),
            expiresAt: Number(row.expires_at),
            jwtPayload: unserializeSessionInfo(row.jwt_user_payload)
        };
    });
}
exports.getSessionObject_Transaction = getSessionObject_Transaction;
function updateSessionObject_Transaction(connection, sessionHandle, refreshTokenHash2, sessionInfo, expiresAt) {
    return __awaiter(this, void 0, void 0, function*() {
        const config = config_1.default.get();
        connection.throwIfTransactionIsNotStarted("expected to be in transaction when updating session data");
        let query = `
        UPDATE ${config.mysql.tables.refreshTokens}
        SET
            refresh_token_hash_2 = ?,
            session_info = ?,
            expires_at = ?
        WHERE
            session_handle = ?
    `;
        let result = yield connection.executeQuery(query, [
            refreshTokenHash2,
            serializeSessionInfo(sessionInfo),
            expiresAt,
            sessionHandle
        ]);
        return result.affectedRows;
    });
}
exports.updateSessionObject_Transaction = updateSessionObject_Transaction;
function getAllSessionHandlesForUser(connection, userId) {
    return __awaiter(this, void 0, void 0, function*() {
        userId = utils_1.stringifyUserId(userId);
        const config = config_1.default.get();
        let query = `
        SELECT
            session_handle
        FROM
            ${config.mysql.tables.refreshTokens}
        WHERE
            user_id = ?
    `;
        let result = yield connection.executeQuery(query, [userId]);
        return result.map(i => i.session_handle.toString());
    });
}
exports.getAllSessionHandlesForUser = getAllSessionHandlesForUser;
function deleteAllExpiredSessions(connection) {
    return __awaiter(this, void 0, void 0, function*() {
        const config = config_1.default.get();
        const query = `
        DELETE FROM ${config.mysql.tables.refreshTokens}
        WHERE
            expires_at <= ?;
    `;
        yield connection.executeQuery(query, [Date.now()]);
    });
}
exports.deleteAllExpiredSessions = deleteAllExpiredSessions;
function deleteAllOldOrphanTokens(connection, createdBefore) {
    return __awaiter(this, void 0, void 0, function*() {
        const config = config_1.default.get();
        const query = `
        DELETE FROM ${config.mysql.tables.allTokens}
        WHERE
            created_time < ?
            AND parent_refresh_token_hash_2 NOT IN (
                SELECT
                    refresh_token_hash_2
                FROM
                    ${config.mysql.tables.refreshTokens}
            ) AND refresh_token_hash_2 NOT IN (
                SELECT
                    refresh_token_hash_2
                FROM
                    ${config.mysql.tables.refreshTokens}
            )
    `;
        yield connection.executeQuery(query, [createdBefore]);
    });
}
exports.deleteAllOldOrphanTokens = deleteAllOldOrphanTokens;
function serializeSessionInfo(data) {
    if (data === undefined) {
        return "";
    } else {
        return JSON.stringify(data);
    }
}
function unserializeSessionInfo(data) {
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
        let query = `
        DROP TABLE IF EXISTS
            ${config.mysql.tables.refreshTokens},
            ${config.mysql.tables.signingKey},
            ${config.mysql.tables.allTokens};
    `;
        yield connection.executeQuery(query, []);
    });
}
exports.resetTables = resetTables;
function getNumberOfRowsInRefreshTokensTable() {
    return __awaiter(this, void 0, void 0, function*() {
        if (process.env.TEST_MODE !== "testing") {
            throw Error("call this function only during testing");
        }
        let connection = yield mysql_1.getConnection();
        try {
            const config = config_1.default.get();
            let query = `
            SELECT
                COUNT(*) AS rowsCount
            FROM
                ${config.mysql.tables.refreshTokens};
        `;
            let result = yield connection.executeQuery(query, []);
            return Number(result[0].rowsCount);
        } finally {
            connection.closeConnection();
        }
    });
}
exports.getNumberOfRowsInRefreshTokensTable = getNumberOfRowsInRefreshTokensTable;
function getNumberOfRowsInAllTokensTable() {
    return __awaiter(this, void 0, void 0, function*() {
        if (process.env.TEST_MODE !== "testing") {
            throw Error("call this function only during testing");
        }
        let connection = yield mysql_1.getConnection();
        try {
            const config = config_1.default.get();
            let query = `
            SELECT
                COUNT(*) AS rowsCount
            FROM
                ${config.mysql.tables.allTokens};
        `;
            let result = yield connection.executeQuery(query, []);
            return Number(result[0].rowsCount);
        } finally {
            connection.closeConnection();
        }
    });
}
exports.getNumberOfRowsInAllTokensTable = getNumberOfRowsInAllTokensTable;
function removeOldSessions() {
    return __awaiter(this, void 0, void 0, function*() {
        let connection = yield mysql_1.getConnection();
        try {
            yield deleteAllExpiredSessions(connection);
        } finally {
            connection.closeConnection();
        }
    });
}
exports.removeOldSessions = removeOldSessions;
function removeOldOrphanTokens(createdBefore) {
    return __awaiter(this, void 0, void 0, function*() {
        let connection = yield mysql_1.getConnection();
        try {
            yield deleteAllOldOrphanTokens(connection, createdBefore);
        } finally {
            connection.closeConnection();
        }
    });
}
exports.removeOldOrphanTokens = removeOldOrphanTokens;
//# sourceMappingURL=dbQueries.js.map
