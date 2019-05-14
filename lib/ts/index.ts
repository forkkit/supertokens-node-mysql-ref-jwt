import { 
    Config,
    TypeInputConfig
} from "./config";
import {
    Mysql
} from "./db/mysql";
import {
    SigningKey as accessTokenSigningKey,
    getAccessTokenFromRequest,
    verifyToken
} from "./tokens/accessToken";
import {
    SigningKey as refreshTokenSigningKey
} from "./tokens/refreshToken";
import { 
    Request,
    Response
} from "express";
import {
    SessionErrors
} from "./utils";

export function init (config: TypeInputConfig) {
    Config.set(config);
    Mysql.init().then(() => {
        accessTokenSigningKey.init();
        refreshTokenSigningKey.init();
    }).catch(err => {
        /**
         * @todo
         */
    })
}

class Session {
    private userId: string;
    private metaInfo: any;
    private expiresAt: number;

    constructor (userId: string, metaInfo: any, expiresAt: number) {
        this.userId = userId;
        this.metaInfo = metaInfo;
        this.expiresAt = expiresAt;
    }

    getUserId = (): string => {
        return this.userId;
    }

    getMetaInfo = (): any => {
        return this.metaInfo;
    }

    getExpiryTime = (): number => {
        return this.expiresAt;
    }
}

export async function getSession(request: Request, response: Response): Promise<Session> {
    const accessToken = getAccessTokenFromRequest(request);
    if (accessToken === null) {
        throw Error(SessionErrors.noAccessTokenInHeaders);
    }
    let jwtPayload = await verifyToken(accessToken);
    if (jwtPayload.pRTHash !== undefined) {
        /**
         * @todo promote child refresh token to main table
         */
    }
    return new Session(jwtPayload.userId, jwtPayload.metaInfo, jwtPayload.exp);
}