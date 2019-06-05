module.exports = {
    mysql: {
        host: undefined,
        port: undefined,
        user: "root",
        password: "bhumil2621995",
        connectionLimit: undefined,
        database: "auth_session",
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