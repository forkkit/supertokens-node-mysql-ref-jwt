import { Request, Response } from 'express';

import { Config } from '../config';
import { getCookieValue, setCookie } from '../cookie';
import { Connection } from '../db/mysql';
import { getSigningKeyForAccessToken, newSigningKeyForAccessToken, updateSingingKeyForAccessToken } from '../db/tokens';
import {
    createNewJWT,
    verifyAndGetPayload,
    TypeAccessTokenPayload,
    TypeInputAccessTokenPayload
} from '../jwt';
import {
    JWTErrors,
    generateNewKey,
    sanitizeNumberInput,
    sanitizeStringInput,
    checkIfStringIsJSONObj
} from '../utils';

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
            return await SigningKey.instance.get();
        }
        return await SigningKey.instance.get(connection);
    }

    private async getKey(connection: Connection): Promise<string> {
        const createdAt = Date.now();
        if (this.key === undefined) {
            // TODO: transaction!
            const key = await getSigningKeyForAccessToken(connection);
            if (key === undefined) {
                const value = await generateNewKey();   // TODO: variable name value?! what does this represent? This is not signing key!? no..
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
            const value = await generateNewKey();
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

export async function verifyTokenAndGetPayload(token: string, connection: Connection): Promise<TypeAccessTokenPayload> {
    let payload = await verifyAndGetPayload(token, getAccessTokenSigningKey, connection);
    payload = validatePayload(payload);
    if (payload.exp < Date.now()) {
        throw Error(JWTErrors.jwtExpired);
    }
    return payload;
}

export async function updateAccessTokenInHeaders(payload: TypeInputAccessTokenPayload, response: Response, connection: Connection) {
    const accessToken = await createNewJWT<TypeInputAccessTokenPayload>(payload, connection);
    const config = Config.get();
    setCookie(response, config.cookie.accessTokenCookieKey, accessToken, config.cookie.domain, config.cookie.secure, true, config.tokens.accessTokens.validity, null);
}

function validatePayload(payload: any): TypeAccessTokenPayload {
    const exp = sanitizeNumberInput(payload.exp);
    const userId = sanitizeStringInput(payload.userId);
    const metaInfo = sanitizeStringInput(payload.metaInfo);
    const rTHash = sanitizeStringInput(payload.rTHash);
    const pRTHash = sanitizeStringInput(payload.pRTHash);
    if (exp === undefined || userId === undefined || metaInfo === undefined || !checkIfStringIsJSONObj(metaInfo) || rTHash === undefined) {
        throw Error(JWTErrors.invalidPaylaod);
    }
    return {
        exp,
        userId,
        metaInfo: JSON.parse(metaInfo),
        rTHash,
        pRTHash
    }
}