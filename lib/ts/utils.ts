import * as validator from "validator";
import { createHash } from "crypto";

export const SessionErrors = {
    noAccessTokenInHeaders: ""
}

export const JWTErrors = {
    invalidJWT: "",
    headerMismatch: "",
    verificationFailed: "",
    jwtExpired: "",
    invalidPaylaod: ""
}

export function checkIfStringIsJSONObj(stringText: string): boolean {
    try {
        let result = JSON.parse(stringText);
        return result !== null && typeof(result) === "object";
    } catch (err) {
        return false;
    }
}

export function sanitizeStringInput(field: any): string | undefined {
    if (field === "") {
        return "";
    }
    if (typeof field !== "string") {
        return undefined;
    }
    try {
        let result = validator.trim(field);
        return result;
    } catch (err) {
        /**
         * @todo
         */
    }
    return undefined;
}

export function sanitizeNumberInput(field: any): number | undefined {
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
    } catch (err) {
        /**
         * @todo
         */
    }
    return undefined;
}

export function sanitizeBooleanInput(field: any): boolean | undefined {
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

export function serializeMetaInfo(metaInfo: any): any {
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

export function serializeMetaInfoToString(metaInfo: any): any {
    return JSON.stringify(serializeMetaInfo(metaInfo));
}

export function generate32CharactersRandomString(): string {
    return createHash("md5").update(Date.now().toString()).digest("hex");
}

export function generate40CharactersRandomString(): string {
    return createHash("sha1").update(Date.now().toString()).digest("hex");
}

export function generate24CharactersRandomString(): string {
    return createHash("md5").update(Date.now().toString()).digest("base64");
}