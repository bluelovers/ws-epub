#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const yargs_1 = __importDefault(require("yargs"));
const path_1 = __importDefault(require("path"));
const index_1 = __importDefault(require("../index"));
const PACKAGE_JSON = require("../package.json");
const update_notifier_1 = __importDefault(require("update-notifier"));
const debug_color2_1 = __importDefault(require("debug-color2"));
debug_color2_1.default.enabledColor = true;
const CWD = process.cwd();
update_notifier_1.default({
    pkg: PACKAGE_JSON,
}).notify();
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
    debug_color2_1.default.log(`currentPath:\n  `, inputPath);
    debug_color2_1.default.log(`inputPath:\n  `, inputPath);
    debug_color2_1.default.log(`outputPath:\n  `, outputPath);
    if (inputPath.indexOf(__dirname) == 0 || outputPath.indexOf(__dirname) == 0) {
        debug_color2_1.default.error(`[FAIL] path not allow`);
        yargs.showHelp();
        process.exit(1);
        return;
    }
    debug_color2_1.default.log(`\n`);
    //console.log(666, yargs.argv);
    return index_1.default(inputPath, outputPath, {
        txtStyle: yargs.argv.txtStyle,
        inputConfigPath: yargs.argv.configPath,
    });
    //yargs.showHelp('log');
})
    .version()
    //.help()
    .argv;
//# sourceMappingURL=tmp-npx-txt-merge.js.map