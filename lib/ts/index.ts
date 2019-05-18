import * as express from 'express';

import { Session } from './session';

export async function init() {

}

export async function login(res: express.Response, userId: string,
    jwtPayload?: { [key: string]: any }, sessionData?: { [key: string]: any }): Promise<Session> {

}

export async function getSession(req: express.Request, res: express.Response): Promise<Session> {

}

export async function refreshSession(req: express.Request, res: express.Response): Promise<Session> {

}

export async function revokeAllSessionsForUser(userId: string) {

}

export async function revokeSessionUsingSessionHandle(sessionHandle: string) {

}