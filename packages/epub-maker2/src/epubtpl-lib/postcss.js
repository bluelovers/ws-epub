"use strict";
/**
 * Created by user on 2017/12/15/015.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.compileCss = exports.postcssStripInlineComments = exports.postcss_epub = exports.autoprefixer = exports.postcss = void 0;
const postcss = require("postcss");
exports.postcss = postcss;
const autoprefixer = require("autoprefixer");
exports.autoprefixer = autoprefixer;
const postcss_epub = require("postcss-epub");
exports.postcss_epub = postcss_epub;
const postcssStripInlineComments = require("postcss-strip-inline-comments");
exports.postcssStripInlineComments = postcssStripInlineComments;
async function compileCss(css) {
    let result = await postcss([
        postcss_epub,
        autoprefixer({
            add: true,
            remove: false,
            flexbox: false,
        }),
    ])
        .process(css, {
        from: undefined,
        // @ts-ignore
        processors: [
            postcssStripInlineComments,
        ],
    });
    //console.log(result);
    //return result.css;
    return result.content;
}
exports.compileCss = compileCss;
exports.default = exports;
//# sourceMappingURL=postcss.js.map