"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EPUB_CONTEXT_DATE = exports.createJSZipGeneratorOptions = exports.createEpubContextDate = void 0;
function createEpubContextDate() {
    return new Date('2000-12-24 23:00:00Z');
}
exports.createEpubContextDate = createEpubContextDate;
function createJSZipGeneratorOptions() {
    return {
        type: 'nodebuffer',
        mimeType: 'application/epub+zip',
        compression: 'DEFLATE',
        compressionOptions: {
            level: 9
        },
    };
}
exports.createJSZipGeneratorOptions = createJSZipGeneratorOptions;
/**
 * 固定 epub 內檔案日期 用來保持相同的 md5
 */
exports.EPUB_CONTEXT_DATE = createEpubContextDate();
//# sourceMappingURL=const.js.map