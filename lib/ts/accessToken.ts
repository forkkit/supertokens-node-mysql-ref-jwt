
export async function init() {

}

export function getInfoFromAccessToken(token: string): {
    sessionHandle: string,
    userId: string,
    refreshTokenHash1: string,
    expiryTime: number,
    parentRefreshTokenHash1: string | undefined
} {

}

export function createNewAccessToken(sessionHandle: string, userId: string, refreshTokenHash1: string,
    expiryTime: number, parentRefreshTokenHash1: string | undefined): string {

}

class SigningKey {

}