/// <reference types="express" />
import * as express from 'express';
/**
 * @description clears all the auth cookies from the response
 */
export declare function clearSessionFromCookie(res: express.Response): void;
export declare function attachAccessTokenToCookie(res: express.Response, token: string, expiry: number): void;
/**
 * @sideEffect also attach id refresh token
 * */
export declare function attachRefreshTokenToCookie(res: express.Response, token: string, expiry: number): void;
/**
 * @description if this returns true, then there is a chance that the session may still be alive
 * because the user may have the refresh token.
 */
export declare function requestHasSessionCookies(req: express.Request): boolean;
/**
 * @throws AuthError TRY_REFRESH_TOKEN
 */
export declare function getAccessTokenFromCookie(req: express.Request): string;
/**
 * @throws AuthError UNAUTHORISED
 */
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
 * @param throws AuthError GENERAL_ERROR
 */
export declare function getCookieValue(req: express.Request, key: string): string | undefined;
