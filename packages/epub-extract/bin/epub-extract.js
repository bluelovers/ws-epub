#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_novel_globby_1 = require("node-novel-globby");
const yargs_1 = __importDefault(require("yargs"));
const path_1 = __importDefault(require("path"));
const index_1 = __importDefault(require("../index"));
const bluebird_1 = __importDefault(require("bluebird"));
let cli = yargs_1.default
    .usage("$0 [-o dir] [-i file]")
    .example('$0 -o epub name.epub', 'extract name.epub to epub dir')
    .command('all', 'extract all epub')
    .alias('a', 'all')
    .command('v', 'show log')
    .alias('o', 'output')
    .nargs('o', 1)
    .describe('o', 'output dir path')
    .alias('i', 'input')
    .nargs('i', 1)
    .describe('i', 'input file path');
//console.log(cli.argv);
let srcFile = (cli.argv.input || cli.argv._[0]);
let outputDir = cli.argv.output;
(async () => {
    let cwd = process.cwd();
    console.log(cwd);
    {
        let chk = path_1.default.relative(cwd, __dirname);
        if (['', '.', '..'].includes(chk)) {
            return bluebird_1.default.reject(`not allow cwd path "${cwd}"`);
        }
    }
    let ls;
    let options = {
        cwd,
        outputDir,
        log: cli.argv.v,
    };
    if (!srcFile) {
        ls = await node_novel_globby_1.globby([
            '*.epub',
        ], {
            cwd,
            absolute: true,
        });
        if (cli.argv.all === true) {
            if (!ls.length) {
                return bluebird_1.default.reject(`can't found any epub file in "${cwd}"`);
            }
            return bluebird_1.default
                .map(ls, function (srcFile) {
                return index_1.default(srcFile, options);
            })
                .then(function (ls) {
                return ls.join("\n");
            });
        }
        else {
            srcFile = ls[0];
        }
    }
    if (!srcFile) {
        cli.showHelp('log');
        console.log(['current epub list:'].concat(ls || []).join("\n- "));
    }
    else {
        return await index_1.default(srcFile, options);
    }
})()
    .catch(function (e) {
    cli.showHelp();
    if (e instanceof Error) {
        console.trace(e);
    }
    else {
        console.error('[ERROR]', e);
    }
})
    .then(function (ls) {
    console.log('[DONE]\n', ls);
});
//# sourceMappingURL=epub-extract.js.map