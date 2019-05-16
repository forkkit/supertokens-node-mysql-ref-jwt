"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// TODO: have all types in one file ideally.. easier to navigate and maintain. call this file types. This is done so that the other files do not get bogged down with types.. and have just the logic.
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
    // TODO: wherever you have used this, remember that this can throw an error.
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
     * @todo do validation - for this you can use my frontend library to validate if you want.
     */
    return config;
};
const sanitize = (config) => {
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
                updateInterval: {
                    min: 1,
                    max: 720,
                    default: 24
                }
            },
            validity: {
                min: 60,
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
        secure: true,
        accessTokenCookieKey: "sAccessToken",
        refreshTokenCookieKey: "sRefreshToken",
        idRefreshTokenCookieKey: "sIdRefreshToken"
    }
};
//# sourceMappingURL=config.js.map