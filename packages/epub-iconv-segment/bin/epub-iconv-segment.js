#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const update_notifier_1 = __importDefault(require("@yarn-tool/update-notifier"));
const yargs_1 = __importDefault(require("yargs"));
const __1 = __importDefault(require(".."));
const path = __importStar(require("path"));
const pkg = __importStar(require("../package.json"));
update_notifier_1.default(path.join(__dirname, '..'));
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
    return __1.default(pattern, options);
})
    .argv;
//# sourceMappingURL=epub-iconv-segment.js.map