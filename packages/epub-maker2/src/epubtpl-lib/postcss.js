"use strict";
/**
 * Created by user on 2017/12/15/015.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.compileCss = exports.postcssStripInlineComments = exports.postcss_epub = exports.autoprefixer = exports.postcss = void 0;
const postcss_1 = __importDefault(require("postcss"));
exports.postcss = postcss_1.default;
const autoprefixer_1 = __importDefault(require("autoprefixer"));
exports.autoprefixer = autoprefixer_1.default;
const postcss_epub_1 = __importDefault(require("postcss-epub"));
exports.postcss_epub = postcss_epub_1.default;
const postcss_strip_inline_comments_1 = __importDefault(require("postcss-strip-inline-comments"));
exports.postcssStripInlineComments = postcss_strip_inline_comments_1.default;
async function compileCss(css) {
    let result = await postcss_1.default([
        postcss_epub_1.default,
        autoprefixer_1.default({
            add: true,
            remove: false,
            flexbox: false,
        }),
    ])
        .process(css, {
        from: undefined,
        // @ts-ignore
        processors: [
            postcss_strip_inline_comments_1.default,
        ],
    });
    //console.log(result);
    //return result.css;
    return result.content;
}
exports.compileCss = compileCss;
exports.default = exports;
//# sourceMappingURL=postcss.js.map