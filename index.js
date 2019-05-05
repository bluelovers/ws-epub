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
const debug_color2_1 = require("debug-color2");
const class_1 = require("node-novel-info/class");
const node_novel_info_2 = require("node-novel-info");
const util_1 = require("node-novel-globby/lib/util");
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
/**
 *
 * @param inputPath 輸入路徑
 * @param outputPath 輸出路徑
 * @param outputFilename 參考用檔案名稱
 * @param noSave 不儲存檔案僅回傳 txt 內容
 */
function txtMerge(inputPath, outputPath, outputFilename, noSave) {
    return BluebirdPromise.resolve().then(async function () {
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
            console.warn(`[WARN] README.md not exists! (${path.join(globby_options.cwd, 'README.md')})`);
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
                    let _vol_prefix = `第${String(++temp.count_idx).padStart(5, '0')}話：${vol_key}${eol}`;
                    data.context.push(`${hr1}CHECK${eol}${_vol_prefix}${vs_ret.titles[vi]}${eol}${hr1}${eol}`);
                }
                data.toc.push('- '.repeat(vs_ret.level + 1) + chapter_title);
                let _prefix = `第${String(++temp.count_idx).padStart(5, '0')}話：${chapter_title}${eol}`;
                let txt = await fs_iconv_1.default.readFile(value.path);
                temp.count_f++;
                data.context.push(`${hr2}BEGIN${eol}${_prefix}${chapter_title}${eol}${hr2}BODY${eol2}${txt}${eol2}${hr2}END${eol2}`);
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
                let filename2 = makeFilename(meta, outputFilename, a, _ls, {
                    TXT_PATH,
                    processReturn,
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
                console.success('[DONE] done.');
                console.info(`Total D: ${data.temp.count_d}\nTotal F: ${data.temp.count_f}\n\n[FILENAME] ${data.filename}`);
            })
                // @ts-ignore
                .tapCatch(function (e) {
                console.error(`[ERROR] something wrong!!`);
                console.trace(e);
            });
        })
            .tapCatch(function (e) {
            console.error(`[ERROR] can't found any file in '${TXT_PATH}'`);
            console.trace(e);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7O0FBR0gsaURBQWtEO0FBQ2xELHVEQUF3RDtBQUN4RCw2QkFBOEI7QUFDOUIsNENBQTZDO0FBQzdDLGlDQUFrQztBQUNsQyxxREFBNEQ7QUFDNUQsbURBQWdEO0FBQ2hELHVDQUE0QztBQUM1QywyQ0FBaUM7QUFDakMsK0RBQTJEO0FBRzNELCtDQUF1QztBQUN2QyxpREFBc0Q7QUFDdEQscURBQXdEO0FBQ3hELHFEQUtvQztBQUVwQyxNQUFNLE9BQU8sR0FBRyxJQUFJLHNCQUFPLENBQUMsSUFBSSxFQUFFO0lBQ2pDLE9BQU8sRUFBRSxJQUFJO0lBQ2IsY0FBYyxFQUFFO1FBQ2YsTUFBTSxFQUFFLElBQUk7S0FDWjtJQUNELFlBQVksRUFBRTtRQUNiLE9BQU8sRUFBRSxJQUFJO0tBQ2I7Q0FDRCxDQUFDLENBQUM7QUFFSCxPQUFPLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQztBQUU1QixNQUFNLE1BQU0sR0FBRyxFQUFFLENBQUM7QUFDbEIsTUFBTSxHQUFHLEdBQUcscUJBQUksQ0FBQztBQUNqQixNQUFNLElBQUksR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBRTNCLE1BQU0sR0FBRyxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDL0IsTUFBTSxHQUFHLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztBQWtCL0I7Ozs7OztHQU1HO0FBQ0gsU0FBZ0IsUUFBUSxDQUFDLFNBQWlCLEVBQ3pDLFVBQWtCLEVBQ2xCLGNBQXVCLEVBQ3ZCLE1BQWdCO0lBT2hCLE9BQU8sZUFBZSxDQUFDLE9BQU8sRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLO1FBRTFDLE1BQU0sUUFBUSxHQUFXLFNBQVMsQ0FBQztRQUNuQyxNQUFNLFFBQVEsR0FBVyxV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QUFFLENBQUMsQ0FBQztRQUVuRSxTQUFTLEdBQUcsTUFBTSxDQUFDO0tBQ25CO0lBRUQsUUFBUSxJQUFJLEdBQUcsR0FBRyxNQUFNLEVBQUUsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLENBQUM7SUFFMUQsU0FBUyxHQUFHLEdBQUcsU0FBUyxVQUFVLENBQUM7SUFFbkMsT0FBTyxTQUFTLENBQUM7QUFDbEIsQ0FBQztBQXpJRCxvQ0F5SUM7QUFFRCxrQkFBZSxRQUFRLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENyZWF0ZWQgYnkgdXNlciBvbiAyMDE4LzEvMjgvMDI4LlxuICovXG5cbmltcG9ydCB7IElBcnJheURlZXBJbnRlcmZhY2UsIElSZXR1cm5MaXN0LCBJUmV0dXJuUm93IH0gZnJvbSAnbm9kZS1ub3ZlbC1nbG9iYnknO1xuaW1wb3J0IG5vdmVsR2xvYmJ5ID0gcmVxdWlyZSgnbm9kZS1ub3ZlbC1nbG9iYnknKTtcbmltcG9ydCBub3ZlbEdsb2JieUJhc2UgPSByZXF1aXJlKCdub2RlLW5vdmVsLWdsb2JieS9nJyk7XG5pbXBvcnQgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcbmltcG9ydCBCbHVlYmlyZFByb21pc2UgPSByZXF1aXJlKCdibHVlYmlyZCcpO1xuaW1wb3J0IG1vbWVudCA9IHJlcXVpcmUoJ21vbWVudCcpO1xuaW1wb3J0IHsgbWRjb25mX3BhcnNlLCBJTWRjb25mTWV0YSB9IGZyb20gJ25vZGUtbm92ZWwtaW5mbyc7XG5pbXBvcnQgeyBjcmxmLCBDUkxGLCBMRiB9IGZyb20gJ2NybGYtbm9ybWFsaXplJztcbmltcG9ydCBmcywgeyB0cmltRmlsZW5hbWUgfSBmcm9tICdmcy1pY29udic7XG5pbXBvcnQgVVN0cmluZyBmcm9tICd1bmktc3RyaW5nJztcbmltcG9ydCB7IHNvcnRUcmVlIH0gZnJvbSAnbm9kZS1ub3ZlbC1nbG9iYnkvbGliL2dsb2Itc29ydCc7XG5pbXBvcnQgeyBhcnJheV91bmlxdWUgfSBmcm9tICdhcnJheS1oeXBlci11bmlxdWUnO1xuaW1wb3J0IHsgbm9ybWFsaXplX3N0cmlwIH0gZnJvbSAnQG5vZGUtbm92ZWwvbm9ybWFsaXplJztcbmltcG9ydCB7IENvbnNvbGUgfSBmcm9tICdkZWJ1Zy1jb2xvcjInO1xuaW1wb3J0IHsgTm9kZU5vdmVsSW5mbyB9IGZyb20gJ25vZGUtbm92ZWwtaW5mby9jbGFzcyc7XG5pbXBvcnQgeyBnZXROb3ZlbFRpdGxlRnJvbU1ldGEgfSBmcm9tICdub2RlLW5vdmVsLWluZm8nO1xuaW1wb3J0IHtcblx0ZWFjaFZvbHVtZVRpdGxlLFxuXHRmb3JlYWNoQXJyYXlEZWVwQXN5bmMsXG5cdElGb3JlYWNoQXJyYXlEZWVwQ2FjaGUsXG5cdElGb3JlYWNoQXJyYXlEZWVwUmV0dXJuLFxufSBmcm9tICdub2RlLW5vdmVsLWdsb2JieS9saWIvdXRpbCc7XG5cbmNvbnN0IGNvbnNvbGUgPSBuZXcgQ29uc29sZShudWxsLCB7XG5cdGVuYWJsZWQ6IHRydWUsXG5cdGluc3BlY3RPcHRpb25zOiB7XG5cdFx0Y29sb3JzOiB0cnVlLFxuXHR9LFxuXHRjaGFsa09wdGlvbnM6IHtcblx0XHRlbmFibGVkOiB0cnVlLFxuXHR9LFxufSk7XG5cbmNvbnNvbGUuZW5hYmxlZENvbG9yID0gdHJ1ZTtcblxuY29uc3QgaHJfbGVuID0gMTU7XG5jb25zdCBlb2wgPSBDUkxGO1xuY29uc3QgZW9sMiA9IGVvbC5yZXBlYXQoMik7XG5cbmNvbnN0IGhyMSA9ICfvvJ0nLnJlcGVhdChocl9sZW4pO1xuY29uc3QgaHIyID0gJ++8jScucmVwZWF0KGhyX2xlbik7XG5cbmV4cG9ydCB0eXBlIElUeHRSdW50aW1lUmV0dXJuID0gSUZvcmVhY2hBcnJheURlZXBSZXR1cm48SVJldHVyblJvdywgYW55LCB7XG5cdHRvYzogc3RyaW5nW10sXG5cdGNvbnRleHQ6IHN0cmluZ1tdLFxufSwge1xuXHRjYWNoZV92b2w6IHtcblx0XHRbdm9sOiBzdHJpbmddOiBudW1iZXI7XG5cdH0sXG5cblx0cHJldl92b2x1bWVfdGl0bGU6IHN0cmluZyxcblxuXHRjb3VudF9pZHg6IG51bWJlcixcblx0Y291bnRfZjogbnVtYmVyLFxuXHRjb3VudF9kOiBudW1iZXIsXG5cbn0+XG5cbi8qKlxuICpcbiAqIEBwYXJhbSBpbnB1dFBhdGgg6Ly45YWl6Lev5b6RXG4gKiBAcGFyYW0gb3V0cHV0UGF0aCDovLjlh7rot6/lvpFcbiAqIEBwYXJhbSBvdXRwdXRGaWxlbmFtZSDlj4PogIPnlKjmqpTmoYjlkI3nqLFcbiAqIEBwYXJhbSBub1NhdmUg5LiN5YSy5a2Y5qqU5qGI5YOF5Zue5YKzIHR4dCDlhaflrrlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHR4dE1lcmdlKGlucHV0UGF0aDogc3RyaW5nLFxuXHRvdXRwdXRQYXRoOiBzdHJpbmcsXG5cdG91dHB1dEZpbGVuYW1lPzogc3RyaW5nLFxuXHRub1NhdmU/OiBib29sZWFuLFxuKTogQmx1ZWJpcmRQcm9taXNlPHtcblx0ZmlsZW5hbWU6IHN0cmluZyxcblx0ZnVsbHBhdGg6IHN0cmluZyxcblx0ZGF0YTogc3RyaW5nLFxufT5cbntcblx0cmV0dXJuIEJsdWViaXJkUHJvbWlzZS5yZXNvbHZlKCkudGhlbihhc3luYyBmdW5jdGlvbiAoKVxuXHR7XG5cdFx0Y29uc3QgVFhUX1BBVEg6IHN0cmluZyA9IGlucHV0UGF0aDtcblx0XHRjb25zdCBQQVRIX0NXRDogc3RyaW5nID0gb3V0cHV0UGF0aDtcblx0XHRjb25zdCBvdXRwdXREaXJQYXRoUHJlZml4ID0gJ291dCc7XG5cblx0XHRpZiAoIWlucHV0UGF0aCB8fCAhb3V0cHV0UGF0aCB8fCB0eXBlb2YgaW5wdXRQYXRoICE9ICdzdHJpbmcnIHx8IHR5cGVvZiBvdXRwdXRQYXRoICE9ICdzdHJpbmcnKVxuXHRcdHtcblx0XHRcdHRocm93IG5ldyBSZWZlcmVuY2VFcnJvcignbXVzdCBzZXQgaW5wdXRQYXRoLCBvdXRwdXRQYXRoJyk7XG5cdFx0fVxuXG5cdFx0bGV0IGdsb2JieV9wYXR0ZXJuczogc3RyaW5nW107XG5cdFx0bGV0IGdsb2JieV9vcHRpb25zOiBub3ZlbEdsb2JieS5JT3B0aW9ucyA9IHtcblx0XHRcdGN3ZDogVFhUX1BBVEgsXG5cdFx0XHR1c2VEZWZhdWx0UGF0dGVybnNFeGNsdWRlOiB0cnVlLFxuXHRcdFx0YWJzb2x1dGU6IHRydWUsXG5cdFx0fTtcblxuXHRcdHtcblx0XHRcdFtnbG9iYnlfcGF0dGVybnMsIGdsb2JieV9vcHRpb25zXSA9IG5vdmVsR2xvYmJ5LmdldE9wdGlvbnMyKGdsb2JieV9vcHRpb25zKTtcblxuXHRcdFx0Ly9nbG9iYnlfcGF0dGVybnMucHVzaCgnISovKi8qLyoqLyonKTtcblx0XHR9XG5cblx0XHRsZXQgbWV0YTogSU1kY29uZk1ldGE7XG5cblx0XHQvL2NvbnNvbGUuaW5mbyhgUEFUSF9DV0Q6ICR7UEFUSF9DV0R9XFxuYCk7XG5cblx0XHQvL2NvbnNvbGUubG9nKGdsb2JieV9wYXR0ZXJucyk7XG5cdFx0Ly9jb25zb2xlLmxvZyhnbG9iYnlfb3B0aW9ucyk7XG5cblx0XHQvLyBAdHMtaWdub3JlXG5cdFx0bWV0YSA9IGF3YWl0IG5vdmVsR2xvYmJ5QmFzZS5nbG9iYnlBU3luYyhbXG5cdFx0XHRcdCdSRUFETUUubWQnLFxuXHRcdFx0XSwgZ2xvYmJ5X29wdGlvbnMpXG5cdFx0XHQvLy50aGVuKHNvcnRUcmVlKVxuXHRcdFx0LnRhcChmdW5jdGlvbiAobHMpXG5cdFx0XHR7XG5cdFx0XHRcdC8vY29uc29sZS5sb2cobHMpO1xuXHRcdFx0fSlcblx0XHRcdC50aGVuKGFzeW5jIGZ1bmN0aW9uIChscylcblx0XHRcdHtcblx0XHRcdFx0bGV0IGRhdGEgPSBhd2FpdCBmcy5yZWFkRmlsZShsc1swXSk7XG5cblx0XHRcdFx0cmV0dXJuIG1kY29uZl9wYXJzZShkYXRhLCB7XG5cdFx0XHRcdFx0dGhyb3c6IGZhbHNlLFxuXHRcdFx0XHR9KTtcblx0XHRcdH0pXG5cdFx0XHQudGFwKGZ1bmN0aW9uIChscylcblx0XHRcdHtcblx0XHRcdFx0Ly9jb25zb2xlLmxvZyhscyk7XG5cdFx0XHR9KVxuXHRcdFx0LmNhdGNoKGZ1bmN0aW9uICgpXG5cdFx0XHR7XG5cdFx0XHRcdGNvbnNvbGUud2FybihgW1dBUk5dIFJFQURNRS5tZCBub3QgZXhpc3RzISAoJHtwYXRoLmpvaW4oZ2xvYmJ5X29wdGlvbnMuY3dkLCAnUkVBRE1FLm1kJyl9KWApO1xuXHRcdFx0fSlcblx0XHQ7XG5cblx0XHQvL2NvbnNvbGUubG9nKGdsb2JieV9wYXR0ZXJucyk7XG5cblx0XHRyZXR1cm4gbm92ZWxHbG9iYnlCYXNlLmdsb2JieUFTeW5jKGdsb2JieV9wYXR0ZXJucywgZ2xvYmJ5X29wdGlvbnMpXG5cdFx0XHQudGhlbihscyA9PiBzb3J0VHJlZShscywgbnVsbCwgZ2xvYmJ5X29wdGlvbnMpKVxuXHRcdFx0LnRoZW4oZnVuY3Rpb24gKGxzKVxuXHRcdFx0e1xuXHRcdFx0XHRyZXR1cm4gbm92ZWxHbG9iYnkuZ2xvYlRvTGlzdEFycmF5RGVlcChscywgZ2xvYmJ5X29wdGlvbnMpXG5cdFx0XHR9KVxuXHRcdFx0LnRhcChmdW5jdGlvbiAobHMpXG5cdFx0XHR7XG5cdFx0XHRcdC8vY29uc29sZS5sb2cobHMpO1xuXHRcdFx0XHQvL3Rocm93IG5ldyBFcnJvcigndGVzdCcpO1xuXHRcdFx0XHQvL3Byb2Nlc3MuZXhpdCgpO1xuXHRcdFx0fSlcblx0XHRcdC50aGVuKGZ1bmN0aW9uIChfbHMpXG5cdFx0XHR7XG5cdFx0XHRcdGlmICghX2xzIHx8ICFPYmplY3Qua2V5cyhfbHMpLmxlbmd0aClcblx0XHRcdFx0e1xuXHRcdFx0XHRcdC8vIEB0cy1pZ25vcmVcblx0XHRcdFx0XHRyZXR1cm4gQmx1ZWJpcmRQcm9taXNlLnJlamVjdChg5rKS5pyJ5Y+v5ZCI5L2155qE5qqU5qGI5a2Y5ZyoYCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvL2xldCBjb3VudF9mID0gMDtcblx0XHRcdFx0Ly9sZXQgY291bnRfZCA9IDA7XG5cblx0XHRcdFx0Ly9sZXQgY291bnRfaWR4ID0gMDtcblxuXHRcdFx0XHRyZXR1cm4gZm9yZWFjaEFycmF5RGVlcEFzeW5jKF9scyBhcyBJQXJyYXlEZWVwSW50ZXJmYWNlPElSZXR1cm5Sb3c+LCBhc3luYyAoe1xuXHRcdFx0XHRcdHZhbHVlLFxuXHRcdFx0XHRcdGluZGV4LFxuXHRcdFx0XHRcdGFycmF5LFxuXHRcdFx0XHRcdGNhY2hlLFxuXHRcdFx0XHR9KSA9PlxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0Y29uc3QgeyB2b2x1bWVfdGl0bGUsIGNoYXB0ZXJfdGl0bGUgfSA9IHZhbHVlO1xuXHRcdFx0XHRcdGNvbnN0IHsgdGVtcCwgZGF0YSB9ID0gY2FjaGU7XG5cblx0XHRcdFx0XHQvL3RlbXAuY2FjaGVfdm9sID0gdGVtcC5jYWNoZV92b2wgfHwge307XG5cdFx0XHRcdFx0Ly90ZW1wLnRvYyA9IHRlbXAudG9jIHx8IFtdO1xuXHRcdFx0XHRcdC8vdGVtcC5jb250ZXh0ID0gdGVtcC5jb250ZXh0IHx8IFtdO1xuXG5cdFx0XHRcdFx0bGV0IHZzX3JldCA9IGVhY2hWb2x1bWVUaXRsZSh2b2x1bWVfdGl0bGUsIHRydWUpO1xuXG5cdFx0XHRcdFx0dnNfcmV0LnRpdGxlc19mdWxsXG5cdFx0XHRcdFx0XHQuZm9yRWFjaChmdW5jdGlvbiAoa2V5LCBpbmRleClcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRsZXQgdGl0bGUgPSB2c19yZXQudGl0bGVzW2luZGV4XTtcblxuXHRcdFx0XHRcdFx0aWYgKHRlbXAuY2FjaGVfdm9sW2tleV0gPT0gbnVsbClcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0ZGF0YS50b2MucHVzaCgnLSAnLnJlcGVhdChpbmRleCArIDEpICsgdGl0bGUpO1xuXG5cdFx0XHRcdFx0XHRcdHRlbXAuY291bnRfZCsrO1xuXG5cdFx0XHRcdFx0XHRcdHRlbXAuY2FjaGVfdm9sW2tleV0gPSAodGVtcC5jYWNoZV92b2xba2V5XSB8IDApO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0O1xuXG5cdFx0XHRcdFx0bGV0IHZpID0gdnNfcmV0LmxldmVsIC0gMTtcblxuXHRcdFx0XHRcdGxldCB2b2xfa2V5ID0gdnNfcmV0LnRpdGxlc19mdWxsW3ZpXTtcblxuXHRcdFx0XHRcdHRlbXAuY2FjaGVfdm9sW3ZvbF9rZXldKys7XG5cblx0XHRcdFx0XHRpZiAodGVtcC5wcmV2X3ZvbHVtZV90aXRsZSAhPSB2b2x1bWVfdGl0bGUpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0bGV0IF92b2xfcHJlZml4ID0gYOesrCR7U3RyaW5nKCsrdGVtcC5jb3VudF9pZHgpLnBhZFN0YXJ0KDUsICcwJyl96Kmx77yaJHt2b2xfa2V5fSR7ZW9sfWA7XG5cblx0XHRcdFx0XHRcdGRhdGEuY29udGV4dC5wdXNoKGAke2hyMX1DSEVDSyR7ZW9sfSR7X3ZvbF9wcmVmaXh9JHt2c19yZXQudGl0bGVzW3ZpXX0ke2VvbH0ke2hyMX0ke2VvbH1gKVxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGRhdGEudG9jLnB1c2goJy0gJy5yZXBlYXQodnNfcmV0LmxldmVsICsgMSkgKyBjaGFwdGVyX3RpdGxlKTtcblxuXHRcdFx0XHRcdGxldCBfcHJlZml4ID0gYOesrCR7U3RyaW5nKCsrdGVtcC5jb3VudF9pZHgpLnBhZFN0YXJ0KDUsICcwJyl96Kmx77yaJHtjaGFwdGVyX3RpdGxlfSR7ZW9sfWA7XG5cblx0XHRcdFx0XHRsZXQgdHh0ID0gYXdhaXQgZnMucmVhZEZpbGUodmFsdWUucGF0aCk7XG5cblx0XHRcdFx0XHR0ZW1wLmNvdW50X2YrKztcblxuXHRcdFx0XHRcdGRhdGEuY29udGV4dC5wdXNoKGAke2hyMn1CRUdJTiR7ZW9sfSR7X3ByZWZpeH0ke2NoYXB0ZXJfdGl0bGV9JHtlb2x9JHtocjJ9Qk9EWSR7ZW9sMn0ke3R4dH0ke2VvbDJ9JHtocjJ9RU5EJHtlb2wyfWApO1xuXG5cdFx0XHRcdFx0dGVtcC5wcmV2X3ZvbHVtZV90aXRsZSA9IHZvbHVtZV90aXRsZTtcblxuXHRcdFx0XHR9LCA8SVR4dFJ1bnRpbWVSZXR1cm4+e1xuXG5cdFx0XHRcdFx0ZGF0YToge1xuXHRcdFx0XHRcdFx0dG9jOiBbXSBhcyBzdHJpbmdbXSxcblx0XHRcdFx0XHRcdGNvbnRleHQ6IFtdIGFzIHN0cmluZ1tdLFxuXHRcdFx0XHRcdH0sXG5cblx0XHRcdFx0XHR0ZW1wOiB7XG5cdFx0XHRcdFx0XHRjYWNoZV92b2w6IHt9LFxuXG5cdFx0XHRcdFx0XHRwcmV2X3ZvbHVtZV90aXRsZTogbnVsbCxcblxuXHRcdFx0XHRcdFx0Y291bnRfaWR4OiAwLFxuXHRcdFx0XHRcdFx0Y291bnRfZjogMCxcblx0XHRcdFx0XHRcdGNvdW50X2Q6IDAsXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0fSlcblx0XHRcdFx0XHQudGFwKGZ1bmN0aW9uIChyZXQpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0Ly9jb25zb2xlLmRpcihyZXQudGVtcCk7XG5cblx0XHRcdFx0XHRcdC8vY29uc29sZS5sb2cocmV0LnRlbXAuY29udGV4dC5qb2luKGVvbCkpO1xuXG5cdFx0XHRcdFx0XHQvL3Byb2Nlc3MuZXhpdCgpO1xuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0LnRoZW4oYXN5bmMgZnVuY3Rpb24gKHByb2Nlc3NSZXR1cm4pXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0bGV0IGEgPSBwcm9jZXNzUmV0dXJuLmRhdGEuY29udGV4dDtcblxuXHRcdFx0XHRcdFx0bGV0IGZpbGVuYW1lMiA9IG1ha2VGaWxlbmFtZShtZXRhLCBvdXRwdXRGaWxlbmFtZSwgYSwgX2xzLCB7XG5cdFx0XHRcdFx0XHRcdFRYVF9QQVRILFxuXHRcdFx0XHRcdFx0XHRwcm9jZXNzUmV0dXJuLFxuXHRcdFx0XHRcdFx0fSk7XG5cblx0XHRcdFx0XHRcdGxldCB0eHQgPSBhLmpvaW4oZW9sKTtcblx0XHRcdFx0XHRcdHR4dCA9IGNybGYodHh0LCBlb2wpO1xuXG5cdFx0XHRcdFx0XHRsZXQgZnVsbHBhdGggPSBwYXRoLmpvaW4oUEFUSF9DV0QsIG91dHB1dERpclBhdGhQcmVmaXgsIGAke2ZpbGVuYW1lMn1gKTtcblxuXHRcdFx0XHRcdFx0aWYgKCFub1NhdmUpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdGF3YWl0IGZzLm91dHB1dEZpbGUoZnVsbHBhdGgsIHR4dCk7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0XHRcdGZpbGVuYW1lOiBmaWxlbmFtZTIsXG5cdFx0XHRcdFx0XHRcdGZ1bGxwYXRoLFxuXHRcdFx0XHRcdFx0XHRkYXRhOiB0eHQsXG5cblx0XHRcdFx0XHRcdFx0dGVtcDogcHJvY2Vzc1JldHVybi50ZW1wLFxuXHRcdFx0XHRcdFx0fTtcblx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdC50YXAoZnVuY3Rpb24gKGRhdGEpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0Y29uc29sZS5zdWNjZXNzKCdbRE9ORV0gZG9uZS4nKTtcblxuXHRcdFx0XHRcdFx0Y29uc29sZS5pbmZvKGBUb3RhbCBEOiAke2RhdGEudGVtcC5jb3VudF9kfVxcblRvdGFsIEY6ICR7ZGF0YS50ZW1wLmNvdW50X2Z9XFxuXFxuW0ZJTEVOQU1FXSAke2RhdGEuZmlsZW5hbWV9YCk7XG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0XHQvLyBAdHMtaWdub3JlXG5cdFx0XHRcdFx0LnRhcENhdGNoKGZ1bmN0aW9uIChlKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGNvbnNvbGUuZXJyb3IoYFtFUlJPUl0gc29tZXRoaW5nIHdyb25nISFgKTtcblx0XHRcdFx0XHRcdGNvbnNvbGUudHJhY2UoZSk7XG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0XHQ7XG5cdFx0XHR9KVxuXHRcdFx0LnRhcENhdGNoKGZ1bmN0aW9uIChlKVxuXHRcdFx0e1xuXHRcdFx0XHRjb25zb2xlLmVycm9yKGBbRVJST1JdIGNhbid0IGZvdW5kIGFueSBmaWxlIGluICcke1RYVF9QQVRIfSdgKTtcblx0XHRcdFx0Y29uc29sZS50cmFjZShlKTtcblx0XHRcdH0pXG5cdFx0XHQ7XG5cdH0pXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRNZXRhVGl0bGVzKG1ldGE6IElNZGNvbmZNZXRhKTogc3RyaW5nW11cbntcblx0cmV0dXJuIGdldE5vdmVsVGl0bGVGcm9tTWV0YShtZXRhKTtcbn1cblxuLyoqXG4gKiDlm57lgrPomZXnkIblvoznmoTmqpTmoYjlkI3nqLFcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1ha2VGaWxlbmFtZShtZXRhPzogSU1kY29uZk1ldGEsIG91dHB1dEZpbGVuYW1lPzogc3RyaW5nLCBhOiBzdHJpbmdbXSA9IFtdLCBfbHM/OiBJUmV0dXJuTGlzdCwgX2FyZ3Y6IHtcblx0VFhUX1BBVEg/OiBzdHJpbmcsXG5cdHByb2Nlc3NSZXR1cm4/OiBJVHh0UnVudGltZVJldHVybixcbn0gPSB7fSBhcyBhbnkpOiBzdHJpbmdcbntcblx0aWYgKF9hcmd2LnByb2Nlc3NSZXR1cm4gJiYgX2FyZ3YucHJvY2Vzc1JldHVybi5kYXRhLnRvYy5sZW5ndGgpXG5cdHtcblx0XHRsZXQgcmV0ID0gX2FyZ3YucHJvY2Vzc1JldHVybi5kYXRhLnRvYztcblxuXHRcdHJldC51bnNoaWZ0KGDnm67pjITntKLlvJXvvJpgKTtcblx0XHRyZXQucHVzaChocjIgKyBlb2wpO1xuXG5cdFx0YS51bnNoaWZ0KHJldC5qb2luKGVvbCkpO1xuXHR9XG5cblx0Y29uc3QgbWV0YUxpYiA9IG5ldyBOb2RlTm92ZWxJbmZvKG1ldGEsIHtcblx0XHR0aHJvdzogZmFsc2UsXG5cdFx0bG93Q2hlY2tMZXZlbDogdHJ1ZSxcblx0fSk7XG5cblx0aWYgKG1ldGEgJiYgbWV0YS5ub3ZlbClcblx0e1xuXHRcdGxldCB0eHQgPSBgJHttZXRhLm5vdmVsLnRpdGxlfSR7ZW9sfSR7bWV0YS5ub3ZlbC5hdXRob3J9JHtlb2x9JHttZXRhTGliLnNvdXJjZXMoKVxuXHRcdFx0LmpvaW4oZW9sKX0ke2VvbH0ke2VvbH0ke21ldGEubm92ZWwucHJlZmFjZX0ke2VvbH0ke2VvbH1gO1xuXG5cdFx0bGV0IGEyID0gW107XG5cblx0XHRsZXQgbm92ZWxJRCA9IF9hcmd2ICYmIF9hcmd2LlRYVF9QQVRIICYmIHBhdGguYmFzZW5hbWUoX2FyZ3YuVFhUX1BBVEgpIHx8ICcnO1xuXG5cdFx0bGV0IHRpdGxlcyA9IFtub3ZlbElEXS5jb25jYXQobWV0YUxpYi50aXRsZXMoKSlcblx0XHRcdC5maWx0ZXIodiA9PiB2ICYmIHYgIT0gbWV0YS5ub3ZlbC50aXRsZSlcblx0XHQ7XG5cblx0XHRpZiAodGl0bGVzLmxlbmd0aClcblx0XHR7XG5cdFx0XHRhMi5wdXNoKGDlhbbku5blkI3nqLHvvJoke2VvbH1gICsgdGl0bGVzLmpvaW4oZW9sKSArIGVvbCk7XG5cdFx0XHRhMi5wdXNoKGhyMik7XG5cdFx0fVxuXG5cdFx0bGV0IF9hcnI6IHN0cmluZ1tdO1xuXHRcdGxldCBfbGFiZWwgPSAnJztcblx0XHRsZXQgX2pvaW4gPSAn44CBJztcblxuXHRcdF9hcnIgPSBtZXRhTGliLmF1dGhvcnMoKVxuXHRcdFx0LmZpbHRlcih2ID0+IHYgJiYgdiAhPSBtZXRhLm5vdmVsLmF1dGhvcilcblx0XHQ7XG5cdFx0X2xhYmVsID0gJ+WFtuS7luS9nOiAhe+8mic7XG5cblx0XHRpZiAoX2FyciAmJiBfYXJyLmxlbmd0aClcblx0XHR7XG5cdFx0XHRhMi5wdXNoKF9sYWJlbCArIF9hcnIuam9pbihfam9pbikgKyBlb2wpO1xuXHRcdH1cblxuXHRcdF9hcnIgPSBtZXRhTGliLmlsbHVzdHMoKTtcblx0XHRfbGFiZWwgPSAn57mq5bir77yaJztcblxuXHRcdGlmIChfYXJyICYmIF9hcnIubGVuZ3RoKVxuXHRcdHtcblx0XHRcdGEyLnB1c2goX2xhYmVsICsgX2Fyci5qb2luKF9qb2luKSArIGVvbCk7XG5cdFx0fVxuXG5cdFx0X2FyciA9IG1ldGFMaWIuY29udHJpYnV0ZXMoKTtcblx0XHRfbGFiZWwgPSAn6LKi54276ICF77yaJztcblxuXHRcdGlmIChfYXJyICYmIF9hcnIubGVuZ3RoKVxuXHRcdHtcblx0XHRcdGEyLnB1c2goX2xhYmVsICsgX2Fyci5qb2luKF9qb2luKSArIGVvbCk7XG5cdFx0fVxuXG5cdFx0X2FyciA9IG1ldGFMaWIudGFncygpO1xuXHRcdF9sYWJlbCA9ICfmqJnnsaTvvJonO1xuXG5cdFx0aWYgKF9hcnIgJiYgX2Fyci5sZW5ndGgpXG5cdFx0e1xuXHRcdFx0YTIucHVzaChfbGFiZWwgKyBfYXJyLmpvaW4oX2pvaW4pICsgZW9sKTtcblx0XHR9XG5cblx0XHRpZiAoYTIubGVuZ3RoKVxuXHRcdHtcblx0XHRcdGEyLnVuc2hpZnQoaHIyKTtcblxuXHRcdFx0YTIucHVzaChocjIpO1xuXG5cdFx0XHR0eHQgKz0gYTIuam9pbihlb2wpO1xuXHRcdH1cblxuLy9cdFx0Y29uc29sZS5sb2codHh0KTtcbi8vXHRcdHByb2Nlc3MuZXhpdCgpO1xuXG5cdFx0YS51bnNoaWZ0KHR4dCk7XG5cdH1cblxuXHRsZXQgZmlsZW5hbWU6IHN0cmluZztcblxuXHRpZiAodHlwZW9mIG91dHB1dEZpbGVuYW1lID09ICdzdHJpbmcnICYmIG91dHB1dEZpbGVuYW1lKVxuXHR7XG5cdFx0ZmlsZW5hbWUgPSBvdXRwdXRGaWxlbmFtZTtcblx0fVxuXG5cdGlmICghZmlsZW5hbWUgJiYgbWV0YSAmJiBtZXRhLm5vdmVsKVxuXHR7XG5cdFx0aWYgKG1ldGEubm92ZWwudGl0bGVfc2hvcnQpXG5cdFx0e1xuXHRcdFx0ZmlsZW5hbWUgPSBtZXRhLm5vdmVsLnRpdGxlX3Nob3J0O1xuXHRcdH1cblx0XHRlbHNlIGlmIChtZXRhLm5vdmVsLnRpdGxlKVxuXHRcdHtcblx0XHRcdGZpbGVuYW1lID0gbWV0YS5ub3ZlbC50aXRsZTtcblx0XHR9XG5cdFx0ZWxzZSBpZiAobWV0YS5ub3ZlbC50aXRsZV96aClcblx0XHR7XG5cdFx0XHRmaWxlbmFtZSA9IG1ldGEubm92ZWwudGl0bGVfemg7XG5cdFx0fVxuXHR9XG5cblx0ZmlsZW5hbWUgPSBmaWxlbmFtZSB8fCAndGVtcCc7XG5cblx0bGV0IGZpbGVuYW1lMiA9IHRyaW1GaWxlbmFtZShmaWxlbmFtZSlcblx0XHQucmVwbGFjZSgvXFwuLywgJ18nKVxuXHRcdC5yZXBsYWNlKC9eW18rXFwtXSt8W18rXFwtXSskLywgJycpXG5cdDtcblxuXHRmaWxlbmFtZTIgPSBVU3RyaW5nLmNyZWF0ZShmaWxlbmFtZTIpLnNwbGl0KCcnKS5zbGljZSgwLCAyMCkuam9pbignJyk7XG5cdGZpbGVuYW1lMiA9IHRyaW1GaWxlbmFtZShmaWxlbmFtZTIpO1xuXG5cdGlmICghZmlsZW5hbWUyKVxuXHR7XG5cdFx0Y29uc29sZS5lcnJvcihgW0VSUk9SXSBCYWQgRmlsZW5hbWU6ICR7ZmlsZW5hbWV9ID0+ICR7ZmlsZW5hbWUyfWApO1xuXG5cdFx0ZmlsZW5hbWUyID0gJ3RlbXAnO1xuXHR9XG5cblx0ZmlsZW5hbWUgKz0gJ18nICsgbW9tZW50KCkubG9jYWwoKS5mb3JtYXQoJ1lZWVlNTURESEhtbScpO1xuXG5cdGZpbGVuYW1lMiA9IGAke2ZpbGVuYW1lMn0ub3V0LnR4dGA7XG5cblx0cmV0dXJuIGZpbGVuYW1lMjtcbn1cblxuZXhwb3J0IGRlZmF1bHQgdHh0TWVyZ2U7XG4iXX0=