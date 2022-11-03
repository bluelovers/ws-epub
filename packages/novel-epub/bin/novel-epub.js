#!/usr/bin/env node
"use strict";
/**
 * Created by user on 2018/2/18/018.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const yargs_1 = tslib_1.__importDefault(require("yargs"));
const path_1 = tslib_1.__importDefault(require("path"));
const index_1 = tslib_1.__importStar(require("../index"));
const log_1 = require("../lib/log");
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
    desc: '小說資料夾路徑 source novel txt folder path',
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
    desc: 'epub 語言 epub lang (此選項僅影響 epub meta 資訊 不會影響任何其他內容)',
})
    .option('vertical', {
    type: 'boolean',
    desc: `是否輸出直排模式`,
})
    .option('downloadRemoteFile', {
    type: 'boolean',
    desc: `是否將網路資源下載到 epub 內`,
})
    .option('iconv', {
    type: 'string',
    requiresArg: true,
    desc: `是否在打包時同時進行簡繁轉換 cn 轉為簡體, tw 轉為繁體`,
})
    .option('epubContextDate', {
    desc: `指定 epub 內檔案的日期標記`,
})
    .showHelpOnFail(true)
    // @ts-ignore
    .command('$0', '', function (yargs) {
    let inputPath = yargs.argv.input || yargs.argv._[0] || CWD;
    let outputPath = yargs.argv.output;
    if (!path_1.default.isAbsolute(inputPath)) {
        inputPath = path_1.default.join(CWD, inputPath);
    }
    if (!path_1.default.isAbsolute(outputPath)) {
        outputPath = path_1.default.join(CWD, outputPath);
    }
    log_1.console.grey(`currentPath:\n  `, inputPath);
    log_1.console.grey(`inputPath:\n  `, inputPath);
    log_1.console.grey(`outputPath:\n  `, outputPath);
    if (inputPath.indexOf(__dirname) == 0 || outputPath.indexOf(__dirname) == 0) {
        log_1.console.error(`[FAIL] path not allow`);
        yargs.showHelp();
        process.exit(1);
        return;
    }
    log_1.console.log(`\n`);
    //console.log(666, yargs.argv);
    let options = {
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
        iconv: yargs.argv.iconv,
        epubContextDate: yargs.argv.epubContextDate,
    };
    log_1.console.dir((0, index_1.makeOptions)(options));
    return (0, index_1.default)(options);
    //yargs.showHelp('log');
})
    .version()
    //.help()
    .argv;
//# sourceMappingURL=novel-epub.js.map