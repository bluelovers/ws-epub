"use strict";
/**
 * Created by user on 2019/8/1.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handlePattern = exports.handleOptions = void 0;
const tslib_1 = require("tslib");
const core_1 = tslib_1.__importDefault(require("sort-object-keys2/core"));
function handleOptions(opts, ...argv) {
    let ret = (0, core_1.default)(Object.assign({}, opts, ...argv), {
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