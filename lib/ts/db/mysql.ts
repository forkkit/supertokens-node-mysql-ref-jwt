import * as mysql from 'mysql';

import { Config } from '../config';

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
        if (Mysql.instance !== undefined) {
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
    private connection: mysql.PoolConnection;

    constructor(connection: mysql.PoolConnection) {
        this.connection = connection;
    }

    executeQuery = (query: string, params: paramTypes[]): Promise<any> => {
        return new Promise<any>(async (resolve, reject) => {
            this.connection.query(query, params, (err, results, fields) => {
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
    //     const connection = this.connection;
    //     return new Promise<any>(async (resolve, reject) => {
    //         try {
    //             await new Promise<any>((resolve2, reject2) => {
    //                 connection.beginTransaction(async (err) => {
    //                     if (err) {
    //                         reject2(err);
    //                         return;
    //                     }
    //                     for (let i = 0; i < queries.length; i++) {
    //                         await new Promise<any>((resolve3, reject3) => {
    //                             connection.query(queries[i].query, queries[i].params, async (err2, results, fields) => {
    //                                 if (err2) {
    //                                     connection.rollback(() => {
    //                                         reject3(err2);
    //                                         return;
    //                                     });
    //                                 }
    //                                 resolve3();
    //                             });
    //                         });
    //                     }
    //                     connection.commit(err2 => {
    //                         if (err2) {
    //                             connection.rollback(() => {
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
        if (this.connection === undefined) {
            throw Error("no connect to MySQL server.");
        }
        try {
            if (this.destroyConnnection) {
                this.connection.destroy();
            } else {
                this.connection.release();
            }
            this.isClosed = true;
        } catch (err) { // TODO: are you sure those functions above throw errors?
            /**
             * @todo
             */
        }
    }
}

async function createTablesIfNotExists(signingKeyTableName: string, refreshTokensTableName: string) {
    /**
     * @todo add proper query. these are just dummy ones
     */
    try {
        const mysqlConnection = await getConnection();
        const signKeyTableQuery = `
            CREATE TABLE IF NOT EXISTS ${signingKeyTableName} (
                key VARCHAR(128) PRIMARY KEY,
                value VARCHAR(128) PRIMARY KEY,
                created_at INT UNSIGNED
            );
        `;
        const refreshTokensTableQuery = `
            CREATE TABLE IF NOT EXISTS ${refreshTokensTableName} (
                token VARCHAR(128) PRIMARY KEY,
                user_id VARCHAR(128) NOT NULL,
                meta_info VARCHAR(255) NOT NULL,
                created_at INT UNSIGNED,
                expires_at INT UNSIGNED
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