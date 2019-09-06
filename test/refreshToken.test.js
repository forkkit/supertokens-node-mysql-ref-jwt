const assert = require("assert");
const config = require("./config");
const refreshToken = require("../lib/build/refreshToken");
const { reset } = require("../lib/build/helpers/utils");
const { printPath } = require("./utils");
const { getNumberOfRowsInAllTokensTable } = require("../lib/build/helpers/dbQueries");

describe(`Refresh Token: ${printPath("[test/refreshToken.test.js]")}`, function() {
    it("testing create and get info refresh token function", async function() {
        await reset(config.minConfigTest);
        assert.strictEqual(typeof refreshToken.createNewRefreshToken, "function");
        assert.strictEqual(typeof refreshToken.getInfoFromRefreshToken, "function");
        const sessionHandle = "sessionHandle";
        const parentRefreshTokenHash2 = "parentRefreshTokenHash2";
        const token = await refreshToken.createNewRefreshToken(sessionHandle, parentRefreshTokenHash2);
        const infoFromToken = await refreshToken.getInfoFromRefreshToken(token.token);
        assert.deepStrictEqual(infoFromToken, { sessionHandle, parentRefreshTokenHash2 });
        assert.deepStrictEqual(await getNumberOfRowsInAllTokensTable(), 1);
    });
});
