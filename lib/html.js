"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const html_minifier_1 = require("html-minifier");
function fixHtml(html) {
    return html_minifier_1.minify(html, {
        collapseWhitespace: true,
        preserveLineBreaks: true,
        conservativeCollapse: true,
    });
}
exports.fixHtml = fixHtml;
exports.default = fixHtml;
