import * as express from 'express';

export function clearSessionFromCookie(res: express.Response) {

}

export function attachAccessTokenToCookie(res: express.Response, token: string) {

}

// also attach id refresh token
export function attachRefreshTokenToCookie(res: express.Response, token: string) {

}

export function doesRequestHaveSessionCookies(req: express.Request): boolean {

}

export function getAccessTokenFromCookie(req: express.Request): string {

}

export function getRefreshTokenFromCookie(req: express.Request): string {

}

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
export function setCookie(res: express.Response, key: string, value: string, domain: string, secure: boolean, httpOnly: boolean, maxAge: number, path: string | undefined) {
    if (path === undefined) {
        path = "/";
    }
    let cookieOptions: express.CookieOptions = {
        domain,
        secure,
        httpOnly,
        maxAge,
        path
    };
    res.cookie(key, value, cookieOptions);
}

/**
 * 
 * @param req 
 * @param key 
 */
export function getCookieValue(req: express.Request, key: string): string | undefined {
    return req.cookies[key];
}