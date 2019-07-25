let mysql = require("@mysql/xdevapi");

import Config from "../config";
import { AuthError, generateError } from "../error";
import { MySQLParamTypes, TypeConfig, TypeQueryResultInfo } from "./types";
import { checkIfTableExists, createTablesIfNotExists as createTablesIfNotExistsQueries } from "./dbQueries";

export class Mysql {
    private static instance: undefined | Mysql;
    private pool: { close: Function; getSession: Function };

    private constructor(config: TypeConfig) {
        this.pool = mysql.getClient({
            host: config.mysql.host,
            port: config.mysql.port,
            user: config.mysql.user,
            password: config.mysql.password,
            schema: config.mysql.database,
            pooling: {
                enabled: true,
                maxSize: config.mysql.connectionLimit,
                queueTimeout: 10
            },
            connectTimeout: 5000
        });
    }

    static async init() {
        if (Mysql.instance === undefined) {
            const config = Config.get();
            Mysql.instance = new Mysql(config);
            await createTablesIfNotExists();
        }
    }

    static getConnection(): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            if (Mysql.instance === undefined) {
                reject(generateError(AuthError.GENERAL_ERROR, new Error("mysql not initiated")));
                return;
            }
            Mysql.instance.pool
                .getSession()
                .then((connection: any) => resolve(connection))
                .catch((err: any) => reject(generateError(AuthError.GENERAL_ERROR, err)));
        });
    }

    static reset = () => {
        if (process.env.TEST_MODE !== "testing") {
            throw Error("call this function only during testing");
        }
        Mysql.instance = undefined;
    };
}

export async function getConnection(): Promise<Connection> {
    try {
        const mysqlConnection = await Mysql.getConnection();
        return new Connection(mysqlConnection);
    } catch (err) {
        throw generateError(AuthError.GENERAL_ERROR, err);
    }
}

export class Connection {
    private isClosed = false;
    private destroyConnnection = false;
    private mysqlConnection: any;
    private currTransactionCount = 0; // used to keep track of live transactions. so that in case a connection is closed prematurely, we can destroy it.

    constructor(mysqlConnection: any) {
        this.mysqlConnection = mysqlConnection;
    }

    executeQuery = (
        query: string,
        params: MySQLParamTypes[]
    ): Promise<{ results: any[]; info: TypeQueryResultInfo }> => {
        return new Promise<{ results: any[]; info: TypeQueryResultInfo }>(async (resolve, reject) => {
            let results: any[] = [];
            this.mysqlConnection
                .sql(query)
                .bind(params)
                .execute((result: any) => results.push(result))
                .then((info: TypeQueryResultInfo) => resolve({ results, info }))
                .catch((err: any) => reject(generateError(AuthError.GENERAL_ERROR, err)));
        });
    };

    private setDestroyConnection = () => {
        this.destroyConnnection = true;
    };

    throwIfTransactionIsNotStarted = (message: string) => {
        if (this.currTransactionCount === 0) {
            throw generateError(AuthError.GENERAL_ERROR, new Error(message));
        }
    };

    startTransaction = async () => {
        await this.executeQuery("START TRANSACTION", []);
        this.currTransactionCount += 1;
    };

    commit = async () => {
        await this.executeQuery("COMMIT", []);
        this.currTransactionCount -= 1;
    };

    closeConnection = () => {
        if (this.isClosed) {
            return;
        }
        if (this.mysqlConnection === undefined) {
            throw Error("no connect to MySQL server.");
        }
        if (this.currTransactionCount > 0) {
            this.setDestroyConnection();
        }
        try {
            if (this.destroyConnnection) {
                this.mysqlConnection.disconnect();
            } else {
                this.mysqlConnection.close();
            }
            this.isClosed = true;
        } catch (err) {
            // we intentially do not throw here.. but we log it.
            generateError(AuthError.GENERAL_ERROR, err);
        }
    };
}

async function createTablesIfNotExists() {
    // first we check if the tables exist so that if the given mysql user does not have the privilege of creating them, then it won't throw an error.
    if ((await checkIfSigningKeyTableExists()) && (await checkIfRefreshTokensTableExists())) {
        return;
    }
    const config = Config.get();
    let signingKeyTableName = config.mysql.tables.signingKey;
    let refreshTokensTableName = config.mysql.tables.refreshTokens;
    let connection = await getConnection();
    try {
        await createTablesIfNotExistsQueries(connection, signingKeyTableName, refreshTokensTableName);
    } finally {
        connection.closeConnection();
    }
}

export async function checkIfSigningKeyTableExists(): Promise<boolean> {
    const config = Config.get();
    let signingKeyTableName = config.mysql.tables.signingKey;
    let connection = await getConnection();
    try {
        await checkIfTableExists(connection, signingKeyTableName);
        return true;
    } catch (err) {
        // i.e. tables don't exist
        return false;
    } finally {
        connection.closeConnection();
    }
}

export async function checkIfRefreshTokensTableExists(): Promise<boolean> {
    const config = Config.get();
    let refreshTokensTableName = config.mysql.tables.refreshTokens;
    let connection = await getConnection();
    try {
        await checkIfTableExists(connection, refreshTokensTableName);
        return true;
    } catch (err) {
        // i.e. tables don't exist
        return false;
    } finally {
        connection.closeConnection();
    }
}
