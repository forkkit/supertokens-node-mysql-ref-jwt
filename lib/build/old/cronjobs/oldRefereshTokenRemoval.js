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
const mysql_1 = require("../db/mysql");
const tokens_1 = require("../db/tokens");
/**
 * @function
 */
function oldRefreshTokenRemoval() {
    return __awaiter(this, void 0, void 0, function* () {
        const mysqlConnection = yield mysql_1.getConnection();
        try {
            yield tokens_1.deleteAllExpiredRefreshTokens(mysqlConnection);
        }
        catch (err) {
            mysqlConnection.setDestroyConnection();
        }
        finally {
            mysqlConnection.closeConnection();
        }
    });
}
exports.default = oldRefreshTokenRemoval;
//# sourceMappingURL=oldRefereshTokenRemoval.js.map