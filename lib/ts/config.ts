import { TypeMysqlConfig } from "./mysql";
/**
 * @class
 */
export class Config {
    private static instance: undefined | Config;
    private config: TypeConfig;

    private constructor (config: TypeInputConfig) {
        this.config = sanitize(config);
    }

    static set (config: any) {
        validate(config);
        if (Config.instance === undefined) {
            Config.instance = new Config(config);
        }
    }

    static get (): TypeConfig {
        if (Config.instance === undefined) {
            throw Error("no config set, please use init function at the start");
        }
        return Config.instance.config;
    }
}

const validate = (config: any): TypeInputConfig => {
    /**
     * @todo do validation
     */
    return config;
}

const sanitize = (config: TypeInputConfig): TypeConfig => {
    return {
        mysql : {
            host: config.mysql.host || defaultConfig.mysql.host,
            port: config.mysql.port || defaultConfig.mysql.port,
            user: config.mysql.user,
            password: config.mysql.password,
            connectionLimit: config.mysql.connectionLimit || defaultConfig.mysql.connectionLimit,
            db: config.mysql.db || defaultConfig.mysql.db,
            tables: config.mysql.tables === undefined ? defaultConfig.mysql.tables : {
                refreshTokens: config.mysql.tables.refreshTokens || defaultConfig.mysql.tables.refreshTokens,
                signingKey: config.mysql.tables.signingKey || defaultConfig.mysql.tables.signingKey
            }
        },
        tokens: {
            accessTokens: config.tokens.accessTokens === undefined ? {
                signingKey: {
                    length: defaultConfig.tokens.accessTokens.signingKey.length.default,
                    dynamic: defaultConfig.tokens.accessTokens.signingKey.dynamic,
                    updateInterval: defaultConfig.tokens.accessTokens.signingKey.updateInterval.default
                },
                validity: defaultConfig.tokens.accessTokens.validity.default
            } : {
                signingKey: config.tokens.accessTokens.signingKey === undefined ? {
                    length: defaultConfig.tokens.accessTokens.signingKey.length.default,
                    dynamic: defaultConfig.tokens.accessTokens.signingKey.dynamic,
                    updateInterval: defaultConfig.tokens.accessTokens.signingKey.updateInterval.default
                } : {
                    length: config.tokens.accessTokens.signingKey.length || defaultConfig.tokens.accessTokens.signingKey.length.default,
                    dynamic: config.tokens.accessTokens.signingKey.dynamic || defaultConfig.tokens.accessTokens.signingKey.dynamic,
                    updateInterval: config.tokens.accessTokens.signingKey.updateInterval || defaultConfig.tokens.accessTokens.signingKey.updateInterval.default
                },
                validity: config.tokens.accessTokens.validity || defaultConfig.tokens.accessTokens.validity.default
            },
            refreshToken: {
                length: config.tokens.refreshToken.length || defaultConfig.tokens.refreshToken.length.default,
                validity: config.tokens.refreshToken.validity || defaultConfig.tokens.refreshToken.validity.default,
                renewTokenURL: config.tokens.refreshToken.renewTokenURL
            }
        },
        cookie: {
            secure: config.cookie.secure || defaultConfig.cookie.secure,
            domain: config.cookie.domain
        },
        logging: {
            info: config.logging.info,
            error: config.logging.error
        },
        security: {
            onTheftDetection: config.security.onTheftDetection
        }
    }
}

const defaultConfig = {
    mysql: {
        host: "localhost",
        port: 3306,
        connectionLimit: 50,
        db: "qually-auth",
        tables: {
            signingKey: "signing-key",
            refreshTokens: "refresh-token"
        }
    },
    tokens: {
        accessTokens: {
            signingKey: {
                length: {
                    max: 128,
                    min: 32,
                    default: 64
                },
                dynamic: false,
                updateInterval: {
                    min: 1,
                    max: 720,
                    default: 24
                }
            },
            validity: {
                min: 60,
                max: 86400000,
                default: 3600
            }
        },
        refreshToken: {
            length:  {
                min: 32,
                max: 128,
                default: 64
            },
            validity: {
                min: 1,
                max: 8760,
                default: 2400
            }
        }
    },
    cookie: {
        secure: true
    }
};

type TypeInfoLoggingFunction = (info: any) => void
type TypeErrorLoggingFunction = (err: any) => void
type TypeSecurityOnTheftDetectionFunction = (userId: string, reason: any) => void

type TypeSecurityConfig =  {
    onTheftDetection: TypeSecurityOnTheftDetectionFunction | undefined
}

type TypeLoggingConfig = {
    info: TypeInfoLoggingFunction | undefined,
    error: TypeErrorLoggingFunction | undefined
}

export type TypeInputConfig = {
    mysql: {
        host: string | undefined,
        port: number | undefined,
        user: string,
        password: string,
        connectionLimit: number | undefined,
        db: string | undefined,
        tables: {
            signingKey: string | undefined,
            refreshTokens: string | undefined
        } | undefined
    },
    tokens: {
        accessTokens: {
            signingKey: {
                length: number | undefined,
                dynamic: boolean | undefined,
                updateInterval: number | undefined
            } | undefined,
            validity: number | undefined
        } | undefined,
        refreshToken: {
            length: number | undefined,
            validity: number | undefined,
            renewTokenURL: string
        }
    },
    logging: TypeLoggingConfig,
    cookie: {
        domain: string,
        secure: boolean | undefined
    },
    security: TypeSecurityConfig
};

type TypeConfig = {
    mysql: TypeMysqlConfig,
    tokens: {
        accessTokens: {
            signingKey: {
                length: number,
                dynamic: boolean,
                updateInterval: number
            },
            validity: number
        },
        refreshToken: {
            length: number,
            validity: number,
            renewTokenURL: string
        }
    },
    logging: TypeLoggingConfig,
    cookie: {
        domain: string,
        secure: boolean
    },
    security: TypeSecurityConfig
}