const session = require("../lib/build/session");
const assert = require("assert");
const { reset, delay } = require("../lib/build/helpers/utils");
const config = require("./config");
const { getNumberOfRowsInRefreshTokensTable } = require("../lib/build/helpers/dbQueries");
const { printPath } = require("./utils");
const errors = require("../lib/build/error");

describe(`Session: ${printPath("[test/session.test.js]")}`, function() {
    it("create and get session", async function() {
        assert.strictEqual(typeof session.createNewSession, "function");
        assert.strictEqual(typeof session.getSession, "function");
        await reset(config.minConfigTest);
        const userId = "testing";
        const jwtPayload = { a: "testing" };
        const sessionData = { s: "session" };
        const newSession = await session.createNewSession(userId, jwtPayload, sessionData);
        assert.strictEqual(typeof newSession, "object");
        assert.strictEqual(typeof newSession.accessToken, "object");
        assert.strictEqual(typeof newSession.accessToken.value, "string");
        assert.strictEqual(typeof newSession.accessToken.expires, "number");
        assert.strictEqual(typeof newSession.idRefreshToken, "object");
        assert.strictEqual(typeof newSession.idRefreshToken.value, "string");
        assert.strictEqual(typeof newSession.idRefreshToken.expires, "number");
        assert.strictEqual(typeof newSession.refreshToken, "object");
        assert.strictEqual(typeof newSession.refreshToken.value, "string");
        assert.strictEqual(typeof newSession.refreshToken.expires, "number");
        assert.strictEqual(typeof newSession.session, "object");
        assert.strictEqual(typeof newSession.session.handle, "string");
        assert.strictEqual(typeof newSession.session.jwtPayload, "object");
        assert.deepStrictEqual(newSession.session.jwtPayload, jwtPayload);
        assert.strictEqual(typeof newSession.session.userId, "string");
        assert.deepStrictEqual(newSession.session.userId, userId);
        const noOfRows = await getNumberOfRowsInRefreshTokensTable();
        assert.deepStrictEqual(noOfRows, 1);
        const sessionInfo = await session.getSession(newSession.accessToken.value);
        assert.strictEqual(typeof sessionInfo, "object");
        assert.deepStrictEqual(sessionInfo.newAccessToken, undefined);
        assert.strictEqual(typeof sessionInfo.session, "object");
        assert.strictEqual(typeof sessionInfo.session.handle, "string");
        assert.strictEqual(typeof sessionInfo.session.jwtPayload, "object");
        assert.deepStrictEqual(sessionInfo.session.jwtPayload, jwtPayload);
        assert.strictEqual(typeof sessionInfo.session.userId, "string");
        assert.deepStrictEqual(sessionInfo.session.userId, userId);
    });

    it("create and get session: [access token expires after 1 secs]", async function() {
        assert.strictEqual(typeof session.createNewSession, "function");
        assert.strictEqual(typeof session.getSession, "function");
        await reset(config.configWithShortValidityForAccessToken);
        const userId = "testing";
        const jwtPayload = { a: "testing" };
        const sessionData = { s: "session" };
        const newSession = await session.createNewSession(userId, jwtPayload, sessionData);
        assert.strictEqual(typeof newSession, "object");
        assert.strictEqual(typeof newSession.accessToken, "object");
        assert.strictEqual(typeof newSession.accessToken.value, "string");
        assert.strictEqual(typeof newSession.idRefreshToken, "object");
        assert.strictEqual(typeof newSession.idRefreshToken.value, "string");
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
        const sessionData = { s: "session" };
        const newSession = await session.createNewSession(userId, jwtPayload, sessionData);
        assert.strictEqual(typeof newSession, "object");
        assert.strictEqual(typeof newSession.accessToken, "object");
        assert.strictEqual(typeof newSession.accessToken.value, "string");
        assert.strictEqual(typeof newSession.idRefreshToken, "object");
        assert.strictEqual(typeof newSession.idRefreshToken.value, "string");
        await session.getSession(newSession.accessToken.value);
        await delay(2000);
        try {
            await session.getSession(newSession.accessToken.value);
            throw Error("test failed");
        } catch (err) {
            if (err.errType !== errors.AuthError.TRY_REFRESH_TOKEN) {
                throw err;
            }
        }
        const newRefreshedSession = await session.refreshSession(newSession.refreshToken.value);
        assert.strictEqual(typeof newRefreshedSession, "object");
        assert.strictEqual(typeof newRefreshedSession.sessionTheftDetected, "boolean");
        assert.deepStrictEqual(newRefreshedSession.sessionTheftDetected, false);
        assert.strictEqual(typeof newRefreshedSession.newAccessToken, "object");
        assert.strictEqual(typeof newRefreshedSession.newAccessToken.value, "string");
        assert.notDeepStrictEqual(newRefreshedSession.newAccessToken.value, newSession.accessToken.value);
        const sessionInfo = await session.getSession(newRefreshedSession.newAccessToken.value);
        assert.strictEqual(typeof sessionInfo, "object");
        assert.strictEqual(typeof sessionInfo.session, "object");
        assert.strictEqual(typeof sessionInfo.session.jwtPayload, "object");
        assert.deepStrictEqual(sessionInfo.session.jwtPayload, jwtPayload);
        assert.strictEqual(typeof sessionInfo.session.userId, "string");
        assert.deepStrictEqual(sessionInfo.session.userId, userId);
    });

    it("alter access token payload", async function() {
        assert.strictEqual(typeof session.createNewSession, "function");
        assert.strictEqual(typeof session.getSession, "function");
        await reset(config.minConfigTest);
        const userId = "testing";
        const jwtPayload = { a: "testing" };
        const sessionData = { s: "session" };
        const newSession = await session.createNewSession(userId, jwtPayload, sessionData);
        assert.strictEqual(typeof newSession, "object");
        assert.strictEqual(typeof newSession.accessToken, "object");
        assert.strictEqual(typeof newSession.accessToken.value, "string");
        await session.getSession(newSession.accessToken.value);
        const alteredPayload = Buffer.from(JSON.stringify({ ...jwtPayload, b: "new field" })).toString("base64");
        const alteredToken = `${newSession.accessToken.value.split(".")[0]}.${alteredPayload}.${
            newSession.accessToken.value.split(".")[2]
        }`;
        try {
            await session.getSession(alteredToken);
            throw Error("test failed");
        } catch (err) {
            if (err.errType !== errors.AuthError.TRY_REFRESH_TOKEN) {
                throw err;
            }
        }
    });

    it("refresh session", async function() {
        assert.strictEqual(typeof session.createNewSession, "function");
        assert.strictEqual(typeof session.getSession, "function");
        await reset(config.configWithShortValidityForAccessToken);
        const userId = "testing";
        const jwtPayload = { a: "testing" };
        const sessionData = { s: "session" };
        const newSession = await session.createNewSession(userId, jwtPayload, sessionData);
        assert.strictEqual(typeof newSession, "object");
        assert.strictEqual(typeof newSession.accessToken, "object");
        assert.strictEqual(typeof newSession.accessToken.value, "string");
        assert.strictEqual(typeof newSession.idRefreshToken, "object");
        assert.strictEqual(typeof newSession.idRefreshToken.value, "string");
        assert.strictEqual(typeof newSession.refreshToken, "object");
        assert.strictEqual(typeof newSession.refreshToken.value, "string");
        await delay(1500);
        try {
            await session.getSession(newSession.accessToken.value);
            throw Error("test failed");
        } catch (err) {
            if (err.errType !== errors.AuthError.TRY_REFRESH_TOKEN) {
                throw err;
            }
        }
        const newRefreshedSession = await session.refreshSession(newSession.refreshToken.value);
        assert.strictEqual(typeof newRefreshedSession, "object");
        assert.strictEqual(typeof newRefreshedSession.sessionTheftDetected, "boolean");
        assert.deepStrictEqual(newRefreshedSession.sessionTheftDetected, false);
        assert.strictEqual(typeof newRefreshedSession.newAccessToken, "object");
        assert.strictEqual(typeof newRefreshedSession.newAccessToken.value, "string");
        assert.notDeepStrictEqual(newRefreshedSession.newAccessToken.value, newSession.accessToken.value);
        assert.strictEqual(typeof newRefreshedSession.newAccessToken.expires, "number");
        assert.strictEqual(typeof newRefreshedSession.newIdRefreshToken, "object");
        assert.strictEqual(typeof newRefreshedSession.newIdRefreshToken.value, "string");
        assert.notDeepStrictEqual(newRefreshedSession.newIdRefreshToken.value, newSession.idRefreshToken.value);
        assert.strictEqual(typeof newRefreshedSession.newIdRefreshToken.expires, "number");
        assert.strictEqual(typeof newRefreshedSession.newRefreshToken, "object");
        assert.strictEqual(typeof newRefreshedSession.newRefreshToken.value, "string");
        assert.notDeepStrictEqual(newRefreshedSession.newRefreshToken.value, newSession.refreshToken.value);
        assert.strictEqual(typeof newRefreshedSession.newRefreshToken.expires, "number");
        assert.strictEqual(typeof newRefreshedSession.session, "object");
        assert.strictEqual(typeof newRefreshedSession.session.handle, "string");
        assert.strictEqual(typeof newRefreshedSession.session.jwtPayload, "object");
        assert.deepStrictEqual(newRefreshedSession.session.jwtPayload, jwtPayload);
        assert.strictEqual(typeof newRefreshedSession.session.userId, "string");
        assert.deepStrictEqual(newRefreshedSession.session.userId, userId);
        const sessionInfo = await session.getSession(newRefreshedSession.newAccessToken.value);
        assert.strictEqual(typeof sessionInfo, "object");
        assert.strictEqual(typeof sessionInfo.newAccessToken, "object");
        assert.strictEqual(typeof sessionInfo.newAccessToken.value, "string");
        assert.notDeepStrictEqual(newRefreshedSession.newAccessToken.value, sessionInfo.newAccessToken.value);
        assert.strictEqual(typeof sessionInfo.newAccessToken.expires, "number");
        assert.strictEqual(typeof sessionInfo.session, "object");
        assert.strictEqual(typeof sessionInfo.session.handle, "string");
        assert.strictEqual(typeof sessionInfo.session.jwtPayload, "object");
        assert.deepStrictEqual(sessionInfo.session.jwtPayload, jwtPayload);
        assert.strictEqual(typeof sessionInfo.session.userId, "string");
        assert.deepStrictEqual(sessionInfo.session.userId, userId);
        const newSessionInfo = await session.getSession(sessionInfo.newAccessToken.value);
        assert.strictEqual(typeof newSessionInfo, "object");
        assert.deepStrictEqual(newSessionInfo.newAccessToken, undefined);
        assert.strictEqual(typeof newSessionInfo.session, "object");
        assert.strictEqual(typeof newSessionInfo.session.handle, "string");
        assert.strictEqual(typeof newSessionInfo.session.jwtPayload, "object");
        assert.deepStrictEqual(newSessionInfo.session.jwtPayload, jwtPayload);
        assert.strictEqual(typeof newSessionInfo.session.userId, "string");
        assert.deepStrictEqual(newSessionInfo.session.userId, userId);
        await delay(1500);
        try {
            await session.getSession(sessionInfo.newAccessToken.value);
            throw Error("test failed");
        } catch (err) {
            if (err.errType !== errors.AuthError.TRY_REFRESH_TOKEN) {
                throw err;
            }
        }
        const newRefreshedSession2 = await session.refreshSession(newRefreshedSession.newRefreshToken.value);
        assert.strictEqual(typeof newRefreshedSession2, "object");
        assert.strictEqual(typeof newRefreshedSession2.sessionTheftDetected, "boolean");
        assert.deepStrictEqual(newRefreshedSession2.sessionTheftDetected, false);
        assert.strictEqual(typeof newRefreshedSession2.newAccessToken, "object");
        assert.strictEqual(typeof newRefreshedSession2.newAccessToken.value, "string");
        assert.notDeepStrictEqual(newRefreshedSession2.newAccessToken.value, sessionInfo.newAccessToken.value);
        const sessionInfo2 = await session.getSession(newRefreshedSession2.newAccessToken.value);
        assert.strictEqual(typeof sessionInfo2, "object");
        assert.strictEqual(typeof sessionInfo2.newAccessToken, "object");
        assert.strictEqual(typeof sessionInfo2.newAccessToken.value, "string");
        assert.notDeepStrictEqual(sessionInfo.newAccessToken.value, sessionInfo2.newAccessToken.value);
    });

    it("refresh session (refresh token expires after 3 secs)", async function() {
        assert.strictEqual(typeof session.createNewSession, "function");
        assert.strictEqual(typeof session.getSession, "function");
        await reset(config.configWithShortValidityForRefreshToken);
        const userId = "testing";
        const jwtPayload = { a: "testing" };
        const sessionData = { s: "session" };
        // Part 1
        {
            const newSession = await session.createNewSession(userId, jwtPayload, sessionData);
            assert.strictEqual(typeof newSession, "object");
            assert.strictEqual(typeof newSession.refreshToken, "object");
            assert.strictEqual(typeof newSession.refreshToken.value, "string");
            const newRefreshedSession = await session.refreshSession(newSession.refreshToken.value);
            assert.strictEqual(typeof newRefreshedSession, "object");
            assert.strictEqual(typeof newRefreshedSession.sessionTheftDetected, "boolean");
            assert.deepStrictEqual(newRefreshedSession.sessionTheftDetected, false);
            assert.strictEqual(typeof newRefreshedSession.newAccessToken, "object");
            assert.strictEqual(typeof newRefreshedSession.newAccessToken.value, "string");
            const sessionInfo = await session.getSession(newRefreshedSession.newAccessToken.value);
            assert.strictEqual(typeof sessionInfo, "object");
            assert.strictEqual(typeof sessionInfo.newAccessToken, "object");
            assert.strictEqual(typeof sessionInfo.newAccessToken.value, "string");
            assert.notDeepStrictEqual(newRefreshedSession.newAccessToken.value, sessionInfo.newAccessToken.value);
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
            const newSession = await session.createNewSession(userId, jwtPayload, sessionData);
            assert.strictEqual(typeof newSession, "object");
            assert.strictEqual(typeof newSession.refreshToken, "object");
            assert.strictEqual(typeof newSession.refreshToken.value, "string");
            const newRefreshedSession = await session.refreshSession(newSession.refreshToken.value);
            assert.strictEqual(typeof newRefreshedSession, "object");
            assert.strictEqual(typeof newRefreshedSession.sessionTheftDetected, "boolean");
            assert.deepStrictEqual(newRefreshedSession.sessionTheftDetected, false);
            assert.strictEqual(typeof newRefreshedSession.newAccessToken, "object");
            assert.strictEqual(typeof newRefreshedSession.newAccessToken.value, "string");
            await delay(2000);
            const newRefreshedSession2 = await session.refreshSession(newRefreshedSession.newRefreshToken.value);
            assert.strictEqual(typeof newRefreshedSession2, "object");
            assert.strictEqual(typeof newRefreshedSession2.sessionTheftDetected, "boolean");
            assert.deepStrictEqual(newRefreshedSession2.sessionTheftDetected, false);
            assert.strictEqual(typeof newRefreshedSession2.newAccessToken, "object");
            assert.strictEqual(typeof newRefreshedSession2.newAccessToken.value, "string");
            await delay(2000);
            const newRefreshedSession3 = await session.refreshSession(newRefreshedSession2.newRefreshToken.value);
            assert.strictEqual(typeof newRefreshedSession3, "object");
            assert.strictEqual(typeof newRefreshedSession3.sessionTheftDetected, "boolean");
            assert.deepStrictEqual(newRefreshedSession3.sessionTheftDetected, false);
            assert.strictEqual(typeof newRefreshedSession3.newAccessToken, "object");
            assert.strictEqual(typeof newRefreshedSession3.newAccessToken.value, "string");
        }
    });

    it("refresh session (token theft S1->R1->S2->R1)", async function() {
        assert.strictEqual(typeof session.createNewSession, "function");
        assert.strictEqual(typeof session.getSession, "function");
        await reset(config.minConfigTest);
        const userId = "testing";
        const jwtPayload = { a: "testing" };
        const sessionData = { s: "session" };
        const newSession = await session.createNewSession(userId, jwtPayload, sessionData);
        assert.strictEqual(typeof newSession, "object");
        assert.strictEqual(typeof newSession.refreshToken, "object");
        assert.strictEqual(typeof newSession.refreshToken.value, "string");
        const newRefreshedSession = await session.refreshSession(newSession.refreshToken.value);
        assert.strictEqual(typeof newRefreshedSession, "object");
        assert.strictEqual(typeof newRefreshedSession.sessionTheftDetected, "boolean");
        assert.deepStrictEqual(newRefreshedSession.sessionTheftDetected, false);
        assert.strictEqual(typeof newRefreshedSession.newAccessToken, "object");
        assert.strictEqual(typeof newRefreshedSession.newAccessToken.value, "string");
        const sessionInfo = await session.getSession(newRefreshedSession.newAccessToken.value);
        assert.strictEqual(typeof sessionInfo, "object");
        assert.strictEqual(typeof sessionInfo.newAccessToken, "object");
        assert.strictEqual(typeof sessionInfo.newAccessToken.value, "string");
        assert.notDeepStrictEqual(newRefreshedSession.newAccessToken.value, sessionInfo.newAccessToken.value);
        const refreshSessionWithOldToken = await session.refreshSession(newSession.refreshToken.value);
        assert.strictEqual(typeof refreshSessionWithOldToken, "object");
        assert.strictEqual(typeof refreshSessionWithOldToken.sessionTheftDetected, "boolean");
        assert.deepStrictEqual(refreshSessionWithOldToken.sessionTheftDetected, true);
    });

    it("refresh session (token theft S1->R1->R2->R1)", async function() {
        assert.strictEqual(typeof session.createNewSession, "function");
        assert.strictEqual(typeof session.getSession, "function");
        await reset(config.minConfigTest);
        const userId = "testing";
        const jwtPayload = { a: "testing" };
        const sessionData = { s: "session" };
        const newSession = await session.createNewSession(userId, jwtPayload, sessionData);
        assert.strictEqual(typeof newSession, "object");
        assert.strictEqual(typeof newSession.refreshToken, "object");
        assert.strictEqual(typeof newSession.refreshToken.value, "string");
        const newRefreshedSession1 = await session.refreshSession(newSession.refreshToken.value);
        assert.strictEqual(typeof newRefreshedSession1, "object");
        assert.strictEqual(typeof newRefreshedSession1.sessionTheftDetected, "boolean");
        assert.deepStrictEqual(newRefreshedSession1.sessionTheftDetected, false);
        assert.strictEqual(typeof newRefreshedSession1.newRefreshToken, "object");
        assert.strictEqual(typeof newRefreshedSession1.newRefreshToken.value, "string");
        const newRefreshedSession2 = await session.refreshSession(newRefreshedSession1.newRefreshToken.value);
        assert.strictEqual(typeof newRefreshedSession2, "object");
        assert.strictEqual(typeof newRefreshedSession2.sessionTheftDetected, "boolean");
        assert.deepStrictEqual(newRefreshedSession2.sessionTheftDetected, false);
        assert.strictEqual(typeof newRefreshedSession2.newRefreshToken, "object");
        assert.strictEqual(typeof newRefreshedSession2.newRefreshToken.value, "string");
        assert.notDeepStrictEqual(
            newRefreshedSession2.newRefreshToken.value,
            newRefreshedSession1.newRefreshToken.value
        );
        const refreshSessionWithOldToken = await session.refreshSession(newSession.refreshToken.value);
        assert.strictEqual(typeof refreshSessionWithOldToken, "object");
        assert.strictEqual(typeof refreshSessionWithOldToken.sessionTheftDetected, "boolean");
        assert.deepStrictEqual(refreshSessionWithOldToken.sessionTheftDetected, true);
    });

    it("update session info", async function() {
        assert.strictEqual(typeof session.createNewSession, "function");
        assert.strictEqual(typeof session.getSession, "function");
        await reset(config.minConfigTest);
        const userId = "testing";
        const jwtPayload = { a: "testing" };
        const sessionData = { s: "session" };
        const newSession = await session.createNewSession(userId, jwtPayload, sessionData);
        assert.strictEqual(typeof newSession, "object");
        assert.strictEqual(typeof newSession.session, "object");
        assert.strictEqual(typeof newSession.session.handle, "string");
        const sessionDataBeforeUpdate = await session.getSessionData(newSession.session.handle);
        assert.strictEqual(typeof sessionDataBeforeUpdate, "object");
        assert.deepStrictEqual(sessionData, sessionDataBeforeUpdate);
        const newSessionData = { s: "new session data" };
        await session.updateSessionData(newSession.session.handle, newSessionData);
        const sessionDataPostUpdate = await session.getSessionData(newSession.session.handle);
        assert.strictEqual(typeof sessionDataPostUpdate, "object");
        assert.deepStrictEqual(newSessionData, sessionDataPostUpdate);
    });

    it("revoke session", async function() {
        assert.strictEqual(typeof session.createNewSession, "function");
        assert.strictEqual(typeof session.getSession, "function");
        await reset(config.minConfigTest);
        const userId = "testing";
        const jwtPayload = { a: "testing" };
        const sessionData = { s: "session" };
        const newSession = await session.createNewSession(userId, jwtPayload, sessionData);
        await session.createNewSession(userId, jwtPayload, sessionData);
        assert.strictEqual(typeof newSession, "object");
        assert.strictEqual(typeof newSession.session, "object");
        assert.strictEqual(typeof newSession.session.handle, "string");
        assert.strictEqual(typeof newSession.refreshToken, "object");
        assert.strictEqual(typeof newSession.refreshToken.value, "string");
        const noOfRowsBefore = await getNumberOfRowsInRefreshTokensTable();
        assert.deepStrictEqual(noOfRowsBefore, 2);
        await session.revokeSessionUsingSessionHandle(newSession.session.handle);
        const noOfRowsAfter = await getNumberOfRowsInRefreshTokensTable();
        assert.deepStrictEqual(noOfRowsAfter, 1);
        try {
            await session.refreshSession(newSession.refreshToken.value);
            throw Error("test failed");
        } catch (err) {
            if (err.errType !== errors.AuthError.UNAUTHORISED) {
                throw err;
            }
        }
    });

    it("remove refresh token from db but session will be valid until access token expires", async function() {
        assert.strictEqual(typeof session.createNewSession, "function");
        assert.strictEqual(typeof session.getSession, "function");
        await reset(config.configWithShortValidityForAccessToken);
        const userId = "testing";
        const jwtPayload = { a: "testing" };
        const sessionData = { s: "session" };
        const newSession = await session.createNewSession(userId, jwtPayload, sessionData);
        assert.strictEqual(typeof newSession, "object");
        assert.strictEqual(typeof newSession.session, "object");
        assert.strictEqual(typeof newSession.session.handle, "string");
        assert.strictEqual(typeof newSession.accessToken, "object");
        assert.strictEqual(typeof newSession.accessToken.value, "string");
        await session.revokeSessionUsingSessionHandle(newSession.session.handle);
        const sessionInfo = await session.getSession(newSession.accessToken.value);
        assert.strictEqual(typeof sessionInfo, "object");
        assert.deepStrictEqual(sessionInfo.newAccessToken, undefined);
        assert.strictEqual(typeof sessionInfo.session, "object");
        assert.strictEqual(typeof sessionInfo.session.handle, "string");
        assert.strictEqual(typeof sessionInfo.session.jwtPayload, "object");
        assert.deepStrictEqual(sessionInfo.session.jwtPayload, jwtPayload);
        assert.strictEqual(typeof sessionInfo.session.userId, "string");
        assert.deepStrictEqual(sessionInfo.session.userId, userId);
        await delay(1500);
        try {
            await session.getSession(newSession.accessToken.value);
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

    it("revoke all sessions for user", async function() {
        assert.strictEqual(typeof session.createNewSession, "function");
        assert.strictEqual(typeof session.getSession, "function");
        await reset(config.minConfigTest);
        const userId = "testing";
        const jwtPayload = { a: "testing" };
        const sessionData = { s: "session" };
        await session.createNewSession(userId, jwtPayload, sessionData);
        await session.createNewSession(userId, jwtPayload, sessionData);
        await session.createNewSession(userId, jwtPayload, sessionData);
        const noOfRowsBefore = await getNumberOfRowsInRefreshTokensTable();
        assert.deepStrictEqual(noOfRowsBefore, 3);
        await session.revokeAllSessionsForUser(userId);
        const noOfRowsAfter = await getNumberOfRowsInRefreshTokensTable();
        assert.deepStrictEqual(noOfRowsAfter, 0);
    });
});
