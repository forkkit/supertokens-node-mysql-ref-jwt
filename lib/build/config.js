"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const error_1 = require("./error");
const utils_1 = require("./helpers/utils");
class Config {
    constructor(config) {
        this.config = setDefaults(config);
    }
    static init(config) {
        if (Config.instance === undefined) {
            Config.instance = new Config(setDefaults(validateAndNormalise(config)));
        }
    }
    static get() {
        if (Config.instance === undefined) {
            throw error_1.generateError(error_1.AuthError.GENERAL_ERROR, new Error("configs not set. Please call the init function before using this library"));
        }
        return Config.instance.config;
    }
}
exports.default = Config;
const validateAndNormalise = (config) => {
    if (config === null || typeof config !== "object") {
        throw error_1.generateError(error_1.AuthError.GENERAL_ERROR, new Error("passed config is not an object"));
    }
    const mysqlInputConfig = config.mysql;
    if (typeof mysqlInputConfig !== "object") {
        throw error_1.generateError(error_1.AuthError.GENERAL_ERROR, new Error("mysql config not passed. user, password and database are required"));
    }
    const host = utils_1.sanitizeStringInput(mysqlInputConfig.host);
    const port = utils_1.sanitizeNumberInput(mysqlInputConfig.port);
    const user = utils_1.sanitizeStringInput(mysqlInputConfig.user);
    if (user === undefined) {
        throw error_1.generateError(error_1.AuthError.GENERAL_ERROR, new Error("mysql config error. user not passed"));
    }
    const password = utils_1.sanitizeStringInput(mysqlInputConfig.password);
    if (password === undefined) {
        throw error_1.generateError(error_1.AuthError.GENERAL_ERROR, new Error("mysql config error. password not passed"));
    }
    const connectionLimit = utils_1.sanitizeNumberInput(mysqlInputConfig.connectionLimit);
    const database = utils_1.sanitizeStringInput(mysqlInputConfig.database);
    if (database === undefined) {
        throw error_1.generateError(error_1.AuthError.GENERAL_ERROR, new Error("mysql config error. database not passed"));
    }
    let tables;
    const tablesMysqlInputConfig = mysqlInputConfig.tables;
    if (tablesMysqlInputConfig !== undefined) {
        const signingKey = utils_1.sanitizeStringInput(tablesMysqlInputConfig.signingKey);
        const refreshTokens = utils_1.sanitizeStringInput(tablesMysqlInputConfig.refreshTokens);
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
    let accessToken;
    if (accessTokenInputConfig !== undefined) {
        const signingKeyInputConfig = accessTokenInputConfig.signingKey;
        let signingKey;
        if (signingKeyInputConfig !== undefined) {
            const dynamic = utils_1.sanitizeBooleanInput(signingKeyInputConfig.dynamic);
            let updateInterval = utils_1.sanitizeNumberInput(signingKeyInputConfig.updateInterval);
            if (updateInterval !== undefined) {
                if (updateInterval > defaultConfig.tokens.accessToken.signingKey.updateInterval.max) {
                    throw error_1.generateError(error_1.AuthError.GENERAL_ERROR, new Error("update interval passed for updating singingKey for access token is not within allowed interval. (Note: value passed will be in units of hours)"));
                }
                else if (updateInterval < defaultConfig.tokens.accessToken.signingKey.updateInterval.min) {
                    throw error_1.generateError(error_1.AuthError.GENERAL_ERROR, new Error("update interval passed for updating singingKey for access token is not within allowed interval. (Note: value passed will be in units of hours)"));
                }
            }
            const get = signingKeyInputConfig.get;
            if (get !== undefined && typeof get !== "function") {
                throw error_1.generateError(error_1.AuthError.GENERAL_ERROR, new Error("config > tokens > accessToken > get must be a function"));
            }
            signingKey = {
                dynamic,
                updateInterval,
                get
            };
        }
        let validity = utils_1.sanitizeNumberInput(accessTokenInputConfig.validity);
        if (validity !== undefined) {
            if (validity > defaultConfig.tokens.accessToken.validity.max) {
                throw error_1.generateError(error_1.AuthError.GENERAL_ERROR, new Error("passed value for validity of access token is not within allowed interval. (Note: value passed will be in units of seconds)"));
            }
            else if (validity < defaultConfig.tokens.accessToken.validity.min) {
                throw error_1.generateError(error_1.AuthError.GENERAL_ERROR, new Error("passed value for validity of access token is not within allowed interval. (Note: value passed will be in units of seconds)"));
            }
        }
        accessToken = {
            signingKey,
            validity
        };
    }
    let refreshTokenInputConfig = tokensInputConfig.refreshToken;
    if (typeof refreshTokenInputConfig !== "object") {
        throw error_1.generateError(error_1.AuthError.GENERAL_ERROR, new Error("refreshToken config not passed. renewTokenPath is required"));
    }
    let validity = utils_1.sanitizeNumberInput(refreshTokenInputConfig.validity);
    if (validity !== undefined) {
        if (validity > defaultConfig.tokens.refreshToken.validity.max) {
            throw error_1.generateError(error_1.AuthError.GENERAL_ERROR, new Error("passed value for validity of refresh token is not within allowed interval. (Note: value passed will be in units of hours)"));
        }
        else if (validity < defaultConfig.tokens.refreshToken.validity.min) {
            throw error_1.generateError(error_1.AuthError.GENERAL_ERROR, new Error("passed value for validity of refresh token is not within allowed interval. (Note: value passed will be in units of hours)"));
        }
    }
    const renewTokenPath = utils_1.sanitizeStringInput(refreshTokenInputConfig.renewTokenPath);
    if (renewTokenPath === undefined) {
        throw error_1.generateError(error_1.AuthError.GENERAL_ERROR, new Error("renewTokenPath not passed"));
    }
    const refreshToken = {
        renewTokenPath,
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
            throw error_1.generateError(error_1.AuthError.GENERAL_ERROR, new Error("logging config error. info option passed must be a function"));
        }
        if (error !== undefined && typeof error !== "function") {
            throw error_1.generateError(error_1.AuthError.GENERAL_ERROR, new Error("logging config error. error option passed must be a function"));
        }
        logging = {
            info,
            error
        };
    }
    const cookieInputConfig = config.cookie;
    const domain = utils_1.sanitizeStringInput(cookieInputConfig.domain);
    const secure = utils_1.sanitizeBooleanInput(cookieInputConfig.secure);
    if (domain === undefined) {
        throw error_1.generateError(error_1.AuthError.GENERAL_ERROR, new Error("domain parameter for cookie not passed"));
    }
    const cookie = {
        domain,
        secure
    };
    const onTokenTheftDetectionFromUser = config.onTokenTheftDetection;
    let onTokenTheftDetection;
    if (onTokenTheftDetectionFromUser !== undefined) {
        if (typeof onTokenTheftDetectionFromUser !== "function") {
            throw error_1.generateError(error_1.AuthError.GENERAL_ERROR, new Error("onTokenTheftDetection must be a function"));
        }
        onTokenTheftDetection = onTokenTheftDetectionFromUser;
    }
    return {
        mysql,
        tokens,
        cookie,
        logging,
        onTokenTheftDetection
    };
};
const setDefaults = (config) => {
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
                renewTokenPath: config.tokens.refreshToken.renewTokenPath
            }
        },
        cookie: {
            secure: config.cookie.secure === undefined ? defaultConfig.cookie.secure : config.cookie.secure,
            domain: config.cookie.domain
        },
        logging: {
            info: config.logging !== undefined ? config.logging.info : undefined,
            error: config.logging !== undefined ? config.logging.error : undefined
        },
        onTokenTheftDetection: config.onTokenTheftDetection === undefined ? () => { } : config.onTokenTheftDetection
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
                updateInterval: {
                    min: 1,
                    max: 720,
                    default: 24
                }
            },
            validity: {
                min: 10,
                max: 1000 * 24 * 3600,
                default: 3600
            }
        },
        refreshToken: {
            validity: {
                min: 1,
                max: 365 * 24,
                default: 100 * 24
            }
        }
    },
    cookie: {
        secure: true
    }
};
//# sourceMappingURL=config.js.map