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
        const sessionInfo = await session.getSession(newSession.idRefreshToken.value, newSession.accessToken.value);
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
            await session.getSession(newSession.idRefreshToken.value, newSession.accessToken.value);
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
        await delay(2000);
        try {
            await session.getSession(newSession.idRefreshToken.value, newSession.accessToken.value);
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
            await session.getSession(newSession.idRefreshToken.value, newSession.accessToken.value);
            throw Error("test failed");
        } catch (err) {
            if (err.errType !== errors.AuthError.TRY_REFRESH_TOKEN) {
                throw err;
            }
        }
        const newRefreshedSession = await session.refreshSession(
            newSession.idRefreshToken.value,
            newSession.refreshToken.value
        );
        assert.strictEqual(typeof newRefreshedSession, "object");
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
        const sessionInfo = await session.getSession(
            newRefreshedSession.newIdRefreshToken.value,
            newRefreshedSession.newAccessToken.value
        );
        assert.strictEqual(typeof sessionInfo, "object");
        assert.deepStrictEqual(typeof sessionInfo.newAccessToken, "object");
        assert.strictEqual(typeof sessionInfo.newAccessToken.value, "string");
        assert.notDeepStrictEqual(newRefreshedSession.newAccessToken.value, sessionInfo.newAccessToken.value);
        assert.strictEqual(typeof sessionInfo.newAccessToken.expires, "number");
        assert.strictEqual(typeof sessionInfo.session, "object");
        assert.strictEqual(typeof sessionInfo.session.handle, "string");
        assert.strictEqual(typeof sessionInfo.session.jwtPayload, "object");
        assert.deepStrictEqual(sessionInfo.session.jwtPayload, jwtPayload);
        assert.strictEqual(typeof sessionInfo.session.userId, "string");
        assert.deepStrictEqual(sessionInfo.session.userId, userId);
    });
});
