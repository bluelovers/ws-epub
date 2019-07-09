"use strict";
/**
 * Created by user on 2018/2/18/018.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const fs_iconv_1 = require("fs-iconv");
const uuid_1 = require("epub-maker2/src/lib/uuid");
exports.createUUID = uuid_1.createUUID;
const node_novel_info_1 = require("node-novel-info");
//export function createUUID(input?: unknown)
//{
//	return getUuidByString(String(input)).toLowerCase();
//}
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
    return parseLowCheckLevelMdconf(fs_iconv_1.readFileSync(file));
}
exports.fsLowCheckLevelMdconf = fsLowCheckLevelMdconf;
function fsLowCheckLevelMdconfAsync(file) {
    return fs_iconv_1.readFile(file).then(parseLowCheckLevelMdconf);
}
exports.fsLowCheckLevelMdconfAsync = fsLowCheckLevelMdconfAsync;
//# sourceMappingURL=util.js.map