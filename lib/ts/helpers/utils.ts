import { createCipheriv, createDecipheriv, createHash, createHmac, pbkdf2, randomBytes } from "crypto";
import * as uuid from "uuid";
import * as validator from "validator";

import { reset as accessTokenReset } from "../accessToken";
import Config from "../config";
import { reset as refreshTokenReset } from "../refreshToken";
import { init } from "../session";
import { resetTables } from "./dbQueries";
import { getConnection, Mysql } from "./mysql";
import { TypeInputConfig } from "./types";

/**
 * number of iterations is 32 here. To make this "more random", increase this value. But know that doing so will increase the amount of time it takes to generate a key.
 */
export async function generateNewSigningKey(): Promise<string> {
    return await new Promise<string>((resolve, reject) => {
        pbkdf2(randomBytes(64), randomBytes(64), 100, 32, "sha512", (err, key) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(key.toString("base64"));
        });
    });
}

export function generateUUID(): string {
    return uuid.v1();
}

export function hash(toHash: string): string {
    return createHash("sha256")
        .update(toHash)
        .digest("hex");
}

export function hmac(text: string, key: string) {
    const hashFunction = createHmac("sha256", key);
    return hashFunction.update(text).digest("hex");
}

/**
 * Encrypts text by given key
 * @param text text to encrypt
 * @param masterKey key used to encrypt
 * @returns String encrypted text, base64 encoded
 */
export async function encrypt(text: string, masterkey: string): Promise<string> {
    // random initialization vector
    const iv = randomBytes(16);

    // random salt
    const salt = randomBytes(64);

    // derive encryption key: 32 byte key length
    // in assumption the masterkey is a cryptographic and NOT a password there is no need for
    // a large number of iterations. It may can replaced by HKDF
    // the value of 2145 is randomly chosen!
    const key = await new Promise<Buffer>((resolve, reject) => {
        pbkdf2(masterkey, salt, 100, 32, "sha512", (err, key) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(key);
        });
    });

    // AES 256 GCM Mode
    const cipher = createCipheriv("aes-256-gcm", key, iv);

    // encrypt the given text
    const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);

    // extract the auth tag
    const tag = cipher.getAuthTag();

    // generate output
    return Buffer.concat([salt, iv, tag, encrypted]).toString("base64");
}

/**
 * Decrypts text by given key
 * @param encdata base64 encoded input data
 * @param masterkey key used to decrypt
 * @returns String decrypted (original) text
 */
export async function decrypt(encdata: string, masterkey: string): Promise<string> {
    // base64 decoding
    const bData = Buffer.from(encdata, "base64");

    // convert data to buffers
    const salt = bData.slice(0, 64);
    const iv = bData.slice(64, 80);
    const tag = bData.slice(80, 96);
    const text: any = bData.slice(96); // NOTE: any because there is something wrong with TS definition file

    // derive key using; 32 byte key length
    const key = await new Promise<Buffer>((resolve, reject) => {
        pbkdf2(masterkey, salt, 100, 32, "sha512", (err, key) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(key);
        });
    });

    // AES 256 GCM Mode
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);

    // encrypt the given text
    const decrypted = decipher.update(text, "binary", "utf8") + decipher.final("utf8");

    return decrypted;
}

/**
 *
 * @param field
 */
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
    } catch (err) {}
    return undefined;
}

/**
 *
 * @param field
 */
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
    } catch (err) {}
    return undefined;
}

/**
 *
 * @param field
 */
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

/**
 * @description used in testing to reset all the singletons. Please do not use this outside of testing
 * @param newConfig this can be undefined because if you actually want to test the init function itself after reset.
 */
export async function reset(newConfig?: TypeInputConfig) {
    if (process.env.TEST_MODE !== "testing") {
        throw Error("call this function only during testing");
    }
    if (newConfig !== undefined) {
        await init(newConfig);
    }
    try {
        let connection = await getConnection();
        try {
            await resetTables(connection);
        } finally {
            connection.closeConnection();
        }
    } catch (err) {
        // if reset function is called before init, this part will throw error
    } finally {
        Config.reset();
        Mysql.reset();
        refreshTokenReset();
        accessTokenReset();
        if (newConfig !== undefined) {
            await init(newConfig);
        }
    }
}

/**
 *
 * @param timeInMilliseconds
 */
export function delay(timeInMilliseconds: number) {
    return new Promise(res => setTimeout(res, timeInMilliseconds));
}
