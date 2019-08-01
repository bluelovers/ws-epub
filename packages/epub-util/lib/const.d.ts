export declare function createEpubContextDate(): Date;
export declare function createJSZipGeneratorOptions(): {
    readonly type: "nodebuffer";
    readonly mimeType: "application/epub+zip";
    readonly compression: "DEFLATE";
    readonly compressionOptions: {
        readonly level: 9;
    };
};
/**
 * 固定 epub 內檔案日期 用來保持相同的 md5
 */
export declare const EPUB_CONTEXT_DATE: Date;
