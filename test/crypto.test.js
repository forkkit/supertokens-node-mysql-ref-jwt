const utils = require("../lib/build/helpers/utils");
const assert = require("assert");

describe("Crypto", function () {
    it("encrypt - decrypt function", async function () {
        assert.strictEqual(typeof (utils.encrypt), "function");
        assert.strictEqual(typeof (utils.decrypt), "function");
        const plainText = "testing";
        const masterKey = "master"
        const cipherText = await utils.encrypt(plainText, masterKey);
        const decipheredText = await utils.decrypt(cipherText, masterKey);
        assert.notDeepStrictEqual(plainText, decipheredText);
    });
})