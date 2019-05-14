import { Connection } from "./mysql";
import { DB_KEY_FOR_SIGNING_KEY_ACCESS_TOKEN } from "../tokens/accessToken";
import { DB_KEY_FOR_SIGNING_KEY_REFRESH_TOKEN } from "../tokens/refreshToken";
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

export async function updateSingingKeyForAccessToken(connection: Connection, signingKey: string, createdAt: number) {
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