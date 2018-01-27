#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const novelGlobby = require("node-novel-globby");
const path = require("path");
const Promise = require("bluebird");
const node_novel_info_1 = require("node-novel-info");
const crlf_normalize_1 = require("crlf-normalize");
const fs_iconv_1 = require("fs-iconv");
let TXT_PATH;
TXT_PATH = path.join(process.cwd());
let globby_patterns;
let globby_options = {
    cwd: TXT_PATH,
    useDefaultPatternsExclude: true,
};
{
    let ret = novelGlobby.getOptions(globby_options);
    [globby_patterns, globby_options] = [ret.patterns, ret.options];
}
(async () => {
    let meta;
    const PATH_CWD = globby_options.cwd || process.cwd();
    console.info(`PATH_CWD: ${PATH_CWD}\n`);
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
        console.warn('[SKIP] README.md not exists!');
    });
    let hr_len = 15;
    let hr1 = '＝'.repeat(hr_len);
    let hr2 = '－'.repeat(hr_len);
    await novelGlobby.globbyASync(globby_options)
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
            let filename = 'temp';
            if (meta && meta.novel && meta.novel.title) {
                filename = meta.novel.title;
            }
            let filename2 = fs_iconv_1.trimFilename(filename)
                .replace(/\./, '_')
                .replace(/^[_+\-]+|[_+\-]+$/, '');
            
            filename2 = fs_iconv_1.trimFilename(filename2.split('').slice(0, 10).join(''));
            
            if (!filename2) {
                console.log(`Bad Filename: ${filename} => ${filename2}`);
                filename2 = 'temp';
            }
            filename2 = `${filename2}.out.txt`;
            await fs_iconv_1.default.outputFile(path.join(PATH_CWD, `out/${filename2}`), txt);
            ;
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
})();
