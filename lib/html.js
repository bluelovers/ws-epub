"use strict";
/**
 * Created by user on 2019/7/9.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const min_1 = require("cjk-conv/lib/zh/convert/min");
const tags_1 = require("./tags");
const store_1 = require("./store");
const str_util_1 = require("str-util");
const log_1 = require("./log");
function novelImage(src, failback) {
    if (failback) {
        failback = ` lowsrc="${failback}" `;
    }
    else {
        failback = '';
    }
    return `<figure class="fullpage ImageContainer page-break-before"><img src="${src}" class="inner-image" ${failback}/></figure>`;
}
exports.novelImage = novelImage;
function splitTxt(txt, plusData) {
    const { attach = {}, store, vid, epub, epubOptions, cwd } = plusData || {};
    const { images } = attach || {};
    if (epubOptions.iconv) {
        if (epubOptions.iconv === 'cn') {
            txt = min_1.tw2cn_min(txt);
        }
        else if (epubOptions.iconv === 'tw') {
            txt = min_1.cn2tw_min(txt);
        }
    }
    return ('<div>' +
        txt
            .toString()
            .replace(/\r\n|\r(?!\n)|\n/g, "\n")
            .replace(/\u003C/g, '&lt;')
            .replace(/\u003E/g, '&gt;')
            .replace(/&lt;(img[^\n]+?)\/?&gt;/gm, function (...m) {
            //console.log(m);
            return `<${m[1].replace(/\/+$/, '')} class="inner-image"/>`;
        })
            .replace(tags_1.reTxtImgTag, (s, id) => {
            if (images && store && id) {
                let input;
                ({ id, input } = store_1.getAttachID(id, {
                    images,
                }));
                if (input) {
                    let ret = store_1.handleAttachFile(input, {
                        ...plusData,
                        store,
                        epubOptions,
                        epub,
                        vid,
                        failbackExt: '.jpg',
                        basePath: 'image',
                        cwd,
                    });
                    if (ret) {
                        if (ret.ok && !ret.isFile) {
                            return novelImage(ret.returnPath, ret.input);
                        }
                        return novelImage(ret.returnPath);
                    }
                }
            }
            return s;
        })
            .replace(tags_1.reTxtHtmlTag, (s, ...argv) => {
            let [tagName = '', attr = '', innerContext = ''] = argv;
            tagName = str_util_1.toHalfWidth(tagName).toLowerCase();
            switch (tagName) {
                case 's':
                case 'i':
                case 'b':
                case 'sup':
                case 'sub':
                    return `<${tagName}>` + innerContext + `</${tagName}>`;
                case 'ruby':
                    return '<ruby>' + tags_1._fixRubyInnerContext(innerContext) + '</ruby>';
                default:
                    log_1.console.warn(`not support ${tagName}`, argv, s);
            }
            return s;
        })
            .replace(/^[ ]*[－＝\-—\=─–]{3,}[ ]*$/mg, '<hr/>')
            //.replace(/^([－＝\-—\=─═─＝=══－\-─—◆◇]+)$/mg, '<span class="overflow-line">$1</span>')
            .replace(/\n/g, '</div>\n<div>')
        + '</div>')
        .replace(/<div><hr\/><\/div>/g, '<hr class="linehr"/>')
        .replace(/<div>[ ]*([－＝—=─═─＝=══－\-─—～◆◇\*＊\+＊＊↣◇◆☆★■□☆◊▃\p{Punctuation}]+)[ ]*<\/div>/ug, '<div class="linegroup calibre1 overflow-line">$1</div>')
        .replace(/<div><\/div>/g, '<div class="linegroup softbreak">　 </div>')
        .replace(/<div>/g, '<div class="linegroup calibre1">');
}
exports.splitTxt = splitTxt;
//# sourceMappingURL=html.js.map