"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const cookie_1 = require("./cookie");
const error_1 = require("./error");
const dbQueries_1 = require("./helpers/dbQueries");
const mysql_1 = require("./helpers/mysql");
class Session {
    constructor(sessionHandle, userId, jwtUserPayload, res) {
        this.revokeSession = () => __awaiter(this, void 0, void 0, function* () {
            let connection = yield mysql_1.getConnection();
            try {
                let affectedRows = yield dbQueries_1.deleteSession(connection, this.sessionHandle);
                if (affectedRows === 1) {
                    cookie_1.clearSessionFromCookie(this.res);
                }
            }
            finally {
                connection.closeConnection();
            }
        });
        /**
         * @description: this function reads from the database every time. It provides no locking mechanism in case other processes are updating session data for this session as well.
         */
        this.getSessionData = () => __awaiter(this, void 0, void 0, function* () {
            let connection = yield mysql_1.getConnection();
            try {
                let result = yield dbQueries_1.getSessionData(connection, this.sessionHandle);
                if (!result.found) {
                    throw error_1.generateError(error_1.AuthError.UNAUTHORISED, new Error("session does not exist anymore"));
                }
                else {
                    return result.data;
                }
            }
            finally {
                connection.closeConnection();
            }
        });
        /**
         * @description: It provides no locking mechanism in case other processes are updating session data for this session as well.
         */
        this.updateSessionData = (newSessionData) => __awaiter(this, void 0, void 0, function* () {
            let connection = yield mysql_1.getConnection();
            try {
                yield dbQueries_1.updateSessionData(connection, this.sessionHandle, newSessionData);
            }
            finally {
                connection.closeConnection();
            }
        });
        this.getUserId = () => {
            return this.userId;
        };
        this.getJWTPayload = () => __awaiter(this, void 0, void 0, function* () {
            return this.jwtUserPayload;
        });
        this.sessionHandle = sessionHandle;
        this.userId = userId;
        this.jwtUserPayload = jwtUserPayload;
        this.res = res;
    }
}
exports.Session = Session;
// export async function readSessionDataFromDb(sessionHandle: string): Promise<{
//     userId: string,
//     sessionInfo: { [key: string]: any },
//     refreshTokenHash2: string,
//     expiryTime: number,
// } | undefined> {
// }
// export async function updateSessionDataInDb(sessionHandle: string,
//     sessionInfo: { [key: string]: any }, refreshTokenHash2: string, expiryTime: number) {
// }
// export async function removeSessionDataInDb(sessionHandle: string) {
// } 
//# sourceMappingURL=session.js.map