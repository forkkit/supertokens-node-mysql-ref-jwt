import { Connection } from "./mysql";
/**
 * @description contains all the mysql queries.
 * @throws AuthError GENERAL_ERROR
 */
/**
 * @param connection
 * @param tableName
 * @throws error if the tables don't exist.
 */
export declare function checkIfTableExists(connection: Connection, tableName: string): Promise<void>;
/**
 * @param connection
 * @param signingKeyTableName
 * @param refreshTokensTableName
 */
export declare function createTablesIfNotExists(connection: Connection, signingKeyTableName: string, refreshTokensTableName: string): Promise<void>;
export declare function getKeyValueFromKeyName_Transaction(connection: Connection, keyName: string): Promise<{
    keyValue: string;
    createdAtTime: number;
} | undefined>;
export declare function insertKeyValueForKeyName_Transaction(connection: Connection, keyName: string, keyValue: string, createdAtTime: number): Promise<void>;
export declare function updateSessionData(connection: Connection, sessionHandleHash1: string, sessionData: any): Promise<any>;
export declare function getSessionData(connection: Connection, sessionHandleHash1: string): Promise<{
    found: false;
} | {
    found: true;
    data: any;
}>;
export declare function deleteSession(connection: Connection, sessionHandleHash1: string): Promise<number>;
export declare function createNewSession(connection: Connection, sessionHandleHash1: string, userId: string, refreshTokenHash2: string, sessionData: any, expiresAt: number, jwtPayload: any): Promise<void>;
export declare function getSessionInfo_Transaction(connection: Connection, sessionHandleHash1: string): Promise<{
    userId: string;
    refreshTokenHash2: string;
    sessionData: any;
    expiresAt: number;
    jwtPayload: any;
} | undefined>;
export declare function updateSessionInfo_Transaction(connection: Connection, sessionHandleHash1: string, refreshTokenHash2: string, sessionData: any, expiresAt: number): Promise<number>;
export declare function getAllHash1SessionHandlesForUser(connection: Connection, userId: string): Promise<string[]>;
export declare function deleteAllExpiredSessions(connection: Connection): Promise<void>;
export declare function resetTables(connection: Connection): Promise<void>;
export declare function getNumberOfRowsInRefreshTokensTable(): Promise<number>;
