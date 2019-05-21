/// <reference types="express" />
import * as express from 'express';
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
     * @throws AuthError GENERAL_ERROR, UNAUTHORISED.
     */
    getSessionData: () => Promise<any>;
    /**
     * @description: It provides no locking mechanism in case other processes are updating session data for this session as well.
     * @param newSessionData this can be anything: an array, a promitive type, object etc etc. This will overwrite the current value stored in the database.
     * @throws AuthError GENERAL_ERROR
     */
    updateSessionData: (newSessionData: any) => Promise<void>;
    getUserId: () => string;
    getJWTPayload: () => Promise<any>;
}
