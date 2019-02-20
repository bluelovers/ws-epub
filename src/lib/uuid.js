"use strict";
/**
 * Created by user on 2018/9/8/008.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const getUuidByString = require("uuid-by-string");
const util_1 = require("./util");
function createUUID(input) {
    if (!input) {
        input = util_1.shortid();
    }
    else if (input.title) {
        input = util_1.hashSum([
            // @ts-ignore
            input.title,
            // @ts-ignore
            input.author,
        ]);
    }
    else if (typeof input !== 'string') {
        input = util_1.hashSum(input);
    }
    return getUuidByString(String(input)).toLowerCase();
}
exports.createUUID = createUUID;
exports.default = createUUID;
//# sourceMappingURL=uuid.js.map