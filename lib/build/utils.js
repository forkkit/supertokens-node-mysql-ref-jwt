"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const validator = require("validator");
const crypto_1 = require("crypto");
exports.SessionErrors = {
    noAccessTokenInHeaders: ""
};
exports.JWTErrors = {
    invalidJWT: "",
    headerMismatch: "",
    verificationFailed: "",
    jwtExpired: "",
    invalidPaylaod: ""
};
function checkIfStringIsJSONObj(stringText) {
    try {
        let result = JSON.parse(stringText);
        return result !== null && typeof (result) === "object";
    }
    catch (err) {
        return false;
    }
}
exports.checkIfStringIsJSONObj = checkIfStringIsJSONObj;
function sanitizeStringInput(field) {
    if (field === "") {
        return "";
    }
    if (typeof field !== "string") {
        return undefined;
    }
    try {
        let result = validator.trim(field);
        return result;
    }
    catch (err) {
        /**
         * @todo
         */
    }
    return undefined;
}
exports.sanitizeStringInput = sanitizeStringInput;
function sanitizeNumberInput(field) {
    if (typeof field === "number") {
        return field;
    }
    if (typeof field !== "string") {
        return undefined;
    }
    try {
        let result = Number(validator.trim(field));
        if (isNaN(result)) {
            return undefined;
        }
        return result;
    }
    catch (err) {
        /**
         * @todo
         */
    }
    return undefined;
}
exports.sanitizeNumberInput = sanitizeNumberInput;
function sanitizeBooleanInput(field) {
    if (field === true || field === false) {
        return field;
    }
    if (field === "false") {
        return false;
    }
    if (field === "true") {
        return true;
    }
    return undefined;
}
exports.sanitizeBooleanInput = sanitizeBooleanInput;
function serializeMetaInfo(metaInfo) {
    if (metaInfo === undefined) {
        metaInfo = {};
    }
    if (!checkIfStringIsJSONObj(metaInfo)) {
        /**
         * @todo error
         */
        throw Error();
    }
    return metaInfo;
}
exports.serializeMetaInfo = serializeMetaInfo;
function serializeMetaInfoToString(metaInfo) {
    return JSON.stringify(serializeMetaInfo(metaInfo));
}
exports.serializeMetaInfoToString = serializeMetaInfoToString;
// TODO: dont just use date.now()!! use something more. add more randomness!!! What is the context of using these? for keys, md5 is unacceptable!
function generate32CharactersRandomString() {
    return crypto_1.createHash("md5").update(Date.now().toString() + crypto_1.randomBytes(8)).digest("hex");
}
exports.generate32CharactersRandomString = generate32CharactersRandomString;
function hash(stringText) {
    return crypto_1.createHash("sha256").update(stringText).digest("hex");
}
exports.hash = hash;
function generate44ChararctersRandomString() {
    return crypto_1.createHash("sha256").update(crypto_1.randomBytes(64)).digest("base64").toString();
}
exports.generate44ChararctersRandomString = generate44ChararctersRandomString;
function generateNewKey() {
    return new Promise((resolve, reject) => {
        crypto_1.pbkdf2(crypto_1.randomBytes(64), crypto_1.randomBytes(64), 100, 32, 'sha512', (err, i) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(i.toString("base64"));
        });
    });
}
exports.generateNewKey = generateNewKey;
function checkUserIdContainsNoDot(userId) {
    return userId.split(".").length === 1;
}
exports.checkUserIdContainsNoDot = checkUserIdContainsNoDot;
//# sourceMappingURL=utils.js.map