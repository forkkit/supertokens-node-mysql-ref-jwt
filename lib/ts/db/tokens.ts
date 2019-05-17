import { Connection } from "./mysql";
import { DB_KEY_FOR_SIGNING_KEY_REFRESH_TOKEN, TypeRefreshTokenInfo } from "../tokens/refreshToken";
import { Config } from "../config";

const DB_KEY_FOR_SIGNING_KEY_ACCESS_TOKEN = 'access-token-signing-key';

export async function newSigningKeyForAccessToken (mysqlConnection: Connection, signingKey: string, createdAt: number) {
    const config = Config.get();
    const signingKeyTableName = config.mysql.tables.signingKey;
    const query = `INSERT INTO ${signingKeyTableName} (key_name, key_value, created_at) VALUES (?, ?, ?);`;
    await mysqlConnection.executeQuery(query, [DB_KEY_FOR_SIGNING_KEY_ACCESS_TOKEN, signingKey, createdAt]);
}

export async function getSigningKeyForAccessToken (mysqlConnection: Connection): Promise<{
    value: string,
    createdAt: number
} | undefined> {
    const config = Config.get();
    const signingKeyTableName = config.mysql.tables.signingKey;
    const query = `SELECT key_value, created_at FROM ${signingKeyTableName} WHERE key_name = ?;`;
    const results = await mysqlConnection.executeQuery(query, [DB_KEY_FOR_SIGNING_KEY_ACCESS_TOKEN]);
    if (results.length === 0) {
        return undefined;
    }
    return {
        value: (results[0].key_value).toString(),
        createdAt: Number(results[0].created_at)
    }
}

export async function updateSingingKeyForAccessToken (mysqlConnection: Connection, signingKey: string, createdAt: number) {
    const config = Config.get();
    const signingKeyTableName = config.mysql.tables.signingKey;
    const query = `UPDATE ${signingKeyTableName} SET key_value = ?, created_at = ? WHERE key_name = ?;`;
    await mysqlConnection.executeQuery(query, [signingKey, createdAt, DB_KEY_FOR_SIGNING_KEY_ACCESS_TOKEN]);
}

export async function getSigningKeyForRefreshToken (mysqlConnection: Connection): Promise<string | null> {
    const config = Config.get();
    const signingKeyTableName = config.mysql.tables.signingKey;
    const query = `SELECT key_value FROM ${signingKeyTableName} WHERE key_name = ?;`;
    const results = await mysqlConnection.executeQuery(query, [DB_KEY_FOR_SIGNING_KEY_REFRESH_TOKEN]);
    if (results.length === 0) {
        return null;
    }
    return (results[0].key_value).toString();
}

export async function newSigningKeyForRefreshToken (mysqlConnection: Connection, signingKey: string, createdAt: number) {
    const config = Config.get();
    const signingKeyTableName = config.mysql.tables.signingKey;
    const query = `INSERT INTO ${signingKeyTableName} (key_name, key_value, created_at) VALUES (?, ?, ?);`;
    await mysqlConnection.executeQuery(query, [DB_KEY_FOR_SIGNING_KEY_REFRESH_TOKEN, signingKey, createdAt]);
}

export async function getInfoForRefreshToken (mysqlConnection: Connection, refreshToken: string): Promise<TypeRefreshTokenInfo | undefined> {
    const config = Config.get();
    const refreshTokenTableName = config.mysql.tables.refreshTokens;
    const query = `SELECT user_id, meta_info, expires_at, created_at, session_id FROM ${refreshTokenTableName} WHERE token = ?;`;
    const results = await mysqlConnection.executeQuery(query, [refreshToken]);
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
}

export async function deleteRefreshToken (mysqlConnection: Connection, refreshToken: string) {
    const config = Config.get();
    const refreshTokenTableName = config.mysql.tables.refreshTokens;
    const query = `DELETE FROM ${refreshTokenTableName} WHERE token = ?;`;
    await mysqlConnection.executeQuery(query, [refreshToken]);
}

export async function promoteRefreshToken (mysqlConnection: Connection, childToken: string, childTokenExpiresAt: number, childTokenCreatedAt: number, parentToken: string) {
    const config = Config.get();
    const refreshTokenTableName = config.mysql.tables.refreshTokens;
    const query = `UPDATE ${refreshTokenTableName} SET token = ?, expires_at = ?, created_at = ? WHERE token = ?;`;
    await mysqlConnection.executeQuery(query, [childToken, childTokenExpiresAt, childTokenCreatedAt, parentToken]);
}

export async function updateMetaInfoForRefreshToken (mysqlConnection: Connection, refreshToken: string, metaInfo: string) {
    const config = Config.get();
    const refreshTokenTableName = config.mysql.tables.refreshTokens;
    const query = `UPDATE ${refreshTokenTableName} SET meta_info = ? WHERE token = ?`;
    await mysqlConnection.executeQuery(query, [metaInfo, refreshToken]);
}

export async function insertIntoRefreshToken (mysqlConnection: Connection, refreshToken: string, userId: string, sessionId: string, metaInfo: string, createdAt: number) {
    const config = Config.get();
    const refreshTokenTableName = config.mysql.tables.refreshTokens;
    const query = `INSERT INTO ${refreshTokenTableName} (token, user_id, meta_info, session_id, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?);`;
    await mysqlConnection.executeQuery(query, [refreshToken, userId, metaInfo, sessionId, createdAt, (createdAt + config.tokens.refreshToken.validity)]);
}

export async function checkIfSessionIdInDB (mysqlConnection: Connection, sessionId: string): Promise<boolean> {
    const config = Config.get();
    const refreshTokenTableName = config.mysql.tables.refreshTokens;
    const query = `SELECT session_id FROM ${refreshTokenTableName} WHERE session_id = ?;`;
    const results = await mysqlConnection.executeQuery(query, [sessionId]);
    return results.length !== 0;
}

export async function deleteAllExpiredRefreshTokens(mysqlConnection: Connection) {
    const config = Config.get();
    const refreshTokenTableName = config.mysql.tables.refreshTokens;
    const query = `DELETE FROM ${refreshTokenTableName} WHERE expired_at <= ?;`;
    await mysqlConnection.executeQuery(query, [Date.now()]);
}