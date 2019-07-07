"use strict";
/**
 * Created by user on 2018/2/18/018.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const uuid_1 = require("epub-maker2/src/lib/uuid");
exports.createUUID = uuid_1.createUUID;
const node_novel_info_1 = require("node-novel-info");
const fs = require("fs-iconv");
const debug_color2_1 = require("debug-color2");
const regexp_cjk_1 = require("regexp-cjk");
const str_util_1 = require("str-util");
exports.console = new debug_color2_1.Console(null, {
    enabled: true,
    inspectOptions: {
        colors: true,
    },
    chalkOptions: {
        enabled: true,
    },
});
exports.console.enabledColor = true;
//export function createUUID(input?: unknown)
//{
//	return getUuidByString(String(input)).toLowerCase();
//}
const reTxtImgTag = new regexp_cjk_1.default(`[(（](?:插圖|圖片|插畫|画像)([a-z0-9ａ-ｚ０-９_-]+)[)）]`, 'iug', {
    greedyTable: 2,
});
function novelImage(src) {
    return `<figure class="fullpage ImageContainer page-break-before"><img src="${src}" class="inner-image"/></figure>`;
}
exports.novelImage = novelImage;
function splitTxt(txt, plusData) {
    const { attach = {} } = plusData || {};
    const { images } = attach || {};
    return ('<div>' +
        txt
            .toString()
            .replace(/\r\n|\r(?!\n)|\n/g, "\n")
            .replace(/\u003C/g, '&lt;')
            .replace(/\u003E/g, '&gt;')
            .replace(/&lt;(img.+?)\/?&gt;/gm, function (...m) {
            //console.log(m);
            return `<${m[1].replace(/\/+$/, '')} class="inner-image"/>`;
        })
            .replace(reTxtImgTag, (s, id) => {
            if (images && id) {
                id = str_util_1.toHalfWidth(id);
                if (images[id]) {
                    return novelImage(images[id]);
                }
                else if (images[id = id.toLowerCase()]) {
                    return novelImage(images[id]);
                }
                else if (images[id = id.toUpperCase()]) {
                    return novelImage(images[id]);
                }
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
/**
 * 讀取不標準的 mdconf
 */
function parseLowCheckLevelMdconf(data) {
    return node_novel_info_1.mdconf_parse(data, {
        // 當沒有包含必要的內容時不產生錯誤
        throw: false,
        // 允許不標準的 info 內容
        lowCheckLevel: true,
    });
}
exports.parseLowCheckLevelMdconf = parseLowCheckLevelMdconf;
function fsLowCheckLevelMdconf(file) {
    return parseLowCheckLevelMdconf(fs.readFileSync(file));
}
exports.fsLowCheckLevelMdconf = fsLowCheckLevelMdconf;
function fsLowCheckLevelMdconfAsync(file) {
    return fs.readFile(file).then(parseLowCheckLevelMdconf);
}
exports.fsLowCheckLevelMdconfAsync = fsLowCheckLevelMdconfAsync;
//# sourceMappingURL=util.js.map