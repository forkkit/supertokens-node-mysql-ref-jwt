/**
 * @description given a token, it verifies it with the stored signature and returns the payload contained in it
 * @throws AuthError GENERAL_ERROR UNAUTHORISED
 */
export declare function getInfoFromRefreshToken(token: string): Promise<{
    sessionHandle: string;
    parentRefreshTokenHash2: string;
}>;
/**
 * @description given token payload, it creates a new token that is signed by a key stored in the DB.
 * Note: The expiry time of the token is not in the token itself. This may result in the token being alive for a longer duration
 * than what is desired. We can easily fix this by adding the expiry time in the token
 * @throws AuthError GENERAL_ERROR
 */
export declare function createNewRefreshToken(sessionHandle: string, parentRefreshTokenHash2: string | undefined): Promise<{
    token: string;
    expiry: number;
}>;
