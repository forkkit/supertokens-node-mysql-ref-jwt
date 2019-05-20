import * as express from 'express';
export declare class Session {
    private sessionHandle;
    private userId;
    private jwtUserPayload;
    private res;
    constructor(sessionHandle: string, userId: string, jwtUserPayload: any, res: express.Response);
    revokeSession: () => Promise<void>;
    /**
     * @description: this function reads from the database every time. It provides no locking mechanism in case other processes are updating session data for this session as well.
     */
    getSessionData: () => Promise<any>;
    /**
     * @description: It provides no locking mechanism in case other processes are updating session data for this session as well.
     */
    updateSessionData: (newSessionData: any) => Promise<void>;
    getUserId: () => string;
    getJWTPayload: () => Promise<any>;
}
