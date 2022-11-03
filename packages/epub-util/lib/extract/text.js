"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fixText = void 0;
const tslib_1 = require("tslib");
const lib_1 = tslib_1.__importStar(require("zero-width/lib"));
const crlf_normalize_1 = require("crlf-normalize");
function fixText(text) {
    return (0, crlf_normalize_1.crlf)((0, lib_1.default)((0, lib_1.nbspToSpace)(text)))
        .replace(/^\n{2,}|\n{2,}$/g, '\n');
}
exports.fixText = fixText;
exports.default = fixText;
//# sourceMappingURL=text.js.map