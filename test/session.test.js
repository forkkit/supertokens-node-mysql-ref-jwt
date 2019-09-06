const session = require("../");
const assert = require("assert");
const { reset, delay } = require("../lib/build/helpers/utils");
const config = require("./config");
const {
    removeOldSessions,
    removeOldOrphanTokens,
    getNumberOfRowsInAllTokensTable,
    getNumberOfRowsInRefreshTokensTable
} = require("../lib/build/helpers/dbQueries");
const { printPath, validateSchema } = require("./utils");
const schemas = require("./schemas");
const errors = require("../lib/build/error");

describe(`Session: ${printPath("[test/session.test.js]")}`, function() {
    it("testing non-string userId (number)", async function() {
        await reset(config.configWithShortValidityForAccessToken);
        const userId = 1;
        const jwtPayload = { a: "testing" };
        const sessionInfo = { s: "session" };
        const newSession = await session.createNewSession(userId, jwtPayload, sessionInfo);
        assert.strictEqual(validateSchema(schemas.schemaCreateNewSessionACTEnabled, newSession), true);
        assert.strictEqual(newSession.session.jwtPayload, jwtPayload);
        assert.strictEqual(newSession.session.userId, userId);
        const sessionObj = await session.getSession(newSession.accessToken.value, newSession.antiCsrfToken);
        assert.strictEqual(validateSchema(schemas.schemaNewSessionGet, sessionObj), true);
        assert.strictEqual(sessionObj.session.userId, userId);
        await delay(1500);
        try {
            await session.getSession(newSession.accessToken.value, null);
            throw Error("test failed");
        } catch (err) {
            if (err.errType !== errors.AuthError.TRY_REFRESH_TOKEN) {
                throw err;
            }
        }
        const newRefreshedSession = await session.refreshSession(newSession.refreshToken.value);
        assert.strictEqual(validateSchema(schemas.schemaRefreshSessionACTEnabled, newRefreshedSession), true);
        assert.notStrictEqual(newRefreshedSession.newAccessToken.value, newSession.accessToken.value);
        assert.notStrictEqual(newRefreshedSession.newIdRefreshToken.value, newSession.idRefreshToken.value);
        assert.notStrictEqual(newRefreshedSession.newRefreshToken.value, newSession.refreshToken.value);
        assert.deepStrictEqual(newRefreshedSession.session.jwtPayload, jwtPayload);
        assert.strictEqual(newRefreshedSession.session.userId, userId);
        assert.notStrictEqual(newRefreshedSession.newAntiCsrfToken, newSession.antiCsrfToken);
    });

    it("testing number as string userId", async function() {
        await reset(config.configWithShortValidityForAccessToken);
        const userId = "1";
        const jwtPayload = { a: "testing" };
        const sessionInfo = { s: "session" };
        const newSession = await session.createNewSession(userId, jwtPayload, sessionInfo);
        assert.strictEqual(validateSchema(schemas.schemaCreateNewSessionACTEnabled, newSession), true);
        assert.strictEqual(newSession.session.jwtPayload, jwtPayload);
        assert.strictEqual(newSession.session.userId, userId);
        const sessionObj = await session.getSession(newSession.accessToken.value, newSession.antiCsrfToken);
        assert.strictEqual(validateSchema(schemas.schemaNewSessionGet, sessionObj), true);
        assert.strictEqual(sessionObj.session.userId, userId);
        await delay(1500);
        try {
            await session.getSession(newSession.accessToken.value, null);
            throw Error("test failed");
        } catch (err) {
            if (err.errType !== errors.AuthError.TRY_REFRESH_TOKEN) {
                throw err;
            }
        }
        const newRefreshedSession = await session.refreshSession(newSession.refreshToken.value);
        assert.strictEqual(validateSchema(schemas.schemaRefreshSessionACTEnabled, newRefreshedSession), true);
        assert.notStrictEqual(newRefreshedSession.newAccessToken.value, newSession.accessToken.value);
        assert.notStrictEqual(newRefreshedSession.newIdRefreshToken.value, newSession.idRefreshToken.value);
        assert.notStrictEqual(newRefreshedSession.newRefreshToken.value, newSession.refreshToken.value);
        assert.deepStrictEqual(newRefreshedSession.session.jwtPayload, jwtPayload);
        assert.strictEqual(newRefreshedSession.session.userId, userId);
        assert.notStrictEqual(newRefreshedSession.newAntiCsrfToken, newSession.antiCsrfToken);
    });

    it("testing stringified JSON userId (single field)", async function() {
        await reset(config.configWithShortValidityForAccessToken);
        const userId = JSON.stringify({ a: "testing" });
        const jwtPayload = { a: "testing" };
        const sessionInfo = { s: "session" };
        const newSession = await session.createNewSession(userId, jwtPayload, sessionInfo);
        assert.strictEqual(validateSchema(schemas.schemaCreateNewSessionACTEnabled, newSession), true);
        assert.strictEqual(newSession.session.jwtPayload, jwtPayload);
        assert.strictEqual(newSession.session.userId, userId);
        const sessionObj = await session.getSession(newSession.accessToken.value, newSession.antiCsrfToken);
        assert.strictEqual(validateSchema(schemas.schemaNewSessionGet, sessionObj), true);
        assert.strictEqual(sessionObj.session.userId, userId);
        await delay(1500);
        try {
            await session.getSession(newSession.accessToken.value, null);
            throw Error("test failed");
        } catch (err) {
            if (err.errType !== errors.AuthError.TRY_REFRESH_TOKEN) {
                throw err;
            }
        }
        const newRefreshedSession = await session.refreshSession(newSession.refreshToken.value);
        assert.strictEqual(validateSchema(schemas.schemaRefreshSessionACTEnabled, newRefreshedSession), true);
        assert.notStrictEqual(newRefreshedSession.newAccessToken.value, newSession.accessToken.value);
        assert.notStrictEqual(newRefreshedSession.newIdRefreshToken.value, newSession.idRefreshToken.value);
        assert.notStrictEqual(newRefreshedSession.newRefreshToken.value, newSession.refreshToken.value);
        assert.deepStrictEqual(newRefreshedSession.session.jwtPayload, jwtPayload);
        assert.strictEqual(newRefreshedSession.session.userId, userId);
        assert.notStrictEqual(newRefreshedSession.newAntiCsrfToken, newSession.antiCsrfToken);
    });

    it("testing stringified JSON userId (multiple fields)", async function() {
        await reset(config.configWithShortValidityForAccessToken);
        const userId = JSON.stringify({ a: "testing", i: "supertokens" });
        const jwtPayload = { a: "testing" };
        const sessionInfo = { s: "session" };
        const newSession = await session.createNewSession(userId, jwtPayload, sessionInfo);
        assert.strictEqual(validateSchema(schemas.schemaCreateNewSessionACTEnabled, newSession), true);
        assert.strictEqual(newSession.session.jwtPayload, jwtPayload);
        assert.strictEqual(newSession.session.userId, userId);
        const sessionObj = await session.getSession(newSession.accessToken.value, newSession.antiCsrfToken);
        assert.strictEqual(validateSchema(schemas.schemaNewSessionGet, sessionObj), true);
        assert.strictEqual(sessionObj.session.userId, userId);
        await delay(1500);
        try {
            await session.getSession(newSession.accessToken.value, null);
            throw Error("test failed");
        } catch (err) {
            if (err.errType !== errors.AuthError.TRY_REFRESH_TOKEN) {
                throw err;
            }
        }
        const newRefreshedSession = await session.refreshSession(newSession.refreshToken.value);
        assert.strictEqual(validateSchema(schemas.schemaRefreshSessionACTEnabled, newRefreshedSession), true);
        assert.notStrictEqual(newRefreshedSession.newAccessToken.value, newSession.accessToken.value);
        assert.notStrictEqual(newRefreshedSession.newIdRefreshToken.value, newSession.idRefreshToken.value);
        assert.notStrictEqual(newRefreshedSession.newRefreshToken.value, newSession.refreshToken.value);
        assert.deepStrictEqual(newRefreshedSession.session.jwtPayload, jwtPayload);
        assert.strictEqual(newRefreshedSession.session.userId, userId);
        assert.notStrictEqual(newRefreshedSession.newAntiCsrfToken, newSession.antiCsrfToken);
    });

    it("testing invalid stringified JSON userId", async function() {
        await reset(config.minConfigTest);
        const userId = JSON.stringify({ i: "testing" });
        const jwtPayload = { a: "testing" };
        const sessionInfo = { s: "session" };
        try {
            await session.createNewSession(userId, jwtPayload, sessionInfo);
        } catch (err) {
            if (err.errType !== errors.AuthError.GENERAL_ERROR) {
                throw err;
            }
        }
    });

    it("create and get session", async function() {
        assert.strictEqual(typeof session.createNewSession, "function");
        assert.strictEqual(typeof session.getSession, "function");
        await reset(config.minConfigTest);

        const userId = "testing";
        const jwtPayload = { a: "testing" };
        const sessionInfo = { s: "session" };

        const newSession = await session.createNewSession(userId, jwtPayload, sessionInfo);
        assert.strictEqual(validateSchema(schemas.schemaCreateNewSessionACTEnabled, newSession), true);
        assert.deepStrictEqual(newSession.session.jwtPayload, jwtPayload);
        assert.deepStrictEqual(newSession.session.userId, userId);

        assert.deepStrictEqual(await getNumberOfRowsInRefreshTokensTable(), 1);
        assert.deepStrictEqual(await getNumberOfRowsInAllTokensTable(), 1);

        const sessionObj = await session.getSession(newSession.accessToken.value, newSession.antiCsrfToken);
        assert.strictEqual(validateSchema(schemas.schemaNewSessionGet, sessionObj), true);
        assert.deepStrictEqual(sessionObj.session.jwtPayload, jwtPayload);
        assert.deepStrictEqual(sessionObj.session.userId, userId);

        try {
            await session.getSession(newSession.accessToken, "wrong-anti-csrf-token");
            throw Error("test failed");
        } catch (err) {
            if (err.errType !== errors.AuthError.TRY_REFRESH_TOKEN) {
                throw err;
            }
        }
    });

    it("create and get session (anti-csrf disabled)", async function() {
        assert.strictEqual(typeof session.createNewSession, "function");
        assert.strictEqual(typeof session.getSession, "function");
        await reset(config.minConfigTestWithAntiCsrfDisabled);

        const userId = "testing";
        const jwtPayload = { a: "testing" };
        const sessionInfo = { s: "session" };

        const newSession = await session.createNewSession(userId, jwtPayload, sessionInfo);
        assert.strictEqual(validateSchema(schemas.schemaCreateNewSessionACTDisabled, newSession), true);
        assert.deepStrictEqual(newSession.session.jwtPayload, jwtPayload);
        assert.deepStrictEqual(newSession.session.userId, userId);

        assert.deepStrictEqual(await getNumberOfRowsInRefreshTokensTable(), 1);
        assert.deepStrictEqual(await getNumberOfRowsInAllTokensTable(), 1);

        const sessionObj = await session.getSession(newSession.accessToken.value, null);
        assert.strictEqual(validateSchema(schemas.schemaNewSessionGet, sessionObj), true);
        assert.deepStrictEqual(sessionObj.session.jwtPayload, jwtPayload);
        assert.deepStrictEqual(sessionObj.session.userId, userId);

        await session.getSession(newSession.accessToken.value, "wrong-anti-csrf-token");
    });

    it("create and get session: [access token expires after 1 secs]", async function() {
        assert.strictEqual(typeof session.createNewSession, "function");
        assert.strictEqual(typeof session.getSession, "function");
        await reset(config.configWithShortValidityForAccessToken);

        const userId = "testing";
        const jwtPayload = { a: "testing" };
        const sessionInfo = { s: "session" };

        const newSession = await session.createNewSession(userId, jwtPayload, sessionInfo);
        assert.strictEqual(validateSchema(schemas.schemaCreateNewSessionACTEnabled, newSession), true);

        await delay(1500);
        try {
            await session.getSession(newSession.accessToken.value);
            throw Error("test failed");
        } catch (err) {
            if (err.errType !== errors.AuthError.TRY_REFRESH_TOKEN) {
                throw err;
            }
        }
    });

    it("create and get session: [jwt signinkey changes after <2s]", async function() {
        assert.strictEqual(typeof session.createNewSession, "function");
        assert.strictEqual(typeof session.getSession, "function");
        await reset(config.configWithShortSigningKeyUpdateInterval);

        const userId = "testing";
        const jwtPayload = { a: "testing" };
        const sessionInfo = { s: "session" };

        const newSession = await session.createNewSession(userId, jwtPayload, sessionInfo);
        assert.strictEqual(validateSchema(schemas.schemaCreateNewSessionACTEnabled, newSession), true);

        await session.getSession(newSession.accessToken.value, newSession.antiCsrfToken);
        await delay(2000);

        try {
            await session.getSession(newSession.accessToken.value, newSession.antiCsrfToken);
            throw Error("test failed");
        } catch (err) {
            if (err.errType !== errors.AuthError.TRY_REFRESH_TOKEN) {
                throw err;
            }
        }
        const newRefreshedSession = await session.refreshSession(newSession.refreshToken.value);
        assert.strictEqual(validateSchema(schemas.schemaRefreshSessionACTEnabled, newRefreshedSession), true);
        assert.notDeepStrictEqual(newRefreshedSession.newAccessToken.value, newSession.accessToken.value);
        assert.notStrictEqual(newRefreshedSession.newAntiCsrfToken, newSession.antiCsrfToken);

        assert.deepStrictEqual(await getNumberOfRowsInRefreshTokensTable(), 1);
        assert.deepStrictEqual(await getNumberOfRowsInAllTokensTable(), 2);

        const sessionObj = await session.getSession(
            newRefreshedSession.newAccessToken.value,
            newRefreshedSession.newAntiCsrfToken
        );
        assert.strictEqual(validateSchema(schemas.schemaUpdatedAccessTokenSessionGet, sessionObj), true);
        assert.deepStrictEqual(sessionObj.session.jwtPayload, jwtPayload);
        assert.deepStrictEqual(sessionObj.session.userId, userId);
    });

    it("alter access token payload", async function() {
        assert.strictEqual(typeof session.createNewSession, "function");
        assert.strictEqual(typeof session.getSession, "function");
        await reset(config.minConfigTest);

        const userId = "testing";
        const jwtPayload = { a: "testing" };
        const sessionInfo = { s: "session" };

        const newSession = await session.createNewSession(userId, jwtPayload, sessionInfo);
        assert.strictEqual(validateSchema(schemas.schemaCreateNewSessionACTEnabled, newSession), true);

        await session.getSession(newSession.accessToken.value, newSession.antiCsrfToken);

        const alteredPayload = Buffer.from(JSON.stringify({ ...jwtPayload, b: "new field" })).toString("base64");
        const alteredToken = `${newSession.accessToken.value.split(".")[0]}.${alteredPayload}.${
            newSession.accessToken.value.split(".")[2]
        }`;

        try {
            await session.getSession(alteredToken, newSession.antiCsrfToken);
            throw Error("test failed");
        } catch (err) {
            if (err.errType !== errors.AuthError.TRY_REFRESH_TOKEN) {
                throw err;
            }
        }
    });

    it("refresh session (with anti-csrf)", async function() {
        assert.strictEqual(typeof session.createNewSession, "function");
        assert.strictEqual(typeof session.getSession, "function");
        await reset(config.configWithShortValidityForAccessToken);

        const userId = "testing";
        const jwtPayload = { a: "testing" };
        const sessionInfo = { s: "session" };

        const newSession = await session.createNewSession(userId, jwtPayload, sessionInfo);
        assert.strictEqual(validateSchema(schemas.schemaCreateNewSessionACTEnabled, newSession), true);

        await delay(1500);
        try {
            await session.getSession(newSession.accessToken.value, newSession.antiCsrfToken);
            throw Error("test failed");
        } catch (err) {
            if (err.errType !== errors.AuthError.TRY_REFRESH_TOKEN) {
                throw err;
            }
        }

        const newRefreshedSession = await session.refreshSession(newSession.refreshToken.value);
        assert.strictEqual(validateSchema(schemas.schemaRefreshSessionACTEnabled, newRefreshedSession), true);
        assert.notDeepStrictEqual(newRefreshedSession.newAccessToken.value, newSession.accessToken.value);
        assert.notDeepStrictEqual(newRefreshedSession.newIdRefreshToken.value, newSession.idRefreshToken.value);
        assert.notDeepStrictEqual(newRefreshedSession.newRefreshToken.value, newSession.refreshToken.value);
        assert.deepStrictEqual(newRefreshedSession.session.jwtPayload, jwtPayload);
        assert.deepStrictEqual(newRefreshedSession.session.userId, userId);
        assert.notStrictEqual(newRefreshedSession.newAntiCsrfToken, newSession.antiCsrfToken);

        assert.deepStrictEqual(await getNumberOfRowsInRefreshTokensTable(), 1);
        assert.deepStrictEqual(await getNumberOfRowsInAllTokensTable(), 2);

        const sessionObj = await session.getSession(
            newRefreshedSession.newAccessToken.value,
            newRefreshedSession.newAntiCsrfToken
        );
        assert.strictEqual(validateSchema(schemas.schemaUpdatedAccessTokenSessionGet, sessionObj), true);
        assert.notDeepStrictEqual(newRefreshedSession.newAccessToken.value, sessionObj.newAccessToken.value);
        assert.deepStrictEqual(sessionObj.session.jwtPayload, jwtPayload);
        assert.deepStrictEqual(sessionObj.session.userId, userId);

        const newSessionInfo = await session.getSession(
            sessionObj.newAccessToken.value,
            newRefreshedSession.newAntiCsrfToken
        );
        assert.strictEqual(validateSchema(schemas.schemaNewSessionGet, newSessionInfo), true);
        assert.deepStrictEqual(newSessionInfo.session.jwtPayload, jwtPayload);
        assert.deepStrictEqual(newSessionInfo.session.userId, userId);

        await delay(1500);
        try {
            await session.getSession(sessionObj.newAccessToken.value, newRefreshedSession.newAntiCsrfToken);
            throw Error("test failed");
        } catch (err) {
            if (err.errType !== errors.AuthError.TRY_REFRESH_TOKEN) {
                throw err;
            }
        }
        const newRefreshedSession2 = await session.refreshSession(newRefreshedSession.newRefreshToken.value);
        assert.strictEqual(validateSchema(schemas.schemaRefreshSessionACTEnabled, newRefreshedSession2), true);
        assert.notDeepStrictEqual(newRefreshedSession2.newAccessToken.value, sessionObj.newAccessToken.value);
        assert.notStrictEqual(newRefreshedSession2.newAntiCsrfToken, newRefreshedSession.antiCsrfToken);

        assert.deepStrictEqual(await getNumberOfRowsInRefreshTokensTable(), 1);
        assert.deepStrictEqual(await getNumberOfRowsInAllTokensTable(), 3);

        const sessionObj2 = await session.getSession(
            newRefreshedSession2.newAccessToken.value,
            newRefreshedSession2.newAntiCsrfToken
        );
        assert.strictEqual(validateSchema(schemas.schemaUpdatedAccessTokenSessionGet, sessionObj2), true);
        assert.notDeepStrictEqual(sessionObj.newAccessToken.value, sessionObj2.newAccessToken.value);
    });

    it("refresh session (with anti-csrf disabled)", async function() {
        assert.strictEqual(typeof session.createNewSession, "function");
        assert.strictEqual(typeof session.getSession, "function");
        await reset(config.configWithShortValidityForAccessTokenAndAntiCsrfDisabled);

        const userId = "testing";
        const jwtPayload = { a: "testing" };
        const sessionInfo = { s: "session" };

        const newSession = await session.createNewSession(userId, jwtPayload, sessionInfo);
        assert.strictEqual(validateSchema(schemas.schemaCreateNewSessionACTDisabled, newSession), true);

        await delay(1500);
        try {
            await session.getSession(newSession.accessToken.value, null);
            throw Error("test failed");
        } catch (err) {
            if (err.errType !== errors.AuthError.TRY_REFRESH_TOKEN) {
                throw err;
            }
        }

        const newRefreshedSession = await session.refreshSession(newSession.refreshToken.value);
        assert.strictEqual(validateSchema(schemas.schemaRefreshSessionACTDisabled, newRefreshedSession), true);
        assert.notDeepStrictEqual(newRefreshedSession.newAccessToken.value, newSession.accessToken.value);
        assert.notDeepStrictEqual(newRefreshedSession.newIdRefreshToken.value, newSession.idRefreshToken.value);
        assert.notDeepStrictEqual(newRefreshedSession.newRefreshToken.value, newSession.refreshToken.value);
        assert.deepStrictEqual(newRefreshedSession.session.jwtPayload, jwtPayload);
        assert.deepStrictEqual(newRefreshedSession.session.userId, userId);

        assert.deepStrictEqual(await getNumberOfRowsInRefreshTokensTable(), 1);
        assert.deepStrictEqual(await getNumberOfRowsInAllTokensTable(), 2);

        const sessionObj = await session.getSession(newRefreshedSession.newAccessToken.value, null);
        assert.strictEqual(validateSchema(schemas.schemaUpdatedAccessTokenSessionGet, sessionObj), true);
        assert.notDeepStrictEqual(newRefreshedSession.newAccessToken.value, sessionObj.newAccessToken.value);
        assert.deepStrictEqual(sessionObj.session.jwtPayload, jwtPayload);
        assert.deepStrictEqual(sessionObj.session.userId, userId);

        const newSessionInfo = await session.getSession(sessionObj.newAccessToken.value, null);
        assert.strictEqual(validateSchema(schemas.schemaNewSessionGet, newSessionInfo), true);
        assert.deepStrictEqual(newSessionInfo.session.jwtPayload, jwtPayload);
        assert.deepStrictEqual(newSessionInfo.session.userId, userId);

        await delay(1500);
        try {
            await session.getSession(sessionObj.newAccessToken.value, null);
            throw Error("test failed");
        } catch (err) {
            if (err.errType !== errors.AuthError.TRY_REFRESH_TOKEN) {
                throw err;
            }
        }
        const newRefreshedSession2 = await session.refreshSession(newRefreshedSession.newRefreshToken.value);
        assert.strictEqual(validateSchema(schemas.schemaRefreshSessionACTDisabled, newRefreshedSession2), true);
        assert.notDeepStrictEqual(newRefreshedSession2.newAccessToken.value, sessionObj.newAccessToken.value);

        assert.deepStrictEqual(await getNumberOfRowsInRefreshTokensTable(), 1);
        assert.deepStrictEqual(await getNumberOfRowsInAllTokensTable(), 3);

        const sessionObj2 = await session.getSession(newRefreshedSession2.newAccessToken.value, null);
        assert.strictEqual(validateSchema(schemas.schemaUpdatedAccessTokenSessionGet, sessionObj2), true);
        assert.notDeepStrictEqual(sessionObj.newAccessToken.value, sessionObj2.newAccessToken.value);
    });

    it("refresh session (refresh token expires after 3 secs)", async function() {
        assert.strictEqual(typeof session.createNewSession, "function");
        assert.strictEqual(typeof session.getSession, "function");
        await reset(config.configWithShortValidityForRefreshToken);

        const userId = "testing";
        const jwtPayload = { a: "testing" };
        const sessionInfo = { s: "session" };
        // Part 1
        {
            const newSession = await session.createNewSession(userId, jwtPayload, sessionInfo);
            assert.strictEqual(validateSchema(schemas.schemaCreateNewSessionACTEnabled, newSession), true);

            const newRefreshedSession = await session.refreshSession(newSession.refreshToken.value);
            assert.strictEqual(validateSchema(schemas.schemaRefreshSessionACTEnabled, newRefreshedSession), true);

            assert.deepStrictEqual(await getNumberOfRowsInRefreshTokensTable(), 1);
            assert.deepStrictEqual(await getNumberOfRowsInAllTokensTable(), 2);

            const sessionObj = await session.getSession(
                newRefreshedSession.newAccessToken.value,
                newRefreshedSession.newAntiCsrfToken
            );
            assert.strictEqual(validateSchema(schemas.schemaUpdatedAccessTokenSessionGet, sessionObj), true);
            assert.notDeepStrictEqual(newRefreshedSession.newAccessToken.value, sessionObj.newAccessToken.value);

            await delay(3000);
            try {
                await session.refreshSession(newRefreshedSession.newRefreshToken.value);
                throw Error("test failed");
            } catch (err) {
                if (err.errType !== errors.AuthError.UNAUTHORISED) {
                    throw err;
                }
            }
        }
        // Part 2
        {
            const newSession = await session.createNewSession(userId, jwtPayload, sessionInfo);
            assert.strictEqual(validateSchema(schemas.schemaCreateNewSessionACTEnabled, newSession), true);

            const newRefreshedSession = await session.refreshSession(newSession.refreshToken.value);
            assert.strictEqual(validateSchema(schemas.schemaRefreshSessionACTEnabled, newRefreshedSession), true);

            assert.deepStrictEqual(await getNumberOfRowsInRefreshTokensTable(), 2);
            assert.deepStrictEqual(await getNumberOfRowsInAllTokensTable(), 4);

            await delay(2000);
            const newRefreshedSession2 = await session.refreshSession(newRefreshedSession.newRefreshToken.value);
            assert.strictEqual(validateSchema(schemas.schemaRefreshSessionACTEnabled, newRefreshedSession), true);

            assert.deepStrictEqual(await getNumberOfRowsInRefreshTokensTable(), 2);
            assert.deepStrictEqual(await getNumberOfRowsInAllTokensTable(), 5);

            await delay(2000);
            const newRefreshedSession3 = await session.refreshSession(newRefreshedSession2.newRefreshToken.value);
            assert.strictEqual(validateSchema(schemas.schemaRefreshSessionACTEnabled, newRefreshedSession), true);

            assert.deepStrictEqual(await getNumberOfRowsInRefreshTokensTable(), 2);
            assert.deepStrictEqual(await getNumberOfRowsInAllTokensTable(), 6);
        }
    });

    it("refresh session (token theft S1->R1->S2->R1)", async function() {
        assert.strictEqual(typeof session.createNewSession, "function");
        assert.strictEqual(typeof session.getSession, "function");
        await reset(config.minConfigTest);

        const userId = "testing";
        const jwtPayload = { a: "testing" };
        const sessionInfo = { s: "session" };

        const newSession = await session.createNewSession(userId, jwtPayload, sessionInfo);
        assert.strictEqual(validateSchema(schemas.schemaCreateNewSessionACTEnabled, newSession), true);

        const newRefreshedSession = await session.refreshSession(newSession.refreshToken.value);
        assert.strictEqual(validateSchema(schemas.schemaRefreshSessionACTEnabled, newRefreshedSession), true);

        const sessionObj = await session.getSession(
            newRefreshedSession.newAccessToken.value,
            newRefreshedSession.newAntiCsrfToken
        );
        assert.strictEqual(validateSchema(schemas.schemaUpdatedAccessTokenSessionGet, sessionObj), true);
        assert.notDeepStrictEqual(newRefreshedSession.newAccessToken.value, sessionObj.newAccessToken.value);

        try {
            await session.refreshSession(newSession.refreshToken.value);
            throw Error("token theft did not get detected");
        } catch (err) {
            if (err.errType !== errors.AuthError.UNAUTHORISED_AND_TOKEN_THEFT_DETECTED) {
                throw err;
            }
            assert.strictEqual(typeof err.err.sessionHandle, "string");
            assert.strictEqual(typeof err.err.userId, "string");
            if (err.err.sessionHandle !== newSession.session.handle || err.err.userId !== newSession.session.userId) {
                throw err;
            }
        }
    });

    it("refresh session (token theft S1->R1->R2->R1)", async function() {
        assert.strictEqual(typeof session.createNewSession, "function");
        assert.strictEqual(typeof session.getSession, "function");
        await reset(config.minConfigTest);

        const userId = "testing";
        const jwtPayload = { a: "testing" };
        const sessionInfo = { s: "session" };

        const newSession = await session.createNewSession(userId, jwtPayload, sessionInfo);
        assert.strictEqual(validateSchema(schemas.schemaCreateNewSessionACTEnabled, newSession), true);

        const newRefreshedSession1 = await session.refreshSession(newSession.refreshToken.value);
        assert.strictEqual(validateSchema(schemas.schemaRefreshSessionACTEnabled, newRefreshedSession1), true);

        const newRefreshedSession2 = await session.refreshSession(newRefreshedSession1.newRefreshToken.value);
        assert.strictEqual(validateSchema(schemas.schemaRefreshSessionACTEnabled, newRefreshedSession2), true);
        assert.notDeepStrictEqual(
            newRefreshedSession2.newRefreshToken.value,
            newRefreshedSession1.newRefreshToken.value
        );

        try {
            await session.refreshSession(newSession.refreshToken.value);
            throw Error("token theft did not get detected");
        } catch (err) {
            if (err.errType !== errors.AuthError.UNAUTHORISED_AND_TOKEN_THEFT_DETECTED) {
                throw err;
            }
            assert.strictEqual(typeof err.err.sessionHandle, "string");
            assert.strictEqual(typeof err.err.userId, "string");
            if (err.err.sessionHandle !== newSession.session.handle || err.err.userId !== newSession.session.userId) {
                throw err;
            }
        }
    });

    it("update session info", async function() {
        assert.strictEqual(typeof session.createNewSession, "function");
        assert.strictEqual(typeof session.getSession, "function");
        await reset(config.minConfigTest);

        const userId = "testing";
        const jwtPayload = { a: "testing" };
        const sessionInfo = { s: "session" };

        const newSession = await session.createNewSession(userId, jwtPayload, sessionInfo);
        assert.strictEqual(validateSchema(schemas.schemaCreateNewSessionACTEnabled, newSession), true);

        const sessionInfoBeforeUpdate = await session.getSessionInfo(
            newSession.session.handle,
            newSession.antiCsrfToken
        );
        assert.strictEqual(typeof sessionInfoBeforeUpdate, "object");
        assert.deepStrictEqual(sessionInfo, sessionInfoBeforeUpdate);

        const newsessionInfo = 2;
        await session.updateSessionInfo(newSession.session.handle, newsessionInfo);
        const sessionInfoPostUpdate = await session.getSessionInfo(newSession.session.handle, newSession.antiCsrfToken);
        assert.strictEqual(typeof sessionInfoPostUpdate, "number");
        assert.deepStrictEqual(newsessionInfo, sessionInfoPostUpdate);
    });

    it("revoke session (without blacklisting)", async function() {
        assert.strictEqual(typeof session.createNewSession, "function");
        assert.strictEqual(typeof session.getSession, "function");
        await reset(config.minConfigTest);

        const userId = "testing";
        const jwtPayload = { a: "testing" };
        const sessionInfo = { s: "session" };
        const newSession = await session.createNewSession(userId, jwtPayload, sessionInfo);
        assert.strictEqual(validateSchema(schemas.schemaCreateNewSessionACTEnabled, newSession), true);

        await session.createNewSession(userId, jwtPayload, sessionInfo);

        assert.deepStrictEqual(await getNumberOfRowsInRefreshTokensTable(), 2);
        assert.deepStrictEqual(await getNumberOfRowsInAllTokensTable(), 2);

        assert.strictEqual(await session.revokeSessionUsingSessionHandle(newSession.session.handle), true);
        assert.deepStrictEqual(await getNumberOfRowsInRefreshTokensTable(), 1);
        assert.deepStrictEqual(await getNumberOfRowsInAllTokensTable(), 2);

        try {
            await session.refreshSession(newSession.refreshToken.value);
            throw Error("test failed");
        } catch (err) {
            if (err.errType !== errors.AuthError.UNAUTHORISED) {
                throw err;
            }
        }
        const sessionObj = await session.getSession(newSession.accessToken.value, newSession.antiCsrfToken);
        assert.strictEqual(validateSchema(schemas.schemaNewSessionGet, sessionObj), true);
        assert.deepStrictEqual(sessionObj.session.jwtPayload, jwtPayload);
        assert.deepStrictEqual(sessionObj.session.userId, userId);
    });

    it("revoke session (with blacklisting)", async function() {
        assert.strictEqual(typeof session.createNewSession, "function");
        assert.strictEqual(typeof session.getSession, "function");
        await reset(config.minConfigTestWithBlacklisting);

        const userId = "testing";
        const jwtPayload = { a: "testing" };
        const sessionInfo = { s: "session" };

        const newSession1 = await session.createNewSession(userId, jwtPayload, sessionInfo);
        assert.strictEqual(validateSchema(schemas.schemaCreateNewSessionACTEnabled, newSession1), true);
        const newSession2 = await session.createNewSession(userId, jwtPayload, sessionInfo);
        assert.strictEqual(validateSchema(schemas.schemaCreateNewSessionACTEnabled, newSession2), true);

        assert.deepStrictEqual(await getNumberOfRowsInRefreshTokensTable(), 2);
        assert.deepStrictEqual(await getNumberOfRowsInAllTokensTable(), 2);

        const sessionObj1 = await session.getSession(newSession1.accessToken.value, newSession1.antiCsrfToken);
        assert.strictEqual(validateSchema(schemas.schemaNewSessionGet, sessionObj1), true);
        assert.deepStrictEqual(sessionObj1.session.jwtPayload, jwtPayload);
        assert.deepStrictEqual(sessionObj1.session.userId, userId);

        assert.strictEqual(await session.revokeSessionUsingSessionHandle(newSession1.session.handle), true);
        assert.deepStrictEqual(await getNumberOfRowsInRefreshTokensTable(), 1);
        assert.deepStrictEqual(await getNumberOfRowsInAllTokensTable(), 2);

        try {
            await session.refreshSession(newSession1.refreshToken.value);
            throw Error("test failed");
        } catch (err) {
            if (err.errType !== errors.AuthError.UNAUTHORISED) {
                throw err;
            }
        }
        try {
            await session.getSession(newSession1.accessToken.value, newSession1.antiCsrfToken);
            throw Error("test failed");
        } catch (err) {
            if (err.errType !== errors.AuthError.UNAUTHORISED) {
                throw err;
            }
        }
        const sessionObj2 = await session.getSession(newSession2.accessToken.value, newSession2.antiCsrfToken);
        assert.strictEqual(validateSchema(schemas.schemaNewSessionGet, sessionObj2), true);
        assert.deepStrictEqual(sessionObj2.session.jwtPayload, jwtPayload);
        assert.deepStrictEqual(sessionObj2.session.userId, userId);
    });

    it("remove refresh token from db but session will be valid until access token expires", async function() {
        assert.strictEqual(typeof session.createNewSession, "function");
        assert.strictEqual(typeof session.getSession, "function");
        await reset(config.configWithShortValidityForAccessToken);

        const userId = "testing";
        const jwtPayload = { a: "testing" };
        const sessionInfo = { s: "session" };

        const newSession = await session.createNewSession(userId, jwtPayload, sessionInfo);
        assert.strictEqual(validateSchema(schemas.schemaCreateNewSessionACTEnabled, newSession), true);

        assert.strictEqual(await session.revokeSessionUsingSessionHandle(newSession.session.handle), true);

        const sessionObj = await session.getSession(newSession.accessToken.value, newSession.antiCsrfToken);
        assert.strictEqual(validateSchema(schemas.schemaNewSessionGet, sessionObj), true);
        assert.deepStrictEqual(sessionObj.session.jwtPayload, jwtPayload);
        assert.deepStrictEqual(sessionObj.session.userId, userId);

        await delay(1500);
        try {
            await session.getSession(newSession.accessToken.value, newSession.antiCsrfToken);
            throw Error("test failed");
        } catch (err) {
            if (err.errType !== errors.AuthError.TRY_REFRESH_TOKEN) {
                throw err;
            }
        }
        try {
            await session.refreshSession(newSession.refreshToken.value);
            throw Error("test failed");
        } catch (err) {
            if (err.errType !== errors.AuthError.UNAUTHORISED) {
                throw err;
            }
        }
    });

    it("revoke all sessions for user (without blacklisting)", async function() {
        assert.strictEqual(typeof session.createNewSession, "function");
        assert.strictEqual(typeof session.getSession, "function");
        await reset(config.minConfigTest);

        const userId = "testing";
        const jwtPayload = { a: "testing" };
        const sessionInfo = { s: "session" };

        const newSession1 = await session.createNewSession(userId, jwtPayload, sessionInfo);
        const newSession2 = await session.createNewSession(userId, jwtPayload, sessionInfo);
        const newSession3 = await session.createNewSession(userId, jwtPayload, sessionInfo);

        assert.deepStrictEqual(await getNumberOfRowsInRefreshTokensTable(), 3);
        assert.deepStrictEqual(await getNumberOfRowsInAllTokensTable(), 3);

        await session.revokeAllSessionsForUser(userId);
        assert.deepStrictEqual(await getNumberOfRowsInRefreshTokensTable(), 0);
        assert.deepStrictEqual(await getNumberOfRowsInAllTokensTable(), 3);

        const sessionObj1 = await session.getSession(newSession1.accessToken.value, newSession1.antiCsrfToken);
        assert.strictEqual(validateSchema(schemas.schemaNewSessionGet, sessionObj1), true);
        assert.deepStrictEqual(sessionObj1.session.jwtPayload, jwtPayload);
        assert.deepStrictEqual(sessionObj1.session.userId, userId);

        const sessionObj2 = await session.getSession(newSession2.accessToken.value, newSession2.antiCsrfToken);
        assert.strictEqual(validateSchema(schemas.schemaNewSessionGet, sessionObj2), true);
        assert.deepStrictEqual(sessionObj2.session.jwtPayload, jwtPayload);
        assert.deepStrictEqual(sessionObj2.session.userId, userId);

        const sessionObj3 = await session.getSession(newSession3.accessToken.value, newSession3.antiCsrfToken);
        assert.strictEqual(validateSchema(schemas.schemaNewSessionGet, sessionObj3), true);
        assert.deepStrictEqual(sessionObj3.session.jwtPayload, jwtPayload);
        assert.deepStrictEqual(sessionObj3.session.userId, userId);
    });

    it("revoke all sessions for user (with blacklisting)", async function() {
        assert.strictEqual(typeof session.createNewSession, "function");
        assert.strictEqual(typeof session.getSession, "function");
        await reset(config.minConfigTestWithBlacklisting);

        const userId = "testing";
        const jwtPayload = { a: "testing" };
        const sessionInfo = { s: "session" };

        const newSession1 = await session.createNewSession(userId, jwtPayload, sessionInfo);
        const newSession2 = await session.createNewSession(userId, jwtPayload, sessionInfo);
        const newSession3 = await session.createNewSession(userId, jwtPayload, sessionInfo);

        assert.deepStrictEqual(await getNumberOfRowsInRefreshTokensTable(), 3);
        assert.deepStrictEqual(await getNumberOfRowsInAllTokensTable(), 3);

        await session.revokeAllSessionsForUser(userId);
        assert.deepStrictEqual(await getNumberOfRowsInRefreshTokensTable(), 0);
        assert.deepStrictEqual(await getNumberOfRowsInAllTokensTable(), 3);

        try {
            await session.getSession(newSession1.accessToken.value, newSession1.antiCsrfToken);
            throw Error("test failed");
        } catch (err) {
            if (err.errType !== errors.AuthError.UNAUTHORISED) {
                throw err;
            }
        }
        try {
            await session.getSession(newSession2.accessToken.value, newSession2.antiCsrfToken);
            throw Error("test failed");
        } catch (err) {
            if (err.errType !== errors.AuthError.UNAUTHORISED) {
                throw err;
            }
        }
        try {
            await session.getSession(newSession3.accessToken.value, newSession3.antiCsrfToken);
            throw Error("test failed");
        } catch (err) {
            if (err.errType !== errors.AuthError.UNAUTHORISED) {
                throw err;
            }
        }
    });

    it("remove old sessions", async function() {
        await reset(config.configWithShortValidityForRefreshToken);

        const userId = "testing";
        const jwtPayload = { a: "testing" };
        const sessionInfo = { s: "session" };

        await session.createNewSession(userId, jwtPayload, sessionInfo);
        await session.createNewSession(userId, jwtPayload, sessionInfo);
        await session.createNewSession(userId, jwtPayload, sessionInfo);

        assert.deepStrictEqual(await getNumberOfRowsInRefreshTokensTable(), 3);
        assert.deepStrictEqual(await getNumberOfRowsInAllTokensTable(), 3);

        await delay(3000);
        await session.createNewSession(userId, jwtPayload, sessionInfo);
        await removeOldSessions();

        assert.deepStrictEqual(await getNumberOfRowsInRefreshTokensTable(), 1);
        assert.deepStrictEqual(await getNumberOfRowsInAllTokensTable(), 4);
    });

    it("remove old orphan tokens", async function() {
        await reset(config.configWithShortValidityForRefreshToken);

        const userId = "testing";
        const jwtPayload = { a: "testing" };
        const sessionInfo = { s: "session" };

        await session.createNewSession(userId, jwtPayload, sessionInfo);
        await session.createNewSession(userId, jwtPayload, sessionInfo);
        await session.createNewSession(userId, jwtPayload, sessionInfo);

        assert.deepStrictEqual(await getNumberOfRowsInRefreshTokensTable(), 3);
        assert.deepStrictEqual(await getNumberOfRowsInAllTokensTable(), 3);

        await delay(3000);
        await session.createNewSession(userId, jwtPayload, sessionInfo);
        await removeOldSessions();
        await removeOldOrphanTokens(Date.now());

        assert.deepStrictEqual(await getNumberOfRowsInRefreshTokensTable(), 1);
        assert.deepStrictEqual(await getNumberOfRowsInAllTokensTable(), 1);
    });
});
