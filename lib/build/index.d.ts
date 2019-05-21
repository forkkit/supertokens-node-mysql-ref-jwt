/// <reference types="express" />
import * as express from 'express';
import { TypeInputConfig } from './helpers/types';
import { Session } from './session';
/**
 * @description: to be called by user of the library. This initiates all the modules necessary for this library to work.
 * Please create a database in your mysql instance before calling this function
 * @throws AuthError GENERAL_ERROR in case anything fails.
 */
export declare function init(config: TypeInputConfig): Promise<void>;
export { AuthError as Error } from "./error";
/**
 * @description call this to "login" a user. This overwrites any existing session that exists.
 * To check if a session exists, call getSession function.
 * @throws GENERAL_ERROR in case anything fails.
 * @sideEffect sets cookies in res
 */
export declare function createNewSession(res: express.Response, userId: string, jwtPayload: any, sessionData?: {
    [key: string]: any;
}): Promise<Session>;
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
 * @description Called by client normally when token theft is detected.
 * @throws AuthError, GENERAL_ERROR
 */
export declare function revokeSessionUsingSessionHandle(sessionHandle: string): Promise<void>;
