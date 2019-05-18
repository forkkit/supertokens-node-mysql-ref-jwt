
export async function init() {

}

export function getInfoFromRefreshToken(token: string): {
    sessionHandle: string,
    userId: string,
    parentRefreshTokenHash1: string | undefined
} {

}

export function createNewRefreshToken(sessionHandle: string, userId: string,
    parentRefreshTokenHash1: string | undefined): string {

}

class SigningKey {

}