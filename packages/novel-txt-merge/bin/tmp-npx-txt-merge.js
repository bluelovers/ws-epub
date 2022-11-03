#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const yargs_1 = tslib_1.__importDefault(require("yargs"));
const path_1 = tslib_1.__importDefault(require("path"));
const index_1 = tslib_1.__importDefault(require("../index"));
const debug_color2_1 = require("debug-color2");
debug_color2_1.console.enabledColor = true;
const update_notifier_1 = require("@yarn-tool/update-notifier");
const CWD = process.cwd();
(0, update_notifier_1.updateNotifier)(path_1.default.join(__dirname, '..'));
let cli = yargs_1.default
    .default({
//input: process.cwd(),
})
    .option('input', {
    alias: ['i'],
    //demandOption: true,
    requiresArg: true,
    normalize: true,
    type: 'string',
    desc: 'source novel txt folder path 要打包的 txt 來源資料夾',
    /*
    default: function ()
    {
        //return process.cwd();
    },
    */
})
    .option('output', {
    alias: ['o'],
    //demandOption: true,
    requiresArg: true,
    normalize: true,
    type: 'string',
    desc: ' output path 輸出資料夾',
    default: function () {
        return CWD;
    },
})
    .option('zh', {
    //default: true,
    boolean: true,
})
    .option('txtStyle', {
    desc: '內建的 txt 風格 0=預設 16=書僕',
    number: true,
})
    .option('configPath', {
    desc: '指定設定檔路徑會以設定檔內的資料來覆寫目前設定',
    normalize: true,
})
    // @ts-ignore
    .command('$0', '', function (yargs) {
    if (yargs.argv.zh) {
        yargs.locale('zh_CN');
    }
    let inputPath = yargs.argv.input || yargs.argv._[0] || CWD;
    let outputPath = yargs.argv.output;
    if (!path_1.default.isAbsolute(inputPath)) {
        inputPath = path_1.default.join(CWD, inputPath);
    }
    if (!path_1.default.isAbsolute(outputPath)) {
        outputPath = path_1.default.join(CWD, outputPath);
    }
    debug_color2_1.console.log(`currentPath:\n  `, inputPath);
    debug_color2_1.console.log(`inputPath:\n  `, inputPath);
    debug_color2_1.console.log(`outputPath:\n  `, outputPath);
    if (inputPath.indexOf(__dirname) == 0 || outputPath.indexOf(__dirname) == 0) {
        debug_color2_1.console.error(`[FAIL] path not allow`);
        yargs.showHelp();
        process.exit(1);
        return;
    }
    debug_color2_1.console.log(`\n`);
    //console.log(666, yargs.argv);
    return (0, index_1.default)(inputPath, outputPath, {
        txtStyle: yargs.argv.txtStyle,
        inputConfigPath: yargs.argv.configPath,
    });
    //yargs.showHelp('log');
})
    .version()
    //.help()
    .argv;
//# sourceMappingURL=tmp-npx-txt-merge.js.map