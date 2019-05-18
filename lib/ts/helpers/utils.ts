import { createCipheriv, createDecipheriv, createHash, pbkdf2, randomBytes } from 'crypto';
import * as uuid from 'uuid';

import { errorLogging } from './logging';

export async function generateNewSigninKey(): Promise<string> {
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
    return createHash("sha256").update(toHash).digest("hex");
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
    const cipher = createCipheriv('aes-256-gcm', key, iv);

    // encrypt the given text
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);

    // extract the auth tag
    const tag = cipher.getAuthTag();

    // generate output
    return Buffer.concat([salt, iv, tag, encrypted]).toString('base64');
}

/**
 * Decrypts text by given key
 * @param encdata base64 encoded input data
 * @param masterkey key used to decrypt
 * @returns String decrypted (original) text
 */
export async function decrypt(encdata: string, masterkey: string) {
    // base64 decoding
    const bData = Buffer.from(encdata, 'base64');

    // convert data to buffers
    const salt = bData.slice(0, 64);
    const iv = bData.slice(64, 80);
    const tag = bData.slice(80, 96);
    const text: any = bData.slice(96); // NOTE: any because there is something wrong with TS definition file

    // derive key using; 32 byte key length
    const key = await new Promise<Buffer>((resolve, reject) => {
        pbkdf2(masterkey, salt, 100, 32, 'sha512', (err, key) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(key);
        });
    });

    // AES 256 GCM Mode
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);

    // encrypt the given text
    const decrypted = decipher.update(text, 'binary', 'utf8') + decipher.final('utf8');

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
    } catch (err) {
        errorLogging(err);
    }
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
    } catch (err) {
        errorLogging(err);
    }
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