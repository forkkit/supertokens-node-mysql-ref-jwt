import * as mysql from 'mysql';

import Config from '../config';
import { AuthError, generateError } from '../error';
import { checkIfTableExists, createTablesIfNotExists as createTablesIfNotExistsQueries } from './dbQueries';
import { MySQLParamTypes, TypeMysqlConfig } from './types';

/**
 * @todo read about what happens when connection is released, does the isolation level stays for that connection?
 */
export class Mysql {
    private static instance: undefined | Mysql;
    private pool: mysql.Pool;

    private constructor(config: TypeMysqlConfig) {
        this.pool = mysql.createPool({
            host: config.host,
            port: config.port,
            user: config.user,
            password: config.password,
            database: config.database,
            connectionLimit: config.connectionLimit
        });
    }

    static async init() {
        if (Mysql.instance === undefined) {
            const config = Config.get();
            Mysql.instance = new Mysql(config.mysql);
            await createTablesIfNotExists();
        }
    }

    static getConnection(): Promise<mysql.PoolConnection> {
        return new Promise<mysql.PoolConnection>((resolve, reject) => {
            if (Mysql.instance === undefined) {
                reject(generateError(AuthError.GENERAL_ERROR, new Error("mysql not initiated")));
                return;
            }
            Mysql.instance.pool.getConnection((err, connection) => {
                if (err) {
                    reject(generateError(AuthError.GENERAL_ERROR, err));
                    return;
                }
                resolve(connection);
            });
        });
    }
}

export async function getConnection(): Promise<Connection> {
    try {
        const mysqlConnection = await Mysql.getConnection();
        return new Connection(mysqlConnection);
    } catch (err) {
        throw generateError(AuthError.GENERAL_ERROR, new Error("error in connecting to mysql"));
    }
}

export class Connection {
    private isClosed = false;
    private destroyConnnection = false;
    private mysqlConnection: mysql.PoolConnection;

    constructor(mysqlConnection: mysql.PoolConnection) {
        this.mysqlConnection = mysqlConnection;
    }

    executeQuery = (query: string, params: MySQLParamTypes[]): Promise<any> => {
        return new Promise<any>(async (resolve, reject) => {
            this.mysqlConnection.query(query, params, (err, results, fields) => {
                if (err) {
                    reject(generateError(AuthError.GENERAL_ERROR, err));
                    return;
                }
                resolve(results);
            });
        });
    }

    setDestroyConnection = () => {
        this.destroyConnnection = true;
    }

    closeConnection = () => {
        if (this.isClosed) {
            return;
        }
        if (this.mysqlConnection === undefined) {
            throw Error("no connect to MySQL server.");
        }
        try {
            if (this.destroyConnnection) {
                this.mysqlConnection.destroy();
            } else {
                this.mysqlConnection.release();
            }
            this.isClosed = true;
        } catch (err) {
            // we intentially do not throw here.. but we log it.
            generateError(AuthError.GENERAL_ERROR, err);
        }
    }
}

async function createTablesIfNotExists() {
    const config = Config.get();
    let signingKeyTableName = config.mysql.tables.signingKey;
    let refreshTokensTableName = config.mysql.tables.refreshTokens;
    let connection = await getConnection();
    try {
        // first we check if the tables exist so that if the given mysql user does not have the privilege of creatingt them, then it won't throw an error. 
        try {
            await checkIfTableExists(connection, signingKeyTableName);
            await checkIfTableExists(connection, refreshTokensTableName);
            // at this point, both tables exist, so we return;
            return;
        } catch (err) {
            // tables probably don't exist. so we will continue..
        }
        await createTablesIfNotExistsQueries(connection, signingKeyTableName, refreshTokensTableName);
    } catch (err) {
        connection.setDestroyConnection();
    } finally {
        connection.closeConnection();
    }
}