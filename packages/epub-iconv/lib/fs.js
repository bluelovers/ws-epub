"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleZipFile = exports.loadZipFile = void 0;
const fs_extra_1 = require("fs-extra");
const buffer_1 = require("./buffer");
function loadZipFile(zipFilePath) {
    return (0, buffer_1.loadZipBuffer)((0, fs_extra_1.readFile)(zipFilePath));
}
exports.loadZipFile = loadZipFile;
function handleZipFile(zipFilePath, options) {
    return (0, buffer_1.handleZipBuffer)((0, fs_extra_1.readFile)(zipFilePath), options);
}
exports.handleZipFile = handleZipFile;
//# sourceMappingURL=fs.js.map