module.exports.minConfigTest = {
    mysql: {
        user: process.env.MYSQL_USER || "root",
        password: process.env.MYSQL_PASSWORD || "root",
        database: process.env.MYSQL_DB || "auth_session",
        tables: {
            refreshTokens: "refresh_token_test",
            signingKey: "signing_key_test"
        }
    },
    tokens: {
        accessToken: {
            signingKey: {
                dynamic: false
            }
        },
        refreshToken: {
            renewTokenPath: "/refersh"
        }
    },
    cookie: {
        domain: "supertoken.io"
    }
};

module.exports.configWithSigningKeyFunction = {
    mysql: {
        user: process.env.MYSQL_USER || "root",
        password: process.env.MYSQL_PASSWORD || "root",
        database: process.env.MYSQL_DB || "auth_session",
        tables: {
            refreshTokens: "refresh_token_test",
            signingKey: "signing_key_test"
        }
    },
    tokens: {
        accessToken: {
            signingKey: {
                get: () => {
                    return "testing";
                }
            }
        },
        refreshToken: {
            renewTokenPath: "/refersh"
        }
    },
    cookie: {
        domain: "supertoken.io"
    }
};

module.exports.configWithShortSigningKeyUpdateInterval = {
    mysql: {
        user: process.env.MYSQL_USER || "root",
        password: process.env.MYSQL_PASSWORD || "root",
        database: process.env.MYSQL_DB || "auth_session",
        tables: {
            refreshTokens: "refresh_token_test",
            signingKey: "signing_key_test"
        }
    },
    tokens: {
        accessToken: {
            signingKey: {
                updateInterval: 0.0005
            }
        },
        refreshToken: {
            renewTokenPath: "/refersh"
        }
    },
    cookie: {
        domain: "supertoken.io"
    }
};

module.exports.configWithShortValidityForAccessToken = {
    mysql: {
        user: process.env.MYSQL_USER || "root",
        password: process.env.MYSQL_PASSWORD || "root",
        database: process.env.MYSQL_DB || "auth_session",
        tables: {
            refreshTokens: "refresh_token_test",
            signingKey: "signing_key_test"
        }
    },
    tokens: {
        accessToken: {
            validity: 1
        },
        refreshToken: {
            renewTokenPath: "/refersh"
        }
    },
    cookie: {
        domain: "supertoken.io"
    }
};
