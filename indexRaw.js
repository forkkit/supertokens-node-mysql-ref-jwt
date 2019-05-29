"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
exports.__esModule = true;
__export(require("./lib/build/session"));
var error_1 = require("./lib/build/error");
exports.Error = error_1.AuthError;
