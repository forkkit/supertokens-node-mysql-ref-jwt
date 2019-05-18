import * as express from 'express';

import { clearSessionFromCookie } from './cookie';
import { AuthError, generateError } from './error';
import { deleteSession, getSessionData, updateSessionData } from './helpers/dbQueries';
import { getConnection } from './helpers/mysql';

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

    revokeSession = async () => {
        let connection = await getConnection();
        try {
            let affectedRows = await deleteSession(connection, this.sessionHandle);
            if (affectedRows === 1) {
                clearSessionFromCookie(this.res);
            }
        } finally {
            connection.closeConnection();
        }
    }

    /**
     * @description: this function reads from the database every time. It provides no locking mechanism in case other processes are updating session data for this session as well.
     */
    getSessionData = async (): Promise<any> => {
        let connection = await getConnection();
        try {
            let result = await getSessionData(connection, this.sessionHandle);
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
     */
    updateSessionData = async (newSessionData: any) => {
        let connection = await getConnection();
        try {
            await updateSessionData(connection, this.sessionHandle, newSessionData);
        } finally {
            connection.closeConnection();
        }
    }

    getUserId = () => {
        return this.userId;
    }

    getJWTPayload = async () => {
        return this.jwtUserPayload;
    }


}

// export async function readSessionDataFromDb(sessionHandle: string): Promise<{
//     userId: string,
//     sessionInfo: { [key: string]: any },
//     refreshTokenHash2: string,
//     expiryTime: number,
// } | undefined> {

// }

// export async function updateSessionDataInDb(sessionHandle: string,
//     sessionInfo: { [key: string]: any }, refreshTokenHash2: string, expiryTime: number) {

// }

// export async function removeSessionDataInDb(sessionHandle: string) {

// }