import * as express from 'express';

import { clearSessionFromCookie } from './cookie';
import { AuthError, generateError } from './error';
import { deleteSession, getSessionData, updateSessionData } from './helpers/dbQueries';
import { getConnection } from './helpers/mysql';
import { hash } from './helpers/utils';

/**
 * @class Session
 * @description an instance of this is created when a session is valid.
 */
export class Session {
    private sessionHandle: string;
    private userId: string;
    private jwtUserPayload: any;
    private res: express.Response;

    constructor(sessionHandle: string, userId: string,
        jwtUserPayload: any, res: express.Response) {
        this.sessionHandle = sessionHandle;
        this.userId = userId;
        this.jwtUserPayload = jwtUserPayload;
        this.res = res;
    }

    /**
     * @description call this to logout the current user. 
     * This only invalidates the refresh token. The access token can still be used after
     * @sideEffect may clear cookies from response.
     * @throw AuthError GENERAL_ERROR
     */
    revokeSession = async () => {
        let connection = await getConnection();
        try {
            let affectedRows = await deleteSession(connection, hash(this.sessionHandle));
            if (affectedRows === 1) {
                clearSessionFromCookie(this.res);
            }
        } finally {
            connection.closeConnection();
        }
    }

    /**
     * @description: this function reads from the database every time. It provides no locking mechanism in case other processes are updating session data for this session as well, so please take of that by yourself.
     * @returns session data as provided by the user earlier
     * @throws AuthError GENERAL_ERROR, UNAUTHORISED. 
     */
    getSessionData = async (): Promise<any> => {
        let connection = await getConnection();
        try {
            let result = await getSessionData(connection, hash(this.sessionHandle));
            if (!result.found) {
                throw generateError(AuthError.UNAUTHORISED, new Error("session does not exist anymore"));
            } else {
                return result.data;
            }
        } finally {
            connection.closeConnection();
        }
    }

    /**
     * @description: It provides no locking mechanism in case other processes are updating session data for this session as well.
     * @param newSessionData this can be anything: an array, a promitive type, object etc etc. This will overwrite the current value stored in the database.
     * @throws AuthError GENERAL_ERROR
     */
    updateSessionData = async (newSessionData: any) => {
        let connection = await getConnection();
        try {
            await updateSessionData(connection, hash(this.sessionHandle), newSessionData);
        } finally {
            connection.closeConnection();
        }
    }

    getUserId = () => {
        return this.userId;
    }

    getJWTPayload = () => {
        return this.jwtUserPayload;
    }


}