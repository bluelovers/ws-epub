"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fixHtml2 = exports.fixHtml = void 0;
const html_minifier_1 = require("html-minifier");
const crlf_normalize_1 = require("crlf-normalize");
function fixHtml(html) {
    let options = {
        collapseWhitespace: true,
        preserveLineBreaks: true,
        conservativeCollapse: true,
        caseSensitive: true,
    };
    return html_minifier_1.minify(html_minifier_1.minify(crlf_normalize_1.crlf(html), options)
        .replace(/(?<=<br\/?>)(?!\s*[\r\n])/ig, '\n')
        .replace(/(?<=<\/p>)(?!\s*[\r\n])/ig, '\n'), options);
}
exports.fixHtml = fixHtml;
function fixHtml2(html) {
    try {
        return fixHtml(html);
    }
    catch (e) {
        console.warn(e.message);
    }
    return html;
}
exports.fixHtml2 = fixHtml2;
exports.default = fixHtml;
//# sourceMappingURL=html.js.map