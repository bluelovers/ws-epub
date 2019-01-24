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
const class_1 = require("node-novel-info/class");
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
const eol = crlf_normalize_1.CRLF;
const eol2 = eol.repeat(2);
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
        let count_idx = 0;
        return BluebirdPromise
            .mapSeries(Object.keys(_ls), async function (val_dir, index, len) {
            let ls = _ls[val_dir];
            let volume_title = ls[0].volume_title;
            count_d++;
            let vs = volume_title
                .split('/')
                .map(function (v) {
                return normalize_1.normalize_strip(v, true);
            });
            volume_title = vs
                .join(crlf_normalize_1.LF);
            let _vol_prefix = '';
            if (1) {
                _vol_prefix = `第${String(++count_idx).padStart(5, '0')}話：${vs.join('／')}${eol}`;
            }
            let txt = `${hr1}CHECK${eol}${_vol_prefix}${volume_title}${eol}${hr1}${eol}`;
            let a = await BluebirdPromise.mapSeries(ls, async function (row) {
                let data = await fs_iconv_1.default.readFile(row.path);
                count_f++;
                let chapter_title = row.chapter_title;
                let _prefix = '';
                if (1) {
                    _prefix = `第${String(++count_idx).padStart(5, '0')}話：${chapter_title}${eol}`;
                }
                let txt = `${hr2}BEGIN${eol}${_prefix}${chapter_title}${eol}${hr2}BODY${eol2}${data}${eol2}${hr2}END${eol2}`;
                return txt;
            });
            a.unshift(txt);
            return a.join(eol);
        })
            .then(async function (a) {
            let filename2 = makeFilename(meta, outputFilename, a, _ls, {
                TXT_PATH,
            });
            let txt = a.join(eol);
            txt = crlf_normalize_1.crlf(txt, eol);
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
function makeFilename(meta, outputFilename, a = [], _ls, _argv) {
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
            ret.push(hr2 + eol);
            a.unshift(ret.join(eol));
        }
    }
    const metaLib = new class_1.NodeNovelInfo(meta, {
        throw: false,
        lowCheckLevel: true,
    });
    if (meta && meta.novel) {
        let txt = `${meta.novel.title}${eol}${meta.novel.author}${eol}${meta.novel.source || ''}${eol}${eol}${meta.novel.preface}${eol}${eol}`;
        let a2 = [];
        let novelID = _argv.TXT_PATH && path.basename(_argv.TXT_PATH) || '';
        let titles = [novelID].concat(metaLib.titles())
            .filter(v => v && v != meta.novel.title);
        if (titles.length) {
            a2.push(`其他名稱：${eol}` + titles.join(eol) + eol);
            a2.push(hr2);
        }
        let _arr;
        let _label = '';
        let _join = '、';
        _arr = metaLib.authors()
            .filter(v => v && v != meta.novel.author);
        _label = '其他作者：';
        if (_arr && _arr.length) {
            a2.push(_label + _arr.join(_join) + eol);
        }
        _arr = metaLib.illusts();
        _label = '繪師：';
        if (_arr && _arr.length) {
            a2.push(_label + _arr.join(_join) + eol);
        }
        _arr = metaLib.contributes();
        _label = '貢獻者：';
        if (_arr && _arr.length) {
            a2.push(_label + _arr.join(_join) + eol);
        }
        _arr = metaLib.tags();
        _label = '標籤：';
        if (_arr && _arr.length) {
            a2.push(_label + _arr.join(_join) + eol);
        }
        if (a2.length) {
            a2.unshift(hr2);
            a2.push(hr2);
            txt += a2.join(eol);
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
