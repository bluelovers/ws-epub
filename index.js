"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const novelGlobby = require("node-novel-globby");
const path = require("path");
const BluebirdPromise = require("bluebird");
const moment = require("moment");
const node_novel_info_1 = require("node-novel-info");
const crlf_normalize_1 = require("crlf-normalize");
const fs_iconv_1 = require("fs-iconv");
const uni_string_1 = require("uni-string");
const glob_sort_1 = require("node-novel-globby/lib/glob-sort");
const array_hyper_unique_1 = require("array-hyper-unique");
const normalize_1 = require("@node-novel/normalize");
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
const hr_len = 15;
const eol = '\n';
const hr1 = '＝'.repeat(hr_len);
const hr2 = '－'.repeat(hr_len);
async function txtMerge(inputPath, outputPath, outputFilename, noSave) {
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
        globby_patterns.push('!*/*/*/**/*');
    }
    let meta;
    meta = await novelGlobby.globbyASync([
        'README.md',
    ], globby_options)
        .then(novelGlobby.returnGlobList)
        .then(glob_sort_1.sortTree)
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
    return await novelGlobby.globbyASync(globby_patterns, globby_options)
        .tap(function (ls) {
    })
        .then(function (_ls) {
        if (!_ls || !Object.keys(_ls).length) {
            return BluebirdPromise.reject(`沒有可合併的檔案存在`);
        }
        let count_f = 0;
        let count_d = 0;
        return BluebirdPromise
            .mapSeries(Object.keys(_ls), async function (val_dir, index, len) {
            let ls = _ls[val_dir];
            let volume_title = ls[0].volume_title;
            let txt = `${hr1}CHECK\n${volume_title}\n${hr1}\n`;
            let a = await BluebirdPromise.mapSeries(ls, async function (row) {
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
            let filename2 = makeFilename(meta, outputFilename, a, _ls);
            let txt = a.join(eol);
            txt = crlf_normalize_1.crlf(txt, crlf_normalize_1.CRLF);
            let fullpath = path.join(PATH_CWD, outputDirPathPrefix, `${filename2}`);
            if (!noSave) {
                await fs_iconv_1.default.outputFile(fullpath, txt);
            }
            return {
                filename: filename2,
                fullpath,
                data: txt,
            };
        })
            .tap(function (data) {
            console.success('[DONE] done.');
            console.info(`Total D: ${count_d}\nTotal F: ${count_f}\n\n[FILENAME] ${data.filename}`);
        })
            .catchThrow(function (e) {
            console.error(`[ERROR] something wrong!!`);
            console.trace(e);
            return e;
        });
    })
        .catch(function (e) {
        console.error(`[ERROR] can't found any file in '${TXT_PATH}'`);
        console.trace(e);
    });
}
exports.txtMerge = txtMerge;
function getMetaTitles(meta) {
    let list = Object.keys(meta.novel)
        .reduce(function (a, key) {
        if (key.indexOf('title') === 0 && typeof meta.novel[key] === 'string') {
            a.push(meta.novel[key]);
        }
        return a;
    }, [])
        .filter(v => v);
    return array_hyper_unique_1.array_unique(list);
}
exports.getMetaTitles = getMetaTitles;
function makeFilename(meta, outputFilename, a = [], _ls) {
    if (_ls) {
        let current_level = 0;
        let _lest = {
            _ts: [],
        };
        let c = '- ';
        let ret = Object.keys(_ls)
            .reduce(function (a1, val_dir) {
            let ls = _ls[val_dir];
            let volume_title = ls[0].volume_title;
            let _ts = volume_title.split('/');
            if (_lest.val_dir != val_dir) {
                for (let i = 0; i < _ts.length; i++) {
                    if (_lest._ts[i] != _ts[i]) {
                        a1.push(c.repeat(i + 1) + normalize_1.normalize_strip(_ts[i], true));
                    }
                }
            }
            ls.forEach(function (row) {
                a1.push(c.repeat(_ts.length + 1) + row.chapter_title);
            });
            _lest = {
                _ts,
                val_dir,
                volume_title,
                level: _ts.length,
            };
            return a1;
        }, []);
        if (ret.length) {
            ret.unshift(`目錄索引：`);
            ret.push(hr2 + crlf_normalize_1.CRLF);
            a.unshift(ret.join(crlf_normalize_1.CRLF));
        }
    }
    if (meta && meta.novel) {
        let txt = `${meta.novel.title}\n${meta.novel.author}\n${meta.novel.source || ''}\n\n${meta.novel.preface}\n\n`;
        let a2 = [];
        let titles = getMetaTitles(meta)
            .filter(v => v != meta.novel.title);
        if (titles.length) {
            a2.push(`其他名稱：\n` + titles.join(crlf_normalize_1.CRLF) + "\n");
            a2.push(hr2);
        }
        if (Array.isArray(meta.contribute) && meta.contribute.length) {
            a2.push(`貢獻者：` + meta.contribute.join('、') + "\n");
        }
        if (Array.isArray(meta.novel.tags) && meta.novel.tags.length) {
            a2.push(`標籤：` + meta.novel.tags.join('、') + "\n");
        }
        if (a2.length) {
            a2.unshift(hr2);
            a2.push(hr2);
            txt += a2.join(crlf_normalize_1.CRLF);
        }
        a.unshift(txt);
    }
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
    filename2 = uni_string_1.default.create(filename2).split('').slice(0, 20).join('');
    filename2 = fs_iconv_1.trimFilename(filename2);
    if (!filename2) {
        console.error(`[ERROR] Bad Filename: ${filename} => ${filename2}`);
        filename2 = 'temp';
    }
    filename += '_' + moment().local().format('YYYYMMDDHHmm');
    filename2 = `${filename2}.out.txt`;
    return filename2;
}
exports.makeFilename = makeFilename;
exports.default = txtMerge;
