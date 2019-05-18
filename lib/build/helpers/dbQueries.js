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
function getKeyValueFromKeyName(connection, keyName) {
    return __awaiter(this, void 0, void 0, function* () {
        const config = config_1.default.get();
        connection.throwIfTransactionIsNotStarted("expected to be in transaction when reading access token signing key");
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
exports.getKeyValueFromKeyName = getKeyValueFromKeyName;
function insertKeyValueForKeyName(connection, keyName, keyValue, createdAtTime) {
    return __awaiter(this, void 0, void 0, function* () {
        const config = config_1.default.get();
        connection.throwIfTransactionIsNotStarted("expected to be in transaction when reading access token signing key");
        let query = `INSERT INTO ${config.mysql.tables.signingKey} VALUES (key_name, key_value, created_at_time) VALUES (?, ?, ?)`;
        yield connection.executeQuery(query, [keyName, keyValue, createdAtTime]);
    });
}
exports.insertKeyValueForKeyName = insertKeyValueForKeyName;
//# sourceMappingURL=dbQueries.js.map