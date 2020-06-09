"use strict";
/**
 * Created by user on 2019/7/22.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleMarkdown = exports.render = exports.createMarkdownIt = void 0;
const markdown_it_1 = __importDefault(require("markdown-it"));
const lodash_1 = require("lodash");
function createMarkdownIt(options, plusData) {
    options = lodash_1.defaultsDeep({}, options, {
        html: true,
        linkify: true,
        breaks: true,
        xhtmlOut: true,
    });
    return new markdown_it_1.default(options)
        .use(require('markdown-it-ruby'))
        .use(require('markdown-it-footnote'))
        .use(require('markdown-it-emoji'))
        .use(require("markdown-it-toc-and-anchor").default)
        .use(require('markdown-it-title'))
        .use(require('markdown-it-implicit-figures'), {
        dataType: true,
        figcaption: true,
    })
        .use(require('@toycode/markdown-it-class'), {
        figure: [
            //'fullpage',
            'ImageContainer',
            'page-break-before',
            'duokan-image-single',
        ],
        img: [
            'inner-image',
        ],
        hr: [
            'linehr',
        ],
        p: [
            'linegroup',
            'calibre1',
        ],
        h1: [
            'left',
        ],
        h2: [
            'left',
        ],
        h3: [
            'left',
        ],
        h4: [
            'left',
        ],
        h5: [
            'left',
        ],
        h6: [
            'left',
        ],
    });
}
exports.createMarkdownIt = createMarkdownIt;
function render(input, options = {}) {
    if (!options.md || options.mdOptions) {
        options.md = createMarkdownIt(options.mdOptions, options);
        /**
         * unsafe
         * disable until fix markdown-it-include
         *
         * @todo 由於可以做到載入非此小說路徑下的檔案 所以停用此功能 直到有空弄個 fork 版 markdown-it-include
         */
        if (0) {
            /*
            options.md = options.md.use(require('markdown-it-include'), {
            root: options.cwd,
        })
             */
        }
    }
    options.mdEnv = options.mdEnv || {};
    let html = options.md.render(input, options.mdEnv);
    // @ts-ignore
    if (options.md.options.xhtmlOut) {
        html = html
            .replace(/<br\s*>/ig, '<br/>');
    }
    return html
        .replace(/(<p(?:\s\w="[\w\s]*")*>.+?)<\/p>/igs, '$1</p>\n<br/>')
        .replace(/(<p(?:\s\w="[\w\s]*")*>)<\/p>/ig, '<p class="linegroup calibre1">$1　 </p>')
        .replace(/<p(?=\s|>)/ig, '<div')
        .replace(/<\/\s*p>/ig, '</div>');
}
exports.render = render;
function handleMarkdown(txt, plusData) {
    lodash_1.defaultsDeep(plusData = plusData || {}, {
        md: null,
        mdEnv: {},
    });
    if (Buffer.isBuffer(txt)) {
        txt = txt.toString();
    }
    let mdHtml = render(txt, plusData);
    return {
        plusData,
        mdEnv: plusData.mdEnv,
        mdHtml,
    };
}
exports.handleMarkdown = handleMarkdown;
//# sourceMappingURL=md.js.map