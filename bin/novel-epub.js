#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const yargs = require("yargs");
const path = require("path");
const index_1 = require("../index");
const CWD = process.cwd();
let cli = yargs
    .default({})
    .option('input', {
    alias: ['i'],
    //demandOption: true,
    requiresArg: true,
    normalize: true,
    type: 'string',
    desc: 'source novel txt folder path',
})
    .option('output', {
    alias: ['o'],
    //demandOption: true,
    requiresArg: true,
    normalize: true,
    type: 'string',
    desc: ' output path',
    default: function () {
        return CWD;
    },
})
    .option('tpl', {
    alias: ['t'],
    requiresArg: true,
    type: 'string',
    desc: 'epub tpl',
})
    .option('filename', {
    alias: ['f'],
    requiresArg: true,
    type: 'string',
    desc: 'filename',
})
    .option('date', {
    boolean: true,
    alias: ['d'],
    desc: 'add current date end of filename',
})
    .option('lang', {
    alias: ['l'],
    type: 'string',
    desc: 'epub lang',
})
    .command('$0', '', function (yargs) {
    let inputPath = yargs.argv.input || yargs.argv._[0] || CWD;
    let outputPath = yargs.argv.output;
    if (!path.isAbsolute(inputPath)) {
        inputPath = path.join(CWD, inputPath);
    }
    if (!path.isAbsolute(outputPath)) {
        outputPath = path.join(CWD, outputPath);
    }
    console.log(`currentPath:\n  `, inputPath);
    console.log(`inputPath:\n  `, inputPath);
    console.log(`outputPath:\n  `, outputPath);
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
        epubLanguage: yargs.argv.lang,
        epubTemplate: yargs.argv.tpl,
        padEndDate: yargs.argv.date,
    });
    //yargs.showHelp('log');
})
    .version()
    .argv;
