import {
    promoteRefreshToken,
    checkIfSessionIdInDB,
    getInfoForRefreshToken,
    insertIntoRefreshToken,
    getSigningKeyForRefreshToken,
    newSigningKeyForRefreshToken,
    updateMetaInfoForRefreshToken
} from "../db/tokens";
import { Connection } from "../db/mysql";
import { setCookie, getCookieValue } from "../cookie";
import { Config } from "../config";
import { Request, Response } from "express";
import {
    hash,
    generateNewKey,
    serializeMetaInfoToString,
    generate32CharactersRandomString,
    generate44ChararctersRandomString
} from "../utils";
import { encrypt, decrypt } from "../crypto";

export const DB_KEY_FOR_SIGNING_KEY_REFRESH_TOKEN = "";
export class SigningKey {
    private key: string | undefined;
    private static instance: SigningKey | undefined;

    private constructor () {}

    static init () {
        if (SigningKey.instance === undefined) {
            SigningKey.instance = new SigningKey();
        }
    }

    static async getSigningKey (connection: Connection): Promise<string> {
        if (SigningKey.instance === undefined) {
            throw Error(); // @todo
        }
        if (SigningKey.instance.key === undefined) {
            let key = await getSigningKeyForRefreshToken(connection);
            if (key === null) {
                key = await generateNewKey();
                await newSigningKeyForRefreshToken(connection, key, Date.now());
            }
            SigningKey.instance.key = key;
        }
        return SigningKey.instance.key;
    }
}

export function getRefreshTokenSigningKey(connection: Connection): Promise<string> {
    return SigningKey.getSigningKey(connection);
}

export async function getRefreshTokenInfo(refreshTokenHash: string, connection: Connection): Promise<TypeRefreshTokenInfo | undefined> {
    const refreshTokenInDB = hash(refreshTokenHash);
    return await getInfoForRefreshToken(connection, refreshTokenInDB);
}

export async function getNewRefreshToken(userId: string, metaInfo: any, parentToken: string | null, sessionId: string | null, connection: Connection): Promise<string> {
    const randomString = generate44ChararctersRandomString();
    sessionId = sessionId === null ? generate32CharactersRandomString() : sessionId;
    let stringToEncrypt = `${randomString}.${userId}.${sessionId}`;
    if (parentToken !== null) {
        stringToEncrypt += `.${parentToken}`;
    }
    const signingKey = await getRefreshTokenSigningKey(connection);
    const encryptedPart = await encrypt(stringToEncrypt, signingKey);
    const refreshToken = `${encryptedPart}.${randomString}`;
    const refreshTokenToStoreInDB = hash(hash(refreshToken));
    metaInfo = serializeMetaInfoToString(metaInfo);
    await insertIntoRefreshToken(connection, refreshTokenToStoreInDB, userId, hash(sessionId), metaInfo, Date.now());
    return refreshToken;
}

export async function promoteChildRefreshTokenToMainTable(childToken: string, parentToken: string, connection: Connection) {
    const config = Config.get();
    const childTokenCreatedAt = Date.now(); 
    const childTokenExpiresAt = childTokenCreatedAt + config.tokens.refreshToken.validity;
    await promoteRefreshToken(connection, childToken, childTokenExpiresAt, childTokenCreatedAt, parentToken);
    const childInfoInMainTable = await getInfoForRefreshToken(connection, childToken);
    if (childInfoInMainTable === undefined) {
        /**
         * @todo
         * if after the promotion query, childToken not in main table
         */
        throw Error();
    }
}

export async function updateRefershTokenInHeaders(refreshToken: string, response: Response) {
    const config = Config.get();
    setCookie(response, config.cookie.refreshTokenCookieKey, refreshToken, config.cookie.domain, config.cookie.secure, true, config.tokens.refreshToken.validity, config.tokens.refreshToken.renewTokenURL);
}

export async function updateMetaInfo(refreshToken: string, metaInfo: any, connection: Connection) {
    metaInfo = serializeMetaInfoToString(metaInfo);
    await updateMetaInfoForRefreshToken(connection, refreshToken, metaInfo);
}

export function getRefreshTokenFromRequest(request: Request): string | null {
    const config = Config.get();
    const refreshToken = getCookieValue(request, config.cookie.refreshTokenCookieKey);
    if (refreshToken === undefined) {
        return null;
    }
    return refreshToken;
}

export async function verifyAndDecryptRefreshToken(refreshToken: string, connection: Connection): Promise<{
    parentToken: string | null,
    userId: string,
    sessionId: string
}> {
    const splittedRefreshToken = refreshToken.split(".");
    if (splittedRefreshToken.length !== 2) {
        /**
         * @todo
         */
        throw Error();
    }
    const signingKey = await getRefreshTokenSigningKey(connection);
    const randomStringOutside = splittedRefreshToken[1];
    const encryptedPart = splittedRefreshToken[0];
    const decryptedRefreshToken = await decrypt(encryptedPart, signingKey);
    const splittedDecryptedRefreshToken = decryptedRefreshToken.split(".");
    if (splittedDecryptedRefreshToken.length !== 3 && splittedDecryptedRefreshToken.length !== 4) {
        /**
         * @todo
         */
        throw Error();
    }
    const randomStringInside = splittedDecryptedRefreshToken[0];
    const userId = splittedDecryptedRefreshToken[1];
    const sessionId = splittedDecryptedRefreshToken[2];
    const parentToken = splittedDecryptedRefreshToken.length === 3 ? null : splittedDecryptedRefreshToken[3];
    if (randomStringInside !== randomStringOutside) {
        /**
         * @todo
         */
        throw Error();
    }
    refreshToken = hash(refreshToken);
    return {
        parentToken,
        userId,
        sessionId
    };
}

export type TypeRefreshTokenInfo = {
    userId: string,
    metaInfo: any,
    createdAt: number,
    expiresAt: number,
    sessionId: string
};

export async function checkIfSessionIdExistsAndNotifyForTokenTheft(connection: Connection, sessionId: string) {
    if (await checkIfSessionIdInDB(connection, sessionId)) {
        /**
         * @todo token theft module
         */    
    }
}