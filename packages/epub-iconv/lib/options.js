"use strict";
/**
 * Created by user on 2019/8/1.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handlePattern = exports.handleOptions = void 0;
const core_1 = __importDefault(require("sort-object-keys2/core"));
function handleOptions(opts, ...argv) {
    let ret = core_1.default(Object.assign({}, opts, ...argv), {
        keys: [
            'cwd',
            'output',
            'iconv',
        ]
    });
    if (ret.iconv != 'cn') {
        ret.iconv = 'tw';
    }
    return ret;
}
exports.handleOptions = handleOptions;
function handlePattern(pattern) {
    if (!Array.isArray(pattern)) {
        pattern = [pattern];
    }
    return pattern
        .filter(v => v)
        .map(v => v.replace(/\\/g, '/'));
}
exports.handlePattern = handlePattern;
//# sourceMappingURL=options.js.map