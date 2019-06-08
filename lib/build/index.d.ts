/// <reference types="express" />
import * as express from "express";
import { TypeInputConfig } from "./helpers/types";
export { AuthError as Error } from "./error";
/**
 * @description: to be called by user of the library. This initiates all the modules necessary for this library to work.
 * Please create a database in your mysql instance before calling this function
 * @throws AuthError GENERAL_ERROR in case anything fails.
 */
export declare function init(config: TypeInputConfig): Promise<void>;
/**
 * @description call this to "login" a user. This overwrites any existing session that exists.
 * To check if a session exists, call getSession function.
 * @throws GENERAL_ERROR in case anything fails.
 * @sideEffect sets cookies in res
 */
export declare function createNewSession(res: express.Response, userId: string, jwtPayload?: any, sessionData?: any): Promise<Session>;
/**
 * @description authenticates a session. To be used in APIs that require authentication
 * @throws AuthError, GENERAL_ERROR, UNAUTHORISED and TRY_REFRESH_TOKEN
 * @sideEffects may remove cookies, or change the accessToken.
 */
export declare function getSession(req: express.Request, res: express.Response): Promise<Session>;
/**
 * @description generates new access and refresh tokens for a given refresh token. Called when client's access token has expired.
 * @throws AuthError, GENERAL_ERROR, UNAUTHORISED
 * @sideEffects may remove cookies, or change the accessToken and refreshToken.
 */
export declare function refreshSession(req: express.Request, res: express.Response): Promise<Session>;
/**
 * @description deletes session info of a user from db. This only invalidates the refresh token. Not the access token.
 * Access tokens cannot be immediately invalidated. Unless we add a bloacklisting method. Or changed the private key to sign them.
 * @throws AuthError, GENERAL_ERROR
 */
export declare function revokeAllSessionsForUser(userId: string): Promise<void>;
/**
 * @description Called by client normally when token theft is detected. Please do not call this to log the user out. This will not clear user cookies. Instead, use the session class to call the revokeSession function
 * @throws AuthError, GENERAL_ERROR
 */
export declare function revokeSessionUsingSessionHandle(sessionHandle: string): Promise<void>;
/**
 * @class Session
 * @description an instance of this is created when a session is valid.
 */
export declare class Session {
    private sessionHandle;
    private userId;
    private jwtUserPayload;
    private res;
    constructor(sessionHandle: string, userId: string, jwtUserPayload: any, res: express.Response);
    /**
     * @description call this to logout the current user.
     * This only invalidates the refresh token. The access token can still be used after
     * @sideEffect may clear cookies from response.
     * @throw AuthError GENERAL_ERROR
     */
    revokeSession: () => Promise<void>;
    /**
     * @description: this function reads from the database every time. It provides no locking mechanism in case other processes are updating session data for this session as well, so please take of that by yourself.
     * @returns session data as provided by the user earlier
     * @sideEffect may clear cookies from response.
     * @throws AuthError GENERAL_ERROR, UNAUTHORISED.
     */
    getSessionData: () => Promise<any>;
    /**
     * @description: It provides no locking mechanism in case other processes are updating session data for this session as well.
     * @param newSessionData this can be anything: an array, a promitive type, object etc etc. This will overwrite the current value stored in the database.
     * @sideEffect may clear cookies from response.
     * @throws AuthError GENERAL_ERROR, UNAUTHORISED.
     */
    updateSessionData: (newSessionData: any) => Promise<void>;
    getUserId: () => string;
    getJWTPayload: () => any;
}
