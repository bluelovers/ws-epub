"use strict";
/**
 * Created by user on 2018/1/28/028.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeFilename = exports.getMetaTitles = exports.txtMerge = void 0;
const tslib_1 = require("tslib");
const novelGlobby = tslib_1.__importStar(require("node-novel-globby"));
const novelGlobbyBase = tslib_1.__importStar(require("node-novel-globby/g"));
const path_1 = tslib_1.__importDefault(require("path"));
const bluebird_1 = tslib_1.__importDefault(require("bluebird"));
const moment_1 = tslib_1.__importDefault(require("moment"));
const node_novel_info_1 = require("node-novel-info");
const crlf_normalize_1 = require("crlf-normalize");
const fs_iconv_1 = tslib_1.__importStar(require("fs-iconv"));
const uni_string_1 = tslib_1.__importDefault(require("uni-string"));
const sort_tree_1 = require("@lazy-glob/sort-tree");
const class_1 = require("node-novel-info/class");
const util_1 = require("node-novel-globby/lib/util");
const tpl_1 = require("./lib/tpl");
const index_1 = require("./lib/index");
const debug_color2_1 = require("debug-color2");
const hr_len = tpl_1.TPL_HR_LEN;
const eol = tpl_1.TPL_EOL;
const eol2 = tpl_1.TPL_EOL2;
const hr1 = tpl_1.TPL_HR1;
const hr2 = tpl_1.TPL_HR2;
function txtMerge(inputPath, outputPath, outputFilename, noSave, inputOptions) {
    if (typeof inputPath === 'object') {
        inputOptions = inputPath;
        ({ inputPath, outputPath, outputFilename, noSave } = inputOptions);
    }
    else if (outputPath != null && typeof outputPath === 'object') {
        inputOptions = outputPath;
        ({ outputPath, outputFilename, noSave } = inputOptions);
    }
    else if (outputFilename != null && typeof outputFilename === 'object') {
        inputOptions = outputFilename;
        ({ outputFilename, noSave } = inputOptions);
    }
    else if (noSave != null && typeof noSave === 'object') {
        inputOptions = noSave;
        ({ noSave } = inputOptions);
    }
    let _o = (0, index_1.makeDefaultTplData)(inputOptions, {
        inputPath,
        outputPath,
        outputFilename,
        noSave,
    });
    inputOptions = _o.inputOptions;
    let tplBaseData = _o.tplBaseData;
    return bluebird_1.default.resolve().then(async function () {
        const TXT_PATH = inputOptions.inputPath;
        const PATH_CWD = inputOptions.outputPath;
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
            [globby_patterns, globby_options] = novelGlobby.getOptions2(globby_options);
            //globby_patterns.push('!*/*/*/**/*');
        }
        let meta;
        //console.info(`PATH_CWD: ${PATH_CWD}\n`);
        //console.log(globby_patterns);
        //console.log(globby_options);
        // @ts-ignore
        meta = await novelGlobbyBase.globbyASync([
            'README.md',
        ], globby_options)
            //.then(sortTree)
            .tap(function (ls) {
            //console.log(ls);
        })
            .then(async function (ls) {
            let data = await fs_iconv_1.default.readFile(ls[0]);
            return (0, node_novel_info_1.mdconf_parse)(data, {
                throw: false,
            });
        })
            .tap(function (ls) {
            //console.log(ls);
        })
            .catch(function () {
            debug_color2_1.console.warn(`[WARN] README.md not exists! (${path_1.default.join(globby_options.cwd, 'README.md')})`);
        });
        //console.log(globby_patterns);
        return novelGlobbyBase.globbyASync(globby_patterns, globby_options)
            .then(ls => (0, sort_tree_1.sortTree)(ls, null, globby_options))
            .then(function (ls) {
            return novelGlobby.globToListArrayDeep(ls, globby_options);
        })
            .tap(function (ls) {
            //console.log(ls);
            //throw new Error('test');
            //process.exit();
        })
            .then(function (_ls) {
            if (!_ls || !Object.keys(_ls).length) {
                // @ts-ignore
                return bluebird_1.default.reject(`沒有可合併的檔案存在`);
            }
            //let count_f = 0;
            //let count_d = 0;
            //let count_idx = 0;
            return (0, util_1.foreachArrayDeepAsync)(_ls, async ({ value, index, array, cache, }) => {
                const { volume_title, chapter_title } = value;
                const { temp, data } = cache;
                //temp.cache_vol = temp.cache_vol || {};
                //temp.toc = temp.toc || [];
                //temp.context = temp.context || [];
                let vs_ret = (0, util_1.eachVolumeTitle)(volume_title, true);
                vs_ret.titles_full
                    .forEach(function (key, index) {
                    let title = vs_ret.titles[index];
                    if (temp.cache_vol[key] == null) {
                        data.toc.push('- '.repeat(index + 1) + title);
                        temp.count_d++;
                        temp.cache_vol[key] = (temp.cache_vol[key] | 0);
                    }
                });
                let vi = vs_ret.level - 1;
                let vol_key = vs_ret.titles_full[vi];
                temp.cache_vol[vol_key]++;
                if (temp.prev_volume_title != volume_title) {
                    //let _vol_prefix = `第${String(++temp.count_idx).padStart(5, '0')}章：${vol_key}${eol}`;
                    //data.context.push(`${hr1}CHECK${eol}${_vol_prefix}${vs_ret.titles[vi]}${eol}${hr1}${eol}`);
                    let _vol_prefix = `第${String(++temp.count_idx).padStart(5, '0')}章：${vol_key}`;
                    let s = (0, index_1.replaceTpl)(inputOptions.tplVolumeStart, {
                        ...tplBaseData,
                        prefix: _vol_prefix,
                        title: vs_ret.titles[vi],
                    });
                    data.context.push(`${inputOptions.hr01}${eol}${s}${eol}${inputOptions.hr02}${eol}`);
                }
                data.toc.push('- '.repeat(vs_ret.level + 1) + chapter_title);
                //let _prefix = `第${String(++temp.count_idx).padStart(5, '0')}話：${chapter_title}${eol}`;
                let _prefix = `第${String(++temp.count_idx).padStart(5, '0')}話：${chapter_title}`;
                let txt = await fs_iconv_1.default.readFile(value.path);
                temp.count_f++;
                //data.context.push(`${hr2}BEGIN${eol}${_prefix}${chapter_title}${eol}${hr2}BODY${eol2}${txt}${eol2}${hr2}END${eol2}`);
                let s = (0, index_1.replaceTpl)(inputOptions.tplVolumeStart, {
                    ...tplBaseData,
                    prefix: _prefix,
                    title: chapter_title,
                });
                data.context.push(`${inputOptions.hr11}${eol}${s}${eol}${inputOptions.hr12}${eol2}${txt}${eol2}${inputOptions.hr13}${eol2}`);
                temp.prev_volume_title = volume_title;
            }, {
                data: {
                    toc: [],
                    context: [],
                },
                temp: {
                    cache_vol: {},
                    prev_volume_title: null,
                    count_idx: 0,
                    count_f: 0,
                    count_d: 0,
                },
            })
                .tap(function (ret) {
                //console.dir(ret.temp);
                //console.log(ret.temp.context.join(eol));
                //process.exit();
            })
                .then(async function (processReturn) {
                let a = processReturn.data.context;
                let filename2 = makeFilename(meta, inputOptions.outputFilename, a, _ls, {
                    TXT_PATH,
                    processReturn,
                    inputOptions,
                    tplBaseData,
                });
                let txt = a.join(eol);
                txt = (0, crlf_normalize_1.crlf)(txt, eol);
                let fullpath = path_1.default.join(PATH_CWD, outputDirPathPrefix, `${filename2}`);
                if (!noSave) {
                    await fs_iconv_1.default.outputFile(fullpath, txt);
                }
                return {
                    filename: filename2,
                    fullpath,
                    data: txt,
                    temp: processReturn.temp,
                };
            })
                .tap(function (data) {
                debug_color2_1.console.success('[DONE] done.');
                debug_color2_1.console.info(`Total D: ${data.temp.count_d}\nTotal F: ${data.temp.count_f}\n\n[FILENAME] ${data.filename}`);
            })
                // @ts-ignore
                .tapCatch(function (e) {
                debug_color2_1.console.error(`[ERROR] something wrong!!`);
                debug_color2_1.console.trace(e);
            });
        })
            .tapCatch(function (e) {
            debug_color2_1.console.error(`[ERROR] can't found any file in '${TXT_PATH}'`);
            debug_color2_1.console.trace(e);
        });
    });
}
exports.txtMerge = txtMerge;
function getMetaTitles(meta) {
    return (0, node_novel_info_1.getNovelTitleFromMeta)(meta);
}
exports.getMetaTitles = getMetaTitles;
/**
 * 回傳處理後的檔案名稱
 */
function makeFilename(meta, outputFilename, a = [], _ls, _argv = {}) {
    let { inputOptions, tplBaseData } = _argv;
    a.unshift(eol);
    a.unshift(tpl_1.TPL_HR1 + 'START');
    if (_argv.processReturn && _argv.processReturn.data.toc.length) {
        let ret = _argv.processReturn.data.toc;
        ret.unshift(`目錄索引：`);
        ret.push(hr2 + eol);
        a.unshift(ret.join(eol));
    }
    const metaLib = new class_1.NodeNovelInfo(meta, {
        throw: false,
        lowCheckLevel: true,
    });
    if (meta && meta.novel) {
        let txt = `${meta.novel.title}${eol}${meta.novel.author}${eol}${metaLib.sources()
            .join(eol)}${eol}${eol}${meta.novel.preface}${eol}${eol}`;
        let a2 = [];
        let novelID = _argv && _argv.TXT_PATH && path_1.default.basename(_argv.TXT_PATH) || '';
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
        //		console.log(txt);
        //		process.exit();
        a.unshift(txt);
    }
    if (inputOptions && inputOptions.tplBannerStart) {
        let s = (0, index_1.replaceTpl)(inputOptions.tplBannerStart, {
            ...tplBaseData,
            title: metaLib.title(),
            author: metaLib.authors().join(' , '),
            lang: 'zh-Hant',
        });
        a.unshift(s);
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
    let filename2 = (0, fs_iconv_1.trimFilename)(filename)
        .replace(/\./, '_')
        .replace(/^[_+\-]+|[_+\-]+$/, '');
    filename2 = uni_string_1.default.create(filename2).split('').slice(0, 20).join('');
    filename2 = (0, fs_iconv_1.trimFilename)(filename2);
    if (!filename2) {
        debug_color2_1.console.error(`[ERROR] Bad Filename: ${filename} => ${filename2}`);
        filename2 = 'temp';
    }
    filename += '_' + (0, moment_1.default)().local().format('YYYYMMDDHHmm');
    filename2 = `${filename2}.out.txt`;
    return filename2;
}
exports.makeFilename = makeFilename;
exports.default = txtMerge;
//# sourceMappingURL=index.js.map