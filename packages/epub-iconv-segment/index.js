"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleGlobSegment = void 0;
/**
 * Created by user on 2019/9/1.
 */
const lib_1 = require("epub-iconv/lib");
const novel_segment_cli_1 = require("novel-segment-cli");
const min_1 = require("@lazy-cjk/zh-convert/min");
async function stringifySegment(input) {
    return novel_segment_cli_1.stringify(await novel_segment_cli_1.textSegment(input));
}
function handleGlobSegment(pattern, options) {
    return lib_1.handleGlob(pattern, {
        ...options,
        iconvFn: {
            async tw(input) {
                return stringifySegment(input).then(v => min_1.cn2tw_min(v, {
                    safe: false
                }));
            },
            async cn(input) {
                return stringifySegment(input).then(v => min_1.tw2cn_min(v));
            },
        }
    });
}
exports.handleGlobSegment = handleGlobSegment;
exports.default = handleGlobSegment;
//# sourceMappingURL=index.js.map