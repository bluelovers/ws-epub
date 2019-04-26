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
        let txt = `${meta.novel.title}${eol}${meta.novel.author}${eol}${metaLib.sources().join(eol)}${eol}${eol}${meta.novel.preface}${eol}${eol}`;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7O0FBR0gsaURBQWtEO0FBQ2xELDZCQUE4QjtBQUM5Qiw0Q0FBNkM7QUFDN0MsaUNBQWtDO0FBQ2xDLHFEQUE0RDtBQUM1RCxtREFBZ0Q7QUFDaEQsdUNBQTRDO0FBQzVDLDJDQUFpQztBQUNqQywrREFBMkQ7QUFFM0QscURBQXdEO0FBQ3hELCtDQUF1QztBQUN2QyxpREFBc0Q7QUFDdEQscURBQXdEO0FBRXhELE1BQU0sT0FBTyxHQUFHLElBQUksc0JBQU8sQ0FBQyxJQUFJLEVBQUU7SUFDakMsT0FBTyxFQUFFLElBQUk7SUFDYixjQUFjLEVBQUU7UUFDZixNQUFNLEVBQUUsSUFBSTtLQUNaO0lBQ0QsWUFBWSxFQUFFO1FBQ2IsT0FBTyxFQUFFLElBQUk7S0FDYjtDQUNELENBQUMsQ0FBQztBQUVILE9BQU8sQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDO0FBRTVCLE1BQU0sTUFBTSxHQUFHLEVBQUUsQ0FBQztBQUNsQixNQUFNLEdBQUcsR0FBRyxxQkFBSSxDQUFDO0FBQ2pCLE1BQU0sSUFBSSxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFFM0IsTUFBTSxHQUFHLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUMvQixNQUFNLEdBQUcsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBRS9COzs7Ozs7R0FNRztBQUNILFNBQWdCLFFBQVEsQ0FBQyxTQUFpQixFQUN6QyxVQUFrQixFQUNsQixjQUF1QixFQUN2QixNQUFnQjtJQU9oQixPQUFPLGVBQWUsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSztRQUUxQyxNQUFNLFFBQVEsR0FBVyxTQUFTLENBQUM7UUFDbkMsTUFBTSxRQUFRLEdBQVcsVUFBVSxDQUFDO1FBQ3BD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LEVBQUUsQ0FBQyxDQUFDO0lBQ3RFLFNBQVMsR0FBRyx1QkFBWSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBRXBDLElBQUksQ0FBQyxTQUFTLEVBQ2Q7UUFDQyxPQUFPLENBQUMsS0FBSyxDQUFDLHlCQUF5QixRQUFRLE9BQU8sU0FBUyxFQUFFLENBQUMsQ0FBQztRQUVuRSxTQUFTLEdBQUcsTUFBTSxDQUFDO0tBQ25CO0lBRUQsUUFBUSxJQUFJLEdBQUcsR0FBRyxNQUFNLEVBQUUsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLENBQUM7SUFFMUQsU0FBUyxHQUFHLEdBQUcsU0FBUyxVQUFVLENBQUM7SUFFbkMsT0FBTyxTQUFTLENBQUM7QUFDbEIsQ0FBQztBQWxNRCxvQ0FrTUM7QUFFRCxrQkFBZSxRQUFRLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENyZWF0ZWQgYnkgdXNlciBvbiAyMDE4LzEvMjgvMDI4LlxuICovXG5cbmltcG9ydCB7IElSZXR1cm5MaXN0IH0gZnJvbSAnbm9kZS1ub3ZlbC1nbG9iYnknO1xuaW1wb3J0IG5vdmVsR2xvYmJ5ID0gcmVxdWlyZSgnbm9kZS1ub3ZlbC1nbG9iYnknKTtcbmltcG9ydCBwYXRoID0gcmVxdWlyZSgncGF0aCcpO1xuaW1wb3J0IEJsdWViaXJkUHJvbWlzZSA9IHJlcXVpcmUoJ2JsdWViaXJkJyk7XG5pbXBvcnQgbW9tZW50ID0gcmVxdWlyZSgnbW9tZW50Jyk7XG5pbXBvcnQgeyBtZGNvbmZfcGFyc2UsIElNZGNvbmZNZXRhIH0gZnJvbSAnbm9kZS1ub3ZlbC1pbmZvJztcbmltcG9ydCB7IGNybGYsIENSTEYsIExGIH0gZnJvbSAnY3JsZi1ub3JtYWxpemUnO1xuaW1wb3J0IGZzLCB7IHRyaW1GaWxlbmFtZSB9IGZyb20gJ2ZzLWljb252JztcbmltcG9ydCBVU3RyaW5nIGZyb20gJ3VuaS1zdHJpbmcnO1xuaW1wb3J0IHsgc29ydFRyZWUgfSBmcm9tICdub2RlLW5vdmVsLWdsb2JieS9saWIvZ2xvYi1zb3J0JztcbmltcG9ydCB7IGFycmF5X3VuaXF1ZSB9IGZyb20gJ2FycmF5LWh5cGVyLXVuaXF1ZSc7XG5pbXBvcnQgeyBub3JtYWxpemVfc3RyaXAgfSBmcm9tICdAbm9kZS1ub3ZlbC9ub3JtYWxpemUnO1xuaW1wb3J0IHsgQ29uc29sZSB9IGZyb20gJ2RlYnVnLWNvbG9yMic7XG5pbXBvcnQgeyBOb2RlTm92ZWxJbmZvIH0gZnJvbSAnbm9kZS1ub3ZlbC1pbmZvL2NsYXNzJztcbmltcG9ydCB7IGdldE5vdmVsVGl0bGVGcm9tTWV0YSB9IGZyb20gJ25vZGUtbm92ZWwtaW5mbyc7XG5cbmNvbnN0IGNvbnNvbGUgPSBuZXcgQ29uc29sZShudWxsLCB7XG5cdGVuYWJsZWQ6IHRydWUsXG5cdGluc3BlY3RPcHRpb25zOiB7XG5cdFx0Y29sb3JzOiB0cnVlLFxuXHR9LFxuXHRjaGFsa09wdGlvbnM6IHtcblx0XHRlbmFibGVkOiB0cnVlLFxuXHR9LFxufSk7XG5cbmNvbnNvbGUuZW5hYmxlZENvbG9yID0gdHJ1ZTtcblxuY29uc3QgaHJfbGVuID0gMTU7XG5jb25zdCBlb2wgPSBDUkxGO1xuY29uc3QgZW9sMiA9IGVvbC5yZXBlYXQoMik7XG5cbmNvbnN0IGhyMSA9ICfvvJ0nLnJlcGVhdChocl9sZW4pO1xuY29uc3QgaHIyID0gJ++8jScucmVwZWF0KGhyX2xlbik7XG5cbi8qKlxuICpcbiAqIEBwYXJhbSBpbnB1dFBhdGgg6Ly45YWl6Lev5b6RXG4gKiBAcGFyYW0gb3V0cHV0UGF0aCDovLjlh7rot6/lvpFcbiAqIEBwYXJhbSBvdXRwdXRGaWxlbmFtZSDlj4PogIPnlKjmqpTmoYjlkI3nqLFcbiAqIEBwYXJhbSBub1NhdmUg5LiN5YSy5a2Y5qqU5qGI5YOF5Zue5YKzIHR4dCDlhaflrrlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHR4dE1lcmdlKGlucHV0UGF0aDogc3RyaW5nLFxuXHRvdXRwdXRQYXRoOiBzdHJpbmcsXG5cdG91dHB1dEZpbGVuYW1lPzogc3RyaW5nLFxuXHRub1NhdmU/OiBib29sZWFuLFxuKTogQmx1ZWJpcmRQcm9taXNlPHtcblx0ZmlsZW5hbWU6IHN0cmluZyxcblx0ZnVsbHBhdGg6IHN0cmluZyxcblx0ZGF0YTogc3RyaW5nLFxufT5cbntcblx0cmV0dXJuIEJsdWViaXJkUHJvbWlzZS5yZXNvbHZlKCkudGhlbihhc3luYyBmdW5jdGlvbiAoKVxuXHR7XG5cdFx0Y29uc3QgVFhUX1BBVEg6IHN0cmluZyA9IGlucHV0UGF0aDtcblx0XHRjb25zdCBQQVRIX0NXRDogc3RyaW5nID0gb3V0cHV0UGF0aDtcblx0XHRjb25zdCBvdXRwdXREaXJQYXRoUHJlZml4ID0gJ291dCc7XG5cblx0XHRpZiAoIWlucHV0UGF0aCB8fCAhb3V0cHV0UGF0aCB8fCB0eXBlb2YgaW5wdXRQYXRoICE9ICdzdHJpbmcnIHx8IHR5cGVvZiBvdXRwdXRQYXRoICE9ICdzdHJpbmcnKVxuXHRcdHtcblx0XHRcdHRocm93IG5ldyBSZWZlcmVuY2VFcnJvcignbXVzdCBzZXQgaW5wdXRQYXRoLCBvdXRwdXRQYXRoJyk7XG5cdFx0fVxuXG5cdFx0bGV0IGdsb2JieV9wYXR0ZXJuczogc3RyaW5nW107XG5cdFx0bGV0IGdsb2JieV9vcHRpb25zOiBub3ZlbEdsb2JieS5JT3B0aW9ucyA9IHtcblx0XHRcdGN3ZDogVFhUX1BBVEgsXG5cdFx0XHR1c2VEZWZhdWx0UGF0dGVybnNFeGNsdWRlOiB0cnVlLFxuXHRcdFx0YWJzb2x1dGU6IHRydWUsXG5cdFx0fTtcblxuXHRcdHtcblx0XHRcdFtnbG9iYnlfcGF0dGVybnMsIGdsb2JieV9vcHRpb25zXSA9IG5vdmVsR2xvYmJ5LmdldE9wdGlvbnMoZ2xvYmJ5X29wdGlvbnMpO1xuXG5cdFx0XHQvL2dsb2JieV9wYXR0ZXJucy5wdXNoKCchKi8qLyovKiovKicpO1xuXHRcdH1cblxuXHRcdGxldCBtZXRhOiBJTWRjb25mTWV0YTtcblxuXHRcdC8vY29uc29sZS5pbmZvKGBQQVRIX0NXRDogJHtQQVRIX0NXRH1cXG5gKTtcblxuXHRcdC8vY29uc29sZS5sb2coZ2xvYmJ5X3BhdHRlcm5zKTtcblx0XHQvL2NvbnNvbGUubG9nKGdsb2JieV9vcHRpb25zKTtcblxuXHRcdC8vIEB0cy1pZ25vcmVcblx0XHRtZXRhID0gYXdhaXQgbm92ZWxHbG9iYnkuZ2xvYmJ5QVN5bmMoW1xuXHRcdFx0XHQnUkVBRE1FLm1kJyxcblx0XHRcdF0sIGdsb2JieV9vcHRpb25zKVxuXHRcdFx0LnRoZW4obm92ZWxHbG9iYnkucmV0dXJuR2xvYkxpc3QpXG5cdFx0XHQudGhlbihzb3J0VHJlZSlcblx0XHRcdC50YXAoZnVuY3Rpb24gKGxzKVxuXHRcdFx0e1xuXHRcdFx0XHQvL2NvbnNvbGUubG9nKGxzKTtcblx0XHRcdH0pXG5cdFx0XHQudGhlbihhc3luYyBmdW5jdGlvbiAobHMpXG5cdFx0XHR7XG5cdFx0XHRcdGxldCBkYXRhID0gYXdhaXQgZnMucmVhZEZpbGUobHNbMF0pO1xuXG5cdFx0XHRcdHJldHVybiBtZGNvbmZfcGFyc2UoZGF0YSwge1xuXHRcdFx0XHRcdHRocm93OiBmYWxzZSxcblx0XHRcdFx0fSk7XG5cdFx0XHR9KVxuXHRcdFx0LnRhcChmdW5jdGlvbiAobHMpXG5cdFx0XHR7XG5cdFx0XHRcdC8vY29uc29sZS5sb2cobHMpO1xuXHRcdFx0fSlcblx0XHRcdC5jYXRjaChmdW5jdGlvbiAoKVxuXHRcdFx0e1xuXHRcdFx0XHRjb25zb2xlLndhcm4oYFtXQVJOXSBSRUFETUUubWQgbm90IGV4aXN0cyEgKCR7cGF0aC5qb2luKGdsb2JieV9vcHRpb25zLmN3ZCwgJ1JFQURNRS5tZCcpfSlgKTtcblx0XHRcdH0pXG5cdFx0O1xuXG5cdFx0Ly9jb25zb2xlLmxvZyhnbG9iYnlfcGF0dGVybnMpO1xuXG5cdFx0cmV0dXJuIG5vdmVsR2xvYmJ5Lmdsb2JieUFTeW5jKGdsb2JieV9wYXR0ZXJucywgZ2xvYmJ5X29wdGlvbnMpXG5cdFx0XHQudGFwKGZ1bmN0aW9uIChscylcblx0XHRcdHtcblx0XHRcdFx0Ly9jb25zb2xlLmxvZyhscyk7XG5cdFx0XHRcdC8vdGhyb3cgbmV3IEVycm9yKCd0ZXN0Jyk7XG5cblx0XHRcdFx0Ly9wcm9jZXNzLmV4aXQoKTtcblx0XHRcdH0pXG5cdFx0XHQudGhlbihmdW5jdGlvbiAoX2xzKVxuXHRcdFx0e1xuXHRcdFx0XHRpZiAoIV9scyB8fCAhT2JqZWN0LmtleXMoX2xzKS5sZW5ndGgpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHQvLyBAdHMtaWdub3JlXG5cdFx0XHRcdFx0cmV0dXJuIEJsdWViaXJkUHJvbWlzZS5yZWplY3QoYOaykuacieWPr+WQiOS9teeahOaqlOahiOWtmOWcqGApO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0bGV0IGNvdW50X2YgPSAwO1xuXHRcdFx0XHRsZXQgY291bnRfZCA9IDA7XG5cblx0XHRcdFx0bGV0IGNvdW50X2lkeCA9IDA7XG5cblx0XHRcdFx0cmV0dXJuIEJsdWViaXJkUHJvbWlzZVxuXHRcdFx0XHRcdC5tYXBTZXJpZXMoT2JqZWN0LmtleXMoX2xzKSwgYXN5bmMgZnVuY3Rpb24gKHZhbF9kaXIsIGluZGV4LCBsZW4pXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0bGV0IGxzOiBub3ZlbEdsb2JieS5JUmV0dXJuUm93W10gPSBfbHNbdmFsX2Rpcl07XG5cblx0XHRcdFx0XHRcdGxldCB2b2x1bWVfdGl0bGUgPSBsc1swXS52b2x1bWVfdGl0bGU7XG5cblx0XHRcdFx0XHRcdGNvdW50X2QrKztcblxuXHRcdFx0XHRcdFx0bGV0IHZzID0gdm9sdW1lX3RpdGxlXG5cdFx0XHRcdFx0XHRcdC5zcGxpdCgnLycpXG5cdFx0XHRcdFx0XHRcdC5tYXAoZnVuY3Rpb24gKHYpXG5cdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gbm9ybWFsaXplX3N0cmlwKHYsIHRydWUpXG5cdFx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHQ7XG5cblx0XHRcdFx0XHRcdHZvbHVtZV90aXRsZSA9IHZzXG5cdFx0XHRcdFx0XHRcdC5qb2luKExGKVxuXHRcdFx0XHRcdFx0O1xuXG5cdFx0XHRcdFx0XHRsZXQgX3ZvbF9wcmVmaXggPSAnJztcblxuXHRcdFx0XHRcdFx0aWYgKDEpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdF92b2xfcHJlZml4ID0gYOesrCR7U3RyaW5nKCsrY291bnRfaWR4KS5wYWRTdGFydCg1LCAnMCcpfeipse+8miR7dnMuam9pbign77yPJyl9JHtlb2x9YDtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0bGV0IHR4dCA9IGAke2hyMX1DSEVDSyR7ZW9sfSR7X3ZvbF9wcmVmaXh9JHt2b2x1bWVfdGl0bGV9JHtlb2x9JHtocjF9JHtlb2x9YDtcblxuXHRcdFx0XHRcdFx0bGV0IGEgPSBhd2FpdCBCbHVlYmlyZFByb21pc2UubWFwU2VyaWVzKGxzLCBhc3luYyBmdW5jdGlvbiAocm93OiBub3ZlbEdsb2JieS5JUmV0dXJuUm93KVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRsZXQgZGF0YSA9IGF3YWl0IGZzLnJlYWRGaWxlKHJvdy5wYXRoKTtcblxuXHRcdFx0XHRcdFx0XHRjb3VudF9mKys7XG5cblx0XHRcdFx0XHRcdFx0bGV0IGNoYXB0ZXJfdGl0bGUgPSByb3cuY2hhcHRlcl90aXRsZTtcblxuXHRcdFx0XHRcdFx0XHRsZXQgX3ByZWZpeCA9ICcnO1xuXG5cdFx0XHRcdFx0XHRcdGlmICgxKVxuXHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0X3ByZWZpeCA9IGDnrKwke1N0cmluZygrK2NvdW50X2lkeCkucGFkU3RhcnQoNSwgJzAnKX3oqbHvvJoke2NoYXB0ZXJfdGl0bGV9JHtlb2x9YFxuXG5cdFx0XHRcdFx0XHRcdFx0Ly9fcHJlZml4ID0gYOesrCR7U3RyaW5nKCsrY291bnRfaWR4KS5wYWRTdGFydCg1LCAnMCcpfeipse+8miR7dnMuY29uY2F0KFtjaGFwdGVyX3RpdGxlXSkuam9pbign77yPJyl9XFxuYDtcblx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdGxldCB0eHQgPSBgJHtocjJ9QkVHSU4ke2VvbH0ke19wcmVmaXh9JHtjaGFwdGVyX3RpdGxlfSR7ZW9sfSR7aHIyfUJPRFkke2VvbDJ9JHtkYXRhfSR7ZW9sMn0ke2hyMn1FTkQke2VvbDJ9YDtcblxuXHRcdFx0XHRcdFx0XHRyZXR1cm4gdHh0O1xuXHRcdFx0XHRcdFx0fSk7XG5cblx0XHRcdFx0XHRcdGEudW5zaGlmdCh0eHQpO1xuXG5cdFx0XHRcdFx0XHRyZXR1cm4gYS5qb2luKGVvbCk7XG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0XHQudGhlbihhc3luYyBmdW5jdGlvbiAoYSlcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRsZXQgZmlsZW5hbWUyID0gbWFrZUZpbGVuYW1lKG1ldGEsIG91dHB1dEZpbGVuYW1lLCBhLCBfbHMsIHtcblx0XHRcdFx0XHRcdFx0VFhUX1BBVEgsXG5cdFx0XHRcdFx0XHR9KTtcblxuXHRcdFx0XHRcdFx0bGV0IHR4dCA9IGEuam9pbihlb2wpO1xuXHRcdFx0XHRcdFx0dHh0ID0gY3JsZih0eHQsIGVvbCk7XG5cblx0XHRcdFx0XHRcdGxldCBmdWxscGF0aCA9IHBhdGguam9pbihQQVRIX0NXRCwgb3V0cHV0RGlyUGF0aFByZWZpeCwgYCR7ZmlsZW5hbWUyfWApO1xuXG5cdFx0XHRcdFx0XHRpZiAoIW5vU2F2ZSlcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0YXdhaXQgZnMub3V0cHV0RmlsZShmdWxscGF0aCwgdHh0KTtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRcdFx0ZmlsZW5hbWU6IGZpbGVuYW1lMixcblx0XHRcdFx0XHRcdFx0ZnVsbHBhdGgsXG5cdFx0XHRcdFx0XHRcdGRhdGE6IHR4dCxcblx0XHRcdFx0XHRcdH07XG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0XHQudGFwKGZ1bmN0aW9uIChkYXRhKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGNvbnNvbGUuc3VjY2VzcygnW0RPTkVdIGRvbmUuJyk7XG5cblx0XHRcdFx0XHRcdGNvbnNvbGUuaW5mbyhgVG90YWwgRDogJHtjb3VudF9kfVxcblRvdGFsIEY6ICR7Y291bnRfZn1cXG5cXG5bRklMRU5BTUVdICR7ZGF0YS5maWxlbmFtZX1gKTtcblx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdC8vIEB0cy1pZ25vcmVcblx0XHRcdFx0XHQudGFwQ2F0Y2goZnVuY3Rpb24gKGUpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0Y29uc29sZS5lcnJvcihgW0VSUk9SXSBzb21ldGhpbmcgd3JvbmchIWApO1xuXHRcdFx0XHRcdFx0Y29uc29sZS50cmFjZShlKTtcblx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdDtcblx0XHRcdH0pXG5cdFx0XHQudGFwQ2F0Y2goZnVuY3Rpb24gKGUpXG5cdFx0XHR7XG5cdFx0XHRcdGNvbnNvbGUuZXJyb3IoYFtFUlJPUl0gY2FuJ3QgZm91bmQgYW55IGZpbGUgaW4gJyR7VFhUX1BBVEh9J2ApO1xuXHRcdFx0XHRjb25zb2xlLnRyYWNlKGUpO1xuXHRcdFx0fSlcblx0XHRcdDtcblx0fSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldE1ldGFUaXRsZXMobWV0YTogSU1kY29uZk1ldGEpOiBzdHJpbmdbXVxue1xuXHRyZXR1cm4gZ2V0Tm92ZWxUaXRsZUZyb21NZXRhKG1ldGEpO1xufVxuXG4vKipcbiAqIOWbnuWCs+iZleeQhuW+jOeahOaqlOahiOWQjeeosVxuICovXG5leHBvcnQgZnVuY3Rpb24gbWFrZUZpbGVuYW1lKG1ldGE/OiBJTWRjb25mTWV0YSwgb3V0cHV0RmlsZW5hbWU/OiBzdHJpbmcsIGE6IHN0cmluZ1tdID0gW10sIF9scz86IElSZXR1cm5MaXN0LCBfYXJndjoge1xuXHRUWFRfUEFUSD86IHN0cmluZyxcbn0gPSB7fSk6IHN0cmluZ1xue1xuXHRpZiAoX2xzKVxuXHR7XG5cdFx0bGV0IGN1cnJlbnRfbGV2ZWwgPSAwO1xuXHRcdGxldCBfbGVzdCA9IHtcblx0XHRcdF90czogW10sXG5cdFx0fSBhcyB7XG5cdFx0XHR2YWxfZGlyOiBzdHJpbmcsXG5cdFx0XHR2b2x1bWVfdGl0bGU6IHN0cmluZyxcblx0XHRcdF90czogc3RyaW5nW10sXG5cdFx0XHRsZXZlbDogbnVtYmVyLFxuXHRcdH07XG5cblx0XHRsZXQgYyA9ICctICc7XG5cblx0XHRsZXQgcmV0ID0gT2JqZWN0LmtleXMoX2xzKVxuXHRcdFx0LnJlZHVjZShmdW5jdGlvbiAoYTEsIHZhbF9kaXIpXG5cdFx0XHR7XG5cdFx0XHRcdGxldCBsczogbm92ZWxHbG9iYnkuSVJldHVyblJvd1tdID0gX2xzW3ZhbF9kaXJdO1xuXG5cdFx0XHRcdGxldCB2b2x1bWVfdGl0bGUgPSBsc1swXS52b2x1bWVfdGl0bGU7XG5cblx0XHRcdFx0bGV0IF90cyA9IHZvbHVtZV90aXRsZS5zcGxpdCgnLycpO1xuXG5cdFx0XHRcdGlmIChfbGVzdC52YWxfZGlyICE9IHZhbF9kaXIpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRmb3IgKGxldCBpID0gMDsgaSA8IF90cy5sZW5ndGg7IGkrKylcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRpZiAoX2xlc3QuX3RzW2ldICE9IF90c1tpXSlcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0YTEucHVzaChjLnJlcGVhdChpICsgMSkgKyBub3JtYWxpemVfc3RyaXAoX3RzW2ldLCB0cnVlKSlcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvL2NvbnNvbGUubG9nKGxzWzBdKTtcblxuXHRcdFx0XHRscy5mb3JFYWNoKGZ1bmN0aW9uIChyb3cpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRhMS5wdXNoKGMucmVwZWF0KF90cy5sZW5ndGggKyAxKSArIHJvdy5jaGFwdGVyX3RpdGxlKTtcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0X2xlc3QgPSB7XG5cdFx0XHRcdFx0X3RzLFxuXHRcdFx0XHRcdHZhbF9kaXIsXG5cdFx0XHRcdFx0dm9sdW1lX3RpdGxlLFxuXHRcdFx0XHRcdGxldmVsOiBfdHMubGVuZ3RoLFxuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdHJldHVybiBhMTtcblx0XHRcdH0sIFtdKVxuXHRcdDtcblxuXHRcdGlmIChyZXQubGVuZ3RoKVxuXHRcdHtcblx0XHRcdHJldC51bnNoaWZ0KGDnm67pjITntKLlvJXvvJpgKTtcblx0XHRcdHJldC5wdXNoKGhyMiArIGVvbCk7XG5cblx0XHRcdGEudW5zaGlmdChyZXQuam9pbihlb2wpKTtcblx0XHR9XG5cbi8vXHRcdGNvbnNvbGUuZGlyKHtcbi8vXHRcdFx0Ly9fbHMsXG4vL1x0XHRcdHJldCxcbi8vXHRcdH0sIHtcbi8vXHRcdFx0ZGVwdGg6IG51bGwsXG4vL1x0XHR9KTtcbi8vXHRcdHByb2Nlc3MuZXhpdCgpO1xuXHR9XG5cblx0Y29uc3QgbWV0YUxpYiA9IG5ldyBOb2RlTm92ZWxJbmZvKG1ldGEsIHtcblx0XHR0aHJvdzogZmFsc2UsXG5cdFx0bG93Q2hlY2tMZXZlbDogdHJ1ZSxcblx0fSk7XG5cblx0aWYgKG1ldGEgJiYgbWV0YS5ub3ZlbClcblx0e1xuXHRcdGxldCB0eHQgPSBgJHttZXRhLm5vdmVsLnRpdGxlfSR7ZW9sfSR7bWV0YS5ub3ZlbC5hdXRob3J9JHtlb2x9JHttZXRhTGliLnNvdXJjZXMoKS5qb2luKGVvbCl9JHtlb2x9JHtlb2x9JHttZXRhLm5vdmVsLnByZWZhY2V9JHtlb2x9JHtlb2x9YDtcblxuXHRcdGxldCBhMiA9IFtdO1xuXG5cdFx0bGV0IG5vdmVsSUQgPSBfYXJndiAmJiBfYXJndi5UWFRfUEFUSCAmJiBwYXRoLmJhc2VuYW1lKF9hcmd2LlRYVF9QQVRIKSB8fCAnJztcblxuXHRcdGxldCB0aXRsZXMgPSBbbm92ZWxJRF0uY29uY2F0KG1ldGFMaWIudGl0bGVzKCkpXG5cdFx0XHQuZmlsdGVyKHYgPT4gdiAmJiB2ICE9IG1ldGEubm92ZWwudGl0bGUpXG5cdFx0O1xuXG5cdFx0aWYgKHRpdGxlcy5sZW5ndGgpXG5cdFx0e1xuXHRcdFx0YTIucHVzaChg5YW25LuW5ZCN56ix77yaJHtlb2x9YCArIHRpdGxlcy5qb2luKGVvbCkgKyBlb2wpO1xuXHRcdFx0YTIucHVzaChocjIpO1xuXHRcdH1cblxuXHRcdGxldCBfYXJyOiBzdHJpbmdbXTtcblx0XHRsZXQgX2xhYmVsID0gJyc7XG5cdFx0bGV0IF9qb2luID0gJ+OAgSc7XG5cblx0XHRfYXJyID0gbWV0YUxpYi5hdXRob3JzKClcblx0XHRcdC5maWx0ZXIodiA9PiB2ICYmIHYgIT0gbWV0YS5ub3ZlbC5hdXRob3IpXG5cdFx0O1xuXHRcdF9sYWJlbCA9ICflhbbku5bkvZzogIXvvJonO1xuXG5cdFx0aWYgKF9hcnIgJiYgX2Fyci5sZW5ndGgpXG5cdFx0e1xuXHRcdFx0YTIucHVzaChfbGFiZWwgKyBfYXJyLmpvaW4oX2pvaW4pICsgZW9sKTtcblx0XHR9XG5cblx0XHRfYXJyID0gbWV0YUxpYi5pbGx1c3RzKCk7XG5cdFx0X2xhYmVsID0gJ+e5quW4q++8mic7XG5cblx0XHRpZiAoX2FyciAmJiBfYXJyLmxlbmd0aClcblx0XHR7XG5cdFx0XHRhMi5wdXNoKF9sYWJlbCArIF9hcnIuam9pbihfam9pbikgKyBlb2wpO1xuXHRcdH1cblxuXHRcdF9hcnIgPSBtZXRhTGliLmNvbnRyaWJ1dGVzKCk7XG5cdFx0X2xhYmVsID0gJ+iyoueNu+iAhe+8mic7XG5cblx0XHRpZiAoX2FyciAmJiBfYXJyLmxlbmd0aClcblx0XHR7XG5cdFx0XHRhMi5wdXNoKF9sYWJlbCArIF9hcnIuam9pbihfam9pbikgKyBlb2wpO1xuXHRcdH1cblxuXHRcdF9hcnIgPSBtZXRhTGliLnRhZ3MoKTtcblx0XHRfbGFiZWwgPSAn5qiZ57Gk77yaJztcblxuXHRcdGlmIChfYXJyICYmIF9hcnIubGVuZ3RoKVxuXHRcdHtcblx0XHRcdGEyLnB1c2goX2xhYmVsICsgX2Fyci5qb2luKF9qb2luKSArIGVvbCk7XG5cdFx0fVxuXG5cdFx0aWYgKGEyLmxlbmd0aClcblx0XHR7XG5cdFx0XHRhMi51bnNoaWZ0KGhyMik7XG5cblx0XHRcdGEyLnB1c2goaHIyKTtcblxuXHRcdFx0dHh0ICs9IGEyLmpvaW4oZW9sKTtcblx0XHR9XG5cbi8vXHRcdGNvbnNvbGUubG9nKHR4dCk7XG4vL1x0XHRwcm9jZXNzLmV4aXQoKTtcblxuXHRcdGEudW5zaGlmdCh0eHQpO1xuXHR9XG5cblx0bGV0IGZpbGVuYW1lOiBzdHJpbmc7XG5cblx0aWYgKHR5cGVvZiBvdXRwdXRGaWxlbmFtZSA9PSAnc3RyaW5nJyAmJiBvdXRwdXRGaWxlbmFtZSlcblx0e1xuXHRcdGZpbGVuYW1lID0gb3V0cHV0RmlsZW5hbWU7XG5cdH1cblxuXHRpZiAoIWZpbGVuYW1lICYmIG1ldGEgJiYgbWV0YS5ub3ZlbClcblx0e1xuXHRcdGlmIChtZXRhLm5vdmVsLnRpdGxlX3Nob3J0KVxuXHRcdHtcblx0XHRcdGZpbGVuYW1lID0gbWV0YS5ub3ZlbC50aXRsZV9zaG9ydDtcblx0XHR9XG5cdFx0ZWxzZSBpZiAobWV0YS5ub3ZlbC50aXRsZSlcblx0XHR7XG5cdFx0XHRmaWxlbmFtZSA9IG1ldGEubm92ZWwudGl0bGU7XG5cdFx0fVxuXHRcdGVsc2UgaWYgKG1ldGEubm92ZWwudGl0bGVfemgpXG5cdFx0e1xuXHRcdFx0ZmlsZW5hbWUgPSBtZXRhLm5vdmVsLnRpdGxlX3poO1xuXHRcdH1cblx0fVxuXG5cdGZpbGVuYW1lID0gZmlsZW5hbWUgfHwgJ3RlbXAnO1xuXG5cdGxldCBmaWxlbmFtZTIgPSB0cmltRmlsZW5hbWUoZmlsZW5hbWUpXG5cdFx0LnJlcGxhY2UoL1xcLi8sICdfJylcblx0XHQucmVwbGFjZSgvXltfK1xcLV0rfFtfK1xcLV0rJC8sICcnKVxuXHQ7XG5cblx0ZmlsZW5hbWUyID0gVVN0cmluZy5jcmVhdGUoZmlsZW5hbWUyKS5zcGxpdCgnJykuc2xpY2UoMCwgMjApLmpvaW4oJycpO1xuXHRmaWxlbmFtZTIgPSB0cmltRmlsZW5hbWUoZmlsZW5hbWUyKTtcblxuXHRpZiAoIWZpbGVuYW1lMilcblx0e1xuXHRcdGNvbnNvbGUuZXJyb3IoYFtFUlJPUl0gQmFkIEZpbGVuYW1lOiAke2ZpbGVuYW1lfSA9PiAke2ZpbGVuYW1lMn1gKTtcblxuXHRcdGZpbGVuYW1lMiA9ICd0ZW1wJztcblx0fVxuXG5cdGZpbGVuYW1lICs9ICdfJyArIG1vbWVudCgpLmxvY2FsKCkuZm9ybWF0KCdZWVlZTU1EREhIbW0nKTtcblxuXHRmaWxlbmFtZTIgPSBgJHtmaWxlbmFtZTJ9Lm91dC50eHRgO1xuXG5cdHJldHVybiBmaWxlbmFtZTI7XG59XG5cbmV4cG9ydCBkZWZhdWx0IHR4dE1lcmdlO1xuIl19