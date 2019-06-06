module.exports = {
    minConfigTest: {
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
            domain: "http://supertoken.io"
        }
    }
};
