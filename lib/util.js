"use strict";
/**
 * Created by user on 2018/2/18/018.
 */
Object.defineProperty(exports, "__esModule", { value: true });
function splitTxt(txt) {
    return ('<p>' +
        txt
            .toString()
            .replace(/\r\n|\r(?!\n)|\n/g, "\n")
            .replace(/\u003C/g, '&lt;')
            .replace(/\u003E/g, '&gt;')
            .replace(/&lt;(img.+?)\/?&gt;/gm, function (...m) {
            //console.log(m);
            return `<${m[1].replace(/\/+$/, '')} class="inner-image"/>`;
        })
            .replace(/^[－＝\-—\=─]{3,}$/mg, '<hr/>')
            .replace(/\n/g, '</p><p>')
        + '</p>')
        .replace(/<p><hr\/><\/p>/g, '<hr class="linehr"/>')
        .replace(/<p>([－＝\-—\=─═─＝=══－\-─—◆◇\*＊\+＊＊↣◇◆☆★■□☆◊▃]+)<\/p>/g, '<p class="linegroup calibre1 overflow-line">$1</p>')
        .replace(/<p><\/p>/g, '<p class="linegroup softbreak">　 </p>')
        .replace(/<p>/g, '<p class="linegroup calibre1">');
}
exports.splitTxt = splitTxt;
const self = require("./util");
exports.default = self;
//export default exports;
