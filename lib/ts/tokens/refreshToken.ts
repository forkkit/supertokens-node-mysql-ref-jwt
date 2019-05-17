import {
    promoteRefreshToken,
    checkIfSessionIdInDB,
    getInfoForRefreshToken,
    insertIntoRefreshToken,
    getSigningKeyForRefreshToken,
    newSigningKeyForRefreshToken,
    updateMetaInfoForRefreshToken,
    deleteAllRefreshTokensForUserId
} from "../db/tokens";
import { Connection } from "../db/mysql";
import { setCookie, getCookieValue } from "../helpers/cookie";
import { Config } from "../config";
import { Request, Response } from "express";
import {
    hash,
    generateNewKey,
    serializeMetaInfoToString,
    generate32CharactersRandomString,
    generate44ChararctersRandomString
} from "../helpers/utils";
import { encrypt, decrypt } from "../helpers/crypto";

/**
 * @constant
 */
export const DB_KEY_FOR_SIGNING_KEY_REFRESH_TOKEN = "";

/**
 * @class
 */
export class SigningKey {
    private key: string | undefined;
    private static instance: SigningKey | undefined;

    private constructor () {}

    static init () {
        if (SigningKey.instance === undefined) {
            SigningKey.instance = new SigningKey();
        }
    }

    static async getSigningKey (mysqlConnection: Connection): Promise<string> {
        if (SigningKey.instance === undefined) {
            throw Error(); // @todo
        }
        if (SigningKey.instance.key === undefined) {
            let key = await getSigningKeyForRefreshToken(mysqlConnection);
            if (key === null) {
                key = await generateNewKey();
                await newSigningKeyForRefreshToken(mysqlConnection, key, Date.now());
            }
            SigningKey.instance.key = key;
        }
        return SigningKey.instance.key;
    }
}

/**
 * 
 * @param mysqlConnection 
 */
export function getRefreshTokenSigningKey(mysqlConnection: Connection): Promise<string> {
    return SigningKey.getSigningKey(mysqlConnection);
}

/**
 * 
 * @param refreshTokenHash 
 * @param mysqlConnection 
 */
export async function getRefreshTokenInfo(refreshTokenHash: string, mysqlConnection: Connection): Promise<TypeRefreshTokenInfo | undefined> {
    const refreshTokenInDB = hash(refreshTokenHash);
    return await getInfoForRefreshToken(mysqlConnection, refreshTokenInDB);
}

/**
 * 
 * @param userId 
 * @param metaInfo 
 * @param parentToken 
 * @param sessionId 
 * @param mysqlConnection 
 */
export async function getNewRefreshToken(userId: string, metaInfo: any, parentToken: string | null, sessionId: string | null, mysqlConnection: Connection): Promise<string> {
    const randomString = generate44ChararctersRandomString();
    sessionId = sessionId === null ? generate32CharactersRandomString() : sessionId;
    let stringToEncrypt = `${randomString}.${userId}.${sessionId}`;
    if (parentToken !== null) {
        stringToEncrypt += `.${parentToken}`;
    }
    const signingKey = await getRefreshTokenSigningKey(mysqlConnection);
    const encryptedPart = await encrypt(stringToEncrypt, signingKey);
    const refreshToken = `${encryptedPart}.${randomString}`;
    const refreshTokenToStoreInDB = hash(hash(refreshToken));
    metaInfo = serializeMetaInfoToString(metaInfo);
    if (parentToken === null) {
        await insertIntoRefreshToken(mysqlConnection, refreshTokenToStoreInDB, userId, hash(sessionId), metaInfo, Date.now());
    }
    return refreshToken;
}

/**
 * 
 * @param childToken 
 * @param parentToken 
 * @param mysqlConnection 
 */
export async function promoteChildRefreshTokenToMainTable(childToken: string, parentToken: string, mysqlConnection: Connection) {
    const config = Config.get();
    const childTokenCreatedAt = Date.now(); 
    const childTokenExpiresAt = childTokenCreatedAt + config.tokens.refreshToken.validity;
    await promoteRefreshToken(mysqlConnection, childToken, childTokenExpiresAt, childTokenCreatedAt, parentToken);
    const childInfoInMainTable = await getInfoForRefreshToken(mysqlConnection, childToken);
    if (childInfoInMainTable === undefined) {
        /**
         * @todo
         * if after the promotion query, childToken not in main table
         */
        throw Error();
    }
}

/**
 * 
 * @param refreshToken 
 * @param response 
 */
export async function updateRefershTokenInHeaders(refreshToken: string, response: Response) {
    const config = Config.get();
    setCookie(response, config.cookie.refreshTokenCookieKey, refreshToken, config.cookie.domain, config.cookie.secure, true, config.tokens.refreshToken.validity, config.tokens.refreshToken.renewTokenURL);
}

export async function updateMetaInfo(refreshToken: string, metaInfo: any, mysqlConnection: Connection) {
    metaInfo = serializeMetaInfoToString(metaInfo);
    await updateMetaInfoForRefreshToken(mysqlConnection, refreshToken, metaInfo);
}

/**
 * 
 * @param request 
 */
export function getRefreshTokenFromRequest(request: Request): string | null {
    const config = Config.get();
    const refreshToken = getCookieValue(request, config.cookie.refreshTokenCookieKey);
    if (refreshToken === undefined) {
        return null;
    }
    return refreshToken;
}

/**
 * 
 * @param refreshToken 
 * @param mysqlConnection 
 */
export async function verifyAndDecryptRefreshToken(refreshToken: string, mysqlConnection: Connection): Promise<{
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
    const signingKey = await getRefreshTokenSigningKey(mysqlConnection);
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
    metaInfo: {[key: string]: any},
    createdAt: number,
    expiresAt: number,
    sessionId: string
};

/**
 * 
 * @param mysqlConnection 
 * @param sessionId 
 */
export async function checkIfSessionIdExistsAndNotifyForTokenTheft(sessionId: string, mysqlConnection: Connection) {
    if (await checkIfSessionIdInDB(mysqlConnection, sessionId)) {
        /**
         * @todo token theft module
         */    
    }
}

export async function removeAllRefreshTokensForUserId(userId: string, mysqlConnection: Connection) {
    await deleteAllRefreshTokensForUserId(mysqlConnection, userId);
}