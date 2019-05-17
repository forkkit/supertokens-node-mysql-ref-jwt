import * as mysql from 'mysql';

import { Config } from '../config';
import { errorLogging } from "../helpers/logging";

// TODO: i would like you to make this as close to our production system as possible.. since thats already tested!! so i don't wanna take risk. use same structure and function largely!
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
            database: config.db,
            connectionLimit: config.connectionLimit
        });
    }

    static async init() {
        if (Mysql.instance === undefined) {
            const config = Config.get();
            Mysql.instance = new Mysql(config.mysql);
            await createTablesIfNotExists(config.mysql.tables.signingKey, config.mysql.tables.refreshTokens);
        }
    }

    static getConnection(): Promise<mysql.PoolConnection> { // TODO: you can do this in the getConnection function below itself.. no need to have 2 getConnection functions like this.
        return new Promise<mysql.PoolConnection>((resolve, reject) => {
            if (Mysql.instance === undefined) {
                reject("mysql not initiated");
                return;
            }
            Mysql.instance.pool.getConnection((err, connection) => {
                if (err) {
                    reject(err);
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
        /**
         * @todo
         */
        throw Error(err);
    }
}

export class Connection {
    private isClosed = false;
    private destroyConnnection = false;
    private mysqlConnection: mysql.PoolConnection;

    constructor(mysqlConnection: mysql.PoolConnection) {
        this.mysqlConnection = mysqlConnection;
    }

    executeQuery = (query: string, params: paramTypes[]): Promise<any> => {
        return new Promise<any>(async (resolve, reject) => {
            this.mysqlConnection.query(query, params, (err, results, fields) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(results);
            });
        });
    }

    // executeTransactions = (queries: {
    //     query: string,
    //     params: any[]
    // }[]) => {
    //     const mysqlConnection = this.mysqlConnection;
    //     return new Promise<any>(async (resolve, reject) => {
    //         try {
    //             await new Promise<any>((resolve2, reject2) => {
    //                 mysqlConnection.beginTransaction(async (err) => {
    //                     if (err) {
    //                         reject2(err);
    //                         return;
    //                     }
    //                     for (let i = 0; i < queries.length; i++) {
    //                         await new Promise<any>((resolve3, reject3) => {
    //                             mysqlConnection.query(queries[i].query, queries[i].params, async (err2, results, fields) => {
    //                                 if (err2) {
    //                                     mysqlConnection.rollback(() => {
    //                                         reject3(err2);
    //                                         return;
    //                                     });
    //                                 }
    //                                 resolve3();
    //                             });
    //                         });
    //                     }
    //                     mysqlConnection.commit(err2 => {
    //                         if (err2) {
    //                             mysqlConnection.rollback(() => {
    //                                 reject2(err2);
    //                                 return;
    //                             });
    //                         }
    //                         resolve2();
    //                     });
    //                 });
    //             });
    //             resolve();
    //         } catch (err) {
    //             /**
    //              * @todo
    //              */
    //             reject(err);
    //         }
    //     })
    // }

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
            errorLogging(err);
        }
    }
}

/**
 * 
 * @param signingKeyTableName 
 * @param refreshTokensTableName 
 */
async function createTablesIfNotExists(signingKeyTableName: string, refreshTokensTableName: string) {
    /**
     * @todo add proper query. these are just dummy ones
     */
    try {
        const mysqlConnection = await getConnection();
        const signKeyTableQuery = `
            CREATE TABLE IF NOT EXISTS ${signingKeyTableName} (
                key_name VARCHAR(128),
                key_value VARCHAR(128),
                created_at BIGINT UNSIGNED,
                PRIMARY KEY(key_name, key_value)
            );
        `;
        const refreshTokensTableQuery = `
            CREATE TABLE IF NOT EXISTS ${refreshTokensTableName} (
                token VARCHAR(128),
                user_id VARCHAR(128) NOT NULL,
                meta_info VARCHAR(255) NOT NULL,
                session_id VARCHAR(255) NOT NULL,
                created_at BIGINT UNSIGNED,
                expires_at BIGINT UNSIGNED,
                PRIMARY KEY(token)
            );
        `;
        const signKeyTableQueryPromise = mysqlConnection.executeQuery(signKeyTableQuery, []);
        const refreshTokensTableQueryPromise = mysqlConnection.executeQuery(refreshTokensTableQuery, []);
        await signKeyTableQueryPromise;
        await refreshTokensTableQueryPromise;
        mysqlConnection.closeConnection();  // TODO: this should be in try {} finally block!
    } catch (err) { // TODO: destroy connection in catch block?
        throw err;
    }
}

export type TypeMysqlConfig = {
    host: string,
    port: number,
    user: string,
    password: string,
    connectionLimit: number,
    db: string,
    tables: {
        signingKey: string,
        refreshTokens: string
    }
};

type paramTypes = string | number | boolean | null | Date;