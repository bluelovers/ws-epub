#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const update_notifier_1 = tslib_1.__importDefault(require("@yarn-tool/update-notifier"));
const yargs_1 = tslib_1.__importDefault(require("yargs"));
const glob_1 = require("../lib/glob");
const path_1 = tslib_1.__importDefault(require("path"));
const pkg = tslib_1.__importStar(require("../package.json"));
(0, update_notifier_1.default)(path_1.default.join(__dirname, '..'));
let argv = yargs_1.default
    .scriptName(pkg.name)
    .example(`epub-iconv --iconv cn *.epub`, ``)
    .option('cwd', {
    normalize: true,
    desc: `搜尋檔案時的基準資料夾`,
    default: process.cwd(),
})
    .option('output', {
    desc: `處理後的檔案輸出路徑`,
    requiresArg: true,
    string: true,
})
    .option('iconv', {
    desc: `cn 轉簡 tw 轉繁`,
    requiresArg: true,
    string: true,
})
    .option('showLog', {
    desc: `是否輸出訊息`,
    boolean: true,
    default: true,
})
    .showHelpOnFail(true)
    .version()
    .command('$0', `epub-iconv *.epub`, (yargs) => yargs, function (argv) {
    let options = {
        cwd: argv.cwd,
        output: argv.output,
        iconv: argv.iconv,
        showLog: argv.showLog,
    };
    let pattern = argv._;
    if (!pattern.length) {
        pattern = ['*.epub'];
    }
    return (0, glob_1.handleGlob)(pattern, options);
})
    .argv;
//# sourceMappingURL=epub-iconv.js.map