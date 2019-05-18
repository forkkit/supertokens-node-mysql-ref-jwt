import Config from '../config';
import { AuthError, generateError } from '../error';
import { Connection } from './mysql';

/**
 * @param connection
 * @param tableName 
 * @description: this function will throw an error if the tables don't exist.
 */
export async function checkIfTableExists(connection: Connection, tableName: string): Promise<void> {
    const query = `SELECT 1 FROM ${tableName} LIMIT 1`;
    await connection.executeQuery(query, []);
}

/**
 * @param connection
 * @param signingKeyTableName 
 * @param refreshTokensTableName 
 */
export async function createTablesIfNotExists(connection: Connection, signingKeyTableName: string, refreshTokensTableName: string) {
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
    await signKeyTableQueryPromise;
    await refreshTokensTableQueryPromise;
}

export async function getKeyValueFromKeyName_Transaction(connection: Connection, keyName: string): Promise<{ keyValue: string, createdAtTime: number }[]> {
    const config = Config.get();
    connection.throwIfTransactionIsNotStarted("expected to be in transaction when reading signing keys");
    let query = `SELECT key_value, created_at_time FROM ${config.mysql.tables.signingKey} WHERE key_name = ? FOR UPDATE`;
    let result = await connection.executeQuery(query, [keyName]);
    if (result.length === 0) {
        return [];
    }
    return result.map((i: any) => ({
        keyValue: i.key_value.toString(),
        createdAtTime: Number(i.created_at_time)
    }));
}

export async function insertKeyValueForKeyName_Transaction(connection: Connection, keyName: string, keyValue: string, createdAtTime: number) {
    const config = Config.get();
    connection.throwIfTransactionIsNotStarted("expected to be in transaction when reading signing keys");
    let query = `INSERT INTO ${config.mysql.tables.signingKey}(key_name, key_value, created_at_time) VALUES (?, ?, ?)`;
    await connection.executeQuery(query, [keyName, keyValue, createdAtTime]);
}

export async function updateSessionData(connection: Connection, sessionHandle: string, sessionData: any) {
    const config = Config.get();
    let query = `UPDATE ${config.mysql.tables.refreshTokens} SET session_info = ? WHERE session_handle = ?`;
    await connection.executeQuery(query, [serialiseSessionData(sessionData), sessionHandle]);
}

export async function getSessionData(connection: Connection, sessionHandle: string): Promise<{ found: false } | { found: true, data: any }> {
    const config = Config.get();
    let query = `SELECT session_info FROM ${config.mysql.tables.refreshTokens} WHERE session_handle = ?`;
    let result = await connection.executeQuery(query, [sessionHandle]);
    if (result.length === 0) {
        return {
            found: false
        };
    }
    return {
        found: true,
        data: unserialiseSessionData(result[0].session_info.toString())
    };
}

export async function deleteSession(connection: Connection, sessionHandle: string): Promise<number> {
    const config = Config.get();
    let query = `DELETE FROM ${config.mysql.tables.refreshTokens} WHERE session_handle = ?`;
    let result = await connection.executeQuery(query, [sessionHandle]);
    return result.affectedRows;
}

export async function createNewSession(connection: Connection, sessionHandle: string, userId: string, refreshTokenHash2: string, sessionData: any, expiresAt: number) {
    const config = Config.get();
    let query = `INSERT INTO ${config.mysql.tables.refreshTokens} 
    (session_handle, user_id, refresh_token_hash_2,
    session_info, expires_at) VALUES (?, ?, ?, ?, ?)`;
    await connection.executeQuery(query, [sessionHandle, userId, refreshTokenHash2, serialiseSessionData(sessionData), expiresAt]);
}

export async function getSessionInfo_Transaction(connection: Connection, sessionHandle: string): Promise<{
    sessionHandle: string, userId: string, refreshTokenHash2: string, sessionData: any, expiresAt: number
} | undefined> {
    const config = Config.get();
    connection.throwIfTransactionIsNotStarted("expected to be in transaction when reading session data");
    let query = `SELECT session_handle, user_id,
    refresh_token_hash_2, session_info,
    expires_at FROM ${config.mysql.tables.refreshTokens} WHERE session_handle = ? FOR UPDATE`;
    let result = await connection.executeQuery(query, [sessionHandle]);
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
}

export async function updateSessionInfo_Transaction(connection: Connection,
    sessionHandle: string, refreshTokenHash2: string, sessionData: any, expiresAt: number): Promise<number> {
    const config = Config.get();
    connection.throwIfTransactionIsNotStarted("expected to be in transaction when updating session data");
    let query = `UPDATE ${config.mysql.tables.refreshTokens} SET refresh_token_hash_2 = ?, 
    session_info = ?, expires_at = ? WHERE session_handle = ?`;
    let result = await connection.executeQuery(query, [refreshTokenHash2, serialiseSessionData(sessionData),
        expiresAt, sessionHandle]);
    return result.affectedRows;
}

function serialiseSessionData(data: any): string {
    if (data === undefined) {
        return "";
    } else {
        return JSON.stringify(data);
    }
}

function unserialiseSessionData(data: string): any {
    if (data === "") {
        return undefined;
    } else {
        try {
            return JSON.parse(data);
        } catch (err) {
            throw generateError(AuthError.GENERAL_ERROR, err);
        }
    }
}