import { Request, Response } from 'express';

import { Config, TypeInputConfig } from './config';
import { setCookie } from './cookie';
import { getConnection, Mysql } from './db/mysql';
import { TypeInputAccessTokenPayload } from './jwt';
import {
    getAccessTokenFromRequest,
    SigningKey as accessTokenSigningKey,
    updateAccessTokenInHeaders,
    verifyTokenAndGetPayload,
} from './tokens/accessToken';
import {
    updateMetaInfo,
    getNewRefreshToken,
    getRefreshTokenInfo,
    getRefreshTokenFromRequest,
    updateRefershTokenInHeaders,
    verifyAndDecryptRefreshToken,
    promoteChildRefreshTokenToMainTable,
    SigningKey as refreshTokenSigningKey,
    checkIfSessionIdExistsAndNotifyForTokenTheft
} from './tokens/refreshToken';
import {
    hash,
    SessionErrors,
    serializeMetaInfo,
    checkUserIdContainsNoDot,
    generate32CharactersRandomString
} from './utils';


export async function init(config: TypeInputConfig) {
    Config.set(config);
    await Mysql.init();
    accessTokenSigningKey.init();
    refreshTokenSigningKey.init();
}

class Session {
    private userId: string;
    private metaInfo: any;
    private expiresAt: number;
    private rTHash: string;

    constructor(userId: string, metaInfo: any, expiresAt: number, rTHash: string) {
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
        const mysqlConnection = await getConnection();
        try {
            await updateMetaInfo(this.rTHash, metaInfo, mysqlConnection);
            this.metaInfo = metaInfo;
        } catch (err) {
            mysqlConnection.setDestroyConnection();
            /**
             * @todo
             */
            throw Error()
        } finally {
            mysqlConnection.closeConnection();
        }
    }
}

export async function getSession(request: Request, response: Response): Promise<Session> {
    const mysqlConnection = await getConnection();
    try {
        const accessToken = getAccessTokenFromRequest(request);
        if (accessToken === null) {
            throw Error(SessionErrors.noAccessTokenInHeaders);
        }
        let jwtPayload = await verifyTokenAndGetPayload(accessToken, mysqlConnection);
        if (jwtPayload.pRTHash !== undefined) {
            let parentRefreshTokenInfo = await getRefreshTokenInfo(jwtPayload.pRTHash, mysqlConnection);
            if (parentRefreshTokenInfo !== undefined && jwtPayload.userId === parentRefreshTokenInfo.userId) {
                await promoteChildRefreshTokenToMainTable(jwtPayload.rTHash, jwtPayload.pRTHash, mysqlConnection);
            } else {
                parentRefreshTokenInfo = await getRefreshTokenInfo(jwtPayload.rTHash, mysqlConnection);
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
            await updateAccessTokenInHeaders(jwtPayload, response, mysqlConnection);
        }
        return new Session(jwtPayload.userId, jwtPayload.metaInfo, jwtPayload.exp, jwtPayload.rTHash);
    } catch (err) {
        mysqlConnection.setDestroyConnection();
        /**
         * @todo error
         */
        throw Error();
    } finally {
        mysqlConnection.closeConnection();
    }
}

export async function createNewSession(request: Request, response: Response, userId: string, metaInfo: any): Promise<Session> {
    if (!checkUserIdContainsNoDot(userId)) {
        /**
         * @todo
         */
        throw Error();
    }
    return await newSession(request, response, userId, metaInfo, null, null);
}

async function newSession(request: Request, response: Response, userId: string, metaInfo: any, parentRefreshToken: string | null, sessionId: string | null): Promise<Session> {
    const mysqlConnection = await getConnection();
    try {
        metaInfo = serializeMetaInfo(metaInfo);
        const config = Config.get();
        const refreshToken = await getNewRefreshToken(userId, metaInfo, parentRefreshToken, sessionId, mysqlConnection);
        const accessTokenExpiry = Date.now() + config.tokens.accessTokens.validity;
        const jwtPayload: TypeInputAccessTokenPayload = {
            userId,
            metaInfo,
            rTHash: hash(refreshToken),
            exp: accessTokenExpiry
        }
        const idRefreshToken = generate32CharactersRandomString();
        await updateAccessTokenInHeaders(jwtPayload, response, mysqlConnection);
        await updateRefershTokenInHeaders(refreshToken, response);
        setCookie(response, config.cookie.idRefreshTokenCookieKey, idRefreshToken, config.cookie.domain, false, false, config.tokens.refreshToken.validity, config.tokens.refreshToken.renewTokenURL);
        return new Session(userId, metaInfo, accessTokenExpiry, refreshToken);
    } catch (err) {
        mysqlConnection.setDestroyConnection();
        /**
         * @todo error
         */
        throw Error();
    } finally {
        mysqlConnection.closeConnection();
    }
}

export async function refreshSession(request: Request, response: Response) {
    const mysqlConnection = await getConnection();
    try {
        const refreshToken = getRefreshTokenFromRequest(request);
        if (refreshToken === null) {
            /**
             * @todo Error for refresh token not found in headers
             */
            throw Error();
        }
        const decryptedInfoForRefreshToken = await verifyAndDecryptRefreshToken(refreshToken, mysqlConnection);
        let parentToken = hash(refreshToken);
        let parentRefreshTokenInfo = await getRefreshTokenInfo(parentToken, mysqlConnection);
        if (parentRefreshTokenInfo === undefined || decryptedInfoForRefreshToken.userId !== parentRefreshTokenInfo.userId || hash(decryptedInfoForRefreshToken.sessionId) !== parentRefreshTokenInfo.sessionId) {
            if (parentRefreshTokenInfo !== undefined) {
                // NOTE: this part will never really be called. this is just precaution
                /**
                 * i.e. userId mismatch OR sessionId mismatch
                 * @todo throw Error
                 */
                throw Error();
            }
            if (decryptedInfoForRefreshToken.parentToken !== null) {
                parentRefreshTokenInfo = await getRefreshTokenInfo(decryptedInfoForRefreshToken.parentToken, mysqlConnection);
                if (parentRefreshTokenInfo === undefined || parentRefreshTokenInfo.userId !== decryptedInfoForRefreshToken.userId) {
                    await checkIfSessionIdExistsAndNotifyForTokenTheft(mysqlConnection, hash(decryptedInfoForRefreshToken.sessionId));
                    /**
                     * @todo
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
        return await newSession(request, response, parentRefreshTokenInfo.userId, parentRefreshTokenInfo.metaInfo, parentToken, parentRefreshTokenInfo.sessionId);
    } catch (err) {
        mysqlConnection.setDestroyConnection();
        /**
         * @todo error
         */
        throw Error();
    } finally {
        mysqlConnection.closeConnection();
    }
}