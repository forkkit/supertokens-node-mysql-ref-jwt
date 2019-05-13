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
            throw Error(err);
        }
    });
}
exports.getConnection = getConnection;
class Connection {
    constructor(connection) {
        this.executeQuery = (query, params) => {
            const connection = this.connection;
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                try {
                    const queryResult = yield new Promise((resolve2, reject2) => {
                        connection.query(query, params, (err, results, fields) => {
                            if (err) {
                                reject2(err);
                                return;
                            }
                            resolve2(results);
                        });
                    });
                    resolve(queryResult);
                }
                catch (err) {
                    /**
                     * @todo
                     */
                    reject(err);
                }
            }));
        };
        this.executeTransactions = (queries) => {
            const connection = this.connection;
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                try {
                    yield new Promise((resolve2, reject2) => {
                        connection.beginTransaction((err) => __awaiter(this, void 0, void 0, function* () {
                            if (err) {
                                reject2(err);
                                return;
                            }
                            for (let i = 0; i < queries.length; i++) {
                                yield new Promise((resolve3, reject3) => {
                                    connection.query(queries[i].query, queries[i].params, (err2, results, fields) => __awaiter(this, void 0, void 0, function* () {
                                        if (err2) {
                                            connection.rollback(() => {
                                                reject3(err2);
                                                return;
                                            });
                                        }
                                        resolve3();
                                    }));
                                });
                            }
                            connection.commit(err2 => {
                                if (err2) {
                                    connection.rollback(() => {
                                        reject2(err2);
                                        return;
                                    });
                                }
                                resolve2();
                            });
                        }));
                    });
                    resolve();
                }
                catch (err) {
                    /**
                     * @todo
                     */
                    reject(err);
                }
            }));
        };
        this.closeConnection = () => {
            this.connection.release();
        };
        this.connection = connection;
    }
}
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
                value VARCHAR(128) NOT NULL,
                time_created INT UNSIGNED
            );
        `;
            const refreshTokensTableQuery = `
            CREATE TABLE IF NOT EXISTS ${refreshTokensTableName} (
                token VARCHAR(128) PRIMARY KEY,
                user_id VARCHAR(128) NOT NULL,
                meta_info VARCHAR(255) NOT NULL,
                time_created INT UNSIGNED
            );
        `;
            const signKeyTableQueryPromise = mysqlConnection.executeQuery(signKeyTableQuery, []);
            const refreshTokensTableQueryPromise = mysqlConnection.executeQuery(refreshTokensTableQuery, []);
            yield signKeyTableQueryPromise;
            yield refreshTokensTableQueryPromise;
            mysqlConnection.closeConnection();
        }
        catch (err) {
            throw err;
        }
    });
}
//# sourceMappingURL=index.js.map