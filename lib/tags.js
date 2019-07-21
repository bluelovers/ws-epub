"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const regexp_cjk_1 = require("regexp-cjk");
const regexp_cjk_plugin_extra_1 = require("regexp-cjk-plugin-extra");
const log_1 = require("./log");
const str_util_1 = require("str-util");
const zhRegExp = regexp_cjk_1.default.use({
    on: [
        regexp_cjk_plugin_extra_1.default({
            autoFullHaif: true,
        })
    ],
});
exports.allowedHtmlTagList = [
    's',
    'ruby',
    'i',
    'b',
    'sup',
    'sub',
];
var EnumHtmlTag;
(function (EnumHtmlTag) {
    EnumHtmlTag["OPEN"] = "&lt;|\\u003C|\uFF1C";
    EnumHtmlTag["CLOSE"] = "&gt;|\\u003E|\uFF1E";
})(EnumHtmlTag = exports.EnumHtmlTag || (exports.EnumHtmlTag = {}));
exports.reTxtImgTag = new zhRegExp(`[(（](?:插圖|圖片|插畫|画像|圖像)([a-z0-9ａ-ｚ０-９_―——─－一─——－\u2E3A\u0332\u0331\u02CD﹘\\-]+)[)）]`, 'iug', {
    greedyTable: 2,
});
exports.reTxtHtmlTag = createHtmlTagRe(exports.allowedHtmlTagList);
exports.reHtmlRubyRt = createHtmlTagRe(['rt']);
exports.reHtmlRubyRp = createHtmlTagRe(['rp']);
exports.reHtmlTagOpen = new zhRegExp("&lt;|\\u003C|\uFF1C" /* OPEN */, 'igu');
exports.reHtmlTagClose = new zhRegExp("&gt;|\\u003E|\uFF1E" /* CLOSE */, 'igu');
exports.reHtmlAttr = new zhRegExp(`(?<=(?:[\\s 　]+))([\\wａ-ｚ０-９]+)(?:＝|═|=)([#＃\\wａ-ｚ０-９]+)`, 'iug', {
    greedyTable: 2,
});
if (0) {
    log_1.console.dir({
        reTxtImgTag: exports.reTxtImgTag,
        reTxtHtmlTag: exports.reTxtHtmlTag,
        reHtmlRubyRt: exports.reHtmlRubyRt,
        reHtmlRubyRp: exports.reHtmlRubyRp,
        reHtmlTagOpen: exports.reHtmlTagOpen,
        reHtmlTagClose: exports.reHtmlTagClose,
        reHtmlAttr: exports.reHtmlAttr,
    });
}
function createHtmlTagRe(allowedHtmlTagList) {
    return new zhRegExp(`(?:${"&lt;|\\u003C|\uFF1C" /* OPEN */})(${allowedHtmlTagList.join('|')})((?:\\s+[\\w \\t＝═=ａ-ｚ０-９]*?)?)(?:${"&gt;|\\u003E|\uFF1E" /* CLOSE */})([^\\n]*?)(?:${"&lt;|\\u003C|\uFF1C" /* OPEN */})(?:(?:\\/|／)\\1)(?:${"&gt;|\\u003E|\uFF1E" /* CLOSE */})`, 'iug', {
        greedyTable: 2,
    });
}
exports.createHtmlTagRe = createHtmlTagRe;
function _convertHtmlTag001(input) {
    return input
        .replace(new RegExp("&lt;|\\u003C|\uFF1C" /* OPEN */, 'ig'), '<')
        .replace(new RegExp("&gt;|\\u003E|\uFF1E" /* CLOSE */, 'ig'), '>');
}
exports._convertHtmlTag001 = _convertHtmlTag001;
function _fixRubyInnerContext(innerContext) {
    return innerContext
        .replace(exports.reHtmlRubyRt, _replaceHtmlTag(($0, $1, $2, $3) => {
        return `<${$1}${$2}>${$3}</${$1}>`;
    }))
        .replace(exports.reHtmlRubyRp, _replaceHtmlTag(($0, $1, $2, $3) => {
        return `<${$1}${$2}>${$3}</${$1}>`;
    }));
}
exports._fixRubyInnerContext = _fixRubyInnerContext;
function _replaceHtmlTag(replacer) {
    return ($0, $1, $2, ...argv) => {
        $1 = str_util_1.toHalfWidth($1);
        $2 = str_util_1.toHalfWidth($2);
        return replacer($0, $1, $2, ...argv);
    };
}
exports._replaceHtmlTag = _replaceHtmlTag;
//# sourceMappingURL=tags.js.map