import Config from './config';
import { AuthError, generateError } from './error';
import { getKeyValueFromKeyName, insertKeyValueForKeyName } from './helpers/dbQueries';
import { getConnection } from './helpers/mysql';
import { TypeConfig, TypeGetSigningKeyUserFunction } from './helpers/types';
import { generateNewSigningKey } from './helpers/utils';

export async function init() {
    let config = Config.get();
    await SigningKey.init(config);
}

export function getInfoFromAccessToken(token: string): {
    sessionHandle: string,
    userId: string,
    refreshTokenHash1: string,
    expiryTime: number,
    parentRefreshTokenHash1: string | undefined
} {

}

export function createNewAccessToken(sessionHandle: string, userId: string, refreshTokenHash1: string,
    expiryTime: number, parentRefreshTokenHash1: string | undefined): string {

}
const ACCESS_TOKEN_SIGNING_KEY_NAME_IN_DB = "access_token_signing_key";
class SigningKey {

    static instance: SigningKey | undefined;
    private dynamic: boolean;
    private updateInterval: number;
    private getKeyFromUser: TypeGetSigningKeyUserFunction | undefined;
    private key: {
        keyValue: string,
        createdAtTime: number
    } | undefined;

    private constructor(config: TypeConfig) {
        this.dynamic = config.tokens.accessToken.signingKey.dynamic;
        this.updateInterval = config.tokens.accessToken.signingKey.updateInterval;
        this.getKeyFromUser = config.tokens.accessToken.signingKey.get;
    }

    static init = async (config: TypeConfig) => {
        if (SigningKey.instance === undefined) {
            SigningKey.instance = new SigningKey(config);
            await SigningKey.getKey();
        }
    }

    private getKeyFromInstance = async (): Promise<string> => {
        if (this.getKeyFromUser !== undefined) {
            try {
                return await this.getKeyFromUser();
            } catch (err) {
                throw generateError(AuthError.GENERAL_ERROR, err);
            }
        }
        if (this.key === undefined) {
            this.key = await this.generateNewKeyAndUpdateInDb();
        }
        if (this.dynamic && Date.now() > (this.key.createdAtTime + this.updateInterval)) {
            // key has expired.
            this.key = await this.generateNewKeyAndUpdateInDb();
        }
        return this.key.keyValue;
    }

    private generateNewKeyAndUpdateInDb = async (): Promise<{
        keyValue: string,
        createdAtTime: number
    }> => {
        let connection = await getConnection();
        try {
            await connection.startTransaction();
            let keys = await getKeyValueFromKeyName(connection, ACCESS_TOKEN_SIGNING_KEY_NAME_IN_DB);
            let generateNewKey = keys.length === 0;
            if (!generateNewKey) {  // read key may have expired...
                if (this.dynamic && Date.now() > (keys[0].createdAtTime + this.updateInterval)) {
                    generateNewKey = true;
                }
            }
            if (generateNewKey) {
                let keyValue = await generateNewSigningKey();
                keys = [{
                    keyValue,
                    createdAtTime: Date.now()
                }];
                await insertKeyValueForKeyName(connection, ACCESS_TOKEN_SIGNING_KEY_NAME_IN_DB, keys[0].keyValue, keys[0].createdAtTime);
            }
            await connection.commit();
            return keys[0];
        } finally {
            connection.closeConnection();
        }
    }

    static getKey = async (): Promise<string> => {
        if (SigningKey.instance === undefined) {
            throw generateError(AuthError.GENERAL_ERROR, new Error("please call init function of access token signing key"));
        }
        return await SigningKey.instance.getKeyFromInstance();
    }
}