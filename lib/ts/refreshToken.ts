import Config from './config';
import { AuthError, generateError } from './error';
import { getKeyValueFromKeyName, insertKeyValueForKeyName } from './helpers/dbQueries';
import { getConnection } from './helpers/mysql';
import { generateNewSigningKey } from './helpers/utils';

export async function init() {
    let config = Config.get();
    await Key.init();
}

export function getInfoFromRefreshToken(token: string): {
    sessionHandle: string,
    userId: string,
    parentRefreshTokenHash1: string | undefined
} {

}

export function createNewRefreshToken(sessionHandle: string, userId: string,
    parentRefreshTokenHash1: string | undefined): string {

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
            let keys = await getKeyValueFromKeyName(connection, REFRESH_TOKEN_KEY_NAME_IN_DB);
            if (keys.length === 0) {
                let keyValue = await generateNewSigningKey();
                keys = [{
                    keyValue,
                    createdAtTime: Date.now()
                }];
                await insertKeyValueForKeyName(connection, REFRESH_TOKEN_KEY_NAME_IN_DB, keys[0].keyValue, keys[0].createdAtTime);
            }
            await connection.commit();
            return keys[0].keyValue;
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