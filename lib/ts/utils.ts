import * as validator from "validator";
import { createHash, randomBytes, pbkdf2 } from "crypto";

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
        return result !== null && typeof (result) === "object";
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

// TODO: dont just use date.now()!! use something more. add more randomness!!! What is the context of using these? for keys, md5 is unacceptable!
export function generate32CharactersRandomString(): string {
    return createHash("md5").update(Date.now().toString() + randomBytes(8)).digest("hex");
}

export function hash(stringText: string): string {
    return createHash("sha256").update(stringText).digest("hex");
}

export function generate44ChararctersRandomString(): string {
    return createHash("sha256").update(randomBytes(64)).digest("base64").toString();
}

export function generateNewKey(): Promise<string> {
    return new Promise((resolve, reject) => {
        pbkdf2(randomBytes(64), randomBytes(64), 100, 32, 'sha512', (err, i) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(i.toString("base64"));
        })
    })
}

export function checkUserIdContainsNoDot(userId: string): boolean {
    return userId.split(".").length === 1;
}