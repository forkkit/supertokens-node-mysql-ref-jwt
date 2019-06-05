const SuperTokens = require("..");
const config = require("./config");
const assert = require("assert");

describe("Config", function() {
    it("testing init()", async function() {
        assert.strictEqual(typeof SuperTokens.init, "function");
        await SuperTokens.init(config);
    });
});
