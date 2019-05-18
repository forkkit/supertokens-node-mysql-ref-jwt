import * as express from 'express';

import { init as accessTokenInit } from './accessToken';
import Config from './config';
import { Mysql } from './helpers/mysql';
import { TypeInputConfig } from './helpers/types';
import { init as refreshTokenInit } from './refreshToken';
import { Session } from './session';

export async function init(config: TypeInputConfig) {
    Config.init(config);
    await Mysql.init();
    await accessTokenInit();
    await refreshTokenInit();
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