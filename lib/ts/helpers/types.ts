export type TypeInputConfig = {
    mysql: {
        host?: string,
        port?: number,
        user: string,
        password: string,
        connectionLimit?: number,
        database: string,
        tables?: {
            signingKey?: string,
            refreshTokens?: string
        }
    },
    tokens: {
        accessToken?: {
            signingKey?: {
                dynamic?: boolean,
                updateInterval?: number,
                get?: TypeGetSigningKeyUserFunction
            },
            validity?: number
        },
        refreshToken: {
            validity?: number,
            renewTokenURL: string   // TODO: this is just the path right? If so, please specify this.
        }
    },
    logging?: TypeLoggingConfig,
    cookie: {
        domain: string,
        secure?: boolean
    },
    onTokenTheftDetection?: TypeSecurityConfig
};

export type TypeConfig = {
    mysql: {
        host: string,
        port: number,
        user: string,
        password: string,
        connectionLimit: number,
        database: string,
        tables: {
            signingKey: string,
            refreshTokens: string
        }
    },
    tokens: {
        accessToken: {
            signingKey: {
                dynamic: boolean,
                updateInterval: number
                get: TypeGetSigningKeyUserFunction | undefined
            },
            validity: number
        },
        refreshToken: {
            validity: number,
            renewTokenURL: string
        }
    },
    logging: TypeLoggingConfig,
    cookie: {
        domain: string,
        secure: boolean,
        accessTokenCookieKey: string,
        refreshTokenCookieKey: string,
        idRefreshTokenCookieKey: string
    },
    onTokenTheftDetection: TypeSecurityConfig
};


type TypeSecurityConfig = (userId: string, sessionHandle: string) => void;

type TypeLoggingConfig = {
    info?: (info: any) => void,
    error?: (err: any) => void
};

export type TypeGetSigningKeyUserFunction = () => Promise<string>;

export type MySQLParamTypes = string | number | boolean | null | Date;