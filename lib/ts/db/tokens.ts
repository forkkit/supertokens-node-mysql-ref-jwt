import { Connection } from "./mysql";
import { DB_KEY_FOR_SIGNING_KEY_REFRESH_TOKEN, TypeRefreshTokenInfo } from "../tokens/refreshToken";
import { Config } from "../config";

const config = Config.get();
const DB_KEY_FOR_SIGNING_KEY_ACCESS_TOKEN = 'access-token-signing-key';

export async function newSigningKeyForAccessToken (mysqlConnection: Connection, signingKey: string, createdAt: number) {
    const query = `INSERT INTO ${config.mysql.tables.signingKey} (key, value, created_at) VALUES (?, ?, ?);`;
    await mysqlConnection.executeQuery(query, [DB_KEY_FOR_SIGNING_KEY_ACCESS_TOKEN, signingKey, createdAt]);
}

export async function getSigningKeyForAccessToken (mysqlConnection: Connection): Promise<{
    value: string,
    createdAt: number
} | undefined> {
    const query = `SELECT value, created_at FROM ${config.mysql.tables.signingKey} WHERE key = ?;`;
    const results = await mysqlConnection.executeQuery(query, [DB_KEY_FOR_SIGNING_KEY_ACCESS_TOKEN]);
    if (results.length === 0) {
        return undefined;
    }
    return {
        value: (results[0].value).toString(),
        createdAt: Number(results[0].created_at)
    }
}

export async function updateSingingKeyForAccessToken (mysqlConnection: Connection, signingKey: string, createdAt: number) {
    const query = `UPDATE ${config.mysql.tables.signingKey} SET value = ?, created_at = ? WHERE key = ?;`;
    await mysqlConnection.executeQuery(query, [signingKey, createdAt, DB_KEY_FOR_SIGNING_KEY_ACCESS_TOKEN]);
}

export async function getSigningKeyForRefreshToken (mysqlConnection: Connection): Promise<string | null> {
    const query = `SELECT value FROM ${config.mysql.tables.signingKey} WHERE key = ?;`;
    const results = await mysqlConnection.executeQuery(query, [DB_KEY_FOR_SIGNING_KEY_REFRESH_TOKEN]);
    if (results.length === 0) {
        return null;
    }
    return (results[0].value).toString();
}

export async function newSigningKeyForRefreshToken (mysqlConnection: Connection, signingKey: string, createdAt: number) {
    const query = `INSERT INTO ${config.mysql.tables.signingKey} (key, value, created_at) VALUES (?, ?, ?);`;
    await mysqlConnection.executeQuery(query, [DB_KEY_FOR_SIGNING_KEY_REFRESH_TOKEN, signingKey, createdAt]);
}

export async function getInfoForRefreshToken (mysqlConnection: Connection, refreshToken: string): Promise<TypeRefreshTokenInfo | undefined> {
    const query = `SELECT user_id, meta_info, expires_at, created_at, session_id FROM ${config.mysql.tables.refreshTokens} WHERE token = ?;`;
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
    const query = `DELETE FROM ${config.mysql.tables.refreshTokens} WHERE token = ?;`;
    await mysqlConnection.executeQuery(query, [refreshToken]);
}

export async function promoteRefreshToken (mysqlConnection: Connection, childToken: string, childTokenExpiresAt: number, childTokenCreatedAt: number, parentToken: string) {
    const query = `UPDATE ${config.mysql.tables.refreshTokens} SET token = ?, expires_at = ?, created_at = ? WHERE token = ?;`;
    await mysqlConnection.executeQuery(query, [childToken, childTokenExpiresAt, childTokenCreatedAt, parentToken]);
}

export async function updateMetaInfoForRefreshToken (mysqlConnection: Connection, refreshToken: string, metaInfo: string) {
    const query = `UPDATE ${config.mysql.tables.refreshTokens} SET meta_info = ? WHERE token = ?`;
    await mysqlConnection.executeQuery(query, [metaInfo, refreshToken]);
}

export async function insertIntoRefreshToken(mysqlConnection: Connection, refreshToken: string, userId: string, sessionId: string, metaInfo: string, createdAt: number) {
    const query = `INSERT INTO ${config.mysql.tables.refreshTokens} (token, user_id, meta_info, session_id, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?);`;
    await mysqlConnection.executeQuery(query, [refreshToken, userId, metaInfo, sessionId, createdAt, (createdAt + config.tokens.refreshToken.validity)]);
}

export async function checkIfSessionIdInDB(mysqlConnection: Connection, sessionId: string): Promise<boolean> {
    const query = `SELECT session_id FROM ${config.mysql.tables.refreshTokens} WHERE session_id = ?;`;
    const results = await mysqlConnection.executeQuery(query, [sessionId]);
    return results.length !== 0;
}