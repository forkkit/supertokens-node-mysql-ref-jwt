"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionErrors = {
    noAccessTokenInHeaders: {
        errCode: 10001,
        errMessage: "no access token found in headers"
    },
    noRefreshTokenInHeaders: {
        errCode: 10002,
        errMessage: "no refresh token found in headers"
    },
    refrehTokenInfoForSessionNotFound: {
        errCode: 10003,
        errMessage: "session expired" //@todo: discuss regarding the message
    },
    dotInPassedUserId: {
        errCode: 10004,
        errMessage: "userId without dots currently not supported"
    },
    invalidRefreshToken: {
        errCode: 10005,
        errMessage: "invalid refresh token"
    }
};
exports.JWTErrors = {
    invalidJWT: {
        errCode: 20001,
        errMessage: "invalid jwt"
    },
    headerMismatch: {
        errCode: 20001,
        errMessage: "jwt header mismatch"
    },
    verificationFailed: {
        errCode: 20001,
        errMessage: "jwt verification failed"
    },
    jwtExpired: {
        errCode: 20001,
        errMessage: "jwt expired"
    },
    invalidPaylaod: {
        errCode: 20001,
        errMessage: "invalid payload"
    }
};
exports.ConfigErrors = {
    configNotSet: {
        errCode: 31001,
        errMessage: "no config set, please use init function at the start"
    },
    mysql: {
        configUndefined: {
            errCode: 32001,
            errMessage: "mysql config not passed. user, password and database are required"
        },
        userNotPassed: {
            errCode: 32002,
            errMessage: "mysql config error. user not passed"
        },
        passwordNotPassed: {
            errCode: 32003,
            errMessage: "mysql config error. password not passed"
        },
        databaseNotPassed: {
            errCode: 32004,
            errMessage: "mysql config error. database not passed"
        }
    },
    tokens: {
        accessToken: {
            signingKey: {
                updateIntervalNotWithinAllowedInterval: {
                    errCode: 33111,
                    errMessage: "update interval passed for updating singingKey for access token is not within allowed interval. (Note: value passed will be in units of hours)"
                },
                valuePassedInGetANotFunction: {
                    errCode: 33112,
                    errMessage: "config > tokens > accessToken > get must be a function"
                }
            },
            validityNotWithinAllowedInterval: {
                errCode: 33121,
                errMessage: "passed value for validity of access token is not within allowed interval. (Note: value passed will be in units of seconds)"
            }
        },
        refreshToken: {
            configUndefined: {
                errCode: 33211,
                errMessage: "refreshToken config not passed. renewTokenURL is required"
            },
            validityNotWithinAllowedInterval: {
                errCode: 33212,
                errMessage: "passed value for validity of refresh token is not within allowed interval. (Note: value passed will be in units of hours)"
            },
            renewTokenURLNotPassed: {
                errCode: 33213,
                errMessage: "renewTokenURL not passed"
            }
        }
    },
    logging: {
        infoFunctionError: {
            errCode: 34001,
            errMessage: "logging config error. info option passed must be a function"
        },
        errorFunctionError: {
            errCode: 34002,
            errMessage: "logging config error. error option passed must be a function"
        }
    },
    cookie: {
        cookieDomainUndefined: {
            errCode: 35001,
            errMessage: "domain parameter for cookie not passed"
        }
    },
    security: {
        onTheftDetectionFunctionError: {
            errCode: 36001,
            errMessage: "onTheftDetection must be a function"
        }
    }
};
exports.MySqlErrors = {
    connectionError: {
        errCode: 40001,
        errMessage: "error in connecting to mysql"
    }
};
exports.MiscellaneousErrors = {
    invalidJSON: {
        errCode: 50001,
        errMessage: "invalid JSON. expected JSON Object"
    }
};
//# sourceMappingURL=errors.js.map