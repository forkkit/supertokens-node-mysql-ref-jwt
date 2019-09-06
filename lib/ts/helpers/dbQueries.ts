import Config from "../config";
import { AuthError, generateError } from "../error";
import { Connection, getConnection } from "./mysql";
import { parseUserIdToCorrectFormat, stringifyUserId } from "./utils";

/**
 * @description contains all the mysql queries.
 * @throws AuthError GENERAL_ERROR
 */

/**
 * @param connection
 * @param tableName
 * @throws error if the tables don't exist.
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
export async function createTablesIfNotExists(
    connection: Connection,
    signingKeyTableName: string,
    refreshTokensTableName: string,
    allTokensTableName: string
) {
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
    await signKeyTableQueryPromise;
    await refreshTokensTableQueryPromise;
    await allTokensTableQueryPromise;
}

export async function getKeyValueFromKeyName_Transaction(
    connection: Connection,
    keyName: string
): Promise<{ keyValue: string; createdAtTime: number } | undefined> {
    const config = Config.get();
    connection.throwIfTransactionIsNotStarted("expected to be in transaction when reading signing keys");
    let query = `
        SELECT
            key_value, created_at_time
        FROM ${config.mysql.tables.signingKey}
        WHERE
            key_name = ?
        FOR UPDATE`;
    let result = await connection.executeQuery(query, [keyName]);
    if (result.length === 0) {
        return undefined;
    }
    return {
        keyValue: result[0].key_value.toString(),
        createdAtTime: Number(result[0].created_at_time)
    };
}

export async function insertKeyValueForKeyName_Transaction(
    connection: Connection,
    keyName: string,
    keyValue: string,
    createdAtTime: number
) {
    const config = Config.get();
    connection.throwIfTransactionIsNotStarted("expected to be in transaction when reading signing keys");
    let query = `
        INSERT INTO
            ${config.mysql.tables.signingKey}(key_name, key_value, created_at_time)
        VALUES
            (?, ?, ?)
        ON DUPLICATE KEY UPDATE
            key_value = ?, created_at_time = ?
    `;
    await connection.executeQuery(query, [keyName, keyValue, createdAtTime, keyValue, createdAtTime]);
}

export async function updateSessionInfo(connection: Connection, sessionHandle: string, sessionInfo: any) {
    const config = Config.get();
    let query = `
        UPDATE ${config.mysql.tables.refreshTokens}
        SET
            session_info = ?
        WHERE
            session_handle = ?`;
    let result = await connection.executeQuery(query, [serializeSessionInfo(sessionInfo), sessionHandle]);
    return result.affectedRows;
}

export async function getSessionInfo(
    connection: Connection,
    sessionHandle: string
): Promise<{ found: false } | { found: true; data: any }> {
    const config = Config.get();
    let query = `
        SELECT
            session_info
        FROM
            ${config.mysql.tables.refreshTokens}
        WHERE
            session_handle = ?
    `;
    let result = await connection.executeQuery(query, [sessionHandle]);
    if (result.length === 0) {
        return {
            found: false
        };
    }
    return {
        found: true,
        data: unserializeSessionInfo(result[0].session_info)
    };
}

export async function deleteSession(connection: Connection, sessionHandle: string): Promise<number> {
    const config = Config.get();
    let query = `
        DELETE FROM ${config.mysql.tables.refreshTokens}
        WHERE
            session_handle = ?
    `;
    let result = await connection.executeQuery(query, [sessionHandle]);
    return result.affectedRows;
}

export async function createNewSession(
    connection: Connection,
    sessionHandle: string,
    userId: string | number,
    refreshTokenHash2: string,
    sessionInfo: any,
    expiresAt: number,
    jwtPayload: any
) {
    userId = stringifyUserId(userId);
    const config = Config.get();
    let query = `
        INSERT INTO
            ${config.mysql.tables.refreshTokens}(session_handle, user_id, refresh_token_hash_2,
                                                session_info, expires_at, jwt_user_payload)
        VALUES
            (?, ?, ?, ?, ?, ?);
    `;
    await connection.executeQuery(query, [
        sessionHandle,
        userId,
        refreshTokenHash2,
        serializeSessionInfo(sessionInfo),
        expiresAt,
        serializeSessionInfo(jwtPayload)
    ]);
}

export async function insertIntoAllTokens(
    connection: Connection,
    sessionHandle: string,
    parentRefreshTokenHash2: string,
    refreshTokenHash2: string
) {
    const config = Config.get();
    let query = `
        INSERT INTO
            ${
                config.mysql.tables.allTokens
            }(refresh_token_hash_2, parent_refresh_token_hash_2, session_handle, created_time)
        VALUES
            (?, ?, ?, ?)
    `;
    await connection.executeQuery(query, [refreshTokenHash2, parentRefreshTokenHash2, sessionHandle, Date.now()]);
}

export async function getInfoFromAllTokens(
    connection: Connection,
    refreshTokenHash2: string
): Promise<
    | {
          sessionHandle: string;
          parentRefreshTokenHash2: string;
      }
    | undefined
> {
    const config = Config.get();
    let query = `
        SELECT
            session_handle,
            parent_refresh_token_hash_2
        FROM
            ${config.mysql.tables.allTokens}
        WHERE
        refresh_token_hash_2 = ?;
    `;
    let result = await connection.executeQuery(query, [refreshTokenHash2]);
    if (result.length === 0) {
        return undefined;
    }
    let row = result[0];
    return {
        sessionHandle: row.session_handle,
        parentRefreshTokenHash2: row.parent_refresh_token_hash_2
    };
}

export async function isSessionBlacklisted(connection: Connection, sessionHandle: string): Promise<boolean> {
    const config = Config.get();
    let query = `
        SELECT
            session_handle
        FROM
            ${config.mysql.tables.refreshTokens}
        WHERE
            session_handle = ?
    `;
    let result = await connection.executeQuery(query, [sessionHandle]);
    return result.length === 0;
}

export async function getSessionObject_Transaction(
    connection: Connection,
    sessionHandle: string
): Promise<
    | {
          userId: string | number;
          refreshTokenHash2: string;
          sessionInfo: any;
          expiresAt: number;
          jwtPayload: any;
      }
    | undefined
> {
    const config = Config.get();
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
    let result = await connection.executeQuery(query, [sessionHandle]);
    if (result.length === 0) {
        return undefined;
    }
    let row = result[0];
    return {
        userId: parseUserIdToCorrectFormat(row.user_id),
        refreshTokenHash2: row.refresh_token_hash_2,
        sessionInfo: unserializeSessionInfo(row.session_info),
        expiresAt: Number(row.expires_at),
        jwtPayload: unserializeSessionInfo(row.jwt_user_payload)
    };
}

export async function updateSessionObject_Transaction(
    connection: Connection,
    sessionHandle: string,
    refreshTokenHash2: string,
    sessionInfo: any,
    expiresAt: number
): Promise<number> {
    const config = Config.get();
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
    let result = await connection.executeQuery(query, [
        refreshTokenHash2,
        serializeSessionInfo(sessionInfo),
        expiresAt,
        sessionHandle
    ]);
    return result.affectedRows;
}

export async function getAllSessionHandlesForUser(connection: Connection, userId: string | number): Promise<string[]> {
    userId = stringifyUserId(userId);
    const config = Config.get();
    let query = `
        SELECT
            session_handle
        FROM
            ${config.mysql.tables.refreshTokens}
        WHERE
            user_id = ?
    `;
    let result = await connection.executeQuery(query, [userId]);
    return result.map((i: any) => i.session_handle.toString());
}

export async function deleteAllExpiredSessions(connection: Connection) {
    const config = Config.get();
    const query = `
        DELETE FROM ${config.mysql.tables.refreshTokens}
        WHERE
            expires_at <= ?;
    `;
    await connection.executeQuery(query, [Date.now()]);
}

export async function deleteAllOldOrphanTokens(connection: Connection, createdBefore: number) {
    const config = Config.get();
    const query = `
        DELETE FROM ${config.mysql.tables.allTokens}
        WHERE
            created_time < ?
            AND parent_refresh_token_hash_2 NOT IN (
                SELECT
                    refresh_token_hash_2
                FROM
                    ${config.mysql.tables.refreshTokens}
            )
    `;
    await connection.executeQuery(query, [createdBefore]);
}

function serializeSessionInfo(data: any): string {
    if (data === undefined) {
        return "";
    } else {
        return JSON.stringify(data);
    }
}

function unserializeSessionInfo(data: string): any {
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

export async function resetTables(connection: Connection) {
    if (process.env.TEST_MODE !== "testing") {
        throw Error("call this function only during testing");
    }
    const config = Config.get();
    let query = `
        DROP TABLE IF EXISTS
            ${config.mysql.tables.refreshTokens},
            ${config.mysql.tables.signingKey},
            ${config.mysql.tables.allTokens};
    `;
    await connection.executeQuery(query, []);
}

export async function getNumberOfRowsInRefreshTokensTable(): Promise<number> {
    if (process.env.TEST_MODE !== "testing") {
        throw Error("call this function only during testing");
    }
    let connection = await getConnection();
    try {
        const config = Config.get();
        let query = `
            SELECT
                COUNT(*) AS rowsCount
            FROM
                ${config.mysql.tables.refreshTokens};
        `;
        let result = await connection.executeQuery(query, []);
        return Number(result[0].rowsCount);
    } finally {
        connection.closeConnection();
    }
}

export async function getNumberOfRowsInAllTokensTable(): Promise<number> {
    if (process.env.TEST_MODE !== "testing") {
        throw Error("call this function only during testing");
    }
    let connection = await getConnection();
    try {
        const config = Config.get();
        let query = `
            SELECT
                COUNT(*) AS rowsCount
            FROM
                ${config.mysql.tables.allTokens};
        `;
        let result = await connection.executeQuery(query, []);
        return Number(result[0].rowsCount);
    } finally {
        connection.closeConnection();
    }
}

export async function removeOldSessions() {
    let connection = await getConnection();
    try {
        await deleteAllExpiredSessions(connection);
    } finally {
        connection.closeConnection();
    }
}

export async function removeOldOrphanTokens(createdBefore: number) {
    let connection = await getConnection();
    try {
        await deleteAllOldOrphanTokens(connection, createdBefore);
    } finally {
        connection.closeConnection();
    }
}
