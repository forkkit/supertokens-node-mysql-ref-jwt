import {
    promoteRefreshToken,
    getInfoForRefreshToken,
    getSigningKeyForRefreshToken,
    newSigningKeyForRefreshToken,
    updateMetaInfoForRefreshToken
} from "../db/tokens";
import { Connection } from "../db/mysql";
import { setCookie, getCookieValue } from "../cookie";
import { Config } from "../config";
import { Request, Response } from "express";
import { serializeMetaInfoToString, generate40CharactersRandomString } from "../utils";

export const DB_KEY_FOR_SIGNING_KEY_REFRESH_TOKEN = "";
export class SigningKey {
    private key: string | undefined;
    private static instance: SigningKey | undefined;

    private constructor () {}

    static async init () {
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
                key = generate40CharactersRandomString();
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

export async function getRefreshTokenInfo(refreshToken: string, connection: Connection): Promise<TypeRefreshTokenInfo | undefined> {
    return await getInfoForRefreshToken(connection, refreshToken);
}

export async function getNewRefreshToken(userId: string, metaInfo: any, parentToken: string | null, connection: Connection): Promise<string> {
    /**
     * @todo
     */
    const randomString = ""; // @todo some randome string
    return "";
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
    userId: string
}> {
    /**
     * @todo
     */
    return {
        parentToken: "",
        userId: ""
    };
}

export type TypeRefreshTokenInfo = {
    userId: string,
    metaInfo: any,
    createdAt: number,
    expiresAt: number
};