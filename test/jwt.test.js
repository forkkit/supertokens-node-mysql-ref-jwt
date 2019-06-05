const jwt = require("../lib/build/helpers/jwt");
const assert = require("assert");

describe("JWT test", function() {
    it("testing create token and verification with correct inputs", function() {
        const payload = { a: "a" };
        const signingKey = "testing";
        assert(typeof jwt.createJWT, "function");
        assert(typeof jwt.verifyJWTAndGetPayload, "function");
        const token = jwt.createJWT(payload, signingKey);
        const verifiedPayload = jwt.verifyJWTAndGetPayload(token, signingKey);
        assert.deepStrictEqual(verifiedPayload, payload);
    });

    it("testing create token and verification with different signing keys", function(done) {
        const payload = { a: "a" };
        const signingKeyA = "testing";
        const signingKeyB = "test";
        assert(typeof jwt.createJWT, "function");
        assert(typeof jwt.verifyJWTAndGetPayload, "function");
        const token = jwt.createJWT(payload, signingKeyA);
        try {
            const verifiedPayload = jwt.verifyJWTAndGetPayload(token, signingKeyB);
        } catch (err) {
            done();
        }
        throw Error("jwt verfied with wrong signing key");
    });
});
