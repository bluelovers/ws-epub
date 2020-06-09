"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fixedJSZipDate = void 0;
/**
 * this allow u try set date for all files, make u will get same md5 if context is same
 *
 * @param {JSZip} zip
 * @param {Date} date
 * @returns {JSZip}
 */
function fixedJSZipDate(zip, date) {
    if (!(date instanceof Date)) {
        throw new TypeError(`date must is Date object`);
    }
    zip.forEach((relativePath, file) => {
        file.date = date;
    });
    return zip;
}
exports.fixedJSZipDate = fixedJSZipDate;
exports.default = fixedJSZipDate;
//# sourceMappingURL=index.js.map