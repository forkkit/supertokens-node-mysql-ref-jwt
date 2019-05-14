import { Config } from "../config";
import { Request } from "express";
import { getCookieValue } from "../cookie";
import { getConnection } from "../db/mysql";
import {
    getSigningKeyForAccessToken,
    newSigningKeyForAccessToken,
    updateSingingKeyForAccessToken
} from "../db/tokens";
import {
    verifyAccessTokenJWTAndGetPayload,
    TypeAccessTokenJWTPayload
} from "../jwt";

export type TypeGetSigningKeyFunction = () => Promise<string>;
export type TypeSingingKeyConfig = {
    length: number,
    dynamic: boolean,
    updateInterval: number
    get: TypeGetSigningKeyFunction | undefined
}
export type TypeAccessTokenConfig = {
    signingKey: TypeSingingKeyConfig,
    validity: number
}

export const DB_KEY_FOR_SIGNING_KEY_ACCESS_TOKEN = 'access-token-signing-key';

export class SigningKey {
    private dynamic: boolean;
    private length: number;
    private updateInterval: number;
    private get: TypeGetSigningKeyFunction;
    private key : {
        value: string,
        createdAt: number
    } | undefined;
    private static instance: SigningKey | undefined;

    private constructor (config: TypeSingingKeyConfig) {
        this.dynamic = config.dynamic;
        this.length = config.length;
        this.updateInterval = config.updateInterval;
        this.get = config.get || this.getKey; // @todo do not OR
    }

    static init () {
        if (SigningKey.instance === undefined) {
            const config = Config.get();
            SigningKey.instance = new SigningKey(config.tokens.accessTokens.signingKey);
        }
    }

    static async getSigningKey (): Promise<string> {
        if (SigningKey.instance === undefined) {
            throw Error();
        }
        return await SigningKey.instance.get();
    }

    /**
     * @todo use transaction
     */
    async getKey (): Promise<string> {
        const connection = await getConnection();
        try {
            if (this.key === undefined) {
                let key = await getSigningKeyForAccessToken(connection);
                if (key === undefined) {
                    const value = '' // @todo: generate random string
                    const createdAt = Date.now();
                    await newSigningKeyForAccessToken(connection, value, createdAt);
                    this.key = {
                        value,
                        createdAt
                    };
                } else {
                    this.key = key;
                }
            }
            if (this.dynamic && Date.now() > (this.key.createdAt + this.updateInterval)) {
                const value = '' // @todo: generate random string
                const createdAt = Date.now();
                await updateSingingKeyForAccessToken(connection, value, createdAt);
                this.key = {
                    value,
                    createdAt
                };
            }
            return this.key.value;
        } catch (err) {
            connection.setDestroyConnection();
            throw err; // @todo logging module
        } finally {
            connection.closeConnection();
        }
    }
}

export function getAccessTokenSigningKey(): Promise<string> {
    return SigningKey.getSigningKey();
}

export function getAccessTokenFromRequest(request: Request): string | null {
    const cookieKey = "sAccessToken"; // @todo put this somewhere else
    const accessToken = getCookieValue(request, cookieKey);
    if (accessToken === undefined) {
        return null;
    }
    return accessToken;
}

export async function verifyToken(token: string): Promise<TypeAccessTokenJWTPayload> {
    return await verifyAccessTokenJWTAndGetPayload(token);
}