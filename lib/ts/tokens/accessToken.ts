import { Config } from "../config";
import { Request, Response } from "express";
import { getCookieValue, setCookie } from "../cookie";
import { getConnection, Connection } from "../db/mysql";
import {
    getSigningKeyForAccessToken,
    newSigningKeyForAccessToken,
    updateSingingKeyForAccessToken
} from "../db/tokens";
import {
    createNewAccessTokenJWT,
    verifyAccessTokenJWTAndGetPayload,
    TypeAccessTokenJWTPayload,
    TypeInputAccessTokenJWTPayload
} from "../jwt";

export type TypeGetSigningKeyFunction = (connection?: Connection) => Promise<string>;
export type TypeGetSigningKeyUserFunction = () => Promise<string>;
export type TypeSingingKeyConfig = {
    length: number,
    dynamic: boolean,
    updateInterval: number
    get: TypeGetSigningKeyUserFunction | undefined
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
    private isUserFunction: boolean;

    private constructor (config: TypeSingingKeyConfig) {
        this.dynamic = config.dynamic;
        this.length = config.length;
        this.updateInterval = config.updateInterval;
        if (config.get === undefined) {
            this.get = this.getKey;
            this.isUserFunction = false;
        } else {
            this.get = config.get;
            this.isUserFunction = true;
        }
    }

    static init () {
        if (SigningKey.instance === undefined) {
            const config = Config.get();
            SigningKey.instance = new SigningKey(config.tokens.accessTokens.signingKey);
        }
    }

    static async getSigningKey (connection: Connection | undefined): Promise<string> {
        if (SigningKey.instance === undefined) {
            throw Error();
        }
        if (SigningKey.instance.isUserFunction) {
            connection = undefined;
        }
        return await SigningKey.instance.get(connection);
    }

    async getKey (connection: Connection): Promise<string> {
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
    }
}

export function getAccessTokenSigningKey(connection: Connection): Promise<string> {
    return SigningKey.getSigningKey(connection);
}

export function getAccessTokenFromRequest(request: Request): string | null {
    const config = Config.get();
    const accessToken = getCookieValue(request, config.cookie.accessTokenCookieKey);
    if (accessToken === undefined) {
        return null;
    }
    return accessToken;
}

export async function verifyTokenAndPayload(token: string, connection: Connection): Promise<TypeAccessTokenJWTPayload> {
    return await verifyAccessTokenJWTAndGetPayload(token, connection);
}

export async function updateAccessTokenInHeaders(payload: TypeInputAccessTokenJWTPayload, response: Response, connection: Connection) {
    const accessToken = await createNewAccessTokenJWT(payload, connection);
    const config = Config.get();
    setCookie(response, config.cookie.accessTokenCookieKey, accessToken, config.cookie.domain, config.cookie.secure, true, config.tokens.accessTokens.validity, null);
}