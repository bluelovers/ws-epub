"use strict";
/**
 * Created by user on 2017/12/17/017.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EpubMaker = void 0;
// @ts-ignore
const file_saver_1 = require("file-saver");
const __1 = require("..");
Object.defineProperty(exports, "EpubMaker", { enumerable: true, get: function () { return __1.EpubMaker; } });
/**
 * for web
 *
 * @param callback
 * @param options
 * @returns {Bluebird<Blob>}
 */
// @ts-ignore
__1.EpubMaker.prototype.downloadEpub = function downloadEpub(callback, options) {
    options = Object.assign({
        type: 'blob',
        useTitle: false,
    }, options);
    let self = this;
    // @ts-ignore
    return this.makeEpub(options).then(async function (epubZipContent) {
        let filename = self.getFilename(options.useTitle);
        console.debug('saving "' + filename + '"...');
        if (callback && typeof (callback) === 'function') {
            await callback(epubZipContent, filename);
        }
        (0, file_saver_1.saveAs)(epubZipContent, filename);
        return epubZipContent;
    });
};
// @ts-ignore
exports.default = __1.EpubMaker;
//# sourceMappingURL=file-saver.js.map