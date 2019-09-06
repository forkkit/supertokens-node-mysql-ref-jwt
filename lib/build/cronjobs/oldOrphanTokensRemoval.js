"use strict";
var __awaiter =
    (this && this.__awaiter) ||
    function(thisArg, _arguments, P, generator) {
        return new (P || (P = Promise))(function(resolve, reject) {
            function fulfilled(value) {
                try {
                    step(generator.next(value));
                } catch (e) {
                    reject(e);
                }
            }
            function rejected(value) {
                try {
                    step(generator["throw"](value));
                } catch (e) {
                    reject(e);
                }
            }
            function step(result) {
                result.done
                    ? resolve(result.value)
                    : new P(function(resolve) {
                          resolve(result.value);
                      }).then(fulfilled, rejected);
            }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
Object.defineProperty(exports, "__esModule", { value: true });
const dbQueries_1 = require("../helpers/dbQueries");
function oldOrphanTokensRemoval() {
    return __awaiter(this, void 0, void 0, function*() {
        let oneDay = 1000 * 60 * 60 * 24;
        let now = Date.now();
        let createdBefore = now - 7 * oneDay;
        yield dbQueries_1.removeOldOrphanTokens(createdBefore);
    });
}
exports.default = oldOrphanTokensRemoval;
//# sourceMappingURL=oldOrphanTokensRemoval.js.map
