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
    requiresArg: true,
    normalize: true,
    type: 'string',
    desc: 'source novel txt folder path',
})
    .option('output', {
    alias: ['o'],
    requiresArg: true,
    normalize: true,
    type: 'string',
    desc: ' output path',
    default: function () {
        return CWD;
    },
})
    .option('zh', {
    boolean: true,
})
    .command('$0', '', function (yargs) {
    if (yargs.argv.zh) {
        yargs.locale('zh_CN');
    }
    let inputPath = yargs.argv.input || yargs.argv._[0] || CWD;
    let outputPath = yargs.argv.output;
    if (!path.isAbsolute(inputPath)) {
        inputPath = path.join(CWD, inputPath);
    }
    if (!path.isAbsolute(outputPath)) {
        outputPath = path.join(CWD, outputPath);
    }
    console.log(`currentPath:\n\t`, inputPath);
    console.log(`inputPath:\n\t`, inputPath);
    console.log(`outputPath:\n\t`, outputPath);
    if (inputPath.indexOf(__dirname) == 0 || outputPath.indexOf(__dirname) == 0) {
        console.error(`[FAIL] path not allow`);
        yargs.showHelp();
        process.exit(1);
        return;
    }
    console.log(`\n`);
    return index_1.default(inputPath, outputPath);
})
    .argv;
