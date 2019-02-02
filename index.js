"use strict";
/**
 * Created by user on 2018/1/28/028.
 */
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
const normalize_1 = require("@node-novel/normalize");
const debug_color2_1 = require("debug-color2");
const class_1 = require("node-novel-info/class");
const node_novel_info_2 = require("node-novel-info");
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
            [globby_patterns, globby_options] = novelGlobby.getOptions(globby_options);
            //globby_patterns.push('!*/*/*/**/*');
        }
        let meta;
        //console.info(`PATH_CWD: ${PATH_CWD}\n`);
        //console.log(globby_patterns);
        //console.log(globby_options);
        // @ts-ignore
        meta = await novelGlobby.globbyASync([
            'README.md',
        ], globby_options)
            .then(novelGlobby.returnGlobList)
            .then(glob_sort_1.sortTree)
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
        return novelGlobby.globbyASync(globby_patterns, globby_options)
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
                        //_prefix = `第${String(++count_idx).padStart(5, '0')}話：${vs.concat([chapter_title]).join('／')}\n`;
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
            //console.log(ls[0]);
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
        //		console.dir({
        //			//_ls,
        //			ret,
        //		}, {
        //			depth: null,
        //		});
        //		process.exit();
    }
    const metaLib = new class_1.NodeNovelInfo(meta, {
        throw: false,
        lowCheckLevel: true,
    });
    if (meta && meta.novel) {
        let txt = `${meta.novel.title}${eol}${meta.novel.author}${eol}${meta.novel.source || ''}${eol}${eol}${meta.novel.preface}${eol}${eol}`;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7O0FBR0gsaURBQWtEO0FBQ2xELDZCQUE4QjtBQUM5Qiw0Q0FBNkM7QUFDN0MsaUNBQWtDO0FBQ2xDLHFEQUE0RDtBQUM1RCxtREFBZ0Q7QUFDaEQsdUNBQTRDO0FBQzVDLDJDQUFpQztBQUNqQywrREFBMkQ7QUFFM0QscURBQXdEO0FBQ3hELCtDQUF1QztBQUN2QyxpREFBc0Q7QUFDdEQscURBQXdEO0FBRXhELE1BQU0sT0FBTyxHQUFHLElBQUksc0JBQU8sQ0FBQyxJQUFJLEVBQUU7SUFDakMsT0FBTyxFQUFFLElBQUk7SUFDYixjQUFjLEVBQUU7UUFDZixNQUFNLEVBQUUsSUFBSTtLQUNaO0lBQ0QsWUFBWSxFQUFFO1FBQ2IsT0FBTyxFQUFFLElBQUk7S0FDYjtDQUNELENBQUMsQ0FBQztBQUVILE9BQU8sQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDO0FBRTVCLE1BQU0sTUFBTSxHQUFHLEVBQUUsQ0FBQztBQUNsQixNQUFNLEdBQUcsR0FBRyxxQkFBSSxDQUFDO0FBQ2pCLE1BQU0sSUFBSSxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFFM0IsTUFBTSxHQUFHLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUMvQixNQUFNLEdBQUcsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBRS9COzs7Ozs7R0FNRztBQUNILFNBQWdCLFFBQVEsQ0FBQyxTQUFpQixFQUN6QyxVQUFrQixFQUNsQixjQUF1QixFQUN2QixNQUFnQjtJQU9oQixPQUFPLGVBQWUsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSztRQUUxQyxNQUFNLFFBQVEsR0FBVyxTQUFTLENBQUM7UUFDbkMsTUFBTSxRQUFRLEdBQVcsVUFBVSxDQUFDO1FBQ3BD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LENBQUM7SUFDdEUsU0FBUyxHQUFHLHVCQUFZLENBQUMsU0FBUyxDQUFDLENBQUM7SUFFcEMsSUFBSSxDQUFDLFNBQVMsRUFDZDtRQUNDLE9BQU8sQ0FBQyxLQUFLLENBQUMseUJBQXlCLFFBQVEsT0FBTyxTQUFTLEVBQUUsQ0FBQyxDQUFDO1FBRW5FLFNBQVMsR0FBRyxNQUFNLENBQUM7S0FDbkI7SUFFRCxRQUFRLElBQUksR0FBRyxHQUFHLE1BQU0sRUFBRSxDQUFDLEtBQUssRUFBRSxDQUFDLE1BQU0sQ0FBQyxjQUFjLENBQUMsQ0FBQztJQUUxRCxTQUFTLEdBQUcsR0FBRyxTQUFTLFVBQVUsQ0FBQztJQUVuQyxPQUFPLFNBQVMsQ0FBQztBQUNsQixDQUFDO0FBbE1ELG9DQWtNQztBQUVELGtCQUFlLFFBQVEsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ3JlYXRlZCBieSB1c2VyIG9uIDIwMTgvMS8yOC8wMjguXG4gKi9cblxuaW1wb3J0IHsgSVJldHVybkxpc3QgfSBmcm9tICdub2RlLW5vdmVsLWdsb2JieSc7XG5pbXBvcnQgbm92ZWxHbG9iYnkgPSByZXF1aXJlKCdub2RlLW5vdmVsLWdsb2JieScpO1xuaW1wb3J0IHBhdGggPSByZXF1aXJlKCdwYXRoJyk7XG5pbXBvcnQgQmx1ZWJpcmRQcm9taXNlID0gcmVxdWlyZSgnYmx1ZWJpcmQnKTtcbmltcG9ydCBtb21lbnQgPSByZXF1aXJlKCdtb21lbnQnKTtcbmltcG9ydCB7IG1kY29uZl9wYXJzZSwgSU1kY29uZk1ldGEgfSBmcm9tICdub2RlLW5vdmVsLWluZm8nO1xuaW1wb3J0IHsgY3JsZiwgQ1JMRiwgTEYgfSBmcm9tICdjcmxmLW5vcm1hbGl6ZSc7XG5pbXBvcnQgZnMsIHsgdHJpbUZpbGVuYW1lIH0gZnJvbSAnZnMtaWNvbnYnO1xuaW1wb3J0IFVTdHJpbmcgZnJvbSAndW5pLXN0cmluZyc7XG5pbXBvcnQgeyBzb3J0VHJlZSB9IGZyb20gJ25vZGUtbm92ZWwtZ2xvYmJ5L2xpYi9nbG9iLXNvcnQnO1xuaW1wb3J0IHsgYXJyYXlfdW5pcXVlIH0gZnJvbSAnYXJyYXktaHlwZXItdW5pcXVlJztcbmltcG9ydCB7IG5vcm1hbGl6ZV9zdHJpcCB9IGZyb20gJ0Bub2RlLW5vdmVsL25vcm1hbGl6ZSc7XG5pbXBvcnQgeyBDb25zb2xlIH0gZnJvbSAnZGVidWctY29sb3IyJztcbmltcG9ydCB7IE5vZGVOb3ZlbEluZm8gfSBmcm9tICdub2RlLW5vdmVsLWluZm8vY2xhc3MnO1xuaW1wb3J0IHsgZ2V0Tm92ZWxUaXRsZUZyb21NZXRhIH0gZnJvbSAnbm9kZS1ub3ZlbC1pbmZvJztcblxuY29uc3QgY29uc29sZSA9IG5ldyBDb25zb2xlKG51bGwsIHtcblx0ZW5hYmxlZDogdHJ1ZSxcblx0aW5zcGVjdE9wdGlvbnM6IHtcblx0XHRjb2xvcnM6IHRydWUsXG5cdH0sXG5cdGNoYWxrT3B0aW9uczoge1xuXHRcdGVuYWJsZWQ6IHRydWUsXG5cdH0sXG59KTtcblxuY29uc29sZS5lbmFibGVkQ29sb3IgPSB0cnVlO1xuXG5jb25zdCBocl9sZW4gPSAxNTtcbmNvbnN0IGVvbCA9IENSTEY7XG5jb25zdCBlb2wyID0gZW9sLnJlcGVhdCgyKTtcblxuY29uc3QgaHIxID0gJ++8nScucmVwZWF0KGhyX2xlbik7XG5jb25zdCBocjIgPSAn77yNJy5yZXBlYXQoaHJfbGVuKTtcblxuLyoqXG4gKlxuICogQHBhcmFtIGlucHV0UGF0aCDovLjlhaXot6/lvpFcbiAqIEBwYXJhbSBvdXRwdXRQYXRoIOi8uOWHuui3r+W+kVxuICogQHBhcmFtIG91dHB1dEZpbGVuYW1lIOWPg+iAg+eUqOaqlOahiOWQjeeosVxuICogQHBhcmFtIG5vU2F2ZSDkuI3lhLLlrZjmqpTmoYjlg4Xlm57lgrMgdHh0IOWFp+WuuVxuICovXG5leHBvcnQgZnVuY3Rpb24gdHh0TWVyZ2UoaW5wdXRQYXRoOiBzdHJpbmcsXG5cdG91dHB1dFBhdGg6IHN0cmluZyxcblx0b3V0cHV0RmlsZW5hbWU/OiBzdHJpbmcsXG5cdG5vU2F2ZT86IGJvb2xlYW4sXG4pOiBCbHVlYmlyZFByb21pc2U8e1xuXHRmaWxlbmFtZTogc3RyaW5nLFxuXHRmdWxscGF0aDogc3RyaW5nLFxuXHRkYXRhOiBzdHJpbmcsXG59Plxue1xuXHRyZXR1cm4gQmx1ZWJpcmRQcm9taXNlLnJlc29sdmUoKS50aGVuKGFzeW5jIGZ1bmN0aW9uICgpXG5cdHtcblx0XHRjb25zdCBUWFRfUEFUSDogc3RyaW5nID0gaW5wdXRQYXRoO1xuXHRcdGNvbnN0IFBBVEhfQ1dEOiBzdHJpbmcgPSBvdXRwdXRQYXRoO1xuXHRcdGNvbnN0IG91dHB1dERpclBhdGhQcmVmaXggPSAnb3V0JztcblxuXHRcdGlmICghaW5wdXRQYXRoIHx8ICFvdXRwdXRQYXRoIHx8IHR5cGVvZiBpbnB1dFBhdGggIT0gJ3N0cmluZycgfHwgdHlwZW9mIG91dHB1dFBhdGggIT0gJ3N0cmluZycpXG5cdFx0e1xuXHRcdFx0dGhyb3cgbmV3IFJlZmVyZW5jZUVycm9yKCdtdXN0IHNldCBpbnB1dFBhdGgsIG91dHB1dFBhdGgnKTtcblx0XHR9XG5cblx0XHRsZXQgZ2xvYmJ5X3BhdHRlcm5zOiBzdHJpbmdbXTtcblx0XHRsZXQgZ2xvYmJ5X29wdGlvbnM6IG5vdmVsR2xvYmJ5LklPcHRpb25zID0ge1xuXHRcdFx0Y3dkOiBUWFRfUEFUSCxcblx0XHRcdHVzZURlZmF1bHRQYXR0ZXJuc0V4Y2x1ZGU6IHRydWUsXG5cdFx0XHRhYnNvbHV0ZTogdHJ1ZSxcblx0XHR9O1xuXG5cdFx0e1xuXHRcdFx0W2dsb2JieV9wYXR0ZXJucywgZ2xvYmJ5X29wdGlvbnNdID0gbm92ZWxHbG9iYnkuZ2V0T3B0aW9ucyhnbG9iYnlfb3B0aW9ucyk7XG5cblx0XHRcdC8vZ2xvYmJ5X3BhdHRlcm5zLnB1c2goJyEqLyovKi8qKi8qJyk7XG5cdFx0fVxuXG5cdFx0bGV0IG1ldGE6IElNZGNvbmZNZXRhO1xuXG5cdFx0Ly9jb25zb2xlLmluZm8oYFBBVEhfQ1dEOiAke1BBVEhfQ1dEfVxcbmApO1xuXG5cdFx0Ly9jb25zb2xlLmxvZyhnbG9iYnlfcGF0dGVybnMpO1xuXHRcdC8vY29uc29sZS5sb2coZ2xvYmJ5X29wdGlvbnMpO1xuXG5cdFx0Ly8gQHRzLWlnbm9yZVxuXHRcdG1ldGEgPSBhd2FpdCBub3ZlbEdsb2JieS5nbG9iYnlBU3luYyhbXG5cdFx0XHRcdCdSRUFETUUubWQnLFxuXHRcdFx0XSwgZ2xvYmJ5X29wdGlvbnMpXG5cdFx0XHQudGhlbihub3ZlbEdsb2JieS5yZXR1cm5HbG9iTGlzdClcblx0XHRcdC50aGVuKHNvcnRUcmVlKVxuXHRcdFx0LnRhcChmdW5jdGlvbiAobHMpXG5cdFx0XHR7XG5cdFx0XHRcdC8vY29uc29sZS5sb2cobHMpO1xuXHRcdFx0fSlcblx0XHRcdC50aGVuKGFzeW5jIGZ1bmN0aW9uIChscylcblx0XHRcdHtcblx0XHRcdFx0bGV0IGRhdGEgPSBhd2FpdCBmcy5yZWFkRmlsZShsc1swXSk7XG5cblx0XHRcdFx0cmV0dXJuIG1kY29uZl9wYXJzZShkYXRhLCB7XG5cdFx0XHRcdFx0dGhyb3c6IGZhbHNlLFxuXHRcdFx0XHR9KTtcblx0XHRcdH0pXG5cdFx0XHQudGFwKGZ1bmN0aW9uIChscylcblx0XHRcdHtcblx0XHRcdFx0Ly9jb25zb2xlLmxvZyhscyk7XG5cdFx0XHR9KVxuXHRcdFx0LmNhdGNoKGZ1bmN0aW9uICgpXG5cdFx0XHR7XG5cdFx0XHRcdGNvbnNvbGUud2FybihgW1dBUk5dIFJFQURNRS5tZCBub3QgZXhpc3RzISAoJHtwYXRoLmpvaW4oZ2xvYmJ5X29wdGlvbnMuY3dkLCAnUkVBRE1FLm1kJyl9KWApO1xuXHRcdFx0fSlcblx0XHQ7XG5cblx0XHQvL2NvbnNvbGUubG9nKGdsb2JieV9wYXR0ZXJucyk7XG5cblx0XHRyZXR1cm4gbm92ZWxHbG9iYnkuZ2xvYmJ5QVN5bmMoZ2xvYmJ5X3BhdHRlcm5zLCBnbG9iYnlfb3B0aW9ucylcblx0XHRcdC50YXAoZnVuY3Rpb24gKGxzKVxuXHRcdFx0e1xuXHRcdFx0XHQvL2NvbnNvbGUubG9nKGxzKTtcblx0XHRcdFx0Ly90aHJvdyBuZXcgRXJyb3IoJ3Rlc3QnKTtcblxuXHRcdFx0XHQvL3Byb2Nlc3MuZXhpdCgpO1xuXHRcdFx0fSlcblx0XHRcdC50aGVuKGZ1bmN0aW9uIChfbHMpXG5cdFx0XHR7XG5cdFx0XHRcdGlmICghX2xzIHx8ICFPYmplY3Qua2V5cyhfbHMpLmxlbmd0aClcblx0XHRcdFx0e1xuXHRcdFx0XHRcdC8vIEB0cy1pZ25vcmVcblx0XHRcdFx0XHRyZXR1cm4gQmx1ZWJpcmRQcm9taXNlLnJlamVjdChg5rKS5pyJ5Y+v5ZCI5L2155qE5qqU5qGI5a2Y5ZyoYCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRsZXQgY291bnRfZiA9IDA7XG5cdFx0XHRcdGxldCBjb3VudF9kID0gMDtcblxuXHRcdFx0XHRsZXQgY291bnRfaWR4ID0gMDtcblxuXHRcdFx0XHRyZXR1cm4gQmx1ZWJpcmRQcm9taXNlXG5cdFx0XHRcdFx0Lm1hcFNlcmllcyhPYmplY3Qua2V5cyhfbHMpLCBhc3luYyBmdW5jdGlvbiAodmFsX2RpciwgaW5kZXgsIGxlbilcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRsZXQgbHM6IG5vdmVsR2xvYmJ5LklSZXR1cm5Sb3dbXSA9IF9sc1t2YWxfZGlyXTtcblxuXHRcdFx0XHRcdFx0bGV0IHZvbHVtZV90aXRsZSA9IGxzWzBdLnZvbHVtZV90aXRsZTtcblxuXHRcdFx0XHRcdFx0Y291bnRfZCsrO1xuXG5cdFx0XHRcdFx0XHRsZXQgdnMgPSB2b2x1bWVfdGl0bGVcblx0XHRcdFx0XHRcdFx0LnNwbGl0KCcvJylcblx0XHRcdFx0XHRcdFx0Lm1hcChmdW5jdGlvbiAodilcblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdHJldHVybiBub3JtYWxpemVfc3RyaXAodiwgdHJ1ZSlcblx0XHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdDtcblxuXHRcdFx0XHRcdFx0dm9sdW1lX3RpdGxlID0gdnNcblx0XHRcdFx0XHRcdFx0LmpvaW4oTEYpXG5cdFx0XHRcdFx0XHQ7XG5cblx0XHRcdFx0XHRcdGxldCBfdm9sX3ByZWZpeCA9ICcnO1xuXG5cdFx0XHRcdFx0XHRpZiAoMSlcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0X3ZvbF9wcmVmaXggPSBg56ysJHtTdHJpbmcoKytjb3VudF9pZHgpLnBhZFN0YXJ0KDUsICcwJyl96Kmx77yaJHt2cy5qb2luKCfvvI8nKX0ke2VvbH1gO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRsZXQgdHh0ID0gYCR7aHIxfUNIRUNLJHtlb2x9JHtfdm9sX3ByZWZpeH0ke3ZvbHVtZV90aXRsZX0ke2VvbH0ke2hyMX0ke2VvbH1gO1xuXG5cdFx0XHRcdFx0XHRsZXQgYSA9IGF3YWl0IEJsdWViaXJkUHJvbWlzZS5tYXBTZXJpZXMobHMsIGFzeW5jIGZ1bmN0aW9uIChyb3c6IG5vdmVsR2xvYmJ5LklSZXR1cm5Sb3cpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdGxldCBkYXRhID0gYXdhaXQgZnMucmVhZEZpbGUocm93LnBhdGgpO1xuXG5cdFx0XHRcdFx0XHRcdGNvdW50X2YrKztcblxuXHRcdFx0XHRcdFx0XHRsZXQgY2hhcHRlcl90aXRsZSA9IHJvdy5jaGFwdGVyX3RpdGxlO1xuXG5cdFx0XHRcdFx0XHRcdGxldCBfcHJlZml4ID0gJyc7XG5cblx0XHRcdFx0XHRcdFx0aWYgKDEpXG5cdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRfcHJlZml4ID0gYOesrCR7U3RyaW5nKCsrY291bnRfaWR4KS5wYWRTdGFydCg1LCAnMCcpfeipse+8miR7Y2hhcHRlcl90aXRsZX0ke2VvbH1gXG5cblx0XHRcdFx0XHRcdFx0XHQvL19wcmVmaXggPSBg56ysJHtTdHJpbmcoKytjb3VudF9pZHgpLnBhZFN0YXJ0KDUsICcwJyl96Kmx77yaJHt2cy5jb25jYXQoW2NoYXB0ZXJfdGl0bGVdKS5qb2luKCfvvI8nKX1cXG5gO1xuXHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0bGV0IHR4dCA9IGAke2hyMn1CRUdJTiR7ZW9sfSR7X3ByZWZpeH0ke2NoYXB0ZXJfdGl0bGV9JHtlb2x9JHtocjJ9Qk9EWSR7ZW9sMn0ke2RhdGF9JHtlb2wyfSR7aHIyfUVORCR7ZW9sMn1gO1xuXG5cdFx0XHRcdFx0XHRcdHJldHVybiB0eHQ7XG5cdFx0XHRcdFx0XHR9KTtcblxuXHRcdFx0XHRcdFx0YS51bnNoaWZ0KHR4dCk7XG5cblx0XHRcdFx0XHRcdHJldHVybiBhLmpvaW4oZW9sKTtcblx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdC50aGVuKGFzeW5jIGZ1bmN0aW9uIChhKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGxldCBmaWxlbmFtZTIgPSBtYWtlRmlsZW5hbWUobWV0YSwgb3V0cHV0RmlsZW5hbWUsIGEsIF9scywge1xuXHRcdFx0XHRcdFx0XHRUWFRfUEFUSCxcblx0XHRcdFx0XHRcdH0pO1xuXG5cdFx0XHRcdFx0XHRsZXQgdHh0ID0gYS5qb2luKGVvbCk7XG5cdFx0XHRcdFx0XHR0eHQgPSBjcmxmKHR4dCwgZW9sKTtcblxuXHRcdFx0XHRcdFx0bGV0IGZ1bGxwYXRoID0gcGF0aC5qb2luKFBBVEhfQ1dELCBvdXRwdXREaXJQYXRoUHJlZml4LCBgJHtmaWxlbmFtZTJ9YCk7XG5cblx0XHRcdFx0XHRcdGlmICghbm9TYXZlKVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRhd2FpdCBmcy5vdXRwdXRGaWxlKGZ1bGxwYXRoLCB0eHQpO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdFx0XHRmaWxlbmFtZTogZmlsZW5hbWUyLFxuXHRcdFx0XHRcdFx0XHRmdWxscGF0aCxcblx0XHRcdFx0XHRcdFx0ZGF0YTogdHh0LFxuXHRcdFx0XHRcdFx0fTtcblx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdC50YXAoZnVuY3Rpb24gKGRhdGEpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0Y29uc29sZS5zdWNjZXNzKCdbRE9ORV0gZG9uZS4nKTtcblxuXHRcdFx0XHRcdFx0Y29uc29sZS5pbmZvKGBUb3RhbCBEOiAke2NvdW50X2R9XFxuVG90YWwgRjogJHtjb3VudF9mfVxcblxcbltGSUxFTkFNRV0gJHtkYXRhLmZpbGVuYW1lfWApO1xuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0Ly8gQHRzLWlnbm9yZVxuXHRcdFx0XHRcdC50YXBDYXRjaChmdW5jdGlvbiAoZSlcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRjb25zb2xlLmVycm9yKGBbRVJST1JdIHNvbWV0aGluZyB3cm9uZyEhYCk7XG5cdFx0XHRcdFx0XHRjb25zb2xlLnRyYWNlKGUpO1xuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0O1xuXHRcdFx0fSlcblx0XHRcdC50YXBDYXRjaChmdW5jdGlvbiAoZSlcblx0XHRcdHtcblx0XHRcdFx0Y29uc29sZS5lcnJvcihgW0VSUk9SXSBjYW4ndCBmb3VuZCBhbnkgZmlsZSBpbiAnJHtUWFRfUEFUSH0nYCk7XG5cdFx0XHRcdGNvbnNvbGUudHJhY2UoZSk7XG5cdFx0XHR9KVxuXHRcdFx0O1xuXHR9KVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TWV0YVRpdGxlcyhtZXRhOiBJTWRjb25mTWV0YSk6IHN0cmluZ1tdXG57XG5cdHJldHVybiBnZXROb3ZlbFRpdGxlRnJvbU1ldGEobWV0YSk7XG59XG5cbi8qKlxuICog5Zue5YKz6JmV55CG5b6M55qE5qqU5qGI5ZCN56ixXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtYWtlRmlsZW5hbWUobWV0YT86IElNZGNvbmZNZXRhLCBvdXRwdXRGaWxlbmFtZT86IHN0cmluZywgYTogc3RyaW5nW10gPSBbXSwgX2xzPzogSVJldHVybkxpc3QsIF9hcmd2OiB7XG5cdFRYVF9QQVRIPzogc3RyaW5nLFxufSA9IHt9KTogc3RyaW5nXG57XG5cdGlmIChfbHMpXG5cdHtcblx0XHRsZXQgY3VycmVudF9sZXZlbCA9IDA7XG5cdFx0bGV0IF9sZXN0ID0ge1xuXHRcdFx0X3RzOiBbXSxcblx0XHR9IGFzIHtcblx0XHRcdHZhbF9kaXI6IHN0cmluZyxcblx0XHRcdHZvbHVtZV90aXRsZTogc3RyaW5nLFxuXHRcdFx0X3RzOiBzdHJpbmdbXSxcblx0XHRcdGxldmVsOiBudW1iZXIsXG5cdFx0fTtcblxuXHRcdGxldCBjID0gJy0gJztcblxuXHRcdGxldCByZXQgPSBPYmplY3Qua2V5cyhfbHMpXG5cdFx0XHQucmVkdWNlKGZ1bmN0aW9uIChhMSwgdmFsX2Rpcilcblx0XHRcdHtcblx0XHRcdFx0bGV0IGxzOiBub3ZlbEdsb2JieS5JUmV0dXJuUm93W10gPSBfbHNbdmFsX2Rpcl07XG5cblx0XHRcdFx0bGV0IHZvbHVtZV90aXRsZSA9IGxzWzBdLnZvbHVtZV90aXRsZTtcblxuXHRcdFx0XHRsZXQgX3RzID0gdm9sdW1lX3RpdGxlLnNwbGl0KCcvJyk7XG5cblx0XHRcdFx0aWYgKF9sZXN0LnZhbF9kaXIgIT0gdmFsX2Rpcilcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGZvciAobGV0IGkgPSAwOyBpIDwgX3RzLmxlbmd0aDsgaSsrKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGlmIChfbGVzdC5fdHNbaV0gIT0gX3RzW2ldKVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRhMS5wdXNoKGMucmVwZWF0KGkgKyAxKSArIG5vcm1hbGl6ZV9zdHJpcChfdHNbaV0sIHRydWUpKVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdC8vY29uc29sZS5sb2cobHNbMF0pO1xuXG5cdFx0XHRcdGxzLmZvckVhY2goZnVuY3Rpb24gKHJvdylcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGExLnB1c2goYy5yZXBlYXQoX3RzLmxlbmd0aCArIDEpICsgcm93LmNoYXB0ZXJfdGl0bGUpO1xuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHRfbGVzdCA9IHtcblx0XHRcdFx0XHRfdHMsXG5cdFx0XHRcdFx0dmFsX2Rpcixcblx0XHRcdFx0XHR2b2x1bWVfdGl0bGUsXG5cdFx0XHRcdFx0bGV2ZWw6IF90cy5sZW5ndGgsXG5cdFx0XHRcdH07XG5cblx0XHRcdFx0cmV0dXJuIGExO1xuXHRcdFx0fSwgW10pXG5cdFx0O1xuXG5cdFx0aWYgKHJldC5sZW5ndGgpXG5cdFx0e1xuXHRcdFx0cmV0LnVuc2hpZnQoYOebrumMhOe0ouW8le+8mmApO1xuXHRcdFx0cmV0LnB1c2goaHIyICsgZW9sKTtcblxuXHRcdFx0YS51bnNoaWZ0KHJldC5qb2luKGVvbCkpO1xuXHRcdH1cblxuLy9cdFx0Y29uc29sZS5kaXIoe1xuLy9cdFx0XHQvL19scyxcbi8vXHRcdFx0cmV0LFxuLy9cdFx0fSwge1xuLy9cdFx0XHRkZXB0aDogbnVsbCxcbi8vXHRcdH0pO1xuLy9cdFx0cHJvY2Vzcy5leGl0KCk7XG5cdH1cblxuXHRjb25zdCBtZXRhTGliID0gbmV3IE5vZGVOb3ZlbEluZm8obWV0YSwge1xuXHRcdHRocm93OiBmYWxzZSxcblx0XHRsb3dDaGVja0xldmVsOiB0cnVlLFxuXHR9KTtcblxuXHRpZiAobWV0YSAmJiBtZXRhLm5vdmVsKVxuXHR7XG5cdFx0bGV0IHR4dCA9IGAke21ldGEubm92ZWwudGl0bGV9JHtlb2x9JHttZXRhLm5vdmVsLmF1dGhvcn0ke2VvbH0ke21ldGEubm92ZWwuc291cmNlIHx8ICcnfSR7ZW9sfSR7ZW9sfSR7bWV0YS5ub3ZlbC5wcmVmYWNlfSR7ZW9sfSR7ZW9sfWA7XG5cblx0XHRsZXQgYTIgPSBbXTtcblxuXHRcdGxldCBub3ZlbElEID0gX2FyZ3YgJiYgX2FyZ3YuVFhUX1BBVEggJiYgcGF0aC5iYXNlbmFtZShfYXJndi5UWFRfUEFUSCkgfHwgJyc7XG5cblx0XHRsZXQgdGl0bGVzID0gW25vdmVsSURdLmNvbmNhdChtZXRhTGliLnRpdGxlcygpKVxuXHRcdFx0LmZpbHRlcih2ID0+IHYgJiYgdiAhPSBtZXRhLm5vdmVsLnRpdGxlKVxuXHRcdDtcblxuXHRcdGlmICh0aXRsZXMubGVuZ3RoKVxuXHRcdHtcblx0XHRcdGEyLnB1c2goYOWFtuS7luWQjeeose+8miR7ZW9sfWAgKyB0aXRsZXMuam9pbihlb2wpICsgZW9sKTtcblx0XHRcdGEyLnB1c2goaHIyKTtcblx0XHR9XG5cblx0XHRsZXQgX2Fycjogc3RyaW5nW107XG5cdFx0bGV0IF9sYWJlbCA9ICcnO1xuXHRcdGxldCBfam9pbiA9ICfjgIEnO1xuXG5cdFx0X2FyciA9IG1ldGFMaWIuYXV0aG9ycygpXG5cdFx0XHQuZmlsdGVyKHYgPT4gdiAmJiB2ICE9IG1ldGEubm92ZWwuYXV0aG9yKVxuXHRcdDtcblx0XHRfbGFiZWwgPSAn5YW25LuW5L2c6ICF77yaJztcblxuXHRcdGlmIChfYXJyICYmIF9hcnIubGVuZ3RoKVxuXHRcdHtcblx0XHRcdGEyLnB1c2goX2xhYmVsICsgX2Fyci5qb2luKF9qb2luKSArIGVvbCk7XG5cdFx0fVxuXG5cdFx0X2FyciA9IG1ldGFMaWIuaWxsdXN0cygpO1xuXHRcdF9sYWJlbCA9ICfnuarluKvvvJonO1xuXG5cdFx0aWYgKF9hcnIgJiYgX2Fyci5sZW5ndGgpXG5cdFx0e1xuXHRcdFx0YTIucHVzaChfbGFiZWwgKyBfYXJyLmpvaW4oX2pvaW4pICsgZW9sKTtcblx0XHR9XG5cblx0XHRfYXJyID0gbWV0YUxpYi5jb250cmlidXRlcygpO1xuXHRcdF9sYWJlbCA9ICfosqLnjbvogIXvvJonO1xuXG5cdFx0aWYgKF9hcnIgJiYgX2Fyci5sZW5ndGgpXG5cdFx0e1xuXHRcdFx0YTIucHVzaChfbGFiZWwgKyBfYXJyLmpvaW4oX2pvaW4pICsgZW9sKTtcblx0XHR9XG5cblx0XHRfYXJyID0gbWV0YUxpYi50YWdzKCk7XG5cdFx0X2xhYmVsID0gJ+aomeexpO+8mic7XG5cblx0XHRpZiAoX2FyciAmJiBfYXJyLmxlbmd0aClcblx0XHR7XG5cdFx0XHRhMi5wdXNoKF9sYWJlbCArIF9hcnIuam9pbihfam9pbikgKyBlb2wpO1xuXHRcdH1cblxuXHRcdGlmIChhMi5sZW5ndGgpXG5cdFx0e1xuXHRcdFx0YTIudW5zaGlmdChocjIpO1xuXG5cdFx0XHRhMi5wdXNoKGhyMik7XG5cblx0XHRcdHR4dCArPSBhMi5qb2luKGVvbCk7XG5cdFx0fVxuXG4vL1x0XHRjb25zb2xlLmxvZyh0eHQpO1xuLy9cdFx0cHJvY2Vzcy5leGl0KCk7XG5cblx0XHRhLnVuc2hpZnQodHh0KTtcblx0fVxuXG5cdGxldCBmaWxlbmFtZTogc3RyaW5nO1xuXG5cdGlmICh0eXBlb2Ygb3V0cHV0RmlsZW5hbWUgPT0gJ3N0cmluZycgJiYgb3V0cHV0RmlsZW5hbWUpXG5cdHtcblx0XHRmaWxlbmFtZSA9IG91dHB1dEZpbGVuYW1lO1xuXHR9XG5cblx0aWYgKCFmaWxlbmFtZSAmJiBtZXRhICYmIG1ldGEubm92ZWwpXG5cdHtcblx0XHRpZiAobWV0YS5ub3ZlbC50aXRsZV9zaG9ydClcblx0XHR7XG5cdFx0XHRmaWxlbmFtZSA9IG1ldGEubm92ZWwudGl0bGVfc2hvcnQ7XG5cdFx0fVxuXHRcdGVsc2UgaWYgKG1ldGEubm92ZWwudGl0bGUpXG5cdFx0e1xuXHRcdFx0ZmlsZW5hbWUgPSBtZXRhLm5vdmVsLnRpdGxlO1xuXHRcdH1cblx0XHRlbHNlIGlmIChtZXRhLm5vdmVsLnRpdGxlX3poKVxuXHRcdHtcblx0XHRcdGZpbGVuYW1lID0gbWV0YS5ub3ZlbC50aXRsZV96aDtcblx0XHR9XG5cdH1cblxuXHRmaWxlbmFtZSA9IGZpbGVuYW1lIHx8ICd0ZW1wJztcblxuXHRsZXQgZmlsZW5hbWUyID0gdHJpbUZpbGVuYW1lKGZpbGVuYW1lKVxuXHRcdC5yZXBsYWNlKC9cXC4vLCAnXycpXG5cdFx0LnJlcGxhY2UoL15bXytcXC1dK3xbXytcXC1dKyQvLCAnJylcblx0O1xuXG5cdGZpbGVuYW1lMiA9IFVTdHJpbmcuY3JlYXRlKGZpbGVuYW1lMikuc3BsaXQoJycpLnNsaWNlKDAsIDIwKS5qb2luKCcnKTtcblx0ZmlsZW5hbWUyID0gdHJpbUZpbGVuYW1lKGZpbGVuYW1lMik7XG5cblx0aWYgKCFmaWxlbmFtZTIpXG5cdHtcblx0XHRjb25zb2xlLmVycm9yKGBbRVJST1JdIEJhZCBGaWxlbmFtZTogJHtmaWxlbmFtZX0gPT4gJHtmaWxlbmFtZTJ9YCk7XG5cblx0XHRmaWxlbmFtZTIgPSAndGVtcCc7XG5cdH1cblxuXHRmaWxlbmFtZSArPSAnXycgKyBtb21lbnQoKS5sb2NhbCgpLmZvcm1hdCgnWVlZWU1NRERISG1tJyk7XG5cblx0ZmlsZW5hbWUyID0gYCR7ZmlsZW5hbWUyfS5vdXQudHh0YDtcblxuXHRyZXR1cm4gZmlsZW5hbWUyO1xufVxuXG5leHBvcnQgZGVmYXVsdCB0eHRNZXJnZTtcbiJdfQ==