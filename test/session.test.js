const session = require("../lib/build/session");
const assert = require("assert");
const { reset } = require("..//lib/build/helpers/utils");
const config = require("./config");

describe("Session", function() {
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
});
