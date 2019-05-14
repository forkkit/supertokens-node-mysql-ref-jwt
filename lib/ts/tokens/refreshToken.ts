import {
    getSigningKeyForRefreshToken,
    newSigningKeyForRefreshToken
} from "../db/tokens";
import { getConnection } from "../db/mysql";

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

    static async getSigningKey (): Promise<string> {
        if (SigningKey.instance === undefined) {
            throw Error(); // @todo
        }
        if (SigningKey.instance.key === undefined) {
            const connection = await getConnection();
            try {
                let key = await getSigningKeyForRefreshToken(connection);
                if (key === null) {
                    key = '' // @todo
                    await newSigningKeyForRefreshToken(connection, key, Date.now());
                }
                SigningKey.instance.key = key;
            } catch (err) {
                connection.setDestroyConnection();
            throw err; // @todo logging module
            } finally {
                connection.closeConnection();
            }
        }
        return SigningKey.instance.key;
    }
}

export function getRefreshTokenSigningKey(): Promise<string> {
    return SigningKey.getSigningKey();
}