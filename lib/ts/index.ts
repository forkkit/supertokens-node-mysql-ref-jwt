import { Config, TypeInputConfig } from "./config";
import { Mysql, getConnection, Connection } from "./db/mysql";
import { 
    verifyTokenAndPayload,
    getAccessTokenFromRequest,
    updateAccessTokenInHeaders,
    SigningKey as accessTokenSigningKey
} from "./tokens/accessToken";
import {
    updateMetaInfo,
    getNewRefreshToken,
    getRefreshTokenInfo,
    getRefreshTokenFromRequest,
    updateRefershTokenInHeaders,
    verifyAndDecryptRefreshToken,
    promoteChildRefreshTokenToMainTable,
    SigningKey as refreshTokenSigningKey
} from "./tokens/refreshToken";
import { Request, Response } from "express";
import { SessionErrors, serializeMetaInfo } from "./utils";
import { TypeInputAccessTokenJWTPayload } from "./jwt";
import { setCookie } from "./cookie";

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
    private rTHash: string;

    constructor (userId: string, metaInfo: any, expiresAt: number, rTHash: string) {
        this.userId = userId;
        this.metaInfo = metaInfo;
        this.expiresAt = expiresAt;
        this.rTHash = rTHash;
    }

    getUserId = (): string => {
        return this.userId;
    }

    getMetaInfo = async (): Promise<any> => {
        return this.metaInfo;
    }

    getExpiryTime = (): number => {
        return this.expiresAt;
    }

    updateMetaInfo = async (metaInfo: any) => {
        const connection = await getConnection();
        try {
            await updateMetaInfo(this.rTHash, metaInfo, connection);
            this.metaInfo = metaInfo;
        } catch (err) {
            connection.setDestroyConnection();
            /**
             * @todo
             */
            throw Error()
        } finally {
            connection.closeConnection();
        }
    }
}

export async function getSession (request: Request, response: Response): Promise<Session> {
    const connection = await getConnection();
    try {
        const accessToken = getAccessTokenFromRequest(request);
        if (accessToken === null) {
            throw Error(SessionErrors.noAccessTokenInHeaders);
        }
        let jwtPayload = await verifyTokenAndPayload(accessToken, connection);
        if (jwtPayload.pRTHash !== undefined) {
            let parentRefreshTokenInfo = await getRefreshTokenInfo(jwtPayload.pRTHash, connection);
            if (parentRefreshTokenInfo !== undefined && jwtPayload.userId === parentRefreshTokenInfo.userId) {
                await promoteChildRefreshTokenToMainTable(jwtPayload.rTHash, jwtPayload.pRTHash, connection);
            } else {
                parentRefreshTokenInfo = await getRefreshTokenInfo(jwtPayload.rTHash, connection);
                if (parentRefreshTokenInfo === undefined || parentRefreshTokenInfo.userId !== jwtPayload.userId) {
                    /**
                     * @todo error message
                     */
                    throw Error()
                }
            }
            await updateRefershTokenInHeaders(jwtPayload.rTHash, response);
            jwtPayload = { 
                userId: jwtPayload.userId,
                metaInfo: parentRefreshTokenInfo.metaInfo,
                exp: jwtPayload.exp,
                rTHash: jwtPayload.rTHash
            };
            await updateAccessTokenInHeaders(jwtPayload, response, connection);
        }
        return new Session(jwtPayload.userId, jwtPayload.metaInfo, jwtPayload.exp, jwtPayload.rTHash);
    } catch (err) {
        connection.setDestroyConnection();
        /**
         * @todo error
         */
        throw Error();
    } finally {
        connection.closeConnection();
    }
}

export async function createNewSession(request: Request, response: Response, userId: string, metaInfo: any): Promise<Session> {
    return await newSession(request, response, userId, metaInfo, null);
}

async function newSession (request: Request, response: Response, userId: string, metaInfo: any, parentRefreshToken: string | null): Promise<Session> {
    const connection = await getConnection();
    try {
        metaInfo = serializeMetaInfo(metaInfo);
        const config = Config.get();
        const refreshToken = await getNewRefreshToken(userId, metaInfo, parentRefreshToken, connection);
        const accessTokenExpiry = Date.now() + config.tokens.accessTokens.validity;
        const jwtPayload: TypeInputAccessTokenJWTPayload = {
            userId,
            metaInfo,
            rTHash: refreshToken,
            exp: accessTokenExpiry
        }
        const idRefreshToken = "" // @todo: random string
        await updateAccessTokenInHeaders(jwtPayload, response, connection);
        await updateRefershTokenInHeaders(refreshToken, response);
        setCookie(response, config.cookie.idRefreshTokenCookieKey, idRefreshToken, config.cookie.domain, config.cookie.secure, false, config.tokens.refreshToken.validity, null);
        return new Session(userId, metaInfo, accessTokenExpiry, refreshToken);
    } catch (err) {
        connection.setDestroyConnection();
        /**
         * @todo error
         */
        throw Error();
    } finally {
        connection.closeConnection();
    }
}

export async function refreshSession (request: Request, response: Response) {
    const connection = await getConnection();
    try {
        const refreshToken = getRefreshTokenFromRequest(request);
        if (refreshToken === null) {
            /**
             * @todo Error for refresh token not found in headers
             */
            throw Error();
        }
        const decryptedInfoForRefreshToken = await verifyAndDecryptRefreshToken(refreshToken, connection);
        let parentToken = refreshToken;
        let parentRefreshTokenInfo = await getRefreshTokenInfo(parentToken, connection);
        if (parentRefreshTokenInfo === undefined || decryptedInfoForRefreshToken.userId !== parentRefreshTokenInfo.userId) {
            if (parentRefreshTokenInfo !== undefined) {
                /**
                 * @todo throw Error
                 */
                throw Error();
            }
            if (decryptedInfoForRefreshToken.parentToken !== null) {
                parentRefreshTokenInfo = await getRefreshTokenInfo(decryptedInfoForRefreshToken.parentToken, connection);
                if (parentRefreshTokenInfo === undefined || parentRefreshTokenInfo.userId !== decryptedInfoForRefreshToken.userId) {
                    /**
                     * @todo token theft Error
                     */
                    throw Error();
                }
            } else {
                /**
                 * @todo throw Error
                 */
                throw Error();
            }
        }
        return await newSession(request, response, parentRefreshTokenInfo.userId, parentRefreshTokenInfo.metaInfo, parentToken);
    } catch (err) {
        connection.setDestroyConnection();
        /**
         * @todo error
         */
        throw Error();
    } finally {
        connection.closeConnection();
    }
}