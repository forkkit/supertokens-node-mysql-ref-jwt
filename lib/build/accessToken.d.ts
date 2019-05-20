export declare function init(): Promise<void>;
export declare function getInfoFromAccessToken(token: string): Promise<{
    sessionHandle: string;
    userId: string;
    refreshTokenHash1: string;
    expiryTime: number;
    parentRefreshTokenHash1: string | undefined;
    userPayload: any;
}>;
export declare function createNewAccessToken(sessionHandle: string, userId: string, refreshTokenHash1: string, parentRefreshTokenHash1: string | undefined, userPayload: any): Promise<{
    token: string;
    expiry: number;
}>;
