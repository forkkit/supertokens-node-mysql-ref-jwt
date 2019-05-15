"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @class
 */
class Config {
    constructor(config) {
        this.config = sanitize(config);
    }
    static set(config) {
        validate(config);
        if (Config.instance === undefined) {
            Config.instance = new Config(config);
        }
    }
    static get() {
        if (Config.instance === undefined) {
            throw Error("no config set, please use init function at the start");
        }
        return Config.instance.config;
    }
}
exports.Config = Config;
const validate = (config) => {
    /**
     * @todo do validation
     */
    return config;
};
const sanitize = (config) => {
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
                    length: defaultConfig.tokens.accessTokens.signingKey.length.default,
                    dynamic: defaultConfig.tokens.accessTokens.signingKey.dynamic,
                    updateInterval: defaultConfig.tokens.accessTokens.signingKey.updateInterval.default,
                    get: undefined
                },
                validity: defaultConfig.tokens.accessTokens.validity.default
            } : {
                signingKey: config.tokens.accessTokens.signingKey === undefined ? {
                    length: defaultConfig.tokens.accessTokens.signingKey.length.default,
                    dynamic: defaultConfig.tokens.accessTokens.signingKey.dynamic,
                    updateInterval: defaultConfig.tokens.accessTokens.signingKey.updateInterval.default,
                    get: undefined
                } : {
                    length: config.tokens.accessTokens.signingKey.length || defaultConfig.tokens.accessTokens.signingKey.length.default,
                    dynamic: config.tokens.accessTokens.signingKey.dynamic || defaultConfig.tokens.accessTokens.signingKey.dynamic,
                    updateInterval: config.tokens.accessTokens.signingKey.updateInterval || defaultConfig.tokens.accessTokens.signingKey.updateInterval.default,
                    get: config.tokens.accessTokens.signingKey.get
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
            length: {
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
        secure: true,
        accessTokenCookieKey: "sAccessToken",
        refreshTokenCookieKey: "sRefreshToken",
        idRefreshTokenCookieKey: "sIdRefreshToken"
    }
};
//# sourceMappingURL=config.js.map