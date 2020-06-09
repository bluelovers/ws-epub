/**
 * Created by user on 2019/5/10.
 */
export declare const TPL_HR_LEN = 15;
export declare const TPL_EOL = "\r\n";
export declare const TPL_EOL2: string;
export declare const TPL_HR1: string;
export declare const TPL_HR2: string;
export declare const TPL_VOLUME_START = "${prefix}${eol}${title}";
export declare const TPL_CHAPTER_START = "${prefix}${eol}${title}";
export declare const enum EnumTxtStyle {
    NONE = 0,
    /**
     * 書僕開放格式
     */
    SHU_BOOK = 16
}
export declare const SHU_BOOK_BANNER = "(= \u66F8\u50D5\u958B\u653E\u683C\u5F0F =)${eol}(= \u66F8\u540D\uFF1A${title} =)${eol}(= \u4F5C\u8005\uFF1A${author} =)${eol}(= \u8A9E\u8A00\uFF1A${lang} =)";
export declare const presetTxtStyle: {
    [k in EnumTxtStyle]?: {
        /**
         * 檔案開頭
         */
        'tplBannerStart': string;
        /**
         * 章 風格
         */
        'tplVolumeStart': string;
        /**
         * 話 風格
         */
        'tplChapterStart': string;
        /**
         * 分隔線 章 開始
         */
        'hr01': string;
        /**
         * 分隔線 章
         */
        'hr02': string;
        /**
         * 分隔線 話 開始
         */
        'hr11': string;
        /**
         * 分隔線 話 內文
         */
        'hr12': string;
        /**
         * 分隔線 話 結束
         */
        'hr13': string;
    };
};
