"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (!exports.hasOwnProperty(p)) __createBinding(exports, m, p);
}
Object.defineProperty(exports, "__esModule", { value: true });
exports._convertHtmlTag001 = exports._replaceHtmlTag = exports._fixRubyInnerContext = void 0;
__exportStar(require("@node-novel/parse-txt-tag/lib/tags"), exports);
const util_1 = require("@node-novel/parse-txt-tag/lib/util");
Object.defineProperty(exports, "_fixRubyInnerContext", { enumerable: true, get: function () { return util_1._fixRubyInnerContext; } });
Object.defineProperty(exports, "_replaceHtmlTag", { enumerable: true, get: function () { return util_1._replaceHtmlTag; } });
Object.defineProperty(exports, "_convertHtmlTag001", { enumerable: true, get: function () { return util_1._convertHtmlTag001; } });
//# sourceMappingURL=tags.js.map