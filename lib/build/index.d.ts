import * as express from 'express';
import { TypeInputConfig } from './helpers/types';
import { Session } from './session';
export declare function init(config: TypeInputConfig): Promise<void>;
export { AuthError as Error } from "./error";
export declare function createNewSession(res: express.Response, userId: string, jwtPayload: any, sessionData?: {
    [key: string]: any;
}): Promise<Session>;
export declare function getSession(req: express.Request, res: express.Response): Promise<Session>;
export declare function refreshSession(req: express.Request, res: express.Response): Promise<Session>;
export declare function revokeAllSessionsForUser(userId: string): Promise<void>;
export declare function revokeSessionUsingSessionHandle(sessionHandle: string): Promise<void>;
