/// <reference types="express" />
import * as express from "express";
/**
 * @description clears all the auth cookies from the response
 */
export declare function clearSessionFromCookie(res: express.Response): void;
export declare function attachAccessTokenToCookie(res: express.Response, token: string, expiry: number): void;
export declare function attachRefreshTokenToCookie(res: express.Response, token: string, expiry: number): void;
export declare function attachIdRefreshTokenToCookie(res: express.Response, token: string, expiry: number): void;
export declare function getAccessTokenFromCookie(req: express.Request): string | undefined;
export declare function getRefreshTokenFromCookie(req: express.Request): string | undefined;
export declare function getIdRefreshTokenFromCookie(req: express.Request): string | undefined;
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
