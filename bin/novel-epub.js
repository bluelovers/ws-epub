#!/usr/bin/env node
"use strict";
/**
 * Created by user on 2018/2/18/018.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const yargs = require("yargs");
const path = require("path");
const index_1 = require("../index");
const updateNotifier = require("update-notifier");
const PACKAGE_JSON = require("../package.json");
const debug_color2_1 = require("debug-color2");
const console = new debug_color2_1.Console(null, {
    enabled: true,
    inspectOptions: {
        colors: true,
    },
    chalkOptions: {
        enabled: true,
    },
});
console.enabledColor = true;
const CWD = process.cwd();
updateNotifier({
    pkg: PACKAGE_JSON,
}).notify();
let cli = yargs
    .default({
//input: process.cwd(),
})
    .option('input', {
    alias: ['i'],
    //demandOption: true,
    requiresArg: true,
    normalize: true,
    type: 'string',
    desc: '小說資料夾路徑 source novel txt folder path',
})
    .option('output', {
    alias: ['o'],
    //demandOption: true,
    requiresArg: true,
    normalize: true,
    type: 'string',
    desc: 'epub 輸出路徑 output path',
    default: function () {
        return CWD;
    },
})
    .option('tpl', {
    alias: ['t'],
    requiresArg: true,
    type: 'string',
    desc: 'epub 模板 epub tpl',
})
    .option('filename', {
    alias: ['f'],
    requiresArg: true,
    type: 'string',
    desc: 'epub 檔名 filename',
})
    .option('useTitle', {
    requiresArg: true,
    default: true,
})
    .option('filenameLocal', {
    requiresArg: true,
    desc: 'try auto choose filename',
    default: true,
})
    .option('date', {
    boolean: true,
    alias: ['d'],
    desc: 'epub 檔名後面追加日期 add current date end of filename',
})
    .option('lang', {
    alias: ['l'],
    type: 'string',
    desc: 'epub 語言 epub lang',
})
    .option('vertical', {
    type: 'boolean',
    desc: `是否輸出直排模式`,
})
    .option('downloadRemoteFile', {
    type: 'boolean',
    desc: `是否將網路資源下載到 epub 內`,
})
    .showHelpOnFail(true)
    // @ts-ignore
    .command('$0', '', function (yargs) {
    let inputPath = yargs.argv.input || yargs.argv._[0] || CWD;
    let outputPath = yargs.argv.output;
    if (!path.isAbsolute(inputPath)) {
        inputPath = path.join(CWD, inputPath);
    }
    if (!path.isAbsolute(outputPath)) {
        outputPath = path.join(CWD, outputPath);
    }
    console.grey(`currentPath:\n  `, inputPath);
    console.grey(`inputPath:\n  `, inputPath);
    console.grey(`outputPath:\n  `, outputPath);
    if (inputPath.indexOf(__dirname) == 0 || outputPath.indexOf(__dirname) == 0) {
        console.error(`[FAIL] path not allow`);
        yargs.showHelp();
        process.exit(1);
        return;
    }
    console.log(`\n`);
    //console.log(666, yargs.argv);
    return index_1.default({
        inputPath,
        outputPath,
        filename: yargs.argv.filename || null,
        useTitle: yargs.argv.useTitle,
        filenameLocal: yargs.argv.filenameLocal,
        epubLanguage: yargs.argv.lang,
        epubTemplate: yargs.argv.tpl,
        padEndDate: yargs.argv.date,
        vertical: yargs.argv.vertical,
        downloadRemoteFile: yargs.argv.downloadRemoteFile,
    });
    //yargs.showHelp('log');
})
    .version()
    //.help()
    .argv;
//# sourceMappingURL=novel-epub.js.map