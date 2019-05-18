"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const HEADER = Buffer.from(JSON.stringify({
    alg: "HS256",
    typ: "JWT"
})).toString("base64");
function createJWT(plainTextPayload, signingKey) {
    const payload = Buffer.from(JSON.stringify(plainTextPayload)).toString("base64");
    const signature = utils_1.hmac(HEADER + "." + payload, signingKey);
    return `${HEADER}.${payload}.${signature}`;
}
exports.createJWT = createJWT;
// Throw error if verifications fail.. or anything goes wrong.
function verifyJWTAndGetPayload(jwt, signingKey) {
    const splittedInput = jwt.split(".");
    if (splittedInput.length !== 3) {
        throw new Error("invalid jwt");
    }
    // checking header
    if (splittedInput[0] !== HEADER) {
        throw new Error("jwt header mismatch");
    }
    // verifying signature
    let payload = splittedInput[1];
    const signatureFromHeaderAndPayload = utils_1.hmac(HEADER + "." + payload, signingKey);
    if (signatureFromHeaderAndPayload !== splittedInput[2]) {
        throw new Error("jwt verification failed");
    }
    // sending payload
    payload = Buffer.from(payload, "base64").toString();
    return JSON.parse(payload);
}
exports.verifyJWTAndGetPayload = verifyJWTAndGetPayload;
//# sourceMappingURL=jwt.js.map