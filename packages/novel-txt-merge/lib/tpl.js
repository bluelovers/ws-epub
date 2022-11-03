"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.presetTxtStyle = exports.SHU_BOOK_BANNER = exports.EnumTxtStyle = exports.TPL_CHAPTER_START = exports.TPL_VOLUME_START = exports.TPL_HR2 = exports.TPL_HR1 = exports.TPL_EOL2 = exports.TPL_EOL = exports.TPL_HR_LEN = void 0;
const crlf_normalize_1 = require("crlf-normalize");
/**
 * Created by user on 2019/5/10.
 */
exports.TPL_HR_LEN = 15;
exports.TPL_EOL = crlf_normalize_1.CRLF;
exports.TPL_EOL2 = crlf_normalize_1.CRLF.repeat(2);
exports.TPL_HR1 = '＝'.repeat(exports.TPL_HR_LEN);
exports.TPL_HR2 = '－'.repeat(exports.TPL_HR_LEN);
exports.TPL_VOLUME_START = '${prefix}${eol}${title}';
exports.TPL_CHAPTER_START = '${prefix}${eol}${title}';
var EnumTxtStyle;
(function (EnumTxtStyle) {
    EnumTxtStyle[EnumTxtStyle["NONE"] = 0] = "NONE";
    /**
     * 書僕開放格式
     */
    EnumTxtStyle[EnumTxtStyle["SHU_BOOK"] = 16] = "SHU_BOOK";
})(EnumTxtStyle = exports.EnumTxtStyle || (exports.EnumTxtStyle = {}));
exports.SHU_BOOK_BANNER = '(= 書僕開放格式 =)${eol}(= 書名：${title} =)${eol}(= 作者：${author} =)${eol}(= 語言：${lang} =)';
exports.presetTxtStyle = {
    [0 /* EnumTxtStyle.NONE */]: {
        'tplBannerStart': '',
        'tplVolumeStart': '${prefix}${eol}${title}',
        'tplChapterStart': '${prefix}${eol}${title}',
        'hr01': exports.TPL_HR1 + 'CHECK',
        'hr02': exports.TPL_HR1,
        'hr11': exports.TPL_HR2 + 'BEGIN',
        'hr12': exports.TPL_HR2 + 'BODY',
        'hr13': exports.TPL_HR2 + 'END',
    },
};
exports.presetTxtStyle[16 /* EnumTxtStyle.SHU_BOOK */] = {
    ...exports.presetTxtStyle[0 /* EnumTxtStyle.NONE */],
    'tplBannerStart': exports.SHU_BOOK_BANNER,
    'tplVolumeStart': '= ${prefix} =${eol}${title}',
    'tplChapterStart': '= ${prefix} =${eol}${title}',
};
//# sourceMappingURL=tpl.js.map