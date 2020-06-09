#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../lib/index");
const bluebird_1 = __importDefault(require("@bluelovers/fast-glob/bluebird"));
const path_1 = __importDefault(require("path"));
const debug_color2_1 = __importDefault(require("debug-color2"));
debug_color2_1.default.setOptions({
    time: true,
});
const cwd = process.cwd();
bluebird_1.default([
    '*.epub'
], {
    cwd,
    absolute: true,
    deep: 0,
})
    .tap(ls => {
    debug_color2_1.default.info(cwd);
    debug_color2_1.default.info(`目前資料夾下找到`, ls.length, `epub`);
})
    .mapSeries(file => {
    debug_color2_1.default.log(file);
    let target_path = path_1.default.join(cwd, path_1.default.parse(file).name + '_out');
    return index_1.autoExtract(file, {
        cwd: target_path,
    });
})
    .then(ls => {
    if (ls.length) {
        debug_color2_1.default.success(`處理完成`, ls.length, `epub`);
    }
    else {
        debug_color2_1.default.red(`沒有找到任何 epub 檔案`);
    }
});
//# sourceMappingURL=extract-bad-epub.js.map