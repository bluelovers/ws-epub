"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const novelGlobby = require("node-novel-globby");
const path = require("path");
const Promise = require("bluebird");
const moment = require("moment");
const node_novel_info_1 = require("node-novel-info");
const crlf_normalize_1 = require("crlf-normalize");
const fs_iconv_1 = require("fs-iconv");
async function txtMerge(inputPath, outputPath, outputFilename) {
    const TXT_PATH = inputPath;
    const PATH_CWD = outputPath;
    const outputDirPathPrefix = 'out';
    if (!inputPath || !outputPath || typeof inputPath != 'string' || typeof outputPath != 'string') {
        throw new ReferenceError('must set inputPath, outputPath');
    }
    let globby_patterns;
    let globby_options = {
        cwd: TXT_PATH,
        useDefaultPatternsExclude: true,
        absolute: true,
    };
    {
        [globby_patterns, globby_options] = novelGlobby.getOptions(globby_options);
        globby_patterns.push('!*/*/**/*');
    }
    let meta;
    meta = await novelGlobby.globbyASync([
        'README.md',
    ], globby_options)
        .then(novelGlobby.returnGlobList)
        .tap(function (ls) {
    })
        .then(async function (ls) {
        let data = await fs_iconv_1.default.readFile(ls[0]);
        return node_novel_info_1.mdconf_parse(data, {
            throw: false,
        });
    })
        .tap(function (ls) {
    })
        .catch(function () {
        console.warn(`[WARN] README.md not exists! (${path.join(globby_options.cwd, 'README.md')})`);
    });
    let hr_len = 15;
    let hr1 = '＝'.repeat(hr_len);
    let hr2 = '－'.repeat(hr_len);
    await novelGlobby.globbyASync(globby_patterns, globby_options)
        .tap(function (ls) {
    })
        .then(function (_ls) {
        const eol = '\n';
        if (!_ls || !Object.keys(_ls).length) {
            return Promise.reject();
        }
        let count_f = 0;
        let count_d = 0;
        return Promise
            .mapSeries(Object.keys(_ls), async function (val_dir, index, len) {
            let ls = _ls[val_dir];
            let volume_title = ls[0].volume_title;
            let txt = `${hr1}CHECK\n${volume_title}\n${hr1}\n`;
            let a = await Promise.mapSeries(ls, async function (row) {
                let data = await fs_iconv_1.default.readFile(row.path);
                let txt = `${hr2}BEGIN\n${row.chapter_title}\n${hr2}BODY\n\n${data}\n\n${hr2}END\n\n`;
                count_f++;
                return txt;
            });
            a.unshift(txt);
            count_d++;
            return a.join(eol);
        })
            .then(async function (a) {
            if (meta && meta.novel) {
                let txt = `${meta.novel.title}\n${meta.novel.author}\n${meta.novel.source || ''}\n\n${meta.novel.preface}\n\n`;
                let a2 = [];
                if (Array.isArray(meta.contribute) && meta.contribute.length) {
                    a2.push(meta.contribute.join('、') + "\n\n");
                }
                if (a2.length) {
                    a2.unshift(hr2);
                    txt += a2.join(crlf_normalize_1.CRLF);
                }
                a.unshift(txt);
            }
            let txt = a.join(eol);
            txt = crlf_normalize_1.crlf(txt, crlf_normalize_1.CRLF);
            let filename;
            if (typeof outputFilename == 'string' && outputFilename) {
                filename = outputFilename;
            }
            if (!filename && meta && meta.novel) {
                if (meta.novel.title_short) {
                    filename = meta.novel.title_short;
                }
                else if (meta.novel.title) {
                    filename = meta.novel.title;
                }
                else if (meta.novel.title_zh) {
                    filename = meta.novel.title_zh;
                }
            }
            filename = filename || 'temp';
            let filename2 = fs_iconv_1.trimFilename(filename)
                .replace(/\./, '_')
                .replace(/^[_+\-]+|[_+\-]+$/, '');
            filename2 = fs_iconv_1.trimFilename(filename2.split('').slice(0, 10).join(''));
            if (!filename2) {
                console.error(`[ERROR] Bad Filename: ${filename} => ${filename2}`);
                filename2 = 'temp';
            }
            filename += '_' + moment().local().format('YYYYMMDDHHmm');
            filename2 = `${filename2}.out.txt`;
            await fs_iconv_1.default.outputFile(path.join(PATH_CWD, outputDirPathPrefix, `${filename2}`), txt);
            return filename2;
        })
            .tap(function (filename) {
            console.log('[DONE] done.');
            console.info(`Total D: ${count_d}\nTotal F: ${count_f}\n\n[FILENAME] ${filename}`);
        })
            .catchThrow(function (e) {
            console.error(`[ERROR] something wrong!!`);
            console.trace(e);
            return e;
        });
    })
        .catch(function (e) {
        console.error(`[ERROR] can't found any file in '${PATH_CWD}'`);
        console.trace(e);
    });
}
exports.txtMerge = txtMerge;
exports.default = txtMerge;
