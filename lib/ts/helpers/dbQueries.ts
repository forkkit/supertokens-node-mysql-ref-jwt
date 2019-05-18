import Config from '../config';
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

export async function getKeyValueFromKeyName(connection: Connection, keyName: string): Promise<{ keyValue: string, createdAtTime: number }[]> {
    const config = Config.get();
    connection.throwIfTransactionIsNotStarted("expected to be in transaction when reading access token signing key");
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

export async function insertKeyValueForKeyName(connection: Connection, keyName: string, keyValue: string, createdAtTime: number) {
    const config = Config.get();
    connection.throwIfTransactionIsNotStarted("expected to be in transaction when reading access token signing key");
    let query = `INSERT INTO ${config.mysql.tables.signingKey} VALUES (key_name, key_value, created_at_time) VALUES (?, ?, ?)`;
    await connection.executeQuery(query, [keyName, keyValue, createdAtTime]);
}