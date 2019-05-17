import { TypeMysqlConfig } from './db/mysql';
import { sanitizeBooleanInput, sanitizeNumberInput, sanitizeStringInput } from './helpers/utils';
import { TypeAccessTokenConfig, TypeGetSigningKeyUserFunction } from './tokens/accessToken';
import { ConfigErrors } from "./helpers/errors";

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
    // NOTE: wherever you have used this, remember that this can throw an error.
    static get(): TypeConfig {
        if (Config.instance === undefined) {
            throw ConfigErrors.configNotSet;
        }
        return Config.instance.config;
    }
}

const validate = (config: any): TypeInputConfig => {
    const mysqlInputConfig = config.mysql;
    if (typeof mysqlInputConfig !== "object") {
        throw ConfigErrors.mysql.configUndefined;
    }
    const host = sanitizeStringInput(mysqlInputConfig.host);
    const port = sanitizeNumberInput(mysqlInputConfig.port);
    const user = sanitizeStringInput(mysqlInputConfig.user);
    if (user === undefined) {
        throw ConfigErrors.mysql.userNotPassed;
    }
    const password = sanitizeStringInput(mysqlInputConfig.password);
    if (password === undefined) {
        throw ConfigErrors.mysql.passwordNotPassed;
    }
    const connectionLimit = sanitizeNumberInput(mysqlInputConfig.connectionLimit);
    const database = sanitizeStringInput(mysqlInputConfig.database);
    if (database === undefined) {
        throw ConfigErrors.mysql.databaseNotPassed;
    }
    let tables: {
        signingKey: string | undefined,
        refreshTokens: string | undefined
    } | undefined;
    const tablesMysqlInputConfig = mysqlInputConfig.tables;
    if (tablesMysqlInputConfig !== undefined) {
        const signingKey = sanitizeStringInput(tablesMysqlInputConfig.signingKey);
        const refreshTokens = sanitizeStringInput(tablesMysqlInputConfig.refreshTokens);
        tables = {
            signingKey,
            refreshTokens
        };
    }
    const mysql = {
        host,
        port,
        user,
        password,
        connectionLimit,
        database,
        tables
    };
    let tokensInputConfig = config.tokens;
    const accessTokenInputConfig = tokensInputConfig.accessToken;
    let accessToken: {
        signingKey: {
            dynamic: boolean | undefined,
            updateInterval: number | undefined,
            get: TypeGetSigningKeyUserFunction | undefined
        } | undefined,
        validity: number | undefined
    } | undefined;
    if (accessTokenInputConfig !== undefined) {
        const signingKeyInputConfig = accessTokenInputConfig.signingKey;
        let signingKey: {
            dynamic: boolean | undefined,
            updateInterval: number | undefined,
            get: TypeGetSigningKeyUserFunction | undefined
        } | undefined;
        if (signingKeyInputConfig !== undefined) {
            const dynamic = sanitizeBooleanInput(signingKeyInputConfig.dynamic);
            let updateInterval = sanitizeNumberInput(signingKeyInputConfig.updateInterval);
            if (updateInterval !== undefined) {
                if (updateInterval > defaultConfig.tokens.accessToken.signingKey.updateInterval.max) {
                    throw ConfigErrors.tokens.accessToken.signingKey.updateIntervalNotWithinAllowedInterval;
                } else if (updateInterval < defaultConfig.tokens.accessToken.signingKey.updateInterval.min) {
                    throw ConfigErrors.tokens.accessToken.signingKey.updateIntervalNotWithinAllowedInterval;
                }
            }
            const get = signingKeyInputConfig.get;
            if (get !== undefined && typeof get !== "function") {
                throw ConfigErrors.tokens.accessToken.signingKey.valuePassedInGetANotFunction;
            }
            signingKey = {
                dynamic,
                updateInterval,
                get
            };
        }
        let validity = sanitizeNumberInput(accessTokenInputConfig.validity);
        if (validity !== undefined) {
            if (validity > defaultConfig.tokens.accessToken.validity.max) {
                throw ConfigErrors.tokens.accessToken.validityNotWithinAllowedInterval;
            } else if (validity < defaultConfig.tokens.accessToken.validity.min) {
                throw ConfigErrors.tokens.accessToken.validityNotWithinAllowedInterval;
            }
        }
        accessToken = {
            signingKey,
            validity
        }
    }
    let refreshTokenInputConfig = tokensInputConfig.refreshToken;
    if (typeof refreshTokenInputConfig !== "object") {
        throw ConfigErrors.tokens.refreshToken.configUndefined;
    }
    let validity = sanitizeNumberInput(refreshTokenInputConfig.validity);
    if (validity !== undefined) {
        if (validity > defaultConfig.tokens.refreshToken.validity.max) {
            throw ConfigErrors.tokens.refreshToken.validityNotWithinAllowedInterval;
        } else if (validity < defaultConfig.tokens.refreshToken.validity.min) {
            throw ConfigErrors.tokens.refreshToken.validityNotWithinAllowedInterval;
        }
    }
    const renewTokenURL = sanitizeStringInput(refreshTokenInputConfig.renewTokenURL);
    if (renewTokenURL === undefined) {
        throw ConfigErrors.tokens.refreshToken.renewTokenURLNotPassed;
    }
    const refreshToken = {
        renewTokenURL,
        validity
    };
    const tokens = {
        accessToken,
        refreshToken
    };
    let loggingInputConfig = config.logging;
    let logging;
    if (loggingInputConfig !== undefined) {
        let info = loggingInputConfig.info;
        let error = loggingInputConfig.error;
        if (info !== undefined && typeof info !== "function") {
            throw ConfigErrors.logging.infoFunctionError;
        }
        if (error !== undefined && typeof error !== "function") {
            throw ConfigErrors.logging.errorFunctionError;
        }
        logging = {
            info,
            error
        };
    }
    const cookieInputConfig = config.cookie;
    const domain = sanitizeStringInput(cookieInputConfig.domain);
    const secure = sanitizeBooleanInput(cookieInputConfig.secure);
    if (domain === undefined) {
        throw ConfigErrors.cookie.cookieDomainUndefined;
    }
    const cookie = {
        domain,
        secure
    };
    const securityInputConfig = config.security;
    let security;
    if (securityInputConfig !== undefined) {
        const onTheftDetection = securityInputConfig.onTheftDetection;
        if (onTheftDetection !== undefined && typeof onTheftDetection !== "function") {
            throw ConfigErrors.security.onTheftDetectionFunctionError;
        }
        security = {
            onTheftDetection
        };
    }
    return {
        mysql,
        tokens,
        cookie,
        logging,
        security
    };
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
            database: config.mysql.database,
            tables: config.mysql.tables === undefined ? defaultConfig.mysql.tables : {
                refreshTokens: config.mysql.tables.refreshTokens || defaultConfig.mysql.tables.refreshTokens,
                signingKey: config.mysql.tables.signingKey || defaultConfig.mysql.tables.signingKey
            }
        },
        tokens: {
            accessToken: config.tokens.accessToken === undefined ? {
                signingKey: {
                    dynamic: defaultConfig.tokens.accessToken.signingKey.dynamic,
                    updateInterval: defaultConfig.tokens.accessToken.signingKey.updateInterval.default * 60 * 60 * 1000,
                    get: undefined
                },
                validity: defaultConfig.tokens.accessToken.validity.default * 1000
            } : {
                    signingKey: config.tokens.accessToken.signingKey === undefined ? {
                        dynamic: defaultConfig.tokens.accessToken.signingKey.dynamic,
                        updateInterval: defaultConfig.tokens.accessToken.signingKey.updateInterval.default,
                        get: undefined
                    } : {
                            dynamic: config.tokens.accessToken.signingKey.dynamic === undefined ? defaultConfig.tokens.accessToken.signingKey.dynamic : config.tokens.accessToken.signingKey.dynamic,
                            updateInterval: (config.tokens.accessToken.signingKey.updateInterval || defaultConfig.tokens.accessToken.signingKey.updateInterval.default) * 60 * 60 * 1000,
                            get: config.tokens.accessToken.signingKey.get
                        },
                    validity: (config.tokens.accessToken.validity || defaultConfig.tokens.accessToken.validity.default) * 1000
                },
            refreshToken: {
                validity: (config.tokens.refreshToken.validity || defaultConfig.tokens.refreshToken.validity.default) * 60 * 60 * 1000,
                renewTokenURL: config.tokens.refreshToken.renewTokenURL
            }
        },
        cookie: {
            secure: config.cookie.secure === undefined ? defaultConfig.cookie.secure : config.cookie.secure,
            domain: config.cookie.domain,
            accessTokenCookieKey: defaultConfig.cookie.accessTokenCookieKey,
            refreshTokenCookieKey: defaultConfig.cookie.refreshTokenCookieKey,
            idRefreshTokenCookieKey: defaultConfig.cookie.idRefreshTokenCookieKey
        },
        logging: {
            info: config.logging !== undefined ? config.logging.info : undefined,
            error: config.logging !== undefined ? config.logging.error : undefined
        },
        security: {
            onTheftDetection: config.security !== undefined ? config.security.onTheftDetection : undefined
        }
    };
};

const defaultConfig = {
    mysql: {
        host: "localhost",
        port: 3306,
        connectionLimit: 50,
        tables: {
            signingKey: "signing_key",
            refreshTokens: "refresh_token"
        }
    },
    tokens: {
        accessToken: {
            signingKey: {
                dynamic: false,
                updateInterval: {   // in hours.
                    min: 1,
                    max: 720,
                    default: 24
                }
            },
            validity: { // in seconds
                min: 10,
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
    onTheftDetection?: TypeSecurityOnTheftDetectionFunction
};

type TypeLoggingConfig = {
    info?: TypeInfoLoggingFunction,
    error?: TypeErrorLoggingFunction
};

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
    security?: TypeSecurityConfig
};

type TypeConfig = {
    mysql: TypeMysqlConfig,
    tokens: {
        accessToken: TypeAccessTokenConfig,
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