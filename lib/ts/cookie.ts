import { Request, Response, CookieOptions } from "express";

export function getCookieValue(req: Request, key: string): string | undefined {
    return req.cookies[key];
}

export function setCookie(res: Response, key: string, value: string, domain: string, secure: boolean, httpOnly: boolean, maxAge: number, path: string | null) {
    if (path === null) {
        path = "/";
    }
    let cookieOptions: CookieOptions = {domain,
        secure,
        httpOnly,
        maxAge,
        path
    };
    res.cookie(key, value, cookieOptions);
}