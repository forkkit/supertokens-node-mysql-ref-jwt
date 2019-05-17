import { createHmac } from 'crypto';

import { Connection } from '../db/mysql';
import { getAccessTokenSigningKey } from '../tokens/accessToken';
import { checkIfStringIsJSONObj, JWTErrors, sanitizeNumberInput, sanitizeStringInput } from './utils';

const algorithm = "sha256";
const header = Buffer.from(JSON.stringify({
    alg: "HS256",
    typ: "JWT"
})).toString("base64");

export type TypeInputAccessTokenPayload = {
    exp: number,
    userId: string,
    metaInfo: string,
    rTHash: string,
    pRTHash?: string
};

export type TypeAccessTokenPayload = {
    exp: number,
    userId: string,
    metaInfo: any,
    rTHash: string
    pRTHash?: string
};

/**
 * 
 * @param jsonPayload 
 * @param mysqlConnection 
 */
export async function createNewJWT<T>(jsonPayload: T, mysqlConnection: Connection): Promise<string> {
    const signingKey = await getAccessTokenSigningKey(mysqlConnection);
    const payload = Buffer.from(JSON.stringify(jsonPayload)).toString("base64");
    const hashFunction = createHmac(algorithm, signingKey);
    const signature = hashFunction.update(`${header}.${payload}`).digest("hex");
    return `${header}.${payload}.${signature}`;
}

// @todo think if you want to change the name of the function
/**
 * 
 * @param token 
 * @param getSingingKey 
 * @param mysqlConnection 
 */
export async function verifyAndGetPayload(token: string, getSingingKey: (mConnection: Connection) => Promise<string>, mysqlConnection: Connection): Promise<TypeAccessTokenPayload> {
    const splittedInput = token.split(".");
    if (splittedInput.length !== 3) {
        throw Error(JWTErrors.invalidJWT);
    }
    if (splittedInput[0] !== header) {
        throw Error(JWTErrors.headerMismatch);
    }
    const payload = splittedInput[1];
    const signature = splittedInput[2];
    const signingKey = await getSingingKey(mysqlConnection);
    const hashFunction = createHmac(algorithm, signingKey);
    const signatureFromHeaderAndPayload = hashFunction.update(`${header}.${payload}`).digest("hex");
    if (signatureFromHeaderAndPayload !== signature) {
        throw Error(JWTErrors.verificationFailed);
    }
    if (!checkIfStringIsJSONObj(payload)) { // NOTE: if somebody gets the signing key, they can potentially manipulate the payload to be a non json, which might lead to unknown behavior.
        throw Error(JWTErrors.invalidPaylaod);
    }
    return JSON.parse(payload);
}