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
const parse_txt_tag_1 = require("@node-novel/parse-txt-tag");
function novelImage(src, options = {}) {
    let { failback = '', attr = '' } = options || {};
    if (failback && failback.length) {
        failback = ` lowsrc="${failback}" `;
    }
    else {
        failback = '';
    }
    return `<figure class="fullpage ImageContainer page-break-before duokan-image-single"><div><img src="${src}" class="inner-image" ${failback} ${attr}/></div></figure>`;
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
    let context = txt
        .toString()
        .replace(/\r\n|\r(?!\n)|\n/g, "\n")
        .replace(/\u003C/g, '&lt;')
        .replace(/\u003E/g, '&gt;')
        .replace(/&lt;(img[^\n]+?)\/?&gt;/gm, function (...m) {
        //console.log(m);
        return `<${m[1].replace(/\/+$/, '')} class="inner-image"/>`;
    });
    context = parse_txt_tag_1.parse(context, {
        on: {
            img({ tagName, innerContext: id, }) {
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
                            let _options = {
                                attr: ` alt="（插圖${str_util_1.toFullWidth(id)}）"`,
                            };
                            if (ret.ok && !ret.isFile) {
                                _options.failback = ret.input;
                                return novelImage(ret.returnPath, _options);
                            }
                            return novelImage(ret.returnPath, _options);
                        }
                    }
                }
                return null;
            },
            default({ tagName, attr, innerContext, cache, attach, }) {
                if (tagName !== 'img' && !tags_1.allowedHtmlTagList.includes(tagName)) {
                    log_1.console.warn(`not support ${tagName}`, attr, innerContext);
                }
                return null;
            },
        }
    }).context;
    context = ('<div>' + context
        .replace(/^[ ]*[－＝\-—\=─–]{3,}[ ]*$/mg, '<hr/>')
        //.replace(/^([－＝\-—\=─═─＝=══－\-─—◆◇]+)$/mg, '<span class="overflow-line">$1</span>')
        .replace(/\n/g, '</div>\n<div>')
        + '</div>')
        .replace(/<div><hr\/><\/div>/g, '<hr class="linehr"/>')
        .replace(/<div>[ ]*([－＝—=─═─＝=══－\-─—～◆◇\*＊\+＊＊↣◇◆☆★■□☆◊▃\p{Punctuation}]+)[ ]*<\/div>/ug, '<div class="linegroup calibre1 overflow-line">$1</div>')
        .replace(/<div><\/div>/g, '<div class="linegroup softbreak">　 </div>')
        .replace(/<div>/g, '<div class="linegroup calibre1">');
    return context;
}
exports.splitTxt = splitTxt;
exports.default = splitTxt;
//# sourceMappingURL=html.js.map