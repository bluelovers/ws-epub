import _zhRegExp from 'regexp-cjk';
export declare const allowedHtmlTagList: readonly ["s", "ruby", "i", "b", "sup", "sub"];
export declare const enum EnumHtmlTag {
    OPEN = "&lt;|\\u003C|\uFF1C",
    CLOSE = "&gt;|\\u003E|\uFF1E"
}
export declare const reTxtImgTag: _zhRegExp;
export declare const reTxtHtmlTag: _zhRegExp;
export declare const reHtmlRubyRt: _zhRegExp;
export declare const reHtmlRubyRp: _zhRegExp;
export declare const reHtmlTagOpen: _zhRegExp;
export declare const reHtmlTagClose: _zhRegExp;
export declare const reHtmlAttr: _zhRegExp;
export declare function createHtmlTagRe(allowedHtmlTagList: string[] | readonly string[]): _zhRegExp;
export declare function _convertHtmlTag001(input: string): string;
export declare function _fixRubyInnerContext(innerContext: string): string;
export declare function _replaceHtmlTag(replacer: ((substring: string, ...args: string[]) => string)): ($0: string, $1: string, $2: string, ...argv: string[]) => string;
