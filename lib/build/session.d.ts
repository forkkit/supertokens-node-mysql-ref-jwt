import { TypeInputConfig } from './helpers/types';
/**
 * @description: to be called by user of the library. This initiates all the modules necessary for this library to work.
 * Please create a database in your mysql instance before calling this function
 * @throws AuthError GENERAL_ERROR in case anything fails.
 */
export declare function init(config: TypeInputConfig): Promise<void>;
/**
 * @description call this to "login" a user.
 * @throws GENERAL_ERROR in case anything fails.
 */
export declare function createNewSession(userId: string, jwtPayload?: any, sessionData?: any): Promise<{
    session: {
        handle: string;
        userId: string;
        jwtPayload: any;
    };
    accessToken: {
        value: string;
        expires: number;
    };
    refreshToken: {
        value: string;
        expires: number;
    };
    idRefreshToken: {
        value: string;
        expires: number;
    };
}>;
/**
 * @description authenticates a session. To be used in APIs that require authentication
 * @throws AuthError, GENERAL_ERROR, UNAUTHORISED and TRY_REFRESH_TOKEN
 */
export declare function getSession(idRefreshToken: string, accessToken: string): Promise<{
    session: {
        handle: string;
        userId: string;
        jwtPayload: any;
    };
    newAccessToken: {
        value: string;
        expires: number;
    } | undefined;
}>;
/**
 * @description generates new access and refresh tokens for a given refresh token. Called when client's access token has expired.
 * @throws AuthError, GENERAL_ERROR, UNAUTHORISED
 */
export declare function refreshSession(idRefreshToken: string, refreshToken: string): Promise<{
    sessionTheftDetected: false;
    session: {
        handle: string;
        userId: string;
        jwtPayload: any;
    };
    newAccessToken: {
        value: string;
        expires: number;
    };
    newRefreshToken: {
        value: string;
        expires: number;
    };
    newIdRefreshToken: {
        value: string;
        expires: number;
    };
} | {
    sessionTheftDetected: true;
    session: {
        handle: string;
        userId: string;
    };
}>;
/**
 * @description deletes session info of a user from db. This only invalidates the refresh token. Not the access token.
 * Access tokens cannot be immediately invalidated. Unless we add a bloacklisting method. Or changed the private key to sign them.
 * @throws AuthError, GENERAL_ERROR
 */
export declare function revokeAllSessionsForUser(userId: string): Promise<void>;
/**
 * @description call to destroy one session
 * @returns true if session was deleted from db. Else false in case there was nothing to delete
 * @throws AuthError, GENERAL_ERROR
 */
export declare function revokeSessionUsingSessionHandle(sessionHandle: string): Promise<boolean>;
/**
    * @description: this function reads from the database every time. It provides no locking mechanism in case other processes are updating session data for this session as well, so please take of that by yourself.
    * @returns session data as provided by the user earlier
    * @throws AuthError GENERAL_ERROR, UNAUTHORISED.
    */
export declare function getSessionData(sessionHandle: string): Promise<any>;
/**
     * @description: It provides no locking mechanism in case other processes are updating session data for this session as well.
    * @throws AuthError GENERAL_ERROR, UNAUTHORISED.
    */
export declare function updateSessionData(sessionHandle: string, newSessionData: any): Promise<void>;
