import { errorLogging } from './helpers/logging';

const ERROR_MAGIC = "ndskajfasndlfkj435234krjdsa";

export function generateError(errType: number, err: any): any {
    if (AuthError.isErrorFromAuth(err)) {
        return err;
    }
    errorLogging(err);
    return {
        errMagic: ERROR_MAGIC,
        errType,
        err
    };
}

export class AuthError {
    static GENERAL_ERROR = 1000;
    static UNAUTHORISED = 2000;
    static TRY_REFRESH_TOKEN = 3000;

    static isErrorFromAuth = (err: any): boolean => {
        return err.errMagic === ERROR_MAGIC;
    }
}