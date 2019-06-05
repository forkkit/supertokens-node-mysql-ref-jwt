module.exports = {
    mysql: {
        host: undefined,
        port: undefined,
        user: "root",
        password: process.env.MYSQL_PASSWORD || "root",
        connectionLimit: undefined,
        database: process.env.MYSQL_DB || "auth_session",
        tables: {
            refreshTokens: "refresh_token_test",
            signingKey: "signing_key_test"
        }
    },
    tokens: {
        refreshToken: {
            renewTokenPath: ""
        }
    },
    cookie: {
        domain: "config.cookie.domain"
    }
};
