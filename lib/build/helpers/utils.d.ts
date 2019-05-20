export declare function generateNewSigningKey(): Promise<string>;
export declare function generateUUID(): string;
export declare function hash(toHash: string): string;
export declare function hmac(text: string, key: string): string;
/**
 * Encrypts text by given key
 * @param text text to encrypt
 * @param masterKey key used to encrypt
 * @returns String encrypted text, base64 encoded
 */
export declare function encrypt(text: string, masterkey: string): Promise<string>;
/**
 * Decrypts text by given key
 * @param encdata base64 encoded input data
 * @param masterkey key used to decrypt
 * @returns String decrypted (original) text
 */
export declare function decrypt(encdata: string, masterkey: string): Promise<string>;
/**
 *
 * @param field
 */
export declare function sanitizeStringInput(field: any): string | undefined;
/**
 *
 * @param field
 */
export declare function sanitizeNumberInput(field: any): number | undefined;
/**
 *
 * @param field
 */
export declare function sanitizeBooleanInput(field: any): boolean | undefined;
