"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// TODO: to discuss all of these.
exports.SessionErrors = {
    noAccessTokenInHeaders: {
        errCode: 10001,
        message: "no access token found in headers"
    },
    noRefreshTokenInHeaders: {
        errCode: 10002,
        message: "no refresh token found in headers"
    },
    refrehTokenInfoForSessionNotFound: {
        errCode: 10003,
        message: "session expired" //@todo: discuss regarding the message
    },
    dotInPassedUserId: {
        errCode: 10004,
        message: "userId without dots currently not supported"
    },
    invalidRefreshToken: {
        errCode: 10005,
        message: "invalid refresh token"
    }
};
// TODO: have just invalidJWT and jwtExpired
exports.JWTErrors = {
    invalidJWT: {
        errCode: 20001,
        message: "invalid jwt"
    },
    headerMismatch: {
        errCode: 20002,
        message: "jwt header mismatch"
    },
    verificationFailed: {
        errCode: 20003,
        message: "jwt verification failed"
    },
    jwtExpired: {
        errCode: 20004,
        message: "jwt expired"
    },
    invalidPaylaod: {
        errCode: 20005,
        message: "invalid payload"
    }
};
exports.ConfigErrors = {
    configNotSet: {
        errCode: 31001,
        message: "no config set, please use init function at the start"
    },
    mysql: {
        configUndefined: {
            errCode: 32001,
            message: "mysql config not passed. user, password and database are required"
        },
        userNotPassed: {
            errCode: 32002,
            message: "mysql config error. user not passed"
        },
        passwordNotPassed: {
            errCode: 32003,
            message: "mysql config error. password not passed"
        },
        databaseNotPassed: {
            errCode: 32004,
            message: "mysql config error. database not passed"
        }
    },
    tokens: {
        accessToken: {
            signingKey: {
                updateIntervalNotWithinAllowedInterval: {
                    errCode: 33111,
                    message: "update interval passed for updating singingKey for access token is not within allowed interval. (Note: value passed will be in units of hours)"
                },
                valuePassedInGetANotFunction: {
                    errCode: 33112,
                    message: "config > tokens > accessToken > get must be a function"
                }
            },
            validityNotWithinAllowedInterval: {
                errCode: 33121,
                message: "passed value for validity of access token is not within allowed interval. (Note: value passed will be in units of seconds)"
            }
        },
        refreshToken: {
            configUndefined: {
                errCode: 33211,
                message: "refreshToken config not passed. renewTokenURL is required"
            },
            validityNotWithinAllowedInterval: {
                errCode: 33212,
                message: "passed value for validity of refresh token is not within allowed interval. (Note: value passed will be in units of hours)"
            },
            renewTokenURLNotPassed: {
                errCode: 33213,
                message: "renewTokenURL not passed"
            }
        }
    },
    logging: {
        infoFunctionError: {
            errCode: 34001,
            message: "logging config error. info option passed must be a function"
        },
        errorFunctionError: {
            errCode: 34002,
            message: "logging config error. error option passed must be a function"
        }
    },
    cookie: {
        cookieDomainUndefined: {
            errCode: 35001,
            message: "domain parameter for cookie not passed"
        }
    },
    security: {
        onTheftDetectionFunctionError: {
            errCode: 36001,
            message: "onTheftDetection must be a function"
        }
    }
};
// TODO: make this just one MySQL error
exports.MySqlErrors = {
    connectionError: {
        errCode: 40001,
        message: "error in connecting to mysql"
    },
    queryExecutionError: {
        errCode: 40002,
        message: "error during query execution"
    }
};
// TODO: we can get rid of all these?
exports.MiscellaneousErrors = {
    invalidJSON: {
        errCode: 50001,
        message: "invalid JSON. expected JSON Object"
    },
    accessTokenSigningKeyTableNotInitialized: {
        errCode: 50002,
        message: "access token module has not been initialized correctly"
    },
    refreshTokenSigningKeyTableNotInitialized: {
        errCode: 50003,
        message: "refresh token module has not been initialized correctly"
    }
};
//# sourceMappingURL=errors.js.map