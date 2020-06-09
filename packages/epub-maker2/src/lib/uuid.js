"use strict";
/**
 * Created by user on 2018/9/8/008.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUUID = void 0;
const uuid_by_string_1 = __importDefault(require("uuid-by-string"));
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
    return uuid_by_string_1.default(String(input)).toLowerCase();
}
exports.createUUID = createUUID;
exports.default = createUUID;
//# sourceMappingURL=uuid.js.map