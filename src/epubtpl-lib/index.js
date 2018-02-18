"use strict";
/**
 * Created by user on 2017/12/15/015.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const js_beautify_1 = require("js-beautify");
function formatHTML(htmlstr, skipFormatting) {
    /*jslint camelcase:false*/
    return (skipFormatting || typeof js_beautify_1.html_beautify === 'undefined') ? htmlstr : js_beautify_1.html_beautify(htmlstr, {
        'end_with_newline': false,
        'indent_char': '\t',
        'indent_inner_html': true,
        'indent_size': '1',
        'preserve_newlines': false,
        'wrap_line_length': '0',
        'unformatted': [],
        'selector_separator_newline': false,
        'newline_between_rules': true
    });
    /*jslint camelcase:true*/
}
exports.formatHTML = formatHTML;
const self = require("./index");
exports.default = self;
