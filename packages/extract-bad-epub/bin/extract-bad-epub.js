#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const index_1 = require("../lib/index");
const bluebird_1 = tslib_1.__importDefault(require("@bluelovers/fast-glob/bluebird"));
const path_1 = tslib_1.__importDefault(require("path"));
const debug_color2_1 = require("debug-color2");
debug_color2_1.console.setOptions({
    time: true,
});
const cwd = process.cwd();
(0, bluebird_1.default)([
    '*.epub'
], {
    cwd,
    absolute: true,
    deep: 0,
})
    .tap(ls => {
    debug_color2_1.console.info(cwd);
    debug_color2_1.console.info(`目前資料夾下找到`, ls.length, `epub`);
})
    .mapSeries(file => {
    debug_color2_1.console.log(file);
    let target_path = path_1.default.join(cwd, path_1.default.parse(file).name + '_out');
    return (0, index_1.autoExtract)(file, {
        cwd: target_path,
    });
})
    .then(ls => {
    if (ls.length) {
        debug_color2_1.console.success(`處理完成`, ls.length, `epub`);
    }
    else {
        debug_color2_1.console.red(`沒有找到任何 epub 檔案`);
    }
});
//# sourceMappingURL=extract-bad-epub.js.map