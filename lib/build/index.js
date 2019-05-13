"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const config_1 = require("./config");
const mysql_1 = require("./mysql");
class Auth {
    constructor() { }
    static init(config) {
        return __awaiter(this, void 0, void 0, function* () {
            config_1.Config.set(config);
            yield mysql_1.Mysql.init();
        });
    }
}
module.exports = Auth;
//# sourceMappingURL=index.js.map