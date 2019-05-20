import * as express from 'express';
export declare function clearSessionFromCookie(res: express.Response): void;
export declare function attachAccessTokenToCookie(res: express.Response, token: string, expiry: number): void;
export declare function attachRefreshTokenToCookie(res: express.Response, token: string, expiry: number): void;
export declare function requestHasSessionCookies(req: express.Request): boolean;
export declare function getAccessTokenFromCookie(req: express.Request): string;
export declare function getRefreshTokenFromCookie(req: express.Request): string;
/**
 * @param res
 * @param key
 * @param value
 * @param domain
 * @param secure
 * @param httpOnly
 * @param maxAge
 * @param path
 */
export declare function setCookie(res: express.Response, key: string, value: string, domain: string, secure: boolean, httpOnly: boolean, expires: number, path: string | undefined): void;
/**
 *
 * @param req
 * @param key
 */
export declare function getCookieValue(req: express.Request, key: string): string | undefined;
