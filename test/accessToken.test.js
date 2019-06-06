const config = require("./config");
const assert = require("assert");
const { reset, delay } = require("../lib/build/helpers/utils");
const accessToken = require("../lib/build/accessToken");

describe("Access Token", function() {
    it("testing create and get access token function", async function() {
        await reset(config.minConfigTest);
        assert.strictEqual(typeof accessToken.createNewAccessToken, "function");
        assert.strictEqual(typeof accessToken.getInfoFromAccessToken, "function");
        const sessionHandle = "sessionHandle";
        const userId = "testing";
        const refreshTokenHash1 = "refreshTokenHash1";
        const parentRefreshTokenHash1 = "parentRefreshTokenHash1";
        const userPayload = { a: "a" };
        const token = await accessToken.createNewAccessToken(
            sessionHandle,
            userId,
            refreshTokenHash1,
            parentRefreshTokenHash1,
            userPayload
        );
        const infoFromToken = await accessToken.getInfoFromAccessToken(token.token);
        assert.deepStrictEqual(infoFromToken, {
            sessionHandle,
            userId,
            refreshTokenHash1,
            parentRefreshTokenHash1,
            userPayload,
            expiryTime: token.expiry
        });
    });

    it("testing with custom signing key function", async function() {
        await reset(config.configWithSigningKeyFunction);
        const signingKey = await accessToken.getKey();
        assert.deepStrictEqual(signingKey, config.configWithSigningKeyFunction.tokens.accessToken.signingKey.get());
    });

    it("testing very short update interval for signing key", async function() {
        await reset(config.configWithSmallSigningKeyUpdateInterval);
        const signingKey1 = await accessToken.getKey();
        await delay(2000);
        const signingKey2 = await accessToken.getKey();
        assert.notDeepStrictEqual(signingKey1, signingKey2);
    });
});
