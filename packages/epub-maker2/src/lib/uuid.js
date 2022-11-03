"use strict";
/**
 * Created by user on 2018/9/8/008.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUUID = void 0;
const tslib_1 = require("tslib");
const uuid_by_string_1 = tslib_1.__importDefault(require("uuid-by-string"));
const util_1 = require("./util");
function createUUID(input) {
    if (!input) {
        input = (0, util_1.shortid)();
    }
    else if (input.title) {
        input = (0, util_1.hashSum)([
            // @ts-ignore
            input.title,
            // @ts-ignore
            input.author,
        ]);
    }
    else if (typeof input !== 'string') {
        input = (0, util_1.hashSum)(input);
    }
    return (0, uuid_by_string_1.default)(String(input)).toLowerCase();
}
exports.createUUID = createUUID;
exports.default = createUUID;
//# sourceMappingURL=uuid.js.map