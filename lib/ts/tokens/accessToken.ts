import { Request, Response } from 'express';

import { Config } from '../config';
import { getCookieValue, setCookie } from '../cookie';
import { Connection } from '../db/mysql';
import { getSigningKeyForAccessToken, newSigningKeyForAccessToken, updateSingingKeyForAccessToken } from '../db/tokens';
import {
    createNewAccessTokenJWT,
    TypeAccessTokenJWTPayload,
    TypeInputAccessTokenJWTPayload,
    verifyAccessTokenJWTAndGetPayload,
} from '../jwt';
import { generate40CharactersRandomString } from '../utils';

export type TypeGetSigningKeyFunction = (connection?: Connection) => Promise<string>;
export type TypeGetSigningKeyUserFunction = () => Promise<string>;
export type TypeSingingKeyConfig = {
    dynamic: boolean,
    updateInterval: number
    get: TypeGetSigningKeyUserFunction | undefined
};
export type TypeAccessTokenConfig = {
    signingKey: TypeSingingKeyConfig,
    validity: number
};

export const DB_KEY_FOR_SIGNING_KEY_ACCESS_TOKEN = 'access-token-signing-key';  // store this in db/tokens.ts. This has no use here.

export class SigningKey {
    private dynamic: boolean;
    private updateInterval: number;
    private get: TypeGetSigningKeyFunction;
    private key: {
        value: string,
        createdAt: number
    } | undefined;
    private static instance: SigningKey | undefined;
    private isUserFunction: boolean;

    private constructor(config: TypeSingingKeyConfig) {
        this.dynamic = config.dynamic;
        this.updateInterval = config.updateInterval;
        if (config.get === undefined) {
            this.get = this.getKey;
            this.isUserFunction = false;
        } else {
            this.get = config.get;
            this.isUserFunction = true;
        }
    }

    static init() {
        if (SigningKey.instance === undefined) {
            const config = Config.get();
            SigningKey.instance = new SigningKey(config.tokens.accessTokens.signingKey);
        }
    }

    static async getSigningKey(connection: Connection | undefined): Promise<string> {
        if (SigningKey.instance === undefined) {
            throw Error();  // TODO: some message!
        }
        if (SigningKey.instance.isUserFunction) {
            connection = undefined; // TODO: this is bad style!! call this function here too: return await SigningKey.instance.get(connection);
        }
        return await SigningKey.instance.get(connection);
    }

    async getKey(connection: Connection): Promise<string> { // TODO: make this private if not used outside the class
        if (this.key === undefined) {
            // TODO: transaction!
            let key = await getSigningKeyForAccessToken(connection);
            if (key === undefined) {
                // TODO: to create key, use the method I told you about!!!!!!!!
                const value = generate40CharactersRandomString();   // TODO: variable name value?! what does this represent? This is not signing key!? no..
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
            const value = generate40CharactersRandomString();   // TODO: see above!! please make this a function here.. do not repeate this code.
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
    const config = Config.get();    // TODO: remember this can throw error!
    const accessToken = getCookieValue(request, config.cookie.accessTokenCookieKey);
    if (accessToken === undefined) {
        return null;
    }
    return accessToken;
}

export async function verifyTokenAndPayload(token: string, connection: Connection): Promise<TypeAccessTokenJWTPayload> {
    return await verifyAccessTokenJWTAndGetPayload(token, connection);  // TODO: do check for access token payload here. not in that file
}

export async function updateAccessTokenInHeaders(payload: TypeInputAccessTokenJWTPayload, response: Response, connection: Connection) {
    const accessToken = await createNewAccessTokenJWT(payload, connection);
    const config = Config.get();
    setCookie(response, config.cookie.accessTokenCookieKey, accessToken, config.cookie.domain, config.cookie.secure, true, config.tokens.accessTokens.validity, null);
}