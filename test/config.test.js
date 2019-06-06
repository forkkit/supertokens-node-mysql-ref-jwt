const SuperTokens = require("..");
const config = require("./config");
const assert = require("assert");
const { reset } = require("../lib/build/helpers/utils");

describe("Config", function() {
    before(async function() {
        await reset();
    });
    it("testing init with minimum required config", async function() {
        assert.strictEqual(typeof SuperTokens.init, "function");
        await SuperTokens.init(config.minConfigTest);
    });
});
