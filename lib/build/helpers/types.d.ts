/// <reference types="node" />
import * as tls from "tls";
export declare type TypeInputConfig = {
    mysql: {
        host?: string;
        port?: number;
        user: string;
        password: string;
        connectionLimit?: number;
        database: string;
        ssl?: string | (tls.SecureContextOptions & {
            rejectUnauthorized?: boolean;
        });
        tables?: {
            signingKey?: string;
            refreshTokens?: string;
        };
    };
    tokens: {
        accessToken?: {
            signingKey?: {
                dynamic?: boolean;
                updateInterval?: number;
                get?: TypeGetSigningKeyUserFunction;
            };
            validity?: number;
            blacklisting?: boolean;
            accessTokenPath?: string;
        };
        refreshToken: {
            validity?: number;
            removalCronjobInterval?: string;
            renewTokenPath: string;
        };
        enableAntiCsrf?: boolean;
    };
    logging?: {
        info?: (info: any) => void;
        error?: (err: any) => void;
    };
    cookie: {
        domain: string;
        secure?: boolean;
        sameSite?: "strict" | "lax" | "none";
    };
};
export declare type TypeConfig = {
    mysql: {
        host: string;
        port: number;
        user: string;
        password: string;
        connectionLimit: number;
        database: string;
        ssl?: string | (tls.SecureContextOptions & {
            rejectUnauthorized?: boolean;
        });
        tables: {
            signingKey: string;
            refreshTokens: string;
        };
    };
    tokens: {
        accessToken: {
            signingKey: {
                dynamic: boolean;
                updateInterval: number;
                get: TypeGetSigningKeyUserFunction | undefined;
            };
            validity: number;
            blacklisting: boolean;
            accessTokenPath: string;
        };
        refreshToken: {
            validity: number;
            removalCronjobInterval: string;
            renewTokenPath: string;
        };
        enableAntiCsrf: boolean;
    };
    logging: {
        info?: (info: any) => void;
        error?: (err: any) => void;
    };
    cookie: {
        domain: string;
        secure: boolean;
        sameSite: "strict" | "lax" | "none";
    };
};
export declare type TypeGetSigningKeyUserFunction = () => Promise<string>;
export declare type MySQLParamTypes = string | number | boolean | null | Date;
export declare type TypeAuthError = {
    errType: number;
    err: any;
};
