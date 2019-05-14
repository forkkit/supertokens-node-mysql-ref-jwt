import {
    createHmac
} from "crypto";
import {
    getAccessTokenSigningKey
} from "./tokens/accessToken";
import {
    JWTErrors,
    sanitizeNumberInput,
    sanitizeStringInput,
    sanitizeBooleanInput,
    checkIfStringIsJSONObj
} from "./utils";

const algorithm = "sha256";
const header = Buffer.from(JSON.stringify({
    alg: "HS256",
    typ:"JWT"
})).toString("base64");

type TypeInputAccessTokenJWTPayload = {
    exp: number,
    userId: string,
    metaInfo: string,
    rTHash: string,
    pRTHash: string | undefined
};

export type TypeAccessTokenJWTPayload = {
    exp: number,
    userId: string,
    metaInfo: any,
    rTHash: string
    pRTHash: string | undefined
};

export async function createNewAccessTokenJWT(jsonPayload: TypeInputAccessTokenJWTPayload): Promise<string> {
    const signingKey = await getAccessTokenSigningKey();
    const payload = Buffer.from(JSON.stringify(jsonPayload)).toString("base64");
    const hashFunction = createHmac(algorithm, signingKey);
    const signature = hashFunction.update(`${header}.${payload}`).digest("hex");
    return `${header}.${payload}.${signature}`;
}

// @todo think if you want to change the name of the function
export async function verifyAccessTokenJWTAndGetPayload(token: string): Promise<TypeAccessTokenJWTPayload> {
    const splittedInput = token.split(".");
    if (splittedInput.length !== 3) {
        throw Error(JWTErrors.invalidJWT);
    }
    if (splittedInput[0] !== header) {
        throw Error(JWTErrors.headerMismatch);
    }
    const payload = splittedInput[1];
    const signature = splittedInput[2];
    const signingKey = await getAccessTokenSigningKey();
    const hashFunction = createHmac(algorithm, signingKey);
    const signatureFromHeaderAndPayload = hashFunction.update(`${header}.${payload}`).digest("hex");
    if (signatureFromHeaderAndPayload !== signature) {
        throw Error(JWTErrors.verificationFailed);
    }
    if (!checkIfStringIsJSONObj(payload)) { // NOTE: if somebody gets the signing key, they can potentially manipulate the payload to be a non json, which might lead to unknown behavior.
        throw Error(JWTErrors.invalidPaylaod);
    }
    const jsonPayload = validateAccessTokenPayload(JSON.parse(payload));
    if (jsonPayload.exp < Date.now()) {
        throw Error(JWTErrors.jwtExpired);
    }
    return jsonPayload;
}

function validateAccessTokenPayload(payload: any): TypeAccessTokenJWTPayload {
    const exp = sanitizeNumberInput(payload.exp);
    const userId = sanitizeStringInput(payload.userId);
    const metaInfo = sanitizeStringInput(payload.metaInfo);
    const rTHash = sanitizeStringInput(payload.rTHash);
    const pRTHash = sanitizeStringInput(payload.pRTHash);
    if (exp === undefined || userId === undefined || metaInfo === undefined || !checkIfStringIsJSONObj(metaInfo) || rTHash === undefined) {
        throw Error(JWTErrors.invalidPaylaod);
    }
    return {
        exp,
        userId,
        metaInfo: JSON.parse(metaInfo),
        rTHash,
        pRTHash
    }
}