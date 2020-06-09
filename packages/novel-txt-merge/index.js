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
    if (inputOptions && inputOptions.tplBannerStart) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7O0FBR0gsaURBQWtEO0FBQ2xELHVEQUF3RDtBQUN4RCw2QkFBOEI7QUFDOUIsNENBQTZDO0FBQzdDLGlDQUFrQztBQUNsQyxxREFBNEQ7QUFDNUQsbURBQWdEO0FBQ2hELHVDQUE0QztBQUM1QywyQ0FBaUM7QUFDakMsK0RBQTJEO0FBSTNELGlEQUFzRDtBQUN0RCxxREFBd0Q7QUFDeEQscURBS29DO0FBQ3BDLG1DQVNtQjtBQUNuQix1Q0FBc0U7QUFFdEUsTUFBTSxNQUFNLEdBQUcsZ0JBQVUsQ0FBQztBQUMxQixNQUFNLEdBQUcsR0FBRyxhQUFPLENBQUM7QUFDcEIsTUFBTSxJQUFJLEdBQUcsY0FBUSxDQUFDO0FBRXRCLE1BQU0sR0FBRyxHQUFHLGFBQU8sQ0FBQztBQUNwQixNQUFNLEdBQUcsR0FBRyxhQUFPLENBQUM7QUFtSHBCLFNBQWdCLFFBQVEsQ0FBQyxTQUE2QyxFQUNyRSxVQUErQyxFQUMvQyxjQUFtRCxFQUNuRCxNQUE0QyxFQUM1QyxZQUF3QztJQU94QyxJQUFJLE9BQU8sU0FBUyxLQUFLLFFBQVEsRUFDakM7UUFDQyxZQUFZLEdBQUcsU0FBUyxDQUFDO1FBRXpCLENBQUMsRUFBQyxTQUFTLEVBQUUsVUFBVSxFQUFFLGNBQWMsRUFBRSxNQUFNLEVBQUMsR0FBRyxZQUFZLENBQUMsQ0FBQztLQUNqRTtTQUNJLElBQUksVUFBVSxJQUFJLElBQUksSUFBSSxPQUFPLFVBQVUsS0FBSyxRQUFRLEVBQzdEO1FBQ0MsWUFBWSxHQUFHLFVBQVUsQ0FBQztRQUUxQixDQUFDLEVBQUMsVUFBVSxFQUFFLGNBQWMsRUFBRSxNQUFNLEVBQUMsR0FBRyxZQUFZLENBQUMsQ0FBQztLQUN0RDtTQUNJLElBQUksY0FBYyxJQUFJLElBQUksSUFBSSxPQUFPLGNBQWMsS0FBSyxRQUFRLEVBQ3JFO1FBQ0MsWUFBWSxHQUFH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SSxNQUFNLENBQUM7SUFFOUIsSUFBSSxTQUFTLEdBQUcsdUJBQVksQ0FBQyxRQUFRLENBQUM7U0FDcEMsT0FBTyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUM7U0FDbEIsT0FBTyxDQUFDLG1CQUFtQixFQUFFLEVBQUUsQ0FBQyxDQUNqQztJQUVELFNBQVMsR0FBRyxvQkFBTyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDdEUsU0FBUyxHQUFHLHVCQUFZLENBQUMsU0FBUyxDQUFDLENBQUM7SUFFcEMsSUFBSSxDQUFDLFNBQVMsRUFDZDtRQUNDLGVBQU8sQ0FBQyxLQUFLLENBQUMseUJBQXlCLFFBQVEsT0FBTyxTQUFTLEVBQUUsQ0FBQyxDQUFDO1FBRW5FLFNBQVMsR0FBRyxNQUFNLENBQUM7S0FDbkI7SUFFRCxRQUFRLElBQUksR0FBRyxHQUFHLE1BQU0sRUFBRSxDQUFDLEtBQUssRUFBRSxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsQ0FBQztJQUUxRCxTQUFTLEdBQUcsR0FBRyxTQUFTLFVBQVUsQ0FBQztJQUVuQyxPQUFPLFNBQVMsQ0FBQztBQUNsQixDQUFDO0FBOUpELG9DQThKQztBQUVELGtCQUFlLFFBQVEsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ3JlYXRlZCBieSB1c2VyIG9uIDIwMTgvMS8yOC8wMjguXG4gKi9cblxuaW1wb3J0IHsgSUFycmF5RGVlcEludGVyZmFjZSwgSVJldHVybkxpc3QsIElSZXR1cm5Sb3cgfSBmcm9tICdub2RlLW5vdmVsLWdsb2JieSc7XG5pbXBvcnQgbm92ZWxHbG9iYnkgPSByZXF1aXJlKCdub2RlLW5vdmVsLWdsb2JieScpO1xuaW1wb3J0IG5vdmVsR2xvYmJ5QmFzZSA9IHJlcXVpcmUoJ25vZGUtbm92ZWwtZ2xvYmJ5L2cnKTtcbmltcG9ydCBwYXRoID0gcmVxdWlyZSgncGF0aCcpO1xuaW1wb3J0IEJsdWViaXJkUHJvbWlzZSA9IHJlcXVpcmUoJ2JsdWViaXJkJyk7XG5pbXBvcnQgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50Jyk7XG5pbXBvcnQgeyBtZGNvbmZfcGFyc2UsIElNZGNvbmZNZXRhIH0gZnJvbSAnbm9kZS1ub3ZlbC1pbmZvJztcbmltcG9ydCB7IGNybGYsIENSTEYsIExGIH0gZnJvbSAnY3JsZi1ub3JtYWxpemUnO1xuaW1wb3J0IGZzLCB7IHRyaW1GaWxlbmFtZSB9IGZyb20gJ2ZzLWljb252JztcbmltcG9ydCBVU3RyaW5nIGZyb20gJ3VuaS1zdHJpbmcnO1xuaW1wb3J0IHsgc29ydFRyZWUgfSBmcm9tICdub2RlLW5vdmVsLWdsb2JieS9saWIvZ2xvYi1zb3J0JztcbmltcG9ydCB7IGFycmF5X3VuaXF1ZSB9IGZyb20gJ2FycmF5LWh5cGVyLXVuaXF1ZSc7XG5pbXBvcnQgeyBub3JtYWxpemVfc3RyaXAgfSBmcm9tICdAbm9kZS1ub3ZlbC9ub3JtYWxpemUnO1xuaW1wb3J0IHsgQ29uc29sZSB9IGZyb20gJ2RlYnVnLWNvbG9yMic7XG5pbXBvcnQgeyBOb2RlTm92ZWxJbmZvIH0gZnJvbSAnbm9kZS1ub3ZlbC1pbmZvL2NsYXNzJztcbmltcG9ydCB7IGdldE5vdmVsVGl0bGVGcm9tTWV0YSB9IGZyb20gJ25vZGUtbm92ZWwtaW5mbyc7XG5pbXBvcnQge1xuXHRlYWNoVm9sdW1lVGl0bGUsXG5cdGZvcmVhY2hBcnJheURlZXBBc3luYyxcblx0SUZvcmVhY2hBcnJheURlZXBDYWNoZSxcblx0SUZvcmVhY2hBcnJheURlZXBSZXR1cm4sXG59IGZyb20gJ25vZGUtbm92ZWwtZ2xvYmJ5L2xpYi91dGlsJztcbmltcG9ydCB7XG5cdEVudW1UeHRTdHlsZSxcblx0VFBMX0NIQVBURVJfU1RBUlQsXG5cdFRQTF9FT0wsXG5cdFRQTF9FT0wyLFxuXHRUUExfSFIxLFxuXHRUUExfSFIyLFxuXHRUUExfSFJfTEVOLFxuXHRUUExfVk9MVU1FX1NUQVJULFxufSBmcm9tICcuL2xpYi90cGwnO1xuaW1wb3J0IHsgY29uc29sZSwgbWFrZURlZmF1bHRUcGxEYXRhLCByZXBsYWNlVHBsIH0gZnJvbSAnLi9saWIvaW5kZXgnO1xuXG5jb25zdCBocl9sZW4gPSBUUExfSFJfTEVOO1xuY29uc3QgZW9sID0gVFBMX0VPTDtcbmNvbnN0IGVvbDIgPSBUUExfRU9MMjtcblxuY29uc3QgaHIxID0gVFBMX0hSMTtcbmNvbnN0IGhyMiA9IFRQTF9IUjI7XG5cbmV4cG9ydCB0eXBlIElUeHRSdW50aW1lUmV0dXJuID0gSUZvcmVhY2hBcnJheURlZXBSZXR1cm48SVJldHVyblJvdywgYW55LCB7XG5cdHRvYzogc3RyaW5nW10sXG5cdGNvbnRleHQ6IHN0cmluZ1tdLFxufSwge1xuXHRjYWNoZV92b2w6IHtcblx0XHRbdm9sOiBzdHJpbmddOiBudW1iZXI7XG5cdH0sXG5cblx0cHJldl92b2x1bWVfdGl0bGU6IHN0cmluZyxcblxuXHRjb3VudF9pZHg6IG51bWJlcixcblx0Y291bnRfZjogbnVtYmVyLFxuXHRjb3VudF9kOiBudW1iZXIsXG5cbn0+XG5cbmV4cG9ydCBpbnRlcmZhY2UgSVR4dE1lcmdlT3B0aW9uc1xue1xuXHRpbnB1dFBhdGg6IHN0cmluZyxcblx0b3V0cHV0UGF0aDogc3RyaW5nLFxuXHRvdXRwdXRGaWxlbmFtZT86IHN0cmluZyxcblx0bm9TYXZlPzogYm9vbGVhbixcblx0LyoqXG5cdCAqIOaqlOahiOmWi+mgrVxuXHQgKi9cblx0dHBsQmFubmVyU3RhcnQ/OiBzdHJpbmcsXG5cdC8qKlxuXHQgKiDnq6Ag6aKo5qC8XG5cdCovXG5cdHRwbFZvbHVtZVN0YXJ0Pzogc3RyaW5nLFxuXHQvKipcblx0ICog6KmxIOmiqOagvFxuXHQgKi9cblx0dHBsQ2hhcHRlclN0YXJ0Pzogc3RyaW5nLFxuXG5cdC8qKlxuXHQgKiDliIbpmpTnt5og56ugIOmWi+Wni1xuXHQgKi9cblx0aHIwMT86IHN0cmluZztcblx0LyoqXG5cdCAqIOWIhumalOe3miDnq6Bcblx0ICovXG5cdGhyMDI/OiBzdHJpbmc7XG5cblx0LyoqXG5cdCAqIOWIhumalOe3miDoqbEg6ZaL5aeLXG5cdCAqL1xuXHRocjExPzogc3RyaW5nO1xuXHQvKipcblx0ICog5YiG6ZqU57eaIOipsSDlhafmlodcblx0ICovXG5cdGhyMTI/OiBzdHJpbmc7XG5cdC8qKlxuXHQgKiDliIbpmpTnt5og6KmxIOe1kOadn1xuXHQgKi9cblx0aHIxMz86IHN0cmluZztcblxuXHQvKipcblx0ICog6aCQ6Kit6aKo5qC8XG5cdCAqL1xuXHR0eHRTdHlsZT86IEVudW1UeHRTdHlsZSxcblxuXHRpbnB1dENvbmZpZ1BhdGg/OiBzdHJpbmcsXG5cbn1cblxuLyoqXG4gKlxuICogQHBhcmFtIGlucHV0UGF0aCDovLjlhaXot6/lvpFcbiAqIEBwYXJhbSBvdXRwdXRQYXRoIOi8uOWHuui3r+W+kVxuICogQHBhcmFtIG91dHB1dEZpbGVuYW1lIOWPg+iAg+eUqOaqlOahiOWQjeeosVxuICogQHBhcmFtIG5vU2F2ZSDkuI3lhLLlrZjmqpTmoYjlg4Xlm57lgrMgdHh0IOWFp+WuuVxuICovXG5leHBvcnQgZnVuY3Rpb24gdHh0TWVyZ2UoaW5wdXRPcHRpb25zPzogUGFydGlhbDxJVHh0TWVyZ2VPcHRpb25zPixcbik6IEJsdWViaXJkUHJvbWlzZTx7XG5cdGZpbGVuYW1lOiBzdHJpbmcsXG5cdGZ1bGxwYXRoOiBzdHJpbmcsXG5cdGRhdGE6IHN0cmluZyxcbn0+XG5leHBvcnQgZnVuY3Rpb24gdHh0TWVyZ2UoaW5wdXRQYXRoOiBzdHJpbmcsXG5cdGlucHV0T3B0aW9ucz86IFBhcnRpYWw8SVR4dE1lcmdlT3B0aW9ucz4sXG4pOiBCbHVlYmlyZFByb21pc2U8e1xuXHRmaWxlbmFtZTogc3RyaW5nLFxuXHRmdWxscGF0aDogc3RyaW5nLFxuXHRkYXRhOiBzdHJpbmcsXG59PlxuZXhwb3J0IGZ1bmN0aW9uIHR4dE1lcmdlKGlucHV0UGF0aDogc3RyaW5nLFxuXHRvdXRwdXRQYXRoOiBzdHJpbmcsXG5cdGlucHV0T3B0aW9ucz86IFBhcnRpYWw8SVR4dE1lcmdlT3B0aW9ucz4sXG4pOiBCbHVlYmlyZFByb21pc2U8e1xuXHRmaWxlbmFtZTogc3RyaW5nLFxuXHRmdWxscGF0aDogc3RyaW5nLFxuXHRkYXRhOiBzdHJpbmcsXG59PlxuZXhwb3J0IGZ1bmN0aW9uIHR4dE1lcmdlKGlucHV0UGF0aDogc3RyaW5nLFxuXHRvdXRwdXRQYXRoOiBzdHJpbmcsXG5cdG91dHB1dEZpbGVuYW1lPzogc3RyaW5nLFxuXHRpbnB1dE9wdGlvbnM/OiBQYXJ0aWFsPElUeHRNZXJnZU9wdGlvbnM+LFxuKTogQmx1ZWJpcmRQcm9taXNlPHtcblx0ZmlsZW5hbWU6IHN0cmluZyxcblx0ZnVsbHBhdGg6IHN0cmluZyxcblx0ZGF0YTogc3RyaW5nLFxufT5cbmV4cG9ydCBmdW5jdGlvbiB0eHRNZXJnZShpbnB1dFBhdGg6IHN0cmluZyxcblx0b3V0cHV0UGF0aDogc3RyaW5nLFxuXHRvdXRwdXRGaWxlbmFtZT86IHN0cmluZyxcblx0bm9TYXZlPzogYm9vbGVhbixcblx0aW5wdXRPcHRpb25zPzogUGFydGlhbDxJVHh0TWVyZ2VPcHRpb25zPixcbik6IEJsdWViaXJkUHJvbWlzZTx7XG5cdGZpbGVuYW1lOiBzdHJpbmcsXG5cdGZ1bGxwYXRoOiBzdHJpbmcsXG5cdGRhdGE6IHN0cmluZyxcbn0+XG5leHBvcnQgZnVuY3Rpb24gdHh0TWVyZ2UoaW5wdXRQYXRoOiBzdHJpbmcgfCBQYXJ0aWFsPElUeHRNZXJnZU9wdGlvbnM+LFxuXHRvdXRwdXRQYXRoPzogc3RyaW5nIHwgUGFydGlhbDxJVHh0TWVyZ2VPcHRpb25zPixcblx0b3V0cHV0RmlsZW5hbWU/OiBzdHJpbmcgfCBQYXJ0aWFsPElUeHRNZXJnZU9wdGlvbnM+LFxuXHRub1NhdmU/OiBib29sZWFuIHwgUGFydGlhbDxJVHh0TWVyZ2VPcHRpb25zPixcblx0aW5wdXRPcHRpb25zPzogUGFydGlhbDxJVHh0TWVyZ2VPcHRpb25zPixcbik6IEJsdWViaXJkUHJvbWlzZTx7XG5cdGZpbGVuYW1lOiBzdHJpbmcsXG5cdGZ1bGxwYXRoOiBzdHJpbmcsXG5cdGRhdGE6IHN0cmluZyxcbn0+XG57XG5cdGlmICh0eXBlb2YgaW5wdXRQYXRoID09PSAnb2JqZWN0Jylcblx0e1xuXHRcdGlucHV0T3B0aW9ucyA9IGlucHV0UGF0aDtcblxuXHRcdCh7aW5wdXRQYXRoLCBvdXRwdXRQYXRoLCBvdXRwdXRGaWxlbmFtZSwgbm9TYXZlfSA9IGlucHV0T3B0aW9ucyk7XG5cdH1cblx0ZWxzZSBpZiAob3V0cHV0UGF0aCAhPSBudWxsICYmIHR5cGVvZiBvdXRwdXRQYXRoID09PSAnb2JqZWN0Jylcblx0e1xuXHRcdGlucHV0T3B0aW9ucyA9IG91dHB1dFBhdGg7XG5cblx0XHQoe291dHB1dFBhdGgsIG91dHB1dEZpbGVuYW1lLCBub1NhdmV9ID0gaW5wdXRPcHRpb25zKTtcblx0fVxuXHRlbHNlIGlmIChvdXRwdXRGaWxlbmFtZSAhPSBudWxsICYmIHR5cGVvZiBvdXRwdXRGaWxlbmFtZSA9PT0gJ29iamVjdCcpXG5cdHtcblx0XHRpbnB1dE9wdGlvbnMgPSBvdXRwdXRGaWxlbmFtZTtcblxuXHRcdCh7b3V0cHV0RmlsZW5hbWUsIG5vU2F2ZX0gPSBpbnB1dE9wdGlvbnMpO1xuXHR9XG5cdGVsc2UgaWYgKG5vU2F2ZSAhPSBudWxsICYmIHR5cGVvZiBub1NhdmUgPT09ICdvYmplY3QnKVxuXHR7XG5cdFx0aW5wdXRPcHRpb25zID0gbm9TYXZlO1xuXG5cdFx0KHtub1NhdmV9ID0gaW5wdXRPcHRpb25zKTtcblx0fVxuXG5cdGxldCBfbyA9IG1ha2VEZWZhdWx0VHBsRGF0YShpbnB1dE9wdGlvbnMsIHtcblx0XHRpbnB1dFBhdGgsXG5cdFx0b3V0cHV0UGF0aCxcblx0XHRvdXRwdXRGaWxlbmFtZSxcblx0XHRub1NhdmUsXG5cdH0pO1xuXG5cdGlucHV0T3B0aW9ucyA9IF9vLmlucHV0T3B0aW9ucztcblx0bGV0IHRwbEJhc2VEYXRhID0gX28udHBsQmFzZURhdGE7XG5cblx0cmV0dXJuIEJsdWViaXJkUHJvbWlzZS5yZXNvbHZlKCkudGhlbihhc3luYyBmdW5jdGlvbiAoKVxuXHR7XG5cdFx0Y29uc3QgVFhUX1BBVEg6IHN0cmluZyA9IGlucHV0T3B0aW9ucy5pbnB1dFBhdGg7XG5cdFx0Y29uc3QgUEFUSF9DV0Q6IHN0cmluZyA9IGlucHV0T3B0aW9ucy5vdXRwdXRQYXRoO1xuXHRcdGNvbnN0IG91dHB1dERpclBhdGhQcmVmaXggPSAnb3V0JztcblxuXHRcdGlmICghaW5wdXRQYXRoIHx8ICFvdXRwdXRQYXRoIHx8IHR5cGVvZiBpbnB1dFBhdGggIT0gJ3N0cmluZycgfHwgdHlwZW9mIG91dHB1dFBhdGggIT0gJ3N0cmluZycpXG5cdFx0e1xuXHRcdFx0dGhyb3cgbmV3IFJlZmVyZW5jZUVycm9yKCdtdXN0IHNldCBpbnB1dFBhdGgsIG91dHB1dFBhdGgnKTtcblx0XHR9XG5cblx0XHRsZXQgZ2xvYmJ5X3BhdHRlcm5zOiBzdHJpbmdbXTtcblx0XHRsZXQgZ2xvYmJ5X29wdGlvbnM6IG5vdmVsR2xvYmJ5LklPcHRpb25zID0ge1xuXHRcdFx0Y3dkOiBUWFRfUEFUSCxcblx0XHRcdHVzZURlZmF1bHRQYXR0ZXJuc0V4Y2x1ZGU6IHRydWUsXG5cdFx0XHRhYnNvbHV0ZTogdHJ1ZSxcblx0XHR9O1xuXG5cdFx0e1xuXHRcdFx0W2dsb2JieV9wYXR0ZXJucywgZ2xvYmJ5X29wdGlvbnNdID0gbm92ZWxHbG9iYnkuZ2V0T3B0aW9uczIoZ2xvYmJ5X29wdGlvbnMpO1xuXG5cdFx0XHQvL2dsb2JieV9wYXR0ZXJucy5wdXNoKCchKi8qLyovKiovKicpO1xuXHRcdH1cblxuXHRcdGxldCBtZXRhOiBJTWRjb25mTWV0YTtcblxuXHRcdC8vY29uc29sZS5pbmZvKGBQQVRIX0NXRDogJHtQQVRIX0NXRH1cXG5gKTtcblxuXHRcdC8vY29uc29sZS5sb2coZ2xvYmJ5X3BhdHRlcm5zKTtcblx0XHQvL2NvbnNvbGUubG9nKGdsb2JieV9vcHRpb25zKTtcblxuXHRcdC8vIEB0cy1pZ25vcmVcblx0XHRtZXRhID0gYXdhaXQgbm92ZWxHbG9iYnlCYXNlLmdsb2JieUFTeW5jKFtcblx0XHRcdFx0J1JFQURNRS5tZCcsXG5cdFx0XHRdLCBnbG9iYnlfb3B0aW9ucylcblx0XHRcdC8vLnRoZW4oc29ydFRyZWUpXG5cdFx0XHQudGFwKGZ1bmN0aW9uIChscylcblx0XHRcdHtcblx0XHRcdFx0Ly9jb25zb2xlLmxvZyhscyk7XG5cdFx0XHR9KVxuXHRcdFx0LnRoZW4oYXN5bmMgZnVuY3Rpb24gKGxzKVxuXHRcdFx0e1xuXHRcdFx0XHRsZXQgZGF0YSA9IGF3YWl0IGZzLnJlYWRGaWxlKGxzWzBdKTtcblxuXHRcdFx0XHRyZXR1cm4gbWRjb25mX3BhcnNlKGRhdGEsIHtcblx0XHRcdFx0XHR0aHJvdzogZmFsc2UsXG5cdFx0XHRcdH0pO1xuXHRcdFx0fSlcblx0XHRcdC50YXAoZnVuY3Rpb24gKGxzKVxuXHRcdFx0e1xuXHRcdFx0XHQvL2NvbnNvbGUubG9nKGxzKTtcblx0XHRcdH0pXG5cdFx0XHQuY2F0Y2goZnVuY3Rpb24gKClcblx0XHRcdHtcblx0XHRcdFx0Y29uc29sZS53YXJuKGBbV0FSTl0gUkVBRE1FLm1kIG5vdCBleGlzdHMhICgke3BhdGguam9pbihnbG9iYnlfb3B0aW9ucy5jd2QsICdSRUFETUUubWQnKX0pYCk7XG5cdFx0XHR9KVxuXHRcdDtcblxuXHRcdC8vY29uc29sZS5sb2coZ2xvYmJ5X3BhdHRlcm5zKTtcblxuXHRcdHJldHVybiBub3ZlbEdsb2JieUJhc2UuZ2xvYmJ5QVN5bmMoZ2xvYmJ5X3BhdHRlcm5zLCBnbG9iYnlfb3B0aW9ucylcblx0XHRcdC50aGVuKGxzID0+IHNvcnRUcmVlKGxzLCBudWxsLCBnbG9iYnlfb3B0aW9ucykpXG5cdFx0XHQudGhlbihmdW5jdGlvbiAobHMpXG5cdFx0XHR7XG5cdFx0XHRcdHJldHVybiBub3ZlbEdsb2JieS5nbG9iVG9MaXN0QXJyYXlEZWVwKGxzLCBnbG9iYnlfb3B0aW9ucylcblx0XHRcdH0pXG5cdFx0XHQudGFwKGZ1bmN0aW9uIChscylcblx0XHRcdHtcblx0XHRcdFx0Ly9jb25zb2xlLmxvZyhscyk7XG5cdFx0XHRcdC8vdGhyb3cgbmV3IEVycm9yKCd0ZXN0Jyk7XG5cdFx0XHRcdC8vcHJvY2Vzcy5leGl0KCk7XG5cdFx0XHR9KVxuXHRcdFx0LnRoZW4oZnVuY3Rpb24gKF9scylcblx0XHRcdHtcblx0XHRcdFx0aWYgKCFfbHMgfHwgIU9iamVjdC5rZXlzKF9scykubGVuZ3RoKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0Ly8gQHRzLWlnbm9yZVxuXHRcdFx0XHRcdHJldHVybiBCbHVlYmlyZFByb21pc2UucmVqZWN0KGDmspLmnInlj6/lkIjkvbXnmoTmqpTmoYjlrZjlnKhgKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vbGV0IGNvdW50X2YgPSAwO1xuXHRcdFx0XHQvL2xldCBjb3VudF9kID0gMDtcblxuXHRcdFx0XHQvL2xldCBjb3VudF9pZHggPSAwO1xuXG5cdFx0XHRcdHJldHVybiBmb3JlYWNoQXJyYXlEZWVwQXN5bmMoX2xzIGFzIElBcnJheURlZXBJbnRlcmZhY2U8SVJldHVyblJvdz4sIGFzeW5jICh7XG5cdFx0XHRcdFx0dmFsdWUsXG5cdFx0XHRcdFx0aW5kZXgsXG5cdFx0XHRcdFx0YXJyYXksXG5cdFx0XHRcdFx0Y2FjaGUsXG5cdFx0XHRcdH0pID0+XG5cdFx0XHRcdHtcblx0XHRcdFx0XHRjb25zdCB7IHZvbHVtZV90aXRsZSwgY2hhcHRlcl90aXRsZSB9ID0gdmFsdWU7XG5cdFx0XHRcdFx0Y29uc3QgeyB0ZW1wLCBkYXRhIH0gPSBjYWNoZTtcblxuXHRcdFx0XHRcdC8vdGVtcC5jYWNoZV92b2wgPSB0ZW1wLmNhY2hlX3ZvbCB8fCB7fTtcblx0XHRcdFx0XHQvL3RlbXAudG9jID0gdGVtcC50b2MgfHwgW107XG5cdFx0XHRcdFx0Ly90ZW1wLmNvbnRleHQgPSB0ZW1wLmNvbnRleHQgfHwgW107XG5cblx0XHRcdFx0XHRsZXQgdnNfcmV0ID0gZWFjaFZvbHVtZVRpdGxlKHZvbHVtZV90aXRsZSwgdHJ1ZSk7XG5cblx0XHRcdFx0XHR2c19yZXQudGl0bGVzX2Z1bGxcblx0XHRcdFx0XHRcdC5mb3JFYWNoKGZ1bmN0aW9uIChrZXksIGluZGV4KVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGxldCB0aXRsZSA9IHZzX3JldC50aXRsZXNbaW5kZXhdO1xuXG5cdFx0XHRcdFx0XHRpZiAodGVtcC5jYWNoZV92b2xba2V5XSA9PSBudWxsKVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRkYXRhLnRvYy5wdXNoKCctICcucmVwZWF0KGluZGV4ICsgMSkgKyB0aXRsZSk7XG5cblx0XHRcdFx0XHRcdFx0dGVtcC5jb3VudF9kKys7XG5cblx0XHRcdFx0XHRcdFx0dGVtcC5jYWNoZV92b2xba2V5XSA9ICh0ZW1wLmNhY2hlX3ZvbFtrZXldIHwgMCk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0XHQ7XG5cblx0XHRcdFx0XHRsZXQgdmkgPSB2c19yZXQubGV2ZWwgLSAxO1xuXG5cdFx0XHRcdFx0bGV0IHZvbF9rZXkgPSB2c19yZXQudGl0bGVzX2Z1bGxbdmldO1xuXG5cdFx0XHRcdFx0dGVtcC5jYWNoZV92b2xbdm9sX2tleV0rKztcblxuXHRcdFx0XHRcdGlmICh0ZW1wLnByZXZfdm9sdW1lX3RpdGxlICE9IHZvbHVtZV90aXRsZSlcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHQvL2xldCBfdm9sX3ByZWZpeCA9IGDnrKwke1N0cmluZygrK3RlbXAuY291bnRfaWR4KS5wYWRTdGFydCg1LCAnMCcpfeeroO+8miR7dm9sX2tleX0ke2VvbH1gO1xuXG5cdFx0XHRcdFx0XHQvL2RhdGEuY29udGV4dC5wdXNoKGAke2hyMX1DSEVDSyR7ZW9sfSR7X3ZvbF9wcmVmaXh9JHt2c19yZXQudGl0bGVzW3ZpXX0ke2VvbH0ke2hyMX0ke2VvbH1gKTtcblxuXHRcdFx0XHRcdFx0bGV0IF92b2xfcHJlZml4ID0gYOesrCR7U3RyaW5nKCsrdGVtcC5jb3VudF9pZHgpLnBhZFN0YXJ0KDUsICcwJyl956ug77yaJHt2b2xfa2V5fWA7XG5cblx0XHRcdFx0XHRcdGxldCBzID0gcmVwbGFjZVRwbChpbnB1dE9wdGlvbnMudHBsVm9sdW1lU3RhcnQsIHtcblx0XHRcdFx0XHRcdFx0Li4udHBsQmFzZURhdGEsXG5cdFx0XHRcdFx0XHRcdHByZWZpeDogX3ZvbF9wcmVmaXgsXG5cdFx0XHRcdFx0XHRcdHRpdGxlOiB2c19yZXQudGl0bGVzW3ZpXSxcblx0XHRcdFx0XHRcdH0pO1xuXG5cdFx0XHRcdFx0XHRkYXRhLmNvbnRleHQucHVzaChgJHtpbnB1dE9wdGlvbnMuaHIwMX0ke2VvbH0ke3N9JHtlb2x9JHtpbnB1dE9wdGlvbnMuaHIwMn0ke2VvbH1gKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRkYXRhLnRvYy5wdXNoKCctICcucmVwZWF0KHZzX3JldC5sZXZlbCArIDEpICsgY2hhcHRlcl90aXRsZSk7XG5cblx0XHRcdFx0XHQvL2xldCBfcHJlZml4ID0gYOesrCR7U3RyaW5nKCsrdGVtcC5jb3VudF9pZHgpLnBhZFN0YXJ0KDUsICcwJyl96Kmx77yaJHtjaGFwdGVyX3RpdGxlfSR7ZW9sfWA7XG5cdFx0XHRcdFx0bGV0IF9wcmVmaXggPSBg56ysJHtTdHJpbmcoKyt0ZW1wLmNvdW50X2lkeCkucGFkU3RhcnQoNSwgJzAnKX3oqbHvvJoke2NoYXB0ZXJfdGl0bGV9YDtcblxuXHRcdFx0XHRcdGxldCB0eHQgPSBhd2FpdCBmcy5yZWFkRmlsZSh2YWx1ZS5wYXRoKTtcblxuXHRcdFx0XHRcdHRlbXAuY291bnRfZisrO1xuXG5cdFx0XHRcdFx0Ly9kYXRhLmNvbnRleHQucHVzaChgJHtocjJ9QkVHSU4ke2VvbH0ke19wcmVmaXh9JHtjaGFwdGVyX3RpdGxlfSR7ZW9sfSR7aHIyfUJPRFkke2VvbDJ9JHt0eHR9JHtlb2wyfSR7aHIyfUVORCR7ZW9sMn1gKTtcblxuXHRcdFx0XHRcdGxldCBzID0gcmVwbGFjZVRwbChpbnB1dE9wdGlvbnMudHBsVm9sdW1lU3RhcnQsIHtcblx0XHRcdFx0XHRcdC4uLnRwbEJhc2VEYXRhLFxuXHRcdFx0XHRcdFx0cHJlZml4OiBfcHJlZml4LFxuXHRcdFx0XHRcdFx0dGl0bGU6IGNoYXB0ZXJfdGl0bGUsXG5cdFx0XHRcdFx0fSk7XG5cblx0XHRcdFx0XHRkYXRhLmNvbnRleHQucHVzaChgJHtpbnB1dE9wdGlvbnMuaHIxMX0ke2VvbH0ke3N9JHtlb2x9JHtpbnB1dE9wdGlvbnMuaHIxMn0ke2VvbDJ9JHt0eHR9JHtlb2wyfSR7aW5wdXRPcHRpb25zLmhyMTN9JHtlb2wyfWApO1xuXG5cdFx0XHRcdFx0dGVtcC5wcmV2X3ZvbHVtZV90aXRsZSA9IHZvbHVtZV90aXRsZTtcblxuXHRcdFx0XHR9LCA8SVR4dFJ1bnRpbWVSZXR1cm4+e1xuXG5cdFx0XHRcdFx0ZGF0YToge1xuXHRcdFx0XHRcdFx0dG9jOiBbXSBhcyBzdHJpbmdbXSxcblx0XHRcdFx0XHRcdGNvbnRleHQ6IFtdIGFzIHN0cmluZ1tdLFxuXHRcdFx0XHRcdH0sXG5cblx0XHRcdFx0XHR0ZW1wOiB7XG5cdFx0XHRcdFx0XHRjYWNoZV92b2w6IHt9LFxuXG5cdFx0XHRcdFx0XHRwcmV2X3ZvbHVtZV90aXRsZTogbnVsbCxcblxuXHRcdFx0XHRcdFx0Y291bnRfaWR4OiAwLFxuXHRcdFx0XHRcdFx0Y291bnRfZjogMCxcblx0XHRcdFx0XHRcdGNvdW50X2Q6IDAsXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0fSlcblx0XHRcdFx0XHQudGFwKGZ1bmN0aW9uIChyZXQpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0Ly9jb25zb2xlLmRpcihyZXQudGVtcCk7XG5cblx0XHRcdFx0XHRcdC8vY29uc29sZS5sb2cocmV0LnRlbXAuY29udGV4dC5qb2luKGVvbCkpO1xuXG5cdFx0XHRcdFx0XHQvL3Byb2Nlc3MuZXhpdCgpO1xuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0LnRoZW4oYXN5bmMgZnVuY3Rpb24gKHByb2Nlc3NSZXR1cm4pXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0bGV0IGEgPSBwcm9jZXNzUmV0dXJuLmRhdGEuY29udGV4dDtcblxuXHRcdFx0XHRcdFx0bGV0IGZpbGVuYW1lMiA9IG1ha2VGaWxlbmFtZShtZXRhLCBpbnB1dE9wdGlvbnMub3V0cHV0RmlsZW5hbWUsIGEsIF9scywge1xuXHRcdFx0XHRcdFx0XHRUWFRfUEFUSCxcblx0XHRcdFx0XHRcdFx0cHJvY2Vzc1JldHVybixcblx0XHRcdFx0XHRcdFx0aW5wdXRPcHRpb25zLFxuXHRcdFx0XHRcdFx0XHR0cGxCYXNlRGF0YSxcblx0XHRcdFx0XHRcdH0pO1xuXG5cdFx0XHRcdFx0XHRsZXQgdHh0ID0gYS5qb2luKGVvbCk7XG5cdFx0XHRcdFx0XHR0eHQgPSBjcmxmKHR4dCwgZW9sKTtcblxuXHRcdFx0XHRcdFx0bGV0IGZ1bGxwYXRoID0gcGF0aC5qb2luKFBBVEhfQ1dELCBvdXRwdXREaXJQYXRoUHJlZml4LCBgJHtmaWxlbmFtZTJ9YCk7XG5cblx0XHRcdFx0XHRcdGlmICghbm9TYXZlKVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRhd2FpdCBmcy5vdXRwdXRGaWxlKGZ1bGxwYXRoLCB0eHQpO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdFx0XHRmaWxlbmFtZTogZmlsZW5hbWUyLFxuXHRcdFx0XHRcdFx0XHRmdWxscGF0aCxcblx0XHRcdFx0XHRcdFx0ZGF0YTogdHh0LFxuXG5cdFx0XHRcdFx0XHRcdHRlbXA6IHByb2Nlc3NSZXR1cm4udGVtcCxcblx0XHRcdFx0XHRcdH07XG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0XHQudGFwKGZ1bmN0aW9uIChkYXRhKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGNvbnNvbGUuc3VjY2VzcygnW0RPTkVdIGRvbmUuJyk7XG5cblx0XHRcdFx0XHRcdGNvbnNvbGUuaW5mbyhgVG90YWwgRDogJHtkYXRhLnRlbXAuY291bnRfZH1cXG5Ub3RhbCBGOiAke2RhdGEudGVtcC5jb3VudF9mfVxcblxcbltGSUxFTkFNRV0gJHtkYXRhLmZpbGVuYW1lfWApO1xuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0Ly8gQHRzLWlnbm9yZVxuXHRcdFx0XHRcdC50YXBDYXRjaChmdW5jdGlvbiAoZSlcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRjb25zb2xlLmVycm9yKGBbRVJST1JdIHNvbWV0aGluZyB3cm9uZyEhYCk7XG5cdFx0XHRcdFx0XHRjb25zb2xlLnRyYWNlKGUpO1xuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0O1xuXHRcdFx0fSlcblx0XHRcdC50YXBDYXRjaChmdW5jdGlvbiAoZSlcblx0XHRcdHtcblx0XHRcdFx0Y29uc29sZS5lcnJvcihgW0VSUk9SXSBjYW4ndCBmb3VuZCBhbnkgZmlsZSBpbiAnJHtUWFRfUEFUSH0nYCk7XG5cdFx0XHRcdGNvbnNvbGUudHJhY2UoZSk7XG5cdFx0XHR9KVxuXHRcdFx0O1xuXHR9KVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TWV0YVRpdGxlcyhtZXRhOiBJTWRjb25mTWV0YSk6IHN0cmluZ1tdXG57XG5cdHJldHVybiBnZXROb3ZlbFRpdGxlRnJvbU1ldGEobWV0YSk7XG59XG5cbi8qKlxuICog5Zue5YKz6JmV55CG5b6M55qE5qqU5qGI5ZCN56ixXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtYWtlRmlsZW5hbWUobWV0YT86IElNZGNvbmZNZXRhLCBvdXRwdXRGaWxlbmFtZT86IHN0cmluZywgYTogc3RyaW5nW10gPSBbXSwgX2xzPzogSUFycmF5RGVlcEludGVyZmFjZTxJUmV0dXJuUm93PiwgX2FyZ3Y6IHtcblx0VFhUX1BBVEg/OiBzdHJpbmcsXG5cdHByb2Nlc3NSZXR1cm4/OiBJVHh0UnVudGltZVJldHVybixcblx0aW5wdXRPcHRpb25zPzogUmV0dXJuVHlwZTx0eXBlb2YgbWFrZURlZmF1bHRUcGxEYXRhPltcImlucHV0T3B0aW9uc1wiXSxcblx0dHBsQmFzZURhdGE/OiBSZXR1cm5UeXBlPHR5cGVvZiBtYWtlRGVmYXVsdFRwbERhdGE+W1widHBsQmFzZURhdGFcIl0sXG59ID0ge30gYXMgYW55KTogc3RyaW5nXG57XG5cdGxldCB7IGlucHV0T3B0aW9ucywgdHBsQmFzZURhdGEgfSA9IF9hcmd2O1xuXG5cdGEudW5zaGlmdChlb2wpO1xuXHRhLnVuc2hpZnQoVFBMX0hSMSArICdTVEFSVCcpO1xuXG5cdGlmIChfYXJndi5wcm9jZXNzUmV0dXJuICYmIF9hcmd2LnByb2Nlc3NSZXR1cm4uZGF0YS50b2MubGVuZ3RoKVxuXHR7XG5cdFx0bGV0IHJldCA9IF9hcmd2LnByb2Nlc3NSZXR1cm4uZGF0YS50b2M7XG5cblx0XHRyZXQudW5zaGlmdChg55uu6YyE57Si5byV77yaYCk7XG5cdFx0cmV0LnB1c2goaHIyICsgZW9sKTtcblxuXHRcdGEudW5zaGlmdChyZXQuam9pbihlb2wpKTtcblx0fVxuXG5cdGNvbnN0IG1ldGFMaWIgPSBuZXcgTm9kZU5vdmVsSW5mbyhtZXRhLCB7XG5cdFx0dGhyb3c6IGZhbHNlLFxuXHRcdGxvd0NoZWNrTGV2ZWw6IHRydWUsXG5cdH0pO1xuXG5cdGlmIChtZXRhICYmIG1ldGEubm92ZWwpXG5cdHtcblx0XHRsZXQgdHh0ID0gYCR7bWV0YS5ub3ZlbC50aXRsZX0ke2VvbH0ke21ldGEubm92ZWwuYXV0aG9yfSR7ZW9sfSR7bWV0YUxpYi5zb3VyY2VzKClcblx0XHRcdC5qb2luKGVvbCl9JHtlb2x9JHtlb2x9JHttZXRhLm5vdmVsLnByZWZhY2V9JHtlb2x9JHtlb2x9YDtcblxuXHRcdGxldCBhMiA9IFtdO1xuXG5cdFx0bGV0IG5vdmVsSUQgPSBfYXJndiAmJiBfYXJndi5UWFRfUEFUSCAmJiBwYXRoLmJhc2VuYW1lKF9hcmd2LlRYVF9QQVRIKSB8fCAnJztcblxuXHRcdGxldCB0aXRsZXMgPSBbbm92ZWxJRF0uY29uY2F0KG1ldGFMaWIudGl0bGVzKCkpXG5cdFx0XHQuZmlsdGVyKHYgPT4gdiAmJiB2ICE9IG1ldGEubm92ZWwudGl0bGUpXG5cdFx0O1xuXG5cdFx0aWYgKHRpdGxlcy5sZW5ndGgpXG5cdFx0e1xuXHRcdFx0YTIucHVzaChg5YW25LuW5ZCN56ix77yaJHtlb2x9YCArIHRpdGxlcy5qb2luKGVvbCkgKyBlb2wpO1xuXHRcdFx0YTIucHVzaChocjIpO1xuXHRcdH1cblxuXHRcdGxldCBfYXJyOiBzdHJpbmdbXTtcblx0XHRsZXQgX2xhYmVsID0gJyc7XG5cdFx0bGV0IF9qb2luID0gJ+OAgSc7XG5cblx0XHRfYXJyID0gbWV0YUxpYi5hdXRob3JzKClcblx0XHRcdC5maWx0ZXIodiA9PiB2ICYmIHYgIT0gbWV0YS5ub3ZlbC5hdXRob3IpXG5cdFx0O1xuXHRcdF9sYWJlbCA9ICflhbbku5bkvZzogIXvvJonO1xuXG5cdFx0aWYgKF9hcnIgJiYgX2Fyci5sZW5ndGgpXG5cdFx0e1xuXHRcdFx0YTIucHVzaChfbGFiZWwgKyBfYXJyLmpvaW4oX2pvaW4pICsgZW9sKTtcblx0XHR9XG5cblx0XHRfYXJyID0gbWV0YUxpYi5pbGx1c3RzKCk7XG5cdFx0X2xhYmVsID0gJ+e5quW4q++8mic7XG5cblx0XHRpZiAoX2FyciAmJiBfYXJyLmxlbmd0aClcblx0XHR7XG5cdFx0XHRhMi5wdXNoKF9sYWJlbCArIF9hcnIuam9pbihfam9pbikgKyBlb2wpO1xuXHRcdH1cblxuXHRcdF9hcnIgPSBtZXRhTGliLmNvbnRyaWJ1dGVzKCk7XG5cdFx0X2xhYmVsID0gJ+iyoueNu+iAhe+8mic7XG5cblx0XHRpZiAoX2FyciAmJiBfYXJyLmxlbmd0aClcblx0XHR7XG5cdFx0XHRhMi5wdXNoKF9sYWJlbCArIF9hcnIuam9pbihfam9pbikgKyBlb2wpO1xuXHRcdH1cblxuXHRcdF9hcnIgPSBtZXRhTGliLnRhZ3MoKTtcblx0XHRfbGFiZWwgPSAn5qiZ57Gk77yaJztcblxuXHRcdGlmIChfYXJyICYmIF9hcnIubGVuZ3RoKVxuXHRcdHtcblx0XHRcdGEyLnB1c2goX2xhYmVsICsgX2Fyci5qb2luKF9qb2luKSArIGVvbCk7XG5cdFx0fVxuXG5cdFx0aWYgKGEyLmxlbmd0aClcblx0XHR7XG5cdFx0XHRhMi51bnNoaWZ0KGhyMik7XG5cblx0XHRcdGEyLnB1c2goaHIyKTtcblxuXHRcdFx0dHh0ICs9IGEyLmpvaW4oZW9sKTtcblx0XHR9XG5cbi8vXHRcdGNvbnNvbGUubG9nKHR4dCk7XG4vL1x0XHRwcm9jZXNzLmV4aXQoKTtcblxuXHRcdGEudW5zaGlmdCh0eHQpO1xuXHR9XG5cblx0aWYgKGlucHV0T3B0aW9ucyAmJiBpbnB1dE9wdGlvbnMudHBsQmFubmVyU3RhcnQpXG5cdHtcblx0XHRsZXQgcyA9IHJlcGxhY2VUcGwoaW5wdXRPcHRpb25zLnRwbEJhbm5lclN0YXJ0LCB7XG5cblx0XHRcdC4uLnRwbEJhc2VEYXRhLFxuXG5cdFx0XHR0aXRsZTogbWV0YUxpYi50aXRsZSgpLFxuXHRcdFx0YXV0aG9yOiBtZXRhTGliLmF1dGhvcnMoKS5qb2luKCcgLCAnKSxcblx0XHRcdGxhbmc6ICd6aC1IYW50Jyxcblx0XHR9KTtcblxuXHRcdGEudW5zaGlmdChzKTtcblx0fVxuXG5cdGxldCBmaWxlbmFtZTogc3RyaW5nO1xuXG5cdGlmICh0eXBlb2Ygb3V0cHV0RmlsZW5hbWUgPT0gJ3N0cmluZycgJiYgb3V0cHV0RmlsZW5hbWUpXG5cdHtcblx0XHRmaWxlbmFtZSA9IG91dHB1dEZpbGVuYW1lO1xuXHR9XG5cblx0aWYgKCFmaWxlbmFtZSAmJiBtZXRhICYmIG1ldGEubm92ZWwpXG5cdHtcblx0XHRpZiAobWV0YS5ub3ZlbC50aXRsZV9zaG9ydClcblx0XHR7XG5cdFx0XHRmaWxlbmFtZSA9IG1ldGEubm92ZWwudGl0bGVfc2hvcnQ7XG5cdFx0fVxuXHRcdGVsc2UgaWYgKG1ldGEubm92ZWwudGl0bGUpXG5cdFx0e1xuXHRcdFx0ZmlsZW5hbWUgPSBtZXRhLm5vdmVsLnRpdGxlO1xuXHRcdH1cblx0XHRlbHNlIGlmIChtZXRhLm5vdmVsLnRpdGxlX3poKVxuXHRcdHtcblx0XHRcdGZpbGVuYW1lID0gbWV0YS5ub3ZlbC50aXRsZV96aDtcblx0XHR9XG5cdH1cblxuXHRmaWxlbmFtZSA9IGZpbGVuYW1lIHx8ICd0ZW1wJztcblxuXHRsZXQgZmlsZW5hbWUyID0gdHJpbUZpbGVuYW1lKGZpbGVuYW1lKVxuXHRcdC5yZXBsYWNlKC9cXC4vLCAnXycpXG5cdFx0LnJlcGxhY2UoL15bXytcXC1dK3xbXytcXC1dKyQvLCAnJylcblx0O1xuXG5cdGZpbGVuYW1lMiA9IFVTdHJpbmcuY3JlYXRlKGZpbGVuYW1lMikuc3BsaXQoJycpLnNsaWNlKDAsIDIwKS5qb2luKCcnKTtcblx0ZmlsZW5hbWUyID0gdHJpbUZpbGVuYW1lKGZpbGVuYW1lMik7XG5cblx0aWYgKCFmaWxlbmFtZTIpXG5cdHtcblx0XHRjb25zb2xlLmVycm9yKGBbRVJST1JdIEJhZCBGaWxlbmFtZTogJHtmaWxlbmFtZX0gPT4gJHtmaWxlbmFtZTJ9YCk7XG5cblx0XHRmaWxlbmFtZTIgPSAndGVtcCc7XG5cdH1cblxuXHRmaWxlbmFtZSArPSAnXycgKyBtb21lbnQoKS5sb2NhbCgpLmZvcm1hdCgnWVlZWU1NRERISG1tJyk7XG5cblx0ZmlsZW5hbWUyID0gYCR7ZmlsZW5hbWUyfS5vdXQudHh0YDtcblxuXHRyZXR1cm4gZmlsZW5hbWUyO1xufVxuXG5leHBvcnQgZGVmYXVsdCB0eHRNZXJnZTtcbiJdfQ==