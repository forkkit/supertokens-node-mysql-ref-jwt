"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("crypto");
const accessToken_1 = require("./tokens/accessToken");
const utils_1 = require("./utils");
const algorithm = "sha256";
const header = Buffer.from(JSON.stringify({
    alg: "HS256",
    typ: "JWT"
})).toString("base64");
function createNewJWT(jsonPayload, connection) {
    return __awaiter(this, void 0, void 0, function* () {
        const signingKey = yield accessToken_1.getAccessTokenSigningKey(connection);
        const payload = Buffer.from(JSON.stringify(jsonPayload)).toString("base64");
        const hashFunction = crypto_1.createHmac(algorithm, signingKey);
        const signature = hashFunction.update(`${header}.${payload}`).digest("hex");
        return `${header}.${payload}.${signature}`;
    });
}
exports.createNewJWT = createNewJWT;
// @todo think if you want to change the name of the function
function verifyAndGetPayload(token, getSingingKey, connection) {
    return __awaiter(this, void 0, void 0, function* () {
        const splittedInput = token.split(".");
        if (splittedInput.length !== 3) {
            throw Error(utils_1.JWTErrors.invalidJWT);
        }
        if (splittedInput[0] !== header) {
            throw Error(utils_1.JWTErrors.headerMismatch);
        }
        const payload = splittedInput[1];
        const signature = splittedInput[2];
        const signingKey = yield getSingingKey(connection);
        const hashFunction = crypto_1.createHmac(algorithm, signingKey);
        const signatureFromHeaderAndPayload = hashFunction.update(`${header}.${payload}`).digest("hex");
        if (signatureFromHeaderAndPayload !== signature) {
            throw Error(utils_1.JWTErrors.verificationFailed);
        }
        if (!utils_1.checkIfStringIsJSONObj(payload)) { // NOTE: if somebody gets the signing key, they can potentially manipulate the payload to be a non json, which might lead to unknown behavior.
            throw Error(utils_1.JWTErrors.invalidPaylaod);
        }
        return JSON.parse(payload);
    });
}
exports.verifyAndGetPayload = verifyAndGetPayload;
//# sourceMappingURL=jwt.js.map