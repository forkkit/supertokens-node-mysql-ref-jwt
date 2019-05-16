"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
const config = config_1.Config.get();
function errorLogging(err) {
    if (config.logging.error !== undefined) {
        config.logging.error(err);
    }
}
exports.errorLogging = errorLogging;
function infoLogging(info) {
    if (config.logging.info !== undefined) {
        config.logging.info(info);
    }
}
exports.infoLogging = infoLogging;
//# sourceMappingURL=logging.js.map