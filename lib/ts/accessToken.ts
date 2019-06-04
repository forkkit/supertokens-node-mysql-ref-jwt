import Config from './config';
import { AuthError, generateError } from './error';
import { getKeyValueFromKeyName_Transaction, insertKeyValueForKeyName_Transaction } from './helpers/dbQueries';
import * as JWT from './helpers/jwt';
import { getConnection } from './helpers/mysql';
import { TypeConfig, TypeGetSigningKeyUserFunction } from './helpers/types';
import { generateNewSigningKey, sanitizeNumberInput, sanitizeStringInput } from './helpers/utils';

/**
 * @description called during library init. Should be called after initing Config and MySQL.
 * @throws AuthError GENERAL_ERROR
 */
export async function init() {
    let config = Config.get();
    await SigningKey.init(config);
}

let a = 1;

/**
 * @description given a token, it verifies it, checks the payload type and returns the payload contained in it
 * @throws AuthError GENERAL_ERROR TRY_REFRESH_TOKEN
 */
export async function getInfoFromAccessToken(
    token: string
): Promise<{
    sessionHandle: string;
    userId: string;
    refreshTokenHash1: string;
    expiryTime: number;
    parentRefreshTokenHash1: string | undefined;
    userPayload: any;
}> {
    let signingKey = await SigningKey.getKey();
    try {
        let payload = JWT.verifyJWTAndGetPayload(token, signingKey); // if this fails, then maybe the signing key has changed. So we ask the user to try refresh token.
        let sessionHandle = sanitizeStringInput(payload.sessionHandle);
        let userId = sanitizeStringInput(payload.userId);
        let refreshTokenHash1 = sanitizeStringInput(payload.rt);
        let expiryTime = sanitizeNumberInput(payload.expiryTime);
        let parentRefreshTokenHash1 = sanitizeStringInput(payload.prt);
        let userPayload = payload.userPayload;
        if (
            sessionHandle === undefined ||
            userId === undefined ||
            refreshTokenHash1 === undefined ||
            expiryTime === undefined
        ) {
            // it would come here if we change the structure of the JWT.
            throw Error("invalid access token payload");
        }
        if (expiryTime < Date.now()) {
            throw Error("expired access token");
        }
        return {
            sessionHandle,
            userId,
            refreshTokenHash1,
            expiryTime,
            parentRefreshTokenHash1,
            userPayload
        };
    } catch (err) {
        throw generateError(AuthError.TRY_REFRESH_TOKEN, err);
    }
}

/**
 * @description given token payload, it creates a new token that is signed by a key stored in the DB.
 * @throws AuthError GENERAL_ERROR
 */
export async function createNewAccessToken(
    sessionHandle: string,
    userId: string,
    refreshTokenHash1: string,
    parentRefreshTokenHash1: string | undefined,
    userPayload: any
): Promise<{ token: string; expiry: number }> {
    let config = Config.get();
    let signingKey = await SigningKey.getKey();
    let expiry = Date.now() + config.tokens.accessToken.validity;
    let token = JWT.createJWT(
        {
            sessionHandle,
            userId,
            rt: refreshTokenHash1,
            prt: parentRefreshTokenHash1,
            expiryTime: expiry,
            userPayload
        },
        signingKey
    );
    return { token, expiry };
}

const ACCESS_TOKEN_SIGNING_KEY_NAME_IN_DB = "access_token_signing_key";
/**
 * @class SigningKey
 * @description this is a singleton class since there is just one key in the whole system for access tokens
 */
class SigningKey {
    static instance: SigningKey | undefined;
    private dynamic: boolean;
    private updateInterval: number;
    private getKeyFromUser: TypeGetSigningKeyUserFunction | undefined;
    private key:
    | {
        keyValue: string;
        createdAtTime: number;
    }
    | undefined;

    private constructor(config: TypeConfig) {
        this.dynamic = config.tokens.accessToken.signingKey.dynamic;
        this.updateInterval = config.tokens.accessToken.signingKey.updateInterval;
        this.getKeyFromUser = config.tokens.accessToken.signingKey.get;
    }

    /**
     * @description called when libraries' init is called. Creates and stores a signing key to be used if not already there.
     */
    static init = async (config: TypeConfig) => {
        if (SigningKey.instance === undefined) {
            SigningKey.instance = new SigningKey(config);
            await SigningKey.getKey();
        }
    };

    private getKeyFromInstance = async (): Promise<string> => {
        if (this.getKeyFromUser !== undefined) {
            // the user has provided their own function for this so use that.
            try {
                return await this.getKeyFromUser();
            } catch (err) {
                throw generateError(AuthError.GENERAL_ERROR, err);
            }
        }
        if (this.key === undefined) {
            this.key = await this.generateNewKeyAndUpdateInDb();
        }
        if (this.dynamic && Date.now() > this.key.createdAtTime + this.updateInterval) {
            // key has expired, we need to change it.
            this.key = await this.generateNewKeyAndUpdateInDb();
        }
        return this.key.keyValue;
    };

    /**
     * @description Generates a new key in a way that takes race conditions in account in case there are multiple node processes running.
     */
    private generateNewKeyAndUpdateInDb = async (): Promise<{
        keyValue: string;
        createdAtTime: number;
    }> => {
        let connection = await getConnection();
        try {
            await connection.startTransaction();
            let key = await getKeyValueFromKeyName_Transaction(connection, ACCESS_TOKEN_SIGNING_KEY_NAME_IN_DB);
            let generateNewKey = false;
            if (key !== undefined) {
                // read key may have expired. Or if we called this function to change an expired key, then some other process may have already done so.
                if (this.dynamic && Date.now() > key.createdAtTime + this.updateInterval) {
                    generateNewKey = true;
                }
            }
            if (key === undefined || generateNewKey) {
                let keyValue = await generateNewSigningKey();
                key = {
                    keyValue,
                    createdAtTime: Date.now()
                };
                await insertKeyValueForKeyName_Transaction(
                    connection,
                    ACCESS_TOKEN_SIGNING_KEY_NAME_IN_DB,
                    key.keyValue,
                    key.createdAtTime
                );
            }
            await connection.commit();
            return key;
        } finally {
            connection.closeConnection();
        }
    };

    static getKey = async (): Promise<string> => {
        if (SigningKey.instance === undefined) {
            throw generateError(
                AuthError.GENERAL_ERROR,
                new Error("please call init function of access token signing key")
            );
        }
        return await SigningKey.instance.getKeyFromInstance();
    };
}
