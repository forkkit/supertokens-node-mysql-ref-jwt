"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const validator = require("validator");
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
//# sourceMappingURL=utils.js.map