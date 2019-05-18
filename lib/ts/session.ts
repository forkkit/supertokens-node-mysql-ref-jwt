export class Session {

}

export async function readSessionDataFromDb(sessionHandle: string): Promise<{
    userId: string,
    sessionInfo: { [key: string]: any },
    refreshTokenHash2: string,
    expiryTime: number,
} | undefined> {

}

export async function updateSessionDataInDb(sessionHandle: string,
    sessionInfo: { [key: string]: any }, refreshTokenHash2: string, expiryTime: number) {

}

export async function removeSessionDataInDb(sessionHandle: string) {

}