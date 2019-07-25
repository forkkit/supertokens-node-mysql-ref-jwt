import { MySQLParamTypes, TypeQueryResultInfo } from "./types";
export declare class Mysql {
    private static instance;
    private pool;
    private constructor();
    static init(): Promise<void>;
    static getConnection(): Promise<any>;
    static reset: () => void;
}
export declare function getConnection(): Promise<Connection>;
export declare class Connection {
    private isClosed;
    private destroyConnnection;
    private mysqlConnection;
    private currTransactionCount;
    constructor(mysqlConnection: any);
    executeQuery: (query: string, params: MySQLParamTypes[]) => Promise<{
        results: any[];
        info: TypeQueryResultInfo;
    }>;
    private setDestroyConnection;
    throwIfTransactionIsNotStarted: (message: string) => void;
    startTransaction: () => Promise<void>;
    commit: () => Promise<void>;
    closeConnection: () => void;
}
export declare function checkIfSigningKeyTableExists(): Promise<boolean>;
export declare function checkIfRefreshTokensTableExists(): Promise<boolean>;
