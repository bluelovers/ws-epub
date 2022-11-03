"use strict";
/**
 * Created by user on 2018/2/18/018.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.pathDirNormalize = exports.pathAtParent = exports.fsLowCheckLevelMdconfAsync = exports.fsLowCheckLevelMdconf = exports.parseLowCheckLevelMdconf = exports.createUUID = void 0;
const tslib_1 = require("tslib");
// @ts-ignore
const fs_iconv_1 = require("fs-iconv");
const uuid_1 = require("epub-maker2/src/lib/uuid");
Object.defineProperty(exports, "createUUID", { enumerable: true, get: function () { return uuid_1.createUUID; } });
const node_novel_info_1 = require("node-novel-info");
const upath2_1 = tslib_1.__importDefault(require("upath2"));
const path_dir_normalize_1 = require("path-dir-normalize");
/**
 * 讀取不標準的 mdconf
 */
function parseLowCheckLevelMdconf(data) {
    return (0, node_novel_info_1.mdconf_parse)(data, {
        // 當沒有包含必要的內容時不產生錯誤
        throw: false,
        // 允許不標準的 info 內容
        lowCheckLevel: true,
    });
}
exports.parseLowCheckLevelMdconf = parseLowCheckLevelMdconf;
function fsLowCheckLevelMdconf(file) {
    return parseLowCheckLevelMdconf((0, fs_iconv_1.readFileSync)(file));
}
exports.fsLowCheckLevelMdconf = fsLowCheckLevelMdconf;
function fsLowCheckLevelMdconfAsync(file) {
    return (0, fs_iconv_1.readFile)(file).then(parseLowCheckLevelMdconf);
}
exports.fsLowCheckLevelMdconfAsync = fsLowCheckLevelMdconfAsync;
function pathAtParent(cwd, cwdRoot) {
    cwd = upath2_1.default.normalize(cwd).toLowerCase();
    cwdRoot = pathDirNormalize(cwdRoot).toLowerCase();
    return (cwdRoot === cwd) || pathDirNormalize(upath2_1.default.dirname(cwd)).startsWith(cwdRoot);
}
exports.pathAtParent = pathAtParent;
function pathDirNormalize(dir) {
    return (0, path_dir_normalize_1.pathDirNormalize)(dir, upath2_1.default);
}
exports.pathDirNormalize = pathDirNormalize;
//# sourceMappingURL=util.js.map