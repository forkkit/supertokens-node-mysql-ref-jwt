import Config from './config';
import { AuthError, generateError } from './error';
import { getKeyValueFromKeyName_Transaction, insertKeyValueForKeyName_Transaction } from './helpers/dbQueries';
import { getConnection } from './helpers/mysql';
import { decrypt, encrypt, generateNewSigningKey, generateUUID, hash, sanitizeStringInput } from './helpers/utils';

export async function init() {
    let config = Config.get();
    await Key.init();
}

export async function getInfoFromRefreshToken(token: string): Promise<{
    sessionHandle: string,
    userId: string,
    parentRefreshTokenHash1: string | undefined
}> {
    let key = await Key.getKey();
    try {
        let splittedToken = token.split(".");
        if (splittedToken.length !== 2) {
            throw Error("invalid refresh token");
        }
        let nonce = splittedToken[1];
        let payload = JSON.parse(await decrypt(splittedToken[0], key));
        let sessionHandle = sanitizeStringInput(payload.sessionHandle);
        let userId = sanitizeStringInput(payload.userId);
        let prt = sanitizeStringInput(payload.prt);
        let nonceFromEnc = sanitizeStringInput(payload.nonce);
        if (sessionHandle === undefined || userId === undefined ||
            nonceFromEnc !== nonce) {
            throw Error("invalid refresh token");
        }
        return {
            sessionHandle,
            userId, parentRefreshTokenHash1: prt
        };
    } catch (err) {
        throw generateError(AuthError.UNAUTHORISED, err);
    }
}

export async function createNewRefreshToken(sessionHandle: string, userId: string,
    parentRefreshTokenHash1: string | undefined): Promise<{ token: string, expiry: number }> {
    let config = Config.get();
    let key = await Key.getKey();
    let nonce = hash(generateUUID());
    let payloadSerialised = JSON.stringify({
        sessionHandle, userId,
        prt: parentRefreshTokenHash1,
        nonce
    });
    let encryptedPart = await encrypt(payloadSerialised, key);
    return {
        token: encryptedPart + "." + nonce,
        expiry: Date.now() + config.tokens.refreshToken.validity
    };
}

const REFRESH_TOKEN_KEY_NAME_IN_DB = "refresh_token_key";
class Key {
    private key: string | undefined;
    private static instance: Key | undefined;

    private constructor() { }

    static init = async () => {
        if (Key.instance === undefined) {
            Key.instance = new Key();
            await Key.getKey();
        }
    }

    private getKeyFromInstance = async (): Promise<string> => {
        if (this.key === undefined) {
            this.key = await this.generateNewKeyAndUpdateInDb();
        }
        return this.key;
    }

    private generateNewKeyAndUpdateInDb = async (): Promise<string> => {
        let connection = await getConnection();
        try {
            await connection.startTransaction();
            let key = await getKeyValueFromKeyName_Transaction(connection, REFRESH_TOKEN_KEY_NAME_IN_DB);
            if (key === undefined) {
                let keyValue = await generateNewSigningKey();
                key = {
                    keyValue,
                    createdAtTime: Date.now()
                };
                await insertKeyValueForKeyName_Transaction(connection, REFRESH_TOKEN_KEY_NAME_IN_DB, key.keyValue, key.createdAtTime);
            }
            await connection.commit();
            return key.keyValue;
        } finally {
            connection.closeConnection();
        }
    }

    static getKey = async (): Promise<string> => {
        if (Key.instance === undefined) {
            throw generateError(AuthError.GENERAL_ERROR, new Error("please call init function of refresh token key"));
        }
        return await Key.instance.getKeyFromInstance();
    }
}