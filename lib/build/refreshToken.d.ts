export declare function init(): Promise<void>;
export declare function getInfoFromRefreshToken(token: string): Promise<{
    sessionHandle: string;
    userId: string;
    parentRefreshTokenHash1: string | undefined;
}>;
export declare function createNewRefreshToken(sessionHandle: string, userId: string, parentRefreshTokenHash1: string | undefined): Promise<{
    token: string;
    expiry: number;
}>;
