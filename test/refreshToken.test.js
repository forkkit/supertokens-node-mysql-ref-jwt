const assert = require("assert");
const config = require("./config");
const refreshToken = require("../lib/build/refreshToken");
const { reset } = require("../lib/build/helpers/utils");

describe("Refresh Token", function() {
    it("testing create and get refresh token function", async function() {
        await reset(config.minConfigTest);
        assert.strictEqual(typeof refreshToken.createNewRefreshToken, "function");
        assert.strictEqual(typeof refreshToken.getInfoFromRefreshToken, "function");
        const sessionHandle = "sessionHandle";
        const parentKey = "parentKey";
        const userId = "superToken";
        const token = await refreshToken.createNewRefreshToken(sessionHandle, userId, parentKey);
        const infoFromToken = await refreshToken.getInfoFromRefreshToken(token.token);
        assert.deepStrictEqual(infoFromToken, {
            sessionHandle: "sessionHandle",
            userId: "superToken",
            parentRefreshTokenHash1: "parentKey"
        });
    });

    it("testing create token and verification with different signing keys", async function() {
        await reset(config.minConfigTest);
        assert.strictEqual(typeof refreshToken.createNewRefreshToken, "function");
        assert.strictEqual(typeof refreshToken.getInfoFromRefreshToken, "function");
        const sessionHandle = "sessionHandle";
        const parentKey = "parentKey";
        const userId = "superToken";
        const token = await refreshToken.createNewRefreshToken(sessionHandle, userId, parentKey);
        await reset(config.minConfigTest);
        try {
            const infoFromToken = await refreshToken.getInfoFromRefreshToken(token.token);
            throw Error("test failed");
        } catch (err) {
            if (err.errType !== 2000) {
                throw err;
            }
        }
    });
});
