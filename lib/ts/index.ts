import { Request, Response } from 'express';

import { Cronjob } from "./cronjobs";
import { setCookie } from './helpers/cookie';
import { getConnection, Mysql } from './db/mysql';
import { Config, TypeInputConfig } from './config';
import { SessionErrors } from "./helpers/errors";
import { TypeInputAccessTokenPayload } from './helpers/jwt';
import {
    verifyTokenAndGetPayload,
    getAccessTokenFromRequest,
    updateAccessTokenInHeaders,
    SigningKey as accessTokenSigningKey
} from './tokens/accessToken';
import {
    updateMetaInfo,
    getNewRefreshToken,
    getRefreshTokenInfo,
    getRefreshTokenFromRequest,
    updateRefershTokenInHeaders,
    verifyAndDecryptRefreshToken,
    removeAllRefreshTokensForUserId,
    promoteChildRefreshTokenToMainTable,
    SigningKey as refreshTokenSigningKey,
    checkIfSessionIdExistsAndNotifyForTokenTheft
} from './tokens/refreshToken';
import {
    hash,
    TypeMetaInfo,
    validateJSONObj,
    checkUserIdContainsNoDot,
    generate32CharactersRandomString
} from './helpers/utils';

export async function init(config: TypeInputConfig) {
    Config.set(config);
    await Mysql.init();
    accessTokenSigningKey.init();
    refreshTokenSigningKey.init();
    Cronjob.init();
}

class Session {
    private userId: string;
    private metaInfo: TypeMetaInfo | undefined;
    private expiresAt: number;
    private rTHash: string;

    constructor(userId: string, expiresAt: number, rTHash: string, metaInfo?: TypeMetaInfo) {
        this.userId = userId;
        this.metaInfo = metaInfo;
        this.expiresAt = expiresAt;
        this.rTHash = rTHash;
    }

    getUserId = (): string => {
        return this.userId;
    }

    getMetaInfo = async (): Promise<TypeMetaInfo> => {
        if (this.metaInfo !== undefined) {
            return this.metaInfo;
        }
        const mysqlConnection = await getConnection();
        try {
            const refreshTokenInfo = await getRefreshTokenInfo(this.rTHash, mysqlConnection);
            if (refreshTokenInfo === undefined) {
                throw SessionErrors.refrehTokenInfoForSessionNotFound;
            }
            return refreshTokenInfo.metaInfo;
        } catch (err) {
            mysqlConnection.setDestroyConnection();
            throw err;
        } finally {
            mysqlConnection.closeConnection();
        }
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
            throw err;
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
            throw SessionErrors.noAccessTokenInHeaders;
        }
        let jwtPayload = await verifyTokenAndGetPayload(accessToken, mysqlConnection);
        if (jwtPayload.pRTHash !== undefined) {
            let parentRefreshTokenInfo = await getRefreshTokenInfo(jwtPayload.pRTHash, mysqlConnection);
            if (parentRefreshTokenInfo !== undefined && jwtPayload.userId === parentRefreshTokenInfo.userId) {
                await promoteChildRefreshTokenToMainTable(jwtPayload.rTHash, jwtPayload.pRTHash, mysqlConnection);
            } else {
                parentRefreshTokenInfo = await getRefreshTokenInfo(jwtPayload.rTHash, mysqlConnection);
                if (parentRefreshTokenInfo === undefined || parentRefreshTokenInfo.userId !== jwtPayload.userId) {
                    throw SessionErrors.refrehTokenInfoForSessionNotFound;
                }
            }
            await updateRefershTokenInHeaders(jwtPayload.rTHash, response);
            jwtPayload = {
                userId: jwtPayload.userId,
                exp: jwtPayload.exp,
                rTHash: jwtPayload.rTHash
            };
            await updateAccessTokenInHeaders(jwtPayload, response, mysqlConnection);
        }
        return new Session(jwtPayload.userId, jwtPayload.exp, jwtPayload.rTHash);
    } catch (err) {
        mysqlConnection.setDestroyConnection();
        throw err;
    } finally {
        mysqlConnection.closeConnection();
    }
}

export async function createNewSession(request: Request, response: Response, userId: string, metaInfo?: TypeMetaInfo): Promise<Session> {
    if (!checkUserIdContainsNoDot(userId)) {
        throw SessionErrors.dotInPassedUserId;
    }
    return await newSession(request, response, userId, null, null, metaInfo);
}

async function newSession(request: Request, response: Response, userId: string, parentRefreshToken: string | null, sessionId: string | null, metaInfo?: TypeMetaInfo): Promise<Session> {
    const mysqlConnection = await getConnection();
    try {
        const serializedMetaInfo = validateJSONObj(metaInfo);
        const config = Config.get();
        const refreshToken = await getNewRefreshToken(userId, serializedMetaInfo, parentRefreshToken, sessionId, mysqlConnection);
        const accessTokenExpiry = Date.now() + config.tokens.accessToken.validity;
        let jwtPayload: TypeInputAccessTokenPayload = {
            userId,
            rTHash: hash(refreshToken),
            exp: accessTokenExpiry
        }
        if (parentRefreshToken !== null) {
            jwtPayload.pRTHash = hash(parentRefreshToken);
        }
        const idRefreshToken = generate32CharactersRandomString();
        await updateAccessTokenInHeaders(jwtPayload, response, mysqlConnection);
        await updateRefershTokenInHeaders(refreshToken, response);
        setCookie(response, config.cookie.idRefreshTokenCookieKey, idRefreshToken, config.cookie.domain, false, false, config.tokens.refreshToken.validity, null);
        return new Session(userId, accessTokenExpiry, refreshToken, serializedMetaInfo);
    } catch (err) {
        mysqlConnection.setDestroyConnection();
        throw err;
    } finally {
        mysqlConnection.closeConnection();
    }
}

export async function refreshSession(request: Request, response: Response) {
    const mysqlConnection = await getConnection();
    try {
        const refreshToken = getRefreshTokenFromRequest(request);
        if (refreshToken === null) {
            throw SessionErrors.noRefreshTokenInHeaders;
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
                    await checkIfSessionIdExistsAndNotifyForTokenTheft(hash(decryptedInfoForRefreshToken.sessionId), mysqlConnection);
                    /**
                     * @todo
                     */
                    throw Error();
                }
                await promoteChildRefreshTokenToMainTable(parentToken, decryptedInfoForRefreshToken.parentToken, mysqlConnection);
            } else {
                throw SessionErrors.invalidRefreshToken;
            }
        }
        return await newSession(request, response, parentRefreshTokenInfo.userId, parentToken, parentRefreshTokenInfo.sessionId, parentRefreshTokenInfo.metaInfo);
    } catch (err) {
        mysqlConnection.setDestroyConnection();
        throw err;
    } finally {
        mysqlConnection.closeConnection();
    }
}

export async function revokeAllRefreshTokenForUser(userId: string) {
    const mysqlConnection = await getConnection();
    try {
        await removeAllRefreshTokensForUserId(userId, mysqlConnection);
    } catch (err) {
        mysqlConnection.setDestroyConnection();
        throw err;
    } finally {
        mysqlConnection.closeConnection();
    }
}