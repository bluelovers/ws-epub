"use strict";
/**
 * Created by user on 2017/12/15/015.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const js_beautify_1 = require("js-beautify");
const html_minifier_1 = require("html-minifier");
function formatHTML(htmlstr, skipFormatting) {
    if (skipFormatting || typeof js_beautify_1.html_beautify === 'undefined') {
        return htmlstr;
    }
    return htmlminify(htmlstr)
        //.replace(/<item id="" href="image\/" media-type="" \/>/ig, '')
        .replace(/^\n+|\n+$/, '\n');
}
exports.formatHTML = formatHTML;
function htmlminify(html, options = {}) {
    options = Object.assign({
        collapseWhitespace: true,
        preserveLineBreaks: true,
        conservativeCollapse: true,
        caseSensitive: true,
        keepClosingSlash: true,
        ignoreCustomFragments: [
            /\<\/[ \t]*meta\>/i,
        ],
    }, options);
    try {
        let ret = html_minifier_1.minify(html, options);
        return ret;
    }
    catch (e) {
        try {
            let ret = js_beautify_1.html_beautify(html, {
                end_with_newline: true,
                indent_char: '',
                indent_inner_html: false,
                indent_size: 0,
                indent_level: 0,
                max_preserve_newlines: 1,
                preserve_newlines: true,
                wrap_line_length: 0,
                unformatted: [],
                selector_separator_newline: false,
                newline_between_rules: true
            });
            return ret;
        }
        catch (e) {
            console.error(e);
        }
    }
    return html;
}
exports.htmlminify = htmlminify;
const self = require("./index");
exports.default = self;
//# sourceMappingURL=index.js.map