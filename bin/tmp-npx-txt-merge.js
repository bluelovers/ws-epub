"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const yargs = require("yargs");
let cli = yargs
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
