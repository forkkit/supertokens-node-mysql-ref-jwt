import { TypeMysqlConfig } from './db/mysql';
import { TypeAccessTokenConfig, TypeGetSigningKeyUserFunction } from './tokens/accessToken';

// TODO: have all types in one file ideally.. easier to navigate and maintain. call this file types. This is done so that the other files do not get bogged down with types.. and have just the logic.
/**
 * @class
 */
export class Config {
    private static instance: undefined | Config;
    private config: TypeConfig;

    private constructor(config: TypeInputConfig) {
        this.config = sanitize(config);
    }

    static set(config: any) {
        validate(config);
        if (Config.instance === undefined) {
            Config.instance = new Config(config);
        }
    }
    // TODO: wherever you have used this, remember that this can throw an error.
    static get(): TypeConfig {
        if (Config.instance === undefined) {
            throw Error("no config set, please use init function at the start");
        }
        return Config.instance.config;
    }
}

const validate = (config: any): TypeInputConfig => {
    /**
     * @todo do validation - for this you can use my frontend library to validate if you want.
     */
    return config;
}

const sanitize = (config: TypeInputConfig): TypeConfig => {
    // TODO: do not do this style.. check for explicit undefined... what is something is number | undefined and that person gives 0 as a number.. then its as good as false. Or an empty string???
    return {
        mysql: {
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
                    dynamic: defaultConfig.tokens.accessTokens.signingKey.dynamic,
                    updateInterval: defaultConfig.tokens.accessTokens.signingKey.updateInterval.default * 60 * 60 * 1000,
                    get: undefined
                },
                validity: defaultConfig.tokens.accessTokens.validity.default * 1000
            } : {
                    signingKey: config.tokens.accessTokens.signingKey === undefined ? {
                        dynamic: defaultConfig.tokens.accessTokens.signingKey.dynamic,
                        updateInterval: defaultConfig.tokens.accessTokens.signingKey.updateInterval.default,
                        get: undefined
                    } : {
                            dynamic: config.tokens.accessTokens.signingKey.dynamic || defaultConfig.tokens.accessTokens.signingKey.dynamic,
                            updateInterval: config.tokens.accessTokens.signingKey.updateInterval || defaultConfig.tokens.accessTokens.signingKey.updateInterval.default,
                            get: config.tokens.accessTokens.signingKey.get
                        },
                    validity: config.tokens.accessTokens.validity || defaultConfig.tokens.accessTokens.validity.default * 1000
                },
            refreshToken: {
                validity: (config.tokens.refreshToken.validity || defaultConfig.tokens.refreshToken.validity.default) * 60 * 60 * 1000,
                renewTokenURL: config.tokens.refreshToken.renewTokenURL
            }
        },
        cookie: {
            secure: config.cookie.secure || defaultConfig.cookie.secure,
            domain: config.cookie.domain,
            accessTokenCookieKey: defaultConfig.cookie.accessTokenCookieKey,
            refreshTokenCookieKey: defaultConfig.cookie.refreshTokenCookieKey,
            idRefreshTokenCookieKey: defaultConfig.cookie.idRefreshTokenCookieKey
        },
        logging: {
            info: config.logging.info,
            error: config.logging.error
        },
        security: {
            onTheftDetection: config.security.onTheftDetection
        }
    };
};

const defaultConfig = {
    mysql: {
        host: "localhost",
        port: 3306,
        connectionLimit: 50,
        db: "auth_session",
        tables: {
            signingKey: "signing_key",
            refreshTokens: "refresh_token"
        }
    },
    tokens: {
        accessTokens: {
            signingKey: {
                dynamic: false,
                updateInterval: {   // in hours.
                    min: 1,
                    max: 720,
                    default: 24
                }
            },
            validity: { // in seconds
                min: 60,
                max: 1000 * 24 * 3600,
                default: 3600
            }
        },
        refreshToken: {
            validity: { // in hours.
                min: 1,
                max: 365 * 24,
                default: 100 * 24
            }
        }
    },
    cookie: {
        secure: true,
        accessTokenCookieKey: "sAccessToken",
        refreshTokenCookieKey: "sRefreshToken",
        idRefreshTokenCookieKey: "sIdRefreshToken"
    }
};

type TypeInfoLoggingFunction = (info: any) => void;
type TypeErrorLoggingFunction = (err: any) => void;

// TODO: also have refresh token in this function? So that user can invalidate just that particular session.. and not logout user from all their devices.
type TypeSecurityOnTheftDetectionFunction = (userId: string, reason: any) => void;

type TypeSecurityConfig = {
    onTheftDetection: TypeSecurityOnTheftDetectionFunction | undefined
};

type TypeLoggingConfig = {
    info: TypeInfoLoggingFunction | undefined,
    error: TypeErrorLoggingFunction | undefined
};

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
                dynamic: boolean | undefined,
                updateInterval: number | undefined,
                get: TypeGetSigningKeyUserFunction | undefined
            } | undefined,
            validity: number | undefined
        } | undefined,
        refreshToken: {
            validity: number | undefined,
            renewTokenURL: string   // TODO: this is just the path right? If so, please specify this.
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
        accessTokens: TypeAccessTokenConfig,
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
    security: TypeSecurityConfig
};