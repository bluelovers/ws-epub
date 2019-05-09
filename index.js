"use strict";
/**
 * Created by user on 2018/1/28/028.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const novelGlobby = require("node-novel-globby");
const novelGlobbyBase = require("node-novel-globby/g");
const path = require("path");
const BluebirdPromise = require("bluebird");
const moment = require("moment");
const node_novel_info_1 = require("node-novel-info");
const crlf_normalize_1 = require("crlf-normalize");
const fs_iconv_1 = require("fs-iconv");
const uni_string_1 = require("uni-string");
const glob_sort_1 = require("node-novel-globby/lib/glob-sort");
const class_1 = require("node-novel-info/class");
const node_novel_info_2 = require("node-novel-info");
const util_1 = require("node-novel-globby/lib/util");
const tpl_1 = require("./lib/tpl");
const index_1 = require("./lib/index");
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
    let _o = index_1.makeDefaultTplData(inputOptions, {
        inputPath,
        outputPath,
        outputFilename,
        noSave,
    });
    inputOptions = _o.inputOptions;
    let tplBaseData = _o.tplBaseData;
    return BluebirdPromise.resolve().then(async function () {
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
            return node_novel_info_1.mdconf_parse(data, {
                throw: false,
            });
        })
            .tap(function (ls) {
            //console.log(ls);
        })
            .catch(function () {
            index_1.console.warn(`[WARN] README.md not exists! (${path.join(globby_options.cwd, 'README.md')})`);
        });
        //console.log(globby_patterns);
        return novelGlobbyBase.globbyASync(globby_patterns, globby_options)
            .then(ls => glob_sort_1.sortTree(ls, null, globby_options))
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
                return BluebirdPromise.reject(`沒有可合併的檔案存在`);
            }
            //let count_f = 0;
            //let count_d = 0;
            //let count_idx = 0;
            return util_1.foreachArrayDeepAsync(_ls, async ({ value, index, array, cache, }) => {
                const { volume_title, chapter_title } = value;
                const { temp, data } = cache;
                //temp.cache_vol = temp.cache_vol || {};
                //temp.toc = temp.toc || [];
                //temp.context = temp.context || [];
                let vs_ret = util_1.eachVolumeTitle(volume_title, true);
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
                    let s = index_1.replaceTpl(inputOptions.tplVolumeStart, {
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
                let s = index_1.replaceTpl(inputOptions.tplVolumeStart, {
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
                txt = crlf_normalize_1.crlf(txt, eol);
                let fullpath = path.join(PATH_CWD, outputDirPathPrefix, `${filename2}`);
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
                index_1.console.success('[DONE] done.');
                index_1.console.info(`Total D: ${data.temp.count_d}\nTotal F: ${data.temp.count_f}\n\n[FILENAME] ${data.filename}`);
            })
                // @ts-ignore
                .tapCatch(function (e) {
                index_1.console.error(`[ERROR] something wrong!!`);
                index_1.console.trace(e);
            });
        })
            .tapCatch(function (e) {
            index_1.console.error(`[ERROR] can't found any file in '${TXT_PATH}'`);
            index_1.console.trace(e);
        });
    });
}
exports.txtMerge = txtMerge;
function getMetaTitles(meta) {
    return node_novel_info_2.getNovelTitleFromMeta(meta);
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
        let novelID = _argv && _argv.TXT_PATH && path.basename(_argv.TXT_PATH) || '';
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
    if (inputOptions.tplBannerStart) {
        let s = index_1.replaceTpl(inputOptions.tplBannerStart, {
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
    let filename2 = fs_iconv_1.trimFilename(filename)
        .replace(/\./, '_')
        .replace(/^[_+\-]+|[_+\-]+$/, '');
    filename2 = uni_string_1.default.create(filename2).split('').slice(0, 20).join('');
    filename2 = fs_iconv_1.trimFilename(filename2);
    if (!filename2) {
        index_1.console.error(`[ERROR] Bad Filename: ${filename} => ${filename2}`);
        filename2 = 'temp';
    }
    filename += '_' + moment().local().format('YYYYMMDDHHmm');
    filename2 = `${filename2}.out.txt`;
    return filename2;
}
exports.makeFilename = makeFilename;
exports.default = txtMerge;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7O0FBR0gsaURBQWtEO0FBQ2xELHVEQUF3RDtBQUN4RCw2QkFBOEI7QUFDOUIsNENBQTZDO0FBQzdDLGlDQUFrQztBQUNsQyxxREFBNEQ7QUFDNUQsbURBQWdEO0FBQ2hELHVDQUE0QztBQUM1QywyQ0FBaUM7QUFDakMsK0RBQTJEO0FBSTNELGlEQUFzRDtBQUN0RCxxREFBd0Q7QUFDeEQscURBS29DO0FBQ3BDLG1DQVNtQjtBQUNuQix1Q0FBc0U7QUFFdEUsTUFBTSxNQUFNLEdBQUcsZ0JBQVUsQ0FBQztBQUMxQixNQUFNLEdBQUcsR0FBRyxhQUFPLENBQUM7QUFDcEIsTUFBTSxJQUFJLEdBQUcsY0FBUSxDQUFDO0FBRXRCLE1BQU0sR0FBRyxHQUFHLGFBQU8sQ0FBQztBQUNwQixNQUFNLEdBQUcsR0FBRyxhQUFPLENBQUM7QUFtSHBCLFNBQWdCLFFBQVEsQ0FBQyxTQUE2QyxFQUNyRSxVQUErQyxFQUMvQyxjQUFtRCxFQUNuRCxNQUE0QyxFQUM1QyxZQUF3QztJQU94QyxJQUFJLE9BQU8sU0FBUyxLQUFLLFFBQVEsRUFDakM7UUFDQyxZQUFZLEdBQUcsU0FBUyxDQUFDO1FBRXpCLENBQUMsRUFBQyxTQUFTLEVBQUUsVUFBVSxFQUFFLGNBQWMsRUFBRSxNQUFNLEVBQUMsR0FBRyxZQUFZLENBQUMsQ0FBQztLQUNqRTtTQUNJLElBQUksVUFBVSxJQUFJLElBQUksSUFBSSxPQUFPLFVBQVUsS0FBSyxRQUFRLEVBQzdEO1FBQ0MsWUFBWSxHQUFHLFVBQVUsQ0FBQztRQUUxQixDQUFDLEVBQUMsVUFBVSxFQUFFLGNBQWMsRUFBRSxNQUFNLEVBQUMsR0FBRyxZQUFZLENBQUMsQ0FBQztLQUN0RDtTQUNJLElBQUksY0FBYyxJQUFJLElBQUksSUFBSSxPQUFPLGNBQWMsS0FBSyxRQUFRLEVBQ3JFO1FBQ0MsWUFBWSxHQUFHLGNBQWMsQ0FBQztRQUU5QixDQUFDLEVBQUMsY0FBYyxFQUFFLE1BQU0sRUFBQyxHQUFHLFlBQVksQ0FBQyxDQUFDO0tBQzFDO1NBQ0ksSUFBSSxNQUFNLElBQUksSUFBSSxJQUFJLE9BQU8sTUFBTSxLQUFLLFFBQVEsRUFDckQ7UUFDQyxZQUFZLEdBQUcsTUFBTSxDQUFDO1FBRXRCLENBQUMsRUFBQyxNQUFNLEVBQUMsR0FBRyxZQUFZLENBQUMsQ0FBQztLQUMxQjtJQUVELElBQUksRUFBRSxHQUFHLDBCQUFrQixDQUFDLFlBQVksRUFBRTtRQUN6QyxTQUFTO1FBQ1QsVUFBVTtRQUNWLGNBQWM7UUFDZCxNQUFNO0tBQ04sQ0FBQyxDQUFDO0lBRUgsWUFBWSxHQUFHLEVBQUUsQ0FBQyxZQUFZLENBQUM7SUFDL0IsSUFBSSxXQUFXLEdBQUcsRUFBRSxDQUFDLFdBQVcsQ0FBQztJQUVqQyxPQUFPLGVBQWUsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSztRQUUxQyxNQUFNLFFBQVEsR0FBVyxZQUFZLENBQUMsU0FBUyxDQUFDO1FBQ2hELE1BQU0sUUFBUSxHQUFXLFlBQVksQ0FBQyxVQUFVLENBQUM7UUFDakQsTUFBTSxtQkFBbUIsR0FBRyxLQUFLLENBQUM7UUFFbEMsSUFBSSxDQUFDLFNBQVMsSUFBSSxDQUFDLFVBQVUsSUFBSSxPQUFPLFNBQVMsSUFBSSxRQUFRLElBQUksT0FBTyxVQUFVLElBQUksUUFBUSxFQUM5RjtZQUNDLE1BQU0sSUFBSSxjQUFjLENBQUMsZ0NBQWdDLENBQUMsQ0FBQztTQUMzRDtRQUVELElBQUksZUFBeUIsQ0FBQztRQUM5QixJQUFJLGNBQWMsR0FBeUI7WUFDMUMsR0FBRyxFQUFFLFFBQVE7WUFDYix5QkFBeUIsRUFBRSxJQUFJO1lBQy9CLFFBQVEsRUFBRSxJQUFJO1NBQ2QsQ0FBQztRQUVGO1lBQ0MsQ0FBQyxlQUFlLEVBQUUsY0FBYyxDQUFDLEdBQUcsV0FBVyxDQUFDLFdBQVcsQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUU1RSxzQ0FBc0M7U0FDdEM7UUFFRCxJQUFJLElBQWlCLENBQUM7UUFFdEIsMENBQTBDO1FBRTFDLCtCQUErQjtRQUMvQiw4QkFBOEI7UUFFOUIsYUFBYTtRQUNiLElBQUksR0FBRyxNQUFNLGVBQWUsQ0FBQyxXQUFXLENBQUM7WUFDdkMsV0FBVztTQUNYLEVBQUUsY0FBYyxDQUFDO1lBQ2xCLGlCQUFpQjthQUNoQixHQUFHLENBQUMsVUFBVSxFQUFFO1lBRWhCLGtCQUFrQjtRQUNuQixDQUFDLENBQUM7YUFDRCxJQUFJLENBQUMsS0FBSyxXQUFXLEVBQUU7WUFFdkIsSUFBSSxJQUFJLEdBQUcsTUFBTSxrQkFBRSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVwQyxPQUFPLDhCQUFZLENBQUMsSUFBSSxFQUFFO2dCQUN6QixLQUFLLEVBQUUsS0FBSzthQUNaLENBQUMsQ0FBQztRQUNKLENBQUMsQ0FBQzthQUNELEdBQUcsQ0FBQyxVQUFVLEVBQUU7WUFFaEIsa0JBQWtCO1FBQ25CLENBQUMsQ0FBQzthQUNELEtBQUssQ0FBQztZQUVOLGVBQU8sQ0FBQyxJQUFJLENBQUMsaUNBQWlDLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsRUFBRSxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDOUYsQ0FBQyxDQUFDLENBQ0Y7UUFFRCwrQkFBK0I7UUFFL0IsT0FBTyxlQUFlLENBQUMsV0FBVyxDQUFDLGVBQWUsRUFBRSxjQUFjLENBQUM7YUFDakUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsb0JBQVEsQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLGNBQWMsQ0FBQyxDQUFDO2FBQzlDLElBQUksQ0FBQyxVQUFVLEVBQUU7WUFFakIsT0FBTyxXQUFXLENBQUMsbUJBQW1CLENBQUMsRUFBRSxFQUFFLGNBQWMsQ0FBQyxDQUFBO1FBQzNELENBQUMsQ0FBQzthQUNELEdBQUcsQ0FBQyxVQUFVLEVBQUU7WUFFaEIsa0JBQWtCO1lBQ2xCLDBCQUEwQjtZQUMxQixpQkFBaUI7UUFDbEIsQ0FBQyxDQUFDO2FBQ0QsSUFBSSxDQUFDLFVBQVUsR0FBRztZQUVsQixJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLEVBQ3BDO2dCQUNDLGFBQWE7Z0JBQ2IsT0FBTyxlQUFlLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDO2FBQzVDO1lBRUQsa0JBQWtCO1lBQ2xCLGtCQUFrQjtZQUVsQixvQkFBb0I7WUFFcEIsT0FBTyw0QkFBcUIsQ0FBQyxHQUFzQyxFQUFFLEtBQUssRUFBRSxFQUMzRSxLQUFLLEVBQ0wsS0FBSyxFQUNMLEtBQUssRUFDTCxLQUFLLEdBQ0wsRUFBRSxFQUFFO2dCQUVKLE1BQU0sRUFBRSxZQUFZLEVBQUUsYUFBYSxFQUFFLEdBQUcsS0FBSyxDQUFDO2dCQUM5QyxNQUFNLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxHQUFHLEtBQUssQ0FBQztnQkFFN0Isd0NBQXdDO2dCQUN4Qyw0QkFBNEI7Z0JBQzVCLG9DQUFvQztnQkFFcEMsSUFBSSxNQUFNLEdBQUcsc0JBQWUsQ0FBQyxZQUFZLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBRWpELE1BQU0sQ0FBQyxXQUFXO3FCQUNoQixPQUFPLENBQUMsVUFBVSxHQUFHLEVBQUUsS0FBSztvQkFFN0IsSUFBSSxLQUFLLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFFakMsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksRUFDL0I7d0JBQ0MsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUM7d0JBRTlDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQzt3QkFFZixJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztxQkFDaEQ7Z0JBQ0YsQ0FBQyxDQUFDLENBQ0Q7Z0JBRUQsSUFBSSxFQUFFLEdBQUcsTUFBTSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUM7Z0JBRTFCLElBQUksT0FBTyxHQUFHLE1BQU0sQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBRXJDLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztnQkFFMUIsSUFBSSxJQUFJLENBQUMsaUJBQWlCLElBQUksWUFBWSxFQUMxQztvQkFDQyxzRkFBc0Y7b0JBRXRGLDZGQUE2RjtvQkFFN0YsSUFBSSxXQUFXLEdBQUcsSUFBSSxNQUFNLENBQUMsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsS0FBSyxPQUFPLEVBQUUsQ0FBQztvQkFFOUUsSUFBSSxDQUFDLEdBQUcsa0JBQVUsQ0FBQyxZQUFZLENBQUMsY0FBYyxFQUFFO3dCQUMvQyxHQUFHLFdBQVc7d0JBQ2QsTUFBTSxFQUFFLFdBQVc7d0JBQ25CLEtBQUssRUFBRSxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztxQkFDeEIsQ0FBQyxDQUFDO29CQUVILElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsWUFBWSxDQUFDLElBQUksR0FBRyxHQUFHLEdBQUcsQ0FBQyxHQUFHLEdBQUcsR0FBRyxZQUFZLENBQUMsSUFBSSxHQUFHLEdBQUcsRUFBRSxDQUFDLENBQUM7aUJBQ3BGO2dCQUVELElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsR0FBRyxhQUFhLENBQUMsQ0FBQztnQkFFN0Qsd0ZBQXdGO2dCQUN4RixJQUFJLE9BQU8sR0FBRyxJQUFJLE1BQU0sQ0FBQyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxLQUFLLGFBQWEsRUFBRSxDQUFDO2dCQUVoRixJQUFJLEdBQUcsR0FBRyxNQUFNLGtCQUFFLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFFeEMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUVmLHVIQUF1SDtnQkFFdkgsSUFBSSxDQUFDLEdBQUcsa0JBQVUsQ0FBQyxZQUFZLENBQUMsY0FBYyxFQUFFO29CQUMvQyxHQUFHLFdBQVc7b0JBQ2QsTUFBTSxFQUFFLE9BQU87b0JBQ2YsS0FBSyxFQUFFLGFBQWE7aUJBQ3BCLENBQUMsQ0FBQztnQkFFSCxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLFlBQVksQ0FBQyxJQUFJLEdBQUcsR0FBRyxHQUFHLENBQUMsR0FBRyxHQUFHLEdBQUcsWUFBWSxDQUFDLElBQUksR0FBRyxJQUFJLEdBQUcsR0FBRyxHQUFHLElBQUksR0FBRyxZQUFZLENBQUMsSUFBSSxHQUFHLElBQUksRUFBRSxDQUFDLENBQUM7Z0JBRTdILElBQUksQ0FBQyxpQkFBaUIsR0FBRyxZQUFZLENBQUM7WUFFdkMsQ0FBQyxFQUFxQjtnQkFFckIsSUFBSSxFQUFFO29CQUNMLEdBQUcsRUFBRSxFQUFjO29CQUNuQixPQUFPLEVBQUUsRUFBYztpQkFDdkI7Z0JBRUQsSUFBSSxFQUFFO29CQUNMLFNBQVMsRUFBRSxFQUFFO29CQUViLGlCQUFpQixFQUFFLElBQUk7b0JBRXZCLFNBQVMsRUFBRSxDQUFDO29CQUNaLE9BQU8sRUFBRSxDQUFDO29CQUNWLE9BQU8sRUFBRSxDQUFDO2lCQUNWO2FBQ0QsQ0FBQztpQkFDQSxHQUFHLENBQUMsVUFBVSxHQUFHO2dCQUVqQix3QkFBd0I7Z0JBRXhCLDBDQUEwQztnQkFFMUMsaUJBQWlCO1lBQ2xCLENBQUMsQ0FBQztpQkFDRCxJQUFJLENBQUMsS0FBSyxXQUFXLGFBQWE7Z0JBRWxDLElBQUksQ0FBQyxHQUFHLGFBQWEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDO2dCQUVuQyxJQUFJLFNBQVMsR0FBRyxZQUFZLENBQUMsSUFBSSxFQUFFLFlBQVksQ0FBQyxjQUFjLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRTtvQkFDdkUsUUFBUTtvQkFDUixhQUFhO29CQUNiLFlBQVk7b0JBQ1osV0FBVztpQkFDWCxDQUFDLENBQUM7Z0JBRUgsSUFBSSxHQUFHLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDdEIsR0FBRyxHQUFHLHFCQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDO2dCQUVyQixJQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxtQkFBbUIsRUFBRSxHQUFHLFNBQVMsRUFBRSxDQUFDLENBQUM7Z0JBRXhFLElBQUksQ0FBQyxNQUFNLEVBQ1g7b0JBQ0MsTUFBTSxrQkFBRSxDQUFDLFVBQVUsQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLENBQUM7aUJBQ25DO2dCQUVELE9BQU87b0JBQ04sUUFBUSxFQUFFLFNBQVM7b0JBQ25CLFFBQVE7b0JBQ1IsSUFBSSxFQUFFLEdBQUc7b0JBRVQsSUFBSSxFQUFFLGFBQWEsQ0FBQyxJQUFJO2lCQUN4QixDQUFDO1lBQ0gsQ0FBQyxDQUFDO2lCQUNELEdBQUcsQ0FBQyxVQUFVLElBQUk7Z0JBRWxCLGVBQU8sQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLENBQUM7Z0JBRWhDLGVBQU8sQ0FBQyxJQUFJLENBQUMsWUFBWSxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sY0FBYyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sa0JBQWtCLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO1lBQzdHLENBQUMsQ0FBQztnQkFDRixhQUFhO2lCQUNaLFFBQVEsQ0FBQyxVQUFVLENBQUM7Z0JBRXBCLGVBQU8sQ0FBQyxLQUFLLENBQUMsMkJBQTJCLENBQUMsQ0FBQztnQkFDM0MsZUFBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNsQixDQUFDLENBQUMsQ0FDRDtRQUNILENBQUMsQ0FBQzthQUNELFFBQVEsQ0FBQyxVQUFVLENBQUM7WUFFcEIsZUFBTyxDQUFDLEtBQUssQ0FBQyxvQ0FBb0MsUUFBUSxHQUFHLENBQUMsQ0FBQztZQUMvRCxlQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2xCLENBQUMsQ0FBQyxDQUNEO0lBQ0gsQ0FBQyxDQUFDLENBQUE7QUFDSCxDQUFDO0FBMVJELDRCQTBSQztBQUVELFNBQWdCLGFBQWEsQ0FBQyxJQUFpQjtJQUU5QyxPQUFPLHVDQUFxQixDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3BDLENBQUM7QUFIRCxzQ0FHQztBQUVEOztHQUVHO0FBQ0gsU0FBZ0IsWUFBWSxDQUFDLElBQWtCLEVBQUUsY0FBdUIsRUFBRSxJQUFjLEVBQUUsRUFBRSxHQUFxQyxFQUFFLFFBSy9ILEVBQVM7SUFFWixJQUFJLEVBQUUsWUFBWSxFQUFFLFdBQVcsRUFBRSxHQUFHLEtBQUssQ0FBQztJQUUxQyxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ2YsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxhQUFPLEdBQUcsT0FBTyxDQUFDLENBQUM7SUFFN0IsSUFBSSxLQUFLLENBQUMsYUFBYSxJQUFJLEtBQUssQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQzlEO1FBQ0MsSUFBSSxHQUFHLEdBQUcsS0FBSyxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDO1FBRXZDLEdBQUcsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDckIsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUM7UUFFcEIsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7S0FDekI7SUFFRCxNQUFNLE9BQU8sR0FBRyxJQUFJLHFCQUFhLENBQUMsSUFBSSxFQUFFO1FBQ3ZDLEtBQUssRUFBRSxLQUFLO1FBQ1osYUFBYSxFQUFFLElBQUk7S0FDbkIsQ0FBQyxDQUFDO0lBRUgsSUFBSSxJQUFJLElBQUksSUFBSSxDQUFDLEtBQUssRUFDdEI7UUFDQyxJQUFJLEdBQUcsR0FBRyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxHQUFHLEdBQUcsT0FBTyxDQUFDLE9BQU8sRUFBRTthQUMvRSxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxHQUFHLEdBQUcsR0FBRyxFQUFFLENBQUM7UUFFM0QsSUFBSSxFQUFFLEdBQUcsRUFBRSxDQUFDO1FBRVosSUFBSSxPQUFPLEdBQUcsS0FBSyxJQUFJLEtBQUssQ0FBQyxRQUFRLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxDQUFDO1FBRTdFLElBQUksTUFBTSxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQzthQUM3QyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQ3hDO1FBRUQsSUFBSSxNQUFNLENBQUMsTUFBTSxFQUNqQjtZQUNDLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxHQUFHLEVBQUUsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDO1lBQ2hELEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDYjtRQUVELElBQUksSUFBYyxDQUFDO1FBQ25CLElBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQztRQUNoQixJQUFJLEtBQUssR0FBRyxHQUFHLENBQUM7UUFFaEIsSUFBSSxHQUFHLE9BQU8sQ0FBQyxPQUFPLEVBQUU7YUFDdEIsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUN6QztRQUNELE1BQU0sR0FBRyxPQUFPLENBQUM7UUFFakIsSUFBSSxJQUFJLElBQUksSUFBSSxDQUFDLE1BQU0sRUFDdkI7WUFDQyxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDO1NBQ3pDO1FBRUQsSUFBSSxHQUFHLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUN6QixNQUFNLEdBQUcsS0FBSyxDQUFDO1FBRWYsSUFBSSxJQUFJLElBQUksSUFBSSxDQUFDLE1BQU0sRUFDdkI7WUFDQyxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDO1NBQ3pDO1FBRUQsSUFBSSxHQUFHLE9BQU8sQ0FBQyxXQUFXLEVBQUUsQ0FBQztRQUM3QixNQUFNLEdBQUcsTUFBTSxDQUFDO1FBRWhCLElBQUksSUFBSSxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQ3ZCO1lBQ0MsRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQztTQUN6QztRQUVELElBQUksR0FBRyxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDdEIsTUFBTSxHQUFHLEtBQUssQ0FBQztRQUVmLElBQUksSUFBSSxJQUFJLElBQUksQ0FBQyxNQUFNLEVBQ3ZCO1lBQ0MsRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQztTQUN6QztRQUVELElBQUksRUFBRSxDQUFDLE1BQU0sRUFDYjtZQUNDLEVBQUUsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7WUFFaEIsRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUViLEdBQUcsSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1NBQ3BCO1FBRUgscUJBQXFCO1FBQ3JCLG1CQUFtQjtRQUVqQixDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0tBQ2Y7SUFFRCxJQUFJLFlBQVksQ0FBQyxjQUFjLEVBQy9CO1FBQ0MsSUFBSSxDQUFDLEdBQUcsa0JBQVUsQ0FBQyxZQUFZLENBQUMsY0FBYyxFQUFFO1lBRS9DLEdBQUcsV0FBVztZQUVkLEtBQUssRUFBRSxPQUFPLENBQUMsS0FBSyxFQUFFO1lBQ3RCLE1BQU0sRUFBRSxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNyQyxJQUFJLEVBQUUsU0FBUztTQUNmLENBQUMsQ0FBQztRQUVILENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDYjtJQUVELElBQUksUUFBZ0IsQ0FBQztJQUVyQixJQUFJLE9BQU8sY0FBYyxJQUFJLFFBQVEsSUFBSSxjQUFjLEVBQ3ZEO1FBQ0MsUUFBUSxHQUFHLGNBQWMsQ0FBQztLQUMxQjtJQUVELElBQUksQ0FBQyxRQUFRLElBQUksSUFBSSxJQUFJLElBQUksQ0FBQyxLQUFLLEVBQ25DO1FBQ0MsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsRUFDMUI7WUFDQyxRQUFRLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUM7U0FDbEM7YUFDSSxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUN6QjtZQUNDLFFBQVEsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQztTQUM1QjthQUNJLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQzVCO1lBQ0MsUUFBUSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDO1NBQy9CO0tBQ0Q7SUFFRCxRQUFRLEdBQUcsUUFBUSxJQUFJLE1BQU0sQ0FBQztJQUU5QixJQUFJLFNBQVMsR0FBRyx1QkFBWSxDQUFDLFFBQVEsQ0FBQztTQUNwQyxPQUFPLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQztTQUNsQixPQUFPLENBQUMsbUJBQW1CLEVBQUUsRUFBRSxDQUFDLENBQ2pDO0lBRUQsU0FBUyxHQUFHLG9CQUFPLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztJQUN0RSxTQUFTLEdBQUcsdUJBQVksQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUVwQyxJQUFJLENBQUMsU0FBUyxFQUNkO1FBQ0MsZUFBTyxDQUFDLEtBQUssQ0FBQyx5QkFBeUIsUUFBUSxPQUFPLFNBQVMsRUFBRSxDQUFDLENBQUM7UUFFbkUsU0FBUyxHQUFHLE1BQU0sQ0FBQztLQUNuQjtJQUVELFFBQVEsSUFBSSxHQUFHLEdBQUcsTUFBTSxFQUFFLENBQUMsS0FBSyxFQUFFLENBQUMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxDQUFDO0lBRTFELFNBQVMsR0FBRyxHQUFHLFNBQVMsVUFBVSxDQUFDO0lBRW5DLE9BQU8sU0FBUyxDQUFDO0FBQ2xCLENBQUM7QUE5SkQsb0NBOEpDO0FBRUQsa0JBQWUsUUFBUSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDcmVhdGVkIGJ5IHVzZXIgb24gMjAxOC8xLzI4LzAyOC5cbiAqL1xuXG5pbXBvcnQgeyBJQXJyYXlEZWVwSW50ZXJmYWNlLCBJUmV0dXJuTGlzdCwgSVJldHVyblJvdyB9IGZyb20gJ25vZGUtbm92ZWwtZ2xvYmJ5JztcbmltcG9ydCBub3ZlbEdsb2JieSA9IHJlcXVpcmUoJ25vZGUtbm92ZWwtZ2xvYmJ5Jyk7XG5pbXBvcnQgbm92ZWxHbG9iYnlCYXNlID0gcmVxdWlyZSgnbm9kZS1ub3ZlbC1nbG9iYnkvZycpO1xuaW1wb3J0IHBhdGggPSByZXF1aXJlKCdwYXRoJyk7XG5pbXBvcnQgQmx1ZWJpcmRQcm9taXNlID0gcmVxdWlyZSgnYmx1ZWJpcmQnKTtcbmltcG9ydCBtb21lbnQgPSByZXF1aXJlKCdtb21lbnQnKTtcbmltcG9ydCB7IG1kY29uZl9wYXJzZSwgSU1kY29uZk1ldGEgfSBmcm9tICdub2RlLW5vdmVsLWluZm8nO1xuaW1wb3J0IHsgY3JsZiwgQ1JMRiwgTEYgfSBmcm9tICdjcmxmLW5vcm1hbGl6ZSc7XG5pbXBvcnQgZnMsIHsgdHJpbUZpbGVuYW1lIH0gZnJvbSAnZnMtaWNvbnYnO1xuaW1wb3J0IFVTdHJpbmcgZnJvbSAndW5pLXN0cmluZyc7XG5pbXBvcnQgeyBzb3J0VHJlZSB9IGZyb20gJ25vZGUtbm92ZWwtZ2xvYmJ5L2xpYi9nbG9iLXNvcnQnO1xuaW1wb3J0IHsgYXJyYXlfdW5pcXVlIH0gZnJvbSAnYXJyYXktaHlwZXItdW5pcXVlJztcbmltcG9ydCB7IG5vcm1hbGl6ZV9zdHJpcCB9IGZyb20gJ0Bub2RlLW5vdmVsL25vcm1hbGl6ZSc7XG5pbXBvcnQgeyBDb25zb2xlIH0gZnJvbSAnZGVidWctY29sb3IyJztcbmltcG9ydCB7IE5vZGVOb3ZlbEluZm8gfSBmcm9tICdub2RlLW5vdmVsLWluZm8vY2xhc3MnO1xuaW1wb3J0IHsgZ2V0Tm92ZWxUaXRsZUZyb21NZXRhIH0gZnJvbSAnbm9kZS1ub3ZlbC1pbmZvJztcbmltcG9ydCB7XG5cdGVhY2hWb2x1bWVUaXRsZSxcblx0Zm9yZWFjaEFycmF5RGVlcEFzeW5jLFxuXHRJRm9yZWFjaEFycmF5RGVlcENhY2hlLFxuXHRJRm9yZWFjaEFycmF5RGVlcFJldHVybixcbn0gZnJvbSAnbm9kZS1ub3ZlbC1nbG9iYnkvbGliL3V0aWwnO1xuaW1wb3J0IHtcblx0RW51bVR4dFN0eWxlLFxuXHRUUExfQ0hBUFRFUl9TVEFSVCxcblx0VFBMX0VPTCxcblx0VFBMX0VPTDIsXG5cdFRQTF9IUjEsXG5cdFRQTF9IUjIsXG5cdFRQTF9IUl9MRU4sXG5cdFRQTF9WT0xVTUVfU1RBUlQsXG59IGZyb20gJy4vbGliL3RwbCc7XG5pbXBvcnQgeyBjb25zb2xlLCBtYWtlRGVmYXVsdFRwbERhdGEsIHJlcGxhY2VUcGwgfSBmcm9tICcuL2xpYi9pbmRleCc7XG5cbmNvbnN0IGhyX2xlbiA9IFRQTF9IUl9MRU47XG5jb25zdCBlb2wgPSBUUExfRU9MO1xuY29uc3QgZW9sMiA9IFRQTF9FT0wyO1xuXG5jb25zdCBocjEgPSBUUExfSFIxO1xuY29uc3QgaHIyID0gVFBMX0hSMjtcblxuZXhwb3J0IHR5cGUgSVR4dFJ1bnRpbWVSZXR1cm4gPSBJRm9yZWFjaEFycmF5RGVlcFJldHVybjxJUmV0dXJuUm93LCBhbnksIHtcblx0dG9jOiBzdHJpbmdbXSxcblx0Y29udGV4dDogc3RyaW5nW10sXG59LCB7XG5cdGNhY2hlX3ZvbDoge1xuXHRcdFt2b2w6IHN0cmluZ106IG51bWJlcjtcblx0fSxcblxuXHRwcmV2X3ZvbHVtZV90aXRsZTogc3RyaW5nLFxuXG5cdGNvdW50X2lkeDogbnVtYmVyLFxuXHRjb3VudF9mOiBudW1iZXIsXG5cdGNvdW50X2Q6IG51bWJlcixcblxufT5cblxuZXhwb3J0IGludGVyZmFjZSBJVHh0TWVyZ2VPcHRpb25zXG57XG5cdGlucHV0UGF0aDogc3RyaW5nLFxuXHRvdXRwdXRQYXRoOiBzdHJpbmcsXG5cdG91dHB1dEZpbGVuYW1lPzogc3RyaW5nLFxuXHRub1NhdmU/OiBib29sZWFuLFxuXHQvKipcblx0ICog5qqU5qGI6ZaL6aCtXG5cdCAqL1xuXHR0cGxCYW5uZXJTdGFydD86IHN0cmluZyxcblx0LyoqXG5cdCAqIOeroCDpoqjmoLxcblx0Ki9cblx0dHBsVm9sdW1lU3RhcnQ/OiBzdHJpbmcsXG5cdC8qKlxuXHQgKiDoqbEg6aKo5qC8XG5cdCAqL1xuXHR0cGxDaGFwdGVyU3RhcnQ/OiBzdHJpbmcsXG5cblx0LyoqXG5cdCAqIOWIhumalOe3miDnq6Ag6ZaL5aeLXG5cdCAqL1xuXHRocjAxPzogc3RyaW5nO1xuXHQvKipcblx0ICog5YiG6ZqU57eaIOeroFxuXHQgKi9cblx0aHIwMj86IHN0cmluZztcblxuXHQvKipcblx0ICog5YiG6ZqU57eaIOipsSDplovlp4tcblx0ICovXG5cdGhyMTE/OiBzdHJpbmc7XG5cdC8qKlxuXHQgKiDliIbpmpTnt5og6KmxIOWFp+aWh1xuXHQgKi9cblx0aHIxMj86IHN0cmluZztcblx0LyoqXG5cdCAqIOWIhumalOe3miDoqbEg57WQ5p2fXG5cdCAqL1xuXHRocjEzPzogc3RyaW5nO1xuXG5cdC8qKlxuXHQgKiDpoJDoqK3poqjmoLxcblx0ICovXG5cdHR4dFN0eWxlPzogRW51bVR4dFN0eWxlLFxuXG5cdGlucHV0Q29uZmlnUGF0aD86IHN0cmluZyxcblxufVxuXG4vKipcbiAqXG4gKiBAcGFyYW0gaW5wdXRQYXRoIOi8uOWFpei3r+W+kVxuICogQHBhcmFtIG91dHB1dFBhdGgg6Ly45Ye66Lev5b6RXG4gKiBAcGFyYW0gb3V0cHV0RmlsZW5hbWUg5Y+D6ICD55So5qqU5qGI5ZCN56ixXG4gKiBAcGFyYW0gbm9TYXZlIOS4jeWEsuWtmOaqlOahiOWDheWbnuWCsyB0eHQg5YWn5a65XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0eHRNZXJnZShpbnB1dE9wdGlvbnM/OiBQYXJ0aWFsPElUeHRNZXJnZU9wdGlvbnM+LFxuKTogQmx1ZWJpcmRQcm9taXNlPHtcblx0ZmlsZW5hbWU6IHN0cmluZyxcblx0ZnVsbHBhdGg6IHN0cmluZyxcblx0ZGF0YTogc3RyaW5nLFxufT5cbmV4cG9ydCBmdW5jdGlvbiB0eHRNZXJnZShpbnB1dFBhdGg6IHN0cmluZyxcblx0aW5wdXRPcHRpb25zPzogUGFydGlhbDxJVHh0TWVyZ2VPcHRpb25zPixcbik6IEJsdWViaXJkUHJvbWlzZTx7XG5cdGZpbGVuYW1lOiBzdHJpbmcsXG5cdGZ1bGxwYXRoOiBzdHJpbmcsXG5cdGRhdGE6IHN0cmluZyxcbn0+XG5leHBvcnQgZnVuY3Rpb24gdHh0TWVyZ2UoaW5wdXRQYXRoOiBzdHJpbmcsXG5cdG91dHB1dFBhdGg6IHN0cmluZyxcblx0aW5wdXRPcHRpb25zPzogUGFydGlhbDxJVHh0TWVyZ2VPcHRpb25zPixcbik6IEJsdWViaXJkUHJvbWlzZTx7XG5cdGZpbGVuYW1lOiBzdHJpbmcsXG5cdGZ1bGxwYXRoOiBzdHJpbmcsXG5cdGRhdGE6IHN0cmluZyxcbn0+XG5leHBvcnQgZnVuY3Rpb24gdHh0TWVyZ2UoaW5wdXRQYXRoOiBzdHJpbmcsXG5cdG91dHB1dFBhdGg6IHN0cmluZyxcblx0b3V0cHV0RmlsZW5hbWU/OiBzdHJpbmcsXG5cdGlucHV0T3B0aW9ucz86IFBhcnRpYWw8SVR4dE1lcmdlT3B0aW9ucz4sXG4pOiBCbHVlYmlyZFByb21pc2U8e1xuXHRmaWxlbmFtZTogc3RyaW5nLFxuXHRmdWxscGF0aDogc3RyaW5nLFxuXHRkYXRhOiBzdHJpbmcsXG59PlxuZXhwb3J0IGZ1bmN0aW9uIHR4dE1lcmdlKGlucHV0UGF0aDogc3RyaW5nLFxuXHRvdXRwdXRQYXRoOiBzdHJpbmcsXG5cdG91dHB1dEZpbGVuYW1lPzogc3RyaW5nLFxuXHRub1NhdmU/OiBib29sZWFuLFxuXHRpbnB1dE9wdGlvbnM/OiBQYXJ0aWFsPElUeHRNZXJnZU9wdGlvbnM+LFxuKTogQmx1ZWJpcmRQcm9taXNlPHtcblx0ZmlsZW5hbWU6IHN0cmluZyxcblx0ZnVsbHBhdGg6IHN0cmluZyxcblx0ZGF0YTogc3RyaW5nLFxufT5cbmV4cG9ydCBmdW5jdGlvbiB0eHRNZXJnZShpbnB1dFBhdGg6IHN0cmluZyB8IFBhcnRpYWw8SVR4dE1lcmdlT3B0aW9ucz4sXG5cdG91dHB1dFBhdGg/OiBzdHJpbmcgfCBQYXJ0aWFsPElUeHRNZXJnZU9wdGlvbnM+LFxuXHRvdXRwdXRGaWxlbmFtZT86IHN0cmluZyB8IFBhcnRpYWw8SVR4dE1lcmdlT3B0aW9ucz4sXG5cdG5vU2F2ZT86IGJvb2xlYW4gfCBQYXJ0aWFsPElUeHRNZXJnZU9wdGlvbnM+LFxuXHRpbnB1dE9wdGlvbnM/OiBQYXJ0aWFsPElUeHRNZXJnZU9wdGlvbnM+LFxuKTogQmx1ZWJpcmRQcm9taXNlPHtcblx0ZmlsZW5hbWU6IHN0cmluZyxcblx0ZnVsbHBhdGg6IHN0cmluZyxcblx0ZGF0YTogc3RyaW5nLFxufT5cbntcblx0aWYgKHR5cGVvZiBpbnB1dFBhdGggPT09ICdvYmplY3QnKVxuXHR7XG5cdFx0aW5wdXRPcHRpb25zID0gaW5wdXRQYXRoO1xuXG5cdFx0KHtpbnB1dFBhdGgsIG91dHB1dFBhdGgsIG91dHB1dEZpbGVuYW1lLCBub1NhdmV9ID0gaW5wdXRPcHRpb25zKTtcblx0fVxuXHRlbHNlIGlmIChvdXRwdXRQYXRoICE9IG51bGwgJiYgdHlwZW9mIG91dHB1dFBhdGggPT09ICdvYmplY3QnKVxuXHR7XG5cdFx0aW5wdXRPcHRpb25zID0gb3V0cHV0UGF0aDtcblxuXHRcdCh7b3V0cHV0UGF0aCwgb3V0cHV0RmlsZW5hbWUsIG5vU2F2ZX0gPSBpbnB1dE9wdGlvbnMpO1xuXHR9XG5cdGVsc2UgaWYgKG91dHB1dEZpbGVuYW1lICE9IG51bGwgJiYgdHlwZW9mIG91dHB1dEZpbGVuYW1lID09PSAnb2JqZWN0Jylcblx0e1xuXHRcdGlucHV0T3B0aW9ucyA9IG91dHB1dEZpbGVuYW1lO1xuXG5cdFx0KHtvdXRwdXRGaWxlbmFtZSwgbm9TYXZlfSA9IGlucHV0T3B0aW9ucyk7XG5cdH1cblx0ZWxzZSBpZiAobm9TYXZlICE9IG51bGwgJiYgdHlwZW9mIG5vU2F2ZSA9PT0gJ29iamVjdCcpXG5cdHtcblx0XHRpbnB1dE9wdGlvbnMgPSBub1NhdmU7XG5cblx0XHQoe25vU2F2ZX0gPSBpbnB1dE9wdGlvbnMpO1xuXHR9XG5cblx0bGV0IF9vID0gbWFrZURlZmF1bHRUcGxEYXRhKGlucHV0T3B0aW9ucywge1xuXHRcdGlucHV0UGF0aCxcblx0XHRvdXRwdXRQYXRoLFxuXHRcdG91dHB1dEZpbGVuYW1lLFxuXHRcdG5vU2F2ZSxcblx0fSk7XG5cblx0aW5wdXRPcHRpb25zID0gX28uaW5wdXRPcHRpb25zO1xuXHRsZXQgdHBsQmFzZURhdGEgPSBfby50cGxCYXNlRGF0YTtcblxuXHRyZXR1cm4gQmx1ZWJpcmRQcm9taXNlLnJlc29sdmUoKS50aGVuKGFzeW5jIGZ1bmN0aW9uICgpXG5cdHtcblx0XHRjb25zdCBUWFRfUEFUSDogc3RyaW5nID0gaW5wdXRPcHRpb25zLmlucHV0UGF0aDtcblx0XHRjb25zdCBQQVRIX0NXRDogc3RyaW5nID0gaW5wdXRPcHRpb25zLm91dHB1dFBhdGg7XG5cdFx0Y29uc3Qgb3V0cHV0RGlyUGF0aFByZWZpeCA9ICdvdXQnO1xuXG5cdFx0aWYgKCFpbnB1dFBhdGggfHwgIW91dHB1dFBhdGggfHwgdHlwZW9mIGlucHV0UGF0aCAhPSAnc3RyaW5nJyB8fCB0eXBlb2Ygb3V0cHV0UGF0aCAhPSAnc3RyaW5nJylcblx0XHR7XG5cdFx0XHR0aHJvdyBuZXcgUmVmZXJlbmNlRXJyb3IoJ211c3Qgc2V0IGlucHV0UGF0aCwgb3V0cHV0UGF0aCcpO1xuXHRcdH1cblxuXHRcdGxldCBnbG9iYnlfcGF0dGVybnM6IHN0cmluZ1tdO1xuXHRcdGxldCBnbG9iYnlfb3B0aW9uczogbm92ZWxHbG9iYnkuSU9wdGlvbnMgPSB7XG5cdFx0XHRjd2Q6IFRYVF9QQVRILFxuXHRcdFx0dXNlRGVmYXVsdFBhdHRlcm5zRXhjbHVkZTogdHJ1ZSxcblx0XHRcdGFic29sdXRlOiB0cnVlLFxuXHRcdH07XG5cblx0XHR7XG5cdFx0XHRbZ2xvYmJ5X3BhdHRlcm5zLCBnbG9iYnlfb3B0aW9uc10gPSBub3ZlbEdsb2JieS5nZXRPcHRpb25zMihnbG9iYnlfb3B0aW9ucyk7XG5cblx0XHRcdC8vZ2xvYmJ5X3BhdHRlcm5zLnB1c2goJyEqLyovKi8qKi8qJyk7XG5cdFx0fVxuXG5cdFx0bGV0IG1ldGE6IElNZGNvbmZNZXRhO1xuXG5cdFx0Ly9jb25zb2xlLmluZm8oYFBBVEhfQ1dEOiAke1BBVEhfQ1dEfVxcbmApO1xuXG5cdFx0Ly9jb25zb2xlLmxvZyhnbG9iYnlfcGF0dGVybnMpO1xuXHRcdC8vY29uc29sZS5sb2coZ2xvYmJ5X29wdGlvbnMpO1xuXG5cdFx0Ly8gQHRzLWlnbm9yZVxuXHRcdG1ldGEgPSBhd2FpdCBub3ZlbEdsb2JieUJhc2UuZ2xvYmJ5QVN5bmMoW1xuXHRcdFx0XHQnUkVBRE1FLm1kJyxcblx0XHRcdF0sIGdsb2JieV9vcHRpb25zKVxuXHRcdFx0Ly8udGhlbihzb3J0VHJlZSlcblx0XHRcdC50YXAoZnVuY3Rpb24gKGxzKVxuXHRcdFx0e1xuXHRcdFx0XHQvL2NvbnNvbGUubG9nKGxzKTtcblx0XHRcdH0pXG5cdFx0XHQudGhlbihhc3luYyBmdW5jdGlvbiAobHMpXG5cdFx0XHR7XG5cdFx0XHRcdGxldCBkYXRhID0gYXdhaXQgZnMucmVhZEZpbGUobHNbMF0pO1xuXG5cdFx0XHRcdHJldHVybiBtZGNvbmZfcGFyc2UoZGF0YSwge1xuXHRcdFx0XHRcdHRocm93OiBmYWxzZSxcblx0XHRcdFx0fSk7XG5cdFx0XHR9KVxuXHRcdFx0LnRhcChmdW5jdGlvbiAobHMpXG5cdFx0XHR7XG5cdFx0XHRcdC8vY29uc29sZS5sb2cobHMpO1xuXHRcdFx0fSlcblx0XHRcdC5jYXRjaChmdW5jdGlvbiAoKVxuXHRcdFx0e1xuXHRcdFx0XHRjb25zb2xlLndhcm4oYFtXQVJOXSBSRUFETUUubWQgbm90IGV4aXN0cyEgKCR7cGF0aC5qb2luKGdsb2JieV9vcHRpb25zLmN3ZCwgJ1JFQURNRS5tZCcpfSlgKTtcblx0XHRcdH0pXG5cdFx0O1xuXG5cdFx0Ly9jb25zb2xlLmxvZyhnbG9iYnlfcGF0dGVybnMpO1xuXG5cdFx0cmV0dXJuIG5vdmVsR2xvYmJ5QmFzZS5nbG9iYnlBU3luYyhnbG9iYnlfcGF0dGVybnMsIGdsb2JieV9vcHRpb25zKVxuXHRcdFx0LnRoZW4obHMgPT4gc29ydFRyZWUobHMsIG51bGwsIGdsb2JieV9vcHRpb25zKSlcblx0XHRcdC50aGVuKGZ1bmN0aW9uIChscylcblx0XHRcdHtcblx0XHRcdFx0cmV0dXJuIG5vdmVsR2xvYmJ5Lmdsb2JUb0xpc3RBcnJheURlZXAobHMsIGdsb2JieV9vcHRpb25zKVxuXHRcdFx0fSlcblx0XHRcdC50YXAoZnVuY3Rpb24gKGxzKVxuXHRcdFx0e1xuXHRcdFx0XHQvL2NvbnNvbGUubG9nKGxzKTtcblx0XHRcdFx0Ly90aHJvdyBuZXcgRXJyb3IoJ3Rlc3QnKTtcblx0XHRcdFx0Ly9wcm9jZXNzLmV4aXQoKTtcblx0XHRcdH0pXG5cdFx0XHQudGhlbihmdW5jdGlvbiAoX2xzKVxuXHRcdFx0e1xuXHRcdFx0XHRpZiAoIV9scyB8fCAhT2JqZWN0LmtleXMoX2xzKS5sZW5ndGgpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHQvLyBAdHMtaWdub3JlXG5cdFx0XHRcdFx0cmV0dXJuIEJsdWViaXJkUHJvbWlzZS5yZWplY3QoYOaykuacieWPr+WQiOS9teeahOaqlOahiOWtmOWcqGApO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly9sZXQgY291bnRfZiA9IDA7XG5cdFx0XHRcdC8vbGV0IGNvdW50X2QgPSAwO1xuXG5cdFx0XHRcdC8vbGV0IGNvdW50X2lkeCA9IDA7XG5cblx0XHRcdFx0cmV0dXJuIGZvcmVhY2hBcnJheURlZXBBc3luYyhfbHMgYXMgSUFycmF5RGVlcEludGVyZmFjZTxJUmV0dXJuUm93PiwgYXN5bmMgKHtcblx0XHRcdFx0XHR2YWx1ZSxcblx0XHRcdFx0XHRpbmRleCxcblx0XHRcdFx0XHRhcnJheSxcblx0XHRcdFx0XHRjYWNoZSxcblx0XHRcdFx0fSkgPT5cblx0XHRcdFx0e1xuXHRcdFx0XHRcdGNvbnN0IHsgdm9sdW1lX3RpdGxlLCBjaGFwdGVyX3RpdGxlIH0gPSB2YWx1ZTtcblx0XHRcdFx0XHRjb25zdCB7IHRlbXAsIGRhdGEgfSA9IGNhY2hlO1xuXG5cdFx0XHRcdFx0Ly90ZW1wLmNhY2hlX3ZvbCA9IHRlbXAuY2FjaGVfdm9sIHx8IHt9O1xuXHRcdFx0XHRcdC8vdGVtcC50b2MgPSB0ZW1wLnRvYyB8fCBbXTtcblx0XHRcdFx0XHQvL3RlbXAuY29udGV4dCA9IHRlbXAuY29udGV4dCB8fCBbXTtcblxuXHRcdFx0XHRcdGxldCB2c19yZXQgPSBlYWNoVm9sdW1lVGl0bGUodm9sdW1lX3RpdGxlLCB0cnVlKTtcblxuXHRcdFx0XHRcdHZzX3JldC50aXRsZXNfZnVsbFxuXHRcdFx0XHRcdFx0LmZvckVhY2goZnVuY3Rpb24gKGtleSwgaW5kZXgpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0bGV0IHRpdGxlID0gdnNfcmV0LnRpdGxlc1tpbmRleF07XG5cblx0XHRcdFx0XHRcdGlmICh0ZW1wLmNhY2hlX3ZvbFtrZXldID09IG51bGwpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdGRhdGEudG9jLnB1c2goJy0gJy5yZXBlYXQoaW5kZXggKyAxKSArIHRpdGxlKTtcblxuXHRcdFx0XHRcdFx0XHR0ZW1wLmNvdW50X2QrKztcblxuXHRcdFx0XHRcdFx0XHR0ZW1wLmNhY2hlX3ZvbFtrZXldID0gKHRlbXAuY2FjaGVfdm9sW2tleV0gfCAwKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdDtcblxuXHRcdFx0XHRcdGxldCB2aSA9IHZzX3JldC5sZXZlbCAtIDE7XG5cblx0XHRcdFx0XHRsZXQgdm9sX2tleSA9IHZzX3JldC50aXRsZXNfZnVsbFt2aV07XG5cblx0XHRcdFx0XHR0ZW1wLmNhY2hlX3ZvbFt2b2xfa2V5XSsrO1xuXG5cdFx0XHRcdFx0aWYgKHRlbXAucHJldl92b2x1bWVfdGl0bGUgIT0gdm9sdW1lX3RpdGxlKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdC8vbGV0IF92b2xfcHJlZml4ID0gYOesrCR7U3RyaW5nKCsrdGVtcC5jb3VudF9pZHgpLnBhZFN0YXJ0KDUsICcwJyl956ug77yaJHt2b2xfa2V5fSR7ZW9sfWA7XG5cblx0XHRcdFx0XHRcdC8vZGF0YS5jb250ZXh0LnB1c2goYCR7aHIxfUNIRUNLJHtlb2x9JHtfdm9sX3ByZWZpeH0ke3ZzX3JldC50aXRsZXNbdmldfSR7ZW9sfSR7aHIxfSR7ZW9sfWApO1xuXG5cdFx0XHRcdFx0XHRsZXQgX3ZvbF9wcmVmaXggPSBg56ysJHtTdHJpbmcoKyt0ZW1wLmNvdW50X2lkeCkucGFkU3RhcnQoNSwgJzAnKX3nq6DvvJoke3ZvbF9rZXl9YDtcblxuXHRcdFx0XHRcdFx0bGV0IHMgPSByZXBsYWNlVHBsKGlucHV0T3B0aW9ucy50cGxWb2x1bWVTdGFydCwge1xuXHRcdFx0XHRcdFx0XHQuLi50cGxCYXNlRGF0YSxcblx0XHRcdFx0XHRcdFx0cHJlZml4OiBfdm9sX3ByZWZpeCxcblx0XHRcdFx0XHRcdFx0dGl0bGU6IHZzX3JldC50aXRsZXNbdmldLFxuXHRcdFx0XHRcdFx0fSk7XG5cblx0XHRcdFx0XHRcdGRhdGEuY29udGV4dC5wdXNoKGAke2lucHV0T3B0aW9ucy5ocjAxfSR7ZW9sfSR7c30ke2VvbH0ke2lucHV0T3B0aW9ucy5ocjAyfSR7ZW9sfWApO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGRhdGEudG9jLnB1c2goJy0gJy5yZXBlYXQodnNfcmV0LmxldmVsICsgMSkgKyBjaGFwdGVyX3RpdGxlKTtcblxuXHRcdFx0XHRcdC8vbGV0IF9wcmVmaXggPSBg56ysJHtTdHJpbmcoKyt0ZW1wLmNvdW50X2lkeCkucGFkU3RhcnQoNSwgJzAnKX3oqbHvvJoke2NoYXB0ZXJfdGl0bGV9JHtlb2x9YDtcblx0XHRcdFx0XHRsZXQgX3ByZWZpeCA9IGDnrKwke1N0cmluZygrK3RlbXAuY291bnRfaWR4KS5wYWRTdGFydCg1LCAnMCcpfeipse+8miR7Y2hhcHRlcl90aXRsZX1gO1xuXG5cdFx0XHRcdFx0bGV0IHR4dCA9IGF3YWl0IGZzLnJlYWRGaWxlKHZhbHVlLnBhdGgpO1xuXG5cdFx0XHRcdFx0dGVtcC5jb3VudF9mKys7XG5cblx0XHRcdFx0XHQvL2RhdGEuY29udGV4dC5wdXNoKGAke2hyMn1CRUdJTiR7ZW9sfSR7X3ByZWZpeH0ke2NoYXB0ZXJfdGl0bGV9JHtlb2x9JHtocjJ9Qk9EWSR7ZW9sMn0ke3R4dH0ke2VvbDJ9JHtocjJ9RU5EJHtlb2wyfWApO1xuXG5cdFx0XHRcdFx0bGV0IHMgPSByZXBsYWNlVHBsKGlucHV0T3B0aW9ucy50cGxWb2x1bWVTdGFydCwge1xuXHRcdFx0XHRcdFx0Li4udHBsQmFzZURhdGEsXG5cdFx0XHRcdFx0XHRwcmVmaXg6IF9wcmVmaXgsXG5cdFx0XHRcdFx0XHR0aXRsZTogY2hhcHRlcl90aXRsZSxcblx0XHRcdFx0XHR9KTtcblxuXHRcdFx0XHRcdGRhdGEuY29udGV4dC5wdXNoKGAke2lucHV0T3B0aW9ucy5ocjExfSR7ZW9sfSR7c30ke2VvbH0ke2lucHV0T3B0aW9ucy5ocjEyfSR7ZW9sMn0ke3R4dH0ke2VvbDJ9JHtpbnB1dE9wdGlvbnMuaHIxM30ke2VvbDJ9YCk7XG5cblx0XHRcdFx0XHR0ZW1wLnByZXZfdm9sdW1lX3RpdGxlID0gdm9sdW1lX3RpdGxlO1xuXG5cdFx0XHRcdH0sIDxJVHh0UnVudGltZVJldHVybj57XG5cblx0XHRcdFx0XHRkYXRhOiB7XG5cdFx0XHRcdFx0XHR0b2M6IFtdIGFzIHN0cmluZ1tdLFxuXHRcdFx0XHRcdFx0Y29udGV4dDogW10gYXMgc3RyaW5nW10sXG5cdFx0XHRcdFx0fSxcblxuXHRcdFx0XHRcdHRlbXA6IHtcblx0XHRcdFx0XHRcdGNhY2hlX3ZvbDoge30sXG5cblx0XHRcdFx0XHRcdHByZXZfdm9sdW1lX3RpdGxlOiBudWxsLFxuXG5cdFx0XHRcdFx0XHRjb3VudF9pZHg6IDAsXG5cdFx0XHRcdFx0XHRjb3VudF9mOiAwLFxuXHRcdFx0XHRcdFx0Y291bnRfZDogMCxcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHR9KVxuXHRcdFx0XHRcdC50YXAoZnVuY3Rpb24gKHJldClcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHQvL2NvbnNvbGUuZGlyKHJldC50ZW1wKTtcblxuXHRcdFx0XHRcdFx0Ly9jb25zb2xlLmxvZyhyZXQudGVtcC5jb250ZXh0LmpvaW4oZW9sKSk7XG5cblx0XHRcdFx0XHRcdC8vcHJvY2Vzcy5leGl0KCk7XG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0XHQudGhlbihhc3luYyBmdW5jdGlvbiAocHJvY2Vzc1JldHVybilcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRsZXQgYSA9IHByb2Nlc3NSZXR1cm4uZGF0YS5jb250ZXh0O1xuXG5cdFx0XHRcdFx0XHRsZXQgZmlsZW5hbWUyID0gbWFrZUZpbGVuYW1lKG1ldGEsIGlucHV0T3B0aW9ucy5vdXRwdXRGaWxlbmFtZSwgYSwgX2xzLCB7XG5cdFx0XHRcdFx0XHRcdFRYVF9QQVRILFxuXHRcdFx0XHRcdFx0XHRwcm9jZXNzUmV0dXJuLFxuXHRcdFx0XHRcdFx0XHRpbnB1dE9wdGlvbnMsXG5cdFx0XHRcdFx0XHRcdHRwbEJhc2VEYXRhLFxuXHRcdFx0XHRcdFx0fSk7XG5cblx0XHRcdFx0XHRcdGxldCB0eHQgPSBhLmpvaW4oZW9sKTtcblx0XHRcdFx0XHRcdHR4dCA9IGNybGYodHh0LCBlb2wpO1xuXG5cdFx0XHRcdFx0XHRsZXQgZnVsbHBhdGggPSBwYXRoLmpvaW4oUEFUSF9DV0QsIG91dHB1dERpclBhdGhQcmVmaXgsIGAke2ZpbGVuYW1lMn1gKTtcblxuXHRcdFx0XHRcdFx0aWYgKCFub1NhdmUpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdGF3YWl0IGZzLm91dHB1dEZpbGUoZnVsbHBhdGgsIHR4dCk7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0XHRcdGZpbGVuYW1lOiBmaWxlbmFtZTIsXG5cdFx0XHRcdFx0XHRcdGZ1bGxwYXRoLFxuXHRcdFx0XHRcdFx0XHRkYXRhOiB0eHQsXG5cblx0XHRcdFx0XHRcdFx0dGVtcDogcHJvY2Vzc1JldHVybi50ZW1wLFxuXHRcdFx0XHRcdFx0fTtcblx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdC50YXAoZnVuY3Rpb24gKGRhdGEpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0Y29uc29sZS5zdWNjZXNzKCdbRE9ORV0gZG9uZS4nKTtcblxuXHRcdFx0XHRcdFx0Y29uc29sZS5pbmZvKGBUb3RhbCBEOiAke2RhdGEudGVtcC5jb3VudF9kfVxcblRvdGFsIEY6ICR7ZGF0YS50ZW1wLmNvdW50X2Z9XFxuXFxuW0ZJTEVOQU1FXSAke2RhdGEuZmlsZW5hbWV9YCk7XG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0XHQvLyBAdHMtaWdub3JlXG5cdFx0XHRcdFx0LnRhcENhdGNoKGZ1bmN0aW9uIChlKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGNvbnNvbGUuZXJyb3IoYFtFUlJPUl0gc29tZXRoaW5nIHdyb25nISFgKTtcblx0XHRcdFx0XHRcdGNvbnNvbGUudHJhY2UoZSk7XG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0XHQ7XG5cdFx0XHR9KVxuXHRcdFx0LnRhcENhdGNoKGZ1bmN0aW9uIChlKVxuXHRcdFx0e1xuXHRcdFx0XHRjb25zb2xlLmVycm9yKGBbRVJST1JdIGNhbid0IGZvdW5kIGFueSBmaWxlIGluICcke1RYVF9QQVRIfSdgKTtcblx0XHRcdFx0Y29uc29sZS50cmFjZShlKTtcblx0XHRcdH0pXG5cdFx0XHQ7XG5cdH0pXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRNZXRhVGl0bGVzKG1ldGE6IElNZGNvbmZNZXRhKTogc3RyaW5nW11cbntcblx0cmV0dXJuIGdldE5vdmVsVGl0bGVGcm9tTWV0YShtZXRhKTtcbn1cblxuLyoqXG4gKiDlm57lgrPomZXnkIblvoznmoTmqpTmoYjlkI3nqLFcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1ha2VGaWxlbmFtZShtZXRhPzogSU1kY29uZk1ldGEsIG91dHB1dEZpbGVuYW1lPzogc3RyaW5nLCBhOiBzdHJpbmdbXSA9IFtdLCBfbHM/OiBJQXJyYXlEZWVwSW50ZXJmYWNlPElSZXR1cm5Sb3c+LCBfYXJndjoge1xuXHRUWFRfUEFUSD86IHN0cmluZyxcblx0cHJvY2Vzc1JldHVybj86IElUeHRSdW50aW1lUmV0dXJuLFxuXHRpbnB1dE9wdGlvbnM/OiBSZXR1cm5UeXBlPHR5cGVvZiBtYWtlRGVmYXVsdFRwbERhdGE+W1wiaW5wdXRPcHRpb25zXCJdLFxuXHR0cGxCYXNlRGF0YT86IFJldHVyblR5cGU8dHlwZW9mIG1ha2VEZWZhdWx0VHBsRGF0YT5bXCJ0cGxCYXNlRGF0YVwiXSxcbn0gPSB7fSBhcyBhbnkpOiBzdHJpbmdcbntcblx0bGV0IHsgaW5wdXRPcHRpb25zLCB0cGxCYXNlRGF0YSB9ID0gX2FyZ3Y7XG5cblx0YS51bnNoaWZ0KGVvbCk7XG5cdGEudW5zaGlmdChUUExfSFIxICsgJ1NUQVJUJyk7XG5cblx0aWYgKF9hcmd2LnByb2Nlc3NSZXR1cm4gJiYgX2FyZ3YucHJvY2Vzc1JldHVybi5kYXRhLnRvYy5sZW5ndGgpXG5cdHtcblx0XHRsZXQgcmV0ID0gX2FyZ3YucHJvY2Vzc1JldHVybi5kYXRhLnRvYztcblxuXHRcdHJldC51bnNoaWZ0KGDnm67pjITntKLlvJXvvJpgKTtcblx0XHRyZXQucHVzaChocjIgKyBlb2wpO1xuXG5cdFx0YS51bnNoaWZ0KHJldC5qb2luKGVvbCkpO1xuXHR9XG5cblx0Y29uc3QgbWV0YUxpYiA9IG5ldyBOb2RlTm92ZWxJbmZvKG1ldGEsIHtcblx0XHR0aHJvdzogZmFsc2UsXG5cdFx0bG93Q2hlY2tMZXZlbDogdHJ1ZSxcblx0fSk7XG5cblx0aWYgKG1ldGEgJiYgbWV0YS5ub3ZlbClcblx0e1xuXHRcdGxldCB0eHQgPSBgJHttZXRhLm5vdmVsLnRpdGxlfSR7ZW9sfSR7bWV0YS5ub3ZlbC5hdXRob3J9JHtlb2x9JHttZXRhTGliLnNvdXJjZXMoKVxuXHRcdFx0LmpvaW4oZW9sKX0ke2VvbH0ke2VvbH0ke21ldGEubm92ZWwucHJlZmFjZX0ke2VvbH0ke2VvbH1gO1xuXG5cdFx0bGV0IGEyID0gW107XG5cblx0XHRsZXQgbm92ZWxJRCA9IF9hcmd2ICYmIF9hcmd2LlRYVF9QQVRIICYmIHBhdGguYmFzZW5hbWUoX2FyZ3YuVFhUX1BBVEgpIHx8ICcnO1xuXG5cdFx0bGV0IHRpdGxlcyA9IFtub3ZlbElEXS5jb25jYXQobWV0YUxpYi50aXRsZXMoKSlcblx0XHRcdC5maWx0ZXIodiA9PiB2ICYmIHYgIT0gbWV0YS5ub3ZlbC50aXRsZSlcblx0XHQ7XG5cblx0XHRpZiAodGl0bGVzLmxlbmd0aClcblx0XHR7XG5cdFx0XHRhMi5wdXNoKGDlhbbku5blkI3nqLHvvJoke2VvbH1gICsgdGl0bGVzLmpvaW4oZW9sKSArIGVvbCk7XG5cdFx0XHRhMi5wdXNoKGhyMik7XG5cdFx0fVxuXG5cdFx0bGV0IF9hcnI6IHN0cmluZ1tdO1xuXHRcdGxldCBfbGFiZWwgPSAnJztcblx0XHRsZXQgX2pvaW4gPSAn44CBJztcblxuXHRcdF9hcnIgPSBtZXRhTGliLmF1dGhvcnMoKVxuXHRcdFx0LmZpbHRlcih2ID0+IHYgJiYgdiAhPSBtZXRhLm5vdmVsLmF1dGhvcilcblx0XHQ7XG5cdFx0X2xhYmVsID0gJ+WFtuS7luS9nOiAhe+8mic7XG5cblx0XHRpZiAoX2FyciAmJiBfYXJyLmxlbmd0aClcblx0XHR7XG5cdFx0XHRhMi5wdXNoKF9sYWJlbCArIF9hcnIuam9pbihfam9pbikgKyBlb2wpO1xuXHRcdH1cblxuXHRcdF9hcnIgPSBtZXRhTGliLmlsbHVzdHMoKTtcblx0XHRfbGFiZWwgPSAn57mq5bir77yaJztcblxuXHRcdGlmIChfYXJyICYmIF9hcnIubGVuZ3RoKVxuXHRcdHtcblx0XHRcdGEyLnB1c2goX2xhYmVsICsgX2Fyci5qb2luKF9qb2luKSArIGVvbCk7XG5cdFx0fVxuXG5cdFx0X2FyciA9IG1ldGFMaWIuY29udHJpYnV0ZXMoKTtcblx0XHRfbGFiZWwgPSAn6LKi54276ICF77yaJztcblxuXHRcdGlmIChfYXJyICYmIF9hcnIubGVuZ3RoKVxuXHRcdHtcblx0XHRcdGEyLnB1c2goX2xhYmVsICsgX2Fyci5qb2luKF9qb2luKSArIGVvbCk7XG5cdFx0fVxuXG5cdFx0X2FyciA9IG1ldGFMaWIudGFncygpO1xuXHRcdF9sYWJlbCA9ICfmqJnnsaTvvJonO1xuXG5cdFx0aWYgKF9hcnIgJiYgX2Fyci5sZW5ndGgpXG5cdFx0e1xuXHRcdFx0YTIucHVzaChfbGFiZWwgKyBfYXJyLmpvaW4oX2pvaW4pICsgZW9sKTtcblx0XHR9XG5cblx0XHRpZiAoYTIubGVuZ3RoKVxuXHRcdHtcblx0XHRcdGEyLnVuc2hpZnQoaHIyKTtcblxuXHRcdFx0YTIucHVzaChocjIpO1xuXG5cdFx0XHR0eHQgKz0gYTIuam9pbihlb2wpO1xuXHRcdH1cblxuLy9cdFx0Y29uc29sZS5sb2codHh0KTtcbi8vXHRcdHByb2Nlc3MuZXhpdCgpO1xuXG5cdFx0YS51bnNoaWZ0KHR4dCk7XG5cdH1cblxuXHRpZiAoaW5wdXRPcHRpb25zLnRwbEJhbm5lclN0YXJ0KVxuXHR7XG5cdFx0bGV0IHMgPSByZXBsYWNlVHBsKGlucHV0T3B0aW9ucy50cGxCYW5uZXJTdGFydCwge1xuXG5cdFx0XHQuLi50cGxCYXNlRGF0YSxcblxuXHRcdFx0dGl0bGU6IG1ldGFMaWIudGl0bGUoKSxcblx0XHRcdGF1dGhvcjogbWV0YUxpYi5hdXRob3JzKCkuam9pbignICwgJyksXG5cdFx0XHRsYW5nOiAnemgtSGFudCcsXG5cdFx0fSk7XG5cblx0XHRhLnVuc2hpZnQocyk7XG5cdH1cblxuXHRsZXQgZmlsZW5hbWU6IHN0cmluZztcblxuXHRpZiAodHlwZW9mIG91dHB1dEZpbGVuYW1lID09ICdzdHJpbmcnICYmIG91dHB1dEZpbGVuYW1lKVxuXHR7XG5cdFx0ZmlsZW5hbWUgPSBvdXRwdXRGaWxlbmFtZTtcblx0fVxuXG5cdGlmICghZmlsZW5hbWUgJiYgbWV0YSAmJiBtZXRhLm5vdmVsKVxuXHR7XG5cdFx0aWYgKG1ldGEubm92ZWwudGl0bGVfc2hvcnQpXG5cdFx0e1xuXHRcdFx0ZmlsZW5hbWUgPSBtZXRhLm5vdmVsLnRpdGxlX3Nob3J0O1xuXHRcdH1cblx0XHRlbHNlIGlmIChtZXRhLm5vdmVsLnRpdGxlKVxuXHRcdHtcblx0XHRcdGZpbGVuYW1lID0gbWV0YS5ub3ZlbC50aXRsZTtcblx0XHR9XG5cdFx0ZWxzZSBpZiAobWV0YS5ub3ZlbC50aXRsZV96aClcblx0XHR7XG5cdFx0XHRmaWxlbmFtZSA9IG1ldGEubm92ZWwudGl0bGVfemg7XG5cdFx0fVxuXHR9XG5cblx0ZmlsZW5hbWUgPSBmaWxlbmFtZSB8fCAndGVtcCc7XG5cblx0bGV0IGZpbGVuYW1lMiA9IHRyaW1GaWxlbmFtZShmaWxlbmFtZSlcblx0XHQucmVwbGFjZSgvXFwuLywgJ18nKVxuXHRcdC5yZXBsYWNlKC9eW18rXFwtXSt8W18rXFwtXSskLywgJycpXG5cdDtcblxuXHRmaWxlbmFtZTIgPSBVU3RyaW5nLmNyZWF0ZShmaWxlbmFtZTIpLnNwbGl0KCcnKS5zbGljZSgwLCAyMCkuam9pbignJyk7XG5cdGZpbGVuYW1lMiA9IHRyaW1GaWxlbmFtZShmaWxlbmFtZTIpO1xuXG5cdGlmICghZmlsZW5hbWUyKVxuXHR7XG5cdFx0Y29uc29sZS5lcnJvcihgW0VSUk9SXSBCYWQgRmlsZW5hbWU6ICR7ZmlsZW5hbWV9ID0+ICR7ZmlsZW5hbWUyfWApO1xuXG5cdFx0ZmlsZW5hbWUyID0gJ3RlbXAnO1xuXHR9XG5cblx0ZmlsZW5hbWUgKz0gJ18nICsgbW9tZW50KCkubG9jYWwoKS5mb3JtYXQoJ1lZWVlNTURESEhtbScpO1xuXG5cdGZpbGVuYW1lMiA9IGAke2ZpbGVuYW1lMn0ub3V0LnR4dGA7XG5cblx0cmV0dXJuIGZpbGVuYW1lMjtcbn1cblxuZXhwb3J0IGRlZmF1bHQgdHh0TWVyZ2U7XG4iXX0=