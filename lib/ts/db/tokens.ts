import { Connection } from "./mysql";
import { DB_KEY_FOR_SIGNING_KEY_ACCESS_TOKEN } from "../tokens/accessToken";
import { DB_KEY_FOR_SIGNING_KEY_REFRESH_TOKEN, TypeRefreshTokenInfo } from "../tokens/refreshToken";
import { Config } from "../config";

const config = Config.get();

export async function newSigningKeyForAccessToken (connection: Connection, signingKey: string, createdAt: number) {
    const query = `INSERT INTO ${config.mysql.tables.signingKey} VALUES (?, ?, ?);`;
    await connection.executeQuery(query, [DB_KEY_FOR_SIGNING_KEY_ACCESS_TOKEN, signingKey, createdAt]);
}

export async function getSigningKeyForAccessToken (connection: Connection): Promise<{
    value: string,
    createdAt: number
} | undefined> {
    const query = `SELECT value, created_at FROM ${config.mysql.tables.signingKey} WHERE key = ?;`;
    const results = await connection.executeQuery(query, [DB_KEY_FOR_SIGNING_KEY_ACCESS_TOKEN]);
    if (results.length === 0) {
        return undefined;
    }
    return {
        value: (results[0].value).toString(),
        createdAt: Number(results[0].created_at)
    }
}

export async function updateSingingKeyForAccessToken (connection: Connection, signingKey: string, createdAt: number) {
    const query = `UPDATE ${config.mysql.tables.signingKey} SET value = ?, created_at = ? WHERE key = ?;`;
    await connection.executeQuery(query, [signingKey, createdAt, DB_KEY_FOR_SIGNING_KEY_ACCESS_TOKEN]);
}

export async function getSigningKeyForRefreshToken (connection: Connection): Promise<string | null> {
    const query = `SELECT value FROM ${config.mysql.tables.signingKey} WHERE key = ?;`;
    const results = await connection.executeQuery(query, [DB_KEY_FOR_SIGNING_KEY_REFRESH_TOKEN]);
    if (results.length === 0) {
        return null;
    }
    return (results[0].value).toString();
}

export async function newSigningKeyForRefreshToken (connection: Connection, signingKey: string, createdAt: number) {
    const query = `INSERT INTO ${config.mysql.tables.signingKey} VALUES (?, ?, ?);`;
    await connection.executeQuery(query, [DB_KEY_FOR_SIGNING_KEY_REFRESH_TOKEN, signingKey, createdAt]);
}

export async function getInfoForRefreshToken (connection: Connection, refreshToken: string): Promise<TypeRefreshTokenInfo | undefined> {
    const query = `SELECT user_id, meta_info, expires_at, created_at FROM ${config.mysql.tables.refreshTokens} WHERE token = ?;`;
    const results = await connection.executeQuery(query, [refreshToken]);
    if (results.length === 0) {
        return undefined;
    }
    return {
        userId: (results[0].user_id).toString(),
        metaInfo: JSON.parse(results[0].meta_info),
        createdAt: Number(results[0].created_at),
        expiresAt: Number(results[0].expires_at)
    };
}

export async function deleteRefreshToken (connection: Connection, refreshToken: string) {
    const query = `DELETE FROM ${config.mysql.tables.refreshTokens} WHERE token = ?;`;
    await connection.executeQuery(query, [refreshToken]);
}

export async function promoteRefreshToken (connection: Connection, childToken: string, childTokenExpiresAt: number, childTokenCreatedAt: number, parentToken: string) {
    const query = `UPDATE ${config.mysql.tables.refreshTokens} SET token = ?, expires_at = ?, created_at = ? WHERE token = ?;`;
    await connection.executeQuery(query, [childToken, childTokenExpiresAt, childTokenCreatedAt, parentToken]);
}

export async function updateMetaInfoForRefreshToken (connection: Connection, refreshToken: string, metaInfo: string) {
    const query = `UPDATE ${config.mysql.tables.refreshTokens} SET meta_info = ? WHERE token = ?`;
    await connection.executeQuery(query, [metaInfo, refreshToken]);
}