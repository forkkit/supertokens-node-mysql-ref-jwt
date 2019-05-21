import * as mysql from 'mysql';
import { MySQLParamTypes } from './types';
export declare class Mysql {
    private static instance;
    private pool;
    private constructor();
    static init(): Promise<void>;
    static getConnection(): Promise<mysql.PoolConnection>;
}
export declare function getConnection(): Promise<Connection>;
export declare class Connection {
    private isClosed;
    private destroyConnnection;
    private mysqlConnection;
    private currTransactionCount;
    constructor(mysqlConnection: mysql.PoolConnection);
    executeQuery: (query: string, params: MySQLParamTypes[]) => Promise<any>;
    setDestroyConnection: () => void;
    throwIfTransactionIsNotStarted: (message: string) => void;
    startTransaction: () => Promise<void>;
    commit: () => Promise<void>;
    closeConnection: () => void;
}
