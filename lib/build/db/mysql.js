"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const mysql = require("mysql");
const config_1 = require("../config");
// TODO: i would like you to make this as close to our production system as possible.. since thats already tested!! so i don't wanna take risk. use same structure and function largely!
/**
 * @todo read about what happens when connection is released, does the isolation level stays for that connection?
 */
class Mysql {
    constructor(config) {
        this.pool = mysql.createPool({
            host: config.host,
            port: config.port,
            user: config.user,
            password: config.password,
            database: config.db,
            connectionLimit: config.connectionLimit
        });
    }
    static init() {
        return __awaiter(this, void 0, void 0, function* () {
            if (Mysql.instance !== undefined) {
                const config = config_1.Config.get();
                Mysql.instance = new Mysql(config.mysql);
                yield createTablesIfNotExists(config.mysql.tables.signingKey, config.mysql.tables.refreshTokens);
            }
        });
    }
    static getConnection() {
        return new Promise((resolve, reject) => {
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
exports.Mysql = Mysql;
function getConnection() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const mysqlConnection = yield Mysql.getConnection();
            return new Connection(mysqlConnection);
        }
        catch (err) {
            /**
             * @todo
             */
            throw Error(err);
        }
    });
}
exports.getConnection = getConnection;
class Connection {
    constructor(connection) {
        this.isClosed = false;
        this.destroyConnnection = false;
        this.executeQuery = (query, params) => {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                this.connection.query(query, params, (err, results, fields) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(results);
                });
            }));
        };
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
        this.setDestroyConnection = () => {
            this.destroyConnnection = true;
        };
        this.closeConnection = () => {
            if (this.isClosed) {
                return;
            }
            if (this.connection === undefined) {
                throw Error("no connect to MySQL server.");
            }
            try {
                if (this.destroyConnnection) {
                    this.connection.destroy();
                }
                else {
                    this.connection.release();
                }
                this.isClosed = true;
            }
            catch (err) { // TODO: are you sure those functions above throw errors?
                /**
                 * @todo
                 */
            }
        };
        this.connection = connection;
    }
}
exports.Connection = Connection;
function createTablesIfNotExists(signingKeyTableName, refreshTokensTableName) {
    return __awaiter(this, void 0, void 0, function* () {
        /**
         * @todo add proper query. these are just dummy ones
         */
        try {
            const mysqlConnection = yield getConnection();
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
                session_id VARCHAR(255) NOT NULL,
                created_at INT UNSIGNED,
                expires_at INT UNSIGNED
            );
        `;
            const signKeyTableQueryPromise = mysqlConnection.executeQuery(signKeyTableQuery, []);
            const refreshTokensTableQueryPromise = mysqlConnection.executeQuery(refreshTokensTableQuery, []);
            yield signKeyTableQueryPromise;
            yield refreshTokensTableQueryPromise;
            mysqlConnection.closeConnection(); // TODO: this should be in try {} finally block!
        }
        catch (err) { // TODO: destroy connection in catch block?
            throw err;
        }
    });
}
//# sourceMappingURL=mysql.js.map