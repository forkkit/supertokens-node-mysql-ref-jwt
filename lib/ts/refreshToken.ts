import Config from "./config";
import { insertIntoAllTokens, getInfoFromAllTokens } from "./helpers/dbQueries";
import { getConnection } from "./helpers/mysql";
import { hash, generateUUID } from "./helpers/utils";
import { generateError, AuthError } from "./error";

/**
 * @description given a token, it verifies it with the stored signature and returns the payload contained in it
 * @throws AuthError GENERAL_ERROR UNAUTHORISED
 */
export async function getInfoFromRefreshToken(
    token: string
): Promise<{
    sessionHandle: string;
    parentRefreshTokenHash2: string;
}> {
    let connection = await getConnection();
    try {
        let info = await getInfoFromAllTokens(connection, hash(hash(token)));
        if (info === undefined) {
            throw Error("session info not found in all tokens info");
        }
        return info;
    } catch (err) {
        throw generateError(AuthError.UNAUTHORISED, err);
    }
}

/**
 * @description given token payload, it creates a new token that is signed by a key stored in the DB.
 * Note: The expiry time of the token is not in the token itself. This may result in the token being alive for a longer duration
 * than what is desired. We can easily fix this by adding the expiry time in the token
 * @throws AuthError GENERAL_ERROR
 */
export async function createNewRefreshToken(
    sessionHandle: string,
    parentRefreshTokenHash2: string | undefined
): Promise<{ token: string; expiry: number }> {
    // token = key1({funcArgs + nonce}).nonce where key1(a) = a encrypted using key1
    // we have the nonce for 2 reasons: given same arguments, the token would be different,
    // and it can be used to verify that the token was indeed created by us.
    let connection = await getConnection();
    let config = Config.get();
    let refreshToken = generateUUID();
    parentRefreshTokenHash2 = parentRefreshTokenHash2 || refreshToken;
    let refreshTokenHash2 = hash(hash(refreshToken));
    try {
        await insertIntoAllTokens(connection, sessionHandle, parentRefreshTokenHash2, refreshTokenHash2);
    } finally {
        connection.closeConnection();
    }
    return {
        token: refreshToken,
        expiry: Date.now() + config.tokens.refreshToken.validity
    };
}
