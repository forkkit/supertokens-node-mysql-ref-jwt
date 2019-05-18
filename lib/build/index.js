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
const accessToken_1 = require("./accessToken");
const config_1 = require("./config");
const mysql_1 = require("./helpers/mysql");
const refreshToken_1 = require("./refreshToken");
function init(config) {
    return __awaiter(this, void 0, void 0, function* () {
        config_1.default.init(config);
        yield mysql_1.Mysql.init();
        yield accessToken_1.init();
        yield refreshToken_1.init();
    });
}
exports.init = init;
function login(res, userId, jwtPayload, sessionData) {
    return __awaiter(this, void 0, void 0, function* () {
    });
}
exports.login = login;
function getSession(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
    });
}
exports.getSession = getSession;
function refreshSession(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
    });
}
exports.refreshSession = refreshSession;
function revokeAllSessionsForUser(userId) {
    return __awaiter(this, void 0, void 0, function* () {
    });
}
exports.revokeAllSessionsForUser = revokeAllSessionsForUser;
function revokeSessionUsingSessionHandle(sessionHandle) {
    return __awaiter(this, void 0, void 0, function* () {
    });
}
exports.revokeSessionUsingSessionHandle = revokeSessionUsingSessionHandle;
//# sourceMappingURL=index.js.map