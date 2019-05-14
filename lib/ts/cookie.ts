import { Request } from "express";

export function getCookieValue(req: Request, key: string): string | undefined {
    return req.cookies[key];
}