import { errorLogging } from './logging';

export function generateNewSigninKey(): string {

}

export function generateNonce(): string {

}

export function hash(toHash: string): string {

}

export async function encrypt(key: string, plainText: string): string {

}

export async function decrypt(key: string, encryptedText: string): string {

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