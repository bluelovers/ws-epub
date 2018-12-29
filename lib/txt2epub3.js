"use strict";
/**
 * Created by user on 2017/12/16/016.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("epub-maker2/src/lib/util");
const fs = require("fs-iconv");
const epub_maker2_1 = require("epub-maker2");
const Promise = require("bluebird");
const path = require("upath2");
const moment = require("moment");
const novelGlobby = require("node-novel-globby");
const node_novel_info_1 = require("node-novel-info");
const util_2 = require("./util");
const uuid_1 = require("epub-maker2/src/lib/uuid");
const deepmerge = require("deepmerge-plus");
const normalize_1 = require("@node-novel/normalize");
const debug_color2_1 = require("debug-color2");
const crlf_normalize_1 = require("crlf-normalize");
exports.console = new debug_color2_1.Console(null, {
    enabled: true,
    inspectOptions: {
        colors: true,
    },
    chalkOptions: {
        enabled: true,
    },
});
exports.console.enabledColor = true;
exports.defaultOptions = Object.freeze({
    epubTemplate: 'lightnovel',
    epubLanguage: 'zh',
    //padEndDate: true,
    globbyOptions: {
        checkRoman: true,
        useDefaultPatternsExclude: true,
    },
});
function getNovelConf(options, cache = {}) {
    return Promise.resolve().then(async function () {
        let meta;
        let confPath;
        if (options.novelConf && typeof options.novelConf == 'object') {
            meta = options.novelConf;
        }
        else {
            if (typeof options.novelConf == 'string') {
                confPath = options.novelConf;
            }
            else {
                confPath = options.inputPath;
            }
            if (fs.existsSync(path.join(confPath, 'meta.md'))) {
                let file = path.join(confPath, 'meta.md');
                meta = await fs.readFile(file)
                    .then(node_novel_info_1.mdconf_parse);
            }
            else if (fs.existsSync(path.join(confPath, 'README.md'))) {
                let file = path.join(confPath, 'README.md');
                meta = await fs.readFile(file)
                    .then(node_novel_info_1.mdconf_parse);
            }
        }
        meta = node_novel_info_1.chkInfo(meta);
        if (!meta || !meta.novel || !meta.novel.title) {
            throw new Error(`not a valid novelInfo data`);
        }
        return meta;
    });
}
exports.getNovelConf = getNovelConf;
function makeOptions(options) {
    options = Object.keys(options)
        .filter(v => typeof options[v] != 'undefined')
        .reduce(function (a, b) {
        a[b] = options[b];
        return a;
    }, {});
    return options = deepmerge.all([{}, exports.defaultOptions, options]);
}
exports.makeOptions = makeOptions;
function create(options, cache = {}) {
    return Promise.resolve().then(async function () {
        //console.log(options, defaultOptions);
        options = makeOptions(options);
        //console.dir(options, {colors: true});
        let novelID = options.novelID;
        let TXT_PATH = options.inputPath;
        let meta = await getNovelConf(options, cache);
        let globby_patterns;
        let globby_options = Object.assign({}, options.globbyOptions, {
            cwd: TXT_PATH,
        });
        {
            [globby_patterns, globby_options] = novelGlobby.getOptions(globby_options);
        }
        //console.log(options, globby_options);
        //console.dir(options);
        exports.console.info(meta.novel.title);
        //console.log(meta.novel.preface);
        let epub = new epub_maker2_1.default()
            .withTemplate(options.epubTemplate)
            .withLanguage(options.epubLanguage)
            .withUuid(uuid_1.createUUID(epub_maker2_1.hashSum([
            meta.novel.title,
            meta.novel.author,
        ])))
            .withTitle(meta.novel.title, meta.novel.title_short || meta.novel.title_zh)
            .withAuthor(meta.novel.author)
            .addAuthor(meta.novel.author)
            .withCollection({
            name: meta.novel.title,
        })
            .withInfoPreface(meta.novel.preface)
            .addTag(meta.novel.tags)
            .addAuthor(meta.contribute);
        if (options.filename) {
            epub.epubConfig.filename = options.filename;
        }
        if (meta.novel.source) {
            epub.addLinks(meta.novel.source);
        }
        if (meta.novel.series) {
            epub.withSeries(meta.novel.series.name, meta.novel.series.position);
        }
        else {
            epub.withSeries(meta.novel.title);
        }
        if (meta.novel.publisher) {
            epub.withPublisher(meta.novel.publisher || 'node-novel');
        }
        if (meta.novel.date) {
            epub.withModificationDate(meta.novel.date);
        }
        if (meta.novel.status) {
            epub.addTag(meta.novel.status);
        }
        if (meta.novel.cover) {
            epub.withCover(meta.novel.cover);
        }
        else {
            await novelGlobby.globby([
                'cover.*',
            ], Object.assign({}, globby_options, {
                absolute: true,
            }))
                .then(ls => {
                if (ls.length) {
                    epub.withCover(ls[0]);
                }
                exports.console.log(ls);
            });
        }
        //process.exit();
        let stat = {
            volume: 0,
            chapter: 0,
            image: 0,
        };
        await novelGlobby
            .globbyASync(globby_patterns, globby_options)
            .then(function (ls) {
            //console.log(ls);
            //process.exit();
            return ls;
        })
            .then(_ls => {
            let idx = 1;
            let cacheTreeSection = {};
            const SymCache = Symbol('cache');
            return Promise
                .mapSeries(Object.keys(_ls), async function (val_dir) {
                let ls = _ls[val_dir];
                let dirname = ls[0].path_dir;
                let volume_title = ls[0].volume_title;
                let volume = cacheTreeSection[val_dir];
                let _new_top_level;
                if (!cacheTreeSection[val_dir]) {
                    let _ts2 = volume_title.split('/');
                    let _ts = val_dir.split('/');
                    let _ds = path.normalize(dirname).split('/');
                    let _last;
                    for (let i = 0; i < _ts.length; i++) {
                        let _navs = _ts.slice(0, i + 1);
                        let _nav = _navs.join('/');
                        let _nav_dir = _ds.slice(0, _ds.length - _ts.length + i + 1).join('/');
                        /*
                        console.dir({
                            _navs,
                            _nav,
                            _nav_dir,
                        });
                        */
                        if (!cacheTreeSection[_nav]) {
                            let vid = `volume${(idx++).toString().padStart(6, '0')}`;
                            let title = normalize_1.normalize_strip(_ts2[i], true);
                            cacheTreeSection[_nav] = new epub_maker2_1.default.Section('auto-toc', vid, {
                                title: title,
                            }, false, true);
                            cacheTreeSection[_nav][SymCache] = cacheTreeSection[_nav][SymCache] || {};
                            if (i == 0) {
                                //epub.withSection(cacheTreeSection[_nav]);
                                _new_top_level = cacheTreeSection[_nav];
                            }
                            stat.volume++;
                            await _handleVolume(cacheTreeSection[_nav], _nav_dir);
                        }
                        if (_last) {
                            _last.withSubSection(cacheTreeSection[_nav]);
                        }
                        _last = cacheTreeSection[_nav];
                    }
                    volume = cacheTreeSection[val_dir];
                    //							console.dir({
                    //								cacheTreeSection,
                    //								volume,
                    //							}, {
                    //								depth: 5,
                    //								colors: true,
                    //							});
                    //							process.exit()
                }
                let vid = volume.id;
                await _handleVolume(volume, dirname);
                async function _handleVolume(volume, dirname) {
                    let vid = volume.id;
                    if (!volume[SymCache].cover) {
                        volume[SymCache].cover = true;
                        let file = path.join(dirname, 'README.md');
                        let meta = await fs.readFile(file)
                            .then(function (data) {
                            return node_novel_info_1.mdconf_parse(data, {
                                // 當沒有包含必要的內容時不產生錯誤
                                throw: false,
                                // 允許不標準的 info 內容
                                lowCheckLevel: true,
                            });
                        })
                            .catch(function () {
                            return null;
                        });
                        //console.log(file, meta);
                        await novelGlobby.globby([
                            'cover.*',
                        ], {
                            cwd: dirname,
                            absolute: true,
                        })
                            .then(async (ls) => {
                            if (ls.length) {
                                let ext = path.extname(ls[0]);
                                let name = `${vid}-cover${ext}`;
                                epub.withAdditionalFile(ls[0], null, name);
                                return name;
                            }
                            else if (fs.existsSync(file)) {
                                if (meta && meta.novel) {
                                    if (meta.novel.cover) {
                                        let ext = '.png';
                                        let basename = `${vid}-cover`;
                                        let name = `${basename}${ext}`;
                                        let data = typeof meta.novel.cover === 'string' ? {
                                            url: meta.novel.cover,
                                        } : meta.novel.cover;
                                        data.ext = null;
                                        data.basename = basename;
                                        epub.withAdditionalFile(data, null, name);
                                        return name;
                                    }
                                }
                            }
                        })
                            .then(function (name) {
                            let _ok = false;
                            let data = {};
                            if (name) {
                                _ok = true;
                                data.cover = {
                                    name,
                                };
                                stat.image += 1;
                            }
                            if (meta && meta.novel) {
                                if (meta.novel.preface) {
                                    _ok = true;
                                    //data.content = crlf(meta.novel.preface);
                                    data.content = util_1.htmlPreface({
                                        infoPreface: meta.novel.preface,
                                    }).infoPrefaceHTML;
                                }
                            }
                            //console.log(name, _ok);
                            if (_ok) {
                                return data;
                            }
                            return null;
                        })
                            .then(function (data) {
                            if (data) {
                                //console.log(volume);
                                volume.setContent(data, true);
                            }
                        });
                    }
                }
                //console.log(dirname);
                //volume.withSubSection(new EpubMaker.Section('auto-toc', null, null, false, false));
                await Promise.mapSeries(ls, async function (row) {
                    //console.log(filename);
                    //let data = await fs.readFile(path.join(TXT_PATH, dirname, filename));
                    let data = await fs.readFile(row.path);
                    //console.log(data);
                    if (row.ext == '.txt') {
                        data = util_2.splitTxt(data.toString());
                    }
                    if (Buffer.isBuffer(data)) {
                        data = data.toString();
                    }
                    let name = row.chapter_title;
                    if (!options.noLog) {
                        let { source_idx, volume_title, chapter_title, dir, file, } = row;
                        exports.console.dir({
                            source_idx,
                            volume_title,
                            chapter_title,
                            dir,
                            file,
                        });
                    }
                    let chapter = new epub_maker2_1.default.Section('chapter', `chapter${(idx++).toString()
                        .padStart(4, '0')}`, {
                        title: name,
                        content: crlf_normalize_1.crlf(data),
                    }, true, false);
                    stat.chapter++;
                    volume.withSubSection(chapter);
                });
                if (!volume[SymCache].image) {
                    volume[SymCache].image = true;
                    await novelGlobby.globby([
                        '*.{jpg,gif,png,jpeg,svg}',
                        'image/*.{jpg,gif,png,jpeg,svg}',
                        'images/*.{jpg,gif,png,jpeg,svg}',
                        '!cover.*',
                        '!*.txt',
                    ], {
                        cwd: dirname,
                        absolute: true,
                    })
                        .then(ls => {
                        let arr = [];
                        for (let i in ls) {
                            let img = ls[i];
                            let ext = path.extname(img);
                            let basename = path.basename(img, ext);
                            // @ts-ignore
                            let name = epub_maker2_1.slugify(basename);
                            if (!name || arr.includes(name)) {
                                name = epub_maker2_1.hashSum([img, i, name]);
                            }
                            //name = `${vid}/${i}-` + name + ext;
                            name = `${vid}/` + name + ext;
                            arr.push('image/' + name);
                            epub.withAdditionalFile(img, 'image', name);
                        }
                        if (arr.length) {
                            if (volume.content && volume.content.cover && volume.content.cover.name) {
                                arr.unshift(volume.content.cover.name);
                            }
                            let chapter = new epub_maker2_1.default.Section('non-specific backmatter', `image${(idx++).toString()
                                .padStart(4, '0')}`, {
                                title: '插圖',
                                content: arr.reduce(function (a, b) {
                                    let html = `<figure class="fullpage ImageContainer page-break-before"><img id="CoverImage" class="CoverImage" src="${b}" alt="Cover" /></figure>`;
                                    a.push(html);
                                    return a;
                                }, []).join("\n"),
                            }, true, false);
                            stat.image += arr.length;
                            volume.withSubSection(chapter);
                        }
                    });
                }
                //epub.withSection(volume);
                if (_new_top_level) {
                    epub.withSection(_new_top_level);
                }
                return volume;
            });
        });
        //		console.log(epub.epubConfig.sections);
        //		process.exit();
        let data = await epub.makeEpub();
        let _file_data = makeFilename(options, epub, meta);
        let { file, filename, now, basename, ext } = _file_data;
        await fs.outputFile(file, data);
        exports.console.success(filename, now.format());
        return {
            file,
            filename,
            epub,
            outputPath: options.outputPath,
            basename,
            ext,
            stat,
        };
    });
}
exports.create = create;
function makeFilename(options, epub, meta) {
    options = makeOptions(options);
    let filename = epub.getFilename(options.useTitle, true);
    if (!options.filename) {
        if (options.filenameLocal) {
            // @ts-ignore
            if (meta.novel.title_output) {
                // @ts-ignore
                filename = meta.novel.title_output;
            }
            else if (Array.isArray(options.filenameLocal)) {
                for (let v of options.filenameLocal) {
                    if (meta.novel[v]) {
                        filename = meta.novel[v];
                        break;
                    }
                }
            }
            else if (meta.novel.title_zh) {
                filename = meta.novel.title_zh;
            }
            else if (meta.novel.title_short) {
                filename = meta.novel.title_short;
            }
            else if (meta.novel.title_tw) {
                filename = meta.novel.title_tw;
            }
            else if (typeof options.filenameLocal == 'string') {
                filename = options.filenameLocal;
            }
        }
    }
    const basename = filename;
    let ext = epub_maker2_1.default.defaultExt;
    let now = moment();
    if (options.padEndDate) {
        filename += '_' + now.format('YYYYMMDD_HHmmss');
    }
    filename += ext;
    let file = path.join(options.outputPath, filename);
    return {
        file,
        ext,
        filename,
        options,
        now,
        basename,
        epub,
        meta,
    };
}
exports.makeFilename = makeFilename;
exports.default = create;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHh0MmVwdWIzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidHh0MmVwdWIzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7R0FFRzs7QUFHSCxtREFBdUQ7QUFDdkQsK0JBQStCO0FBQy9CLDZDQUEwRDtBQUMxRCxvQ0FBcUM7QUFDckMsK0JBQStCO0FBRS9CLGlDQUFpQztBQUNqQyxpREFBaUQ7QUFDakQscURBQXFFO0FBQ3JFLGlDQUFrQztBQUNsQyxtREFBc0Q7QUFDdEQsNENBQTRDO0FBQzVDLHFEQUF3RDtBQUN4RCwrQ0FBdUM7QUFDdkMsbURBQXNDO0FBRXpCLFFBQUEsT0FBTyxHQUFHLElBQUksc0JBQU8sQ0FBQyxJQUFJLEVBQUU7SUFDeEMsT0FBTyxFQUFFLElBQUk7SUFDYixjQUFjLEVBQUU7UUFDZixNQUFNLEVBQUUsSUFBSTtLQUNaO0lBQ0QsWUFBWSxFQUFFO1FBQ2IsT0FBTyxFQUFFLElBQUk7S0FDYjtDQUNELENBQUMsQ0FBQztBQUVILGVBQU8sQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDO0FBaUNmLFFBQUEsY0FBYyxHQUFzQixNQUFNLENBQUMsTUFBTSxDQUFDO0lBQzlELFlBQVksRUFBRSxZQUFZO0lBQzFCLFlBQVksRUFBRSxJQUFJO0lBQ2xCLG1CQUFtQjtJQUVuQixhQUFhLEVBQUU7UUFDZCxVQUFVLEVBQUUsSUFBSTtRQUNoQix5QkFBeUIsRUFBRSxJQUFJO0tBQy9CO0NBQ0QsQ0FBQyxDQUFDO0FBRUgsU0FBZ0IsWUFBWSxDQUFDLE9BQWlCLEVBQUUsS0FBSyxHQUFHLEVBQUU7SUFFekQsT0FBTyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUMsSUFBSSxDQUFDLEtBQUs7UUFFbEMsSUFBSSxJQUFpQixDQUFDO1FBQ3RCLElBQUksUUFBZ0IsQ0FBQztRQUVyQixJQUFJLE9BQU8sQ0FBQyxTQUFTLElBQUksT0FBTyxPQUFPLENBQUMsU0FBUyxJQUFJLFFBQVEsRUFDN0Q7WUFDQyxJQUFJLEdBQUcsT0FBTyxD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SSxPQUFPLE9BQU8sQ0FBQyxhQUFhLElBQUksUUFBUSxFQUNqRDtnQkFDQyxRQUFRLEdBQUcsT0FBTyxDQUFDLGFBQWEsQ0FBQzthQUNqQztTQUNEO0tBQ0Q7SUFFRCxNQUFNLFFBQVEsR0FBRyxRQUFRLENBQUM7SUFFMUIsSUFBSSxHQUFHLEdBQUcscUJBQVMsQ0FBQyxVQUFVLENBQUM7SUFFL0IsSUFBSSxHQUFHLEdBQUcsTUFBTSxFQUFFLENBQUM7SUFFbkIsSUFBSSxPQUFPLENBQUMsVUFBVSxFQUN0QjtRQUNDLFFBQVEsSUFBSSxHQUFHLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0tBQ2hEO0lBRUQsUUFBUSxJQUFJLEdBQUcsQ0FBQztJQUVoQixJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFFbkQsT0FBTztRQUNOLElBQUk7UUFDSixHQUFHO1FBQ0gsUUFBUTtRQUNSLE9BQU87UUFDUCxHQUFHO1FBQ0gsUUFBUTtRQUNSLElBQUk7UUFDSixJQUFJO0tBQ0osQ0FBQTtBQUNGLENBQUM7QUF2RUQsb0NBdUVDO0FBRUQsa0JBQWUsTUFBTSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDcmVhdGVkIGJ5IHVzZXIgb24gMjAxNy8xMi8xNi8wMTYuXG4gKi9cblxuaW1wb3J0IHsgSVNlY3Rpb25Db250ZW50IH0gZnJvbSAnZXB1Yi1tYWtlcjIvc3JjL2luZGV4JztcbmltcG9ydCB7IGh0bWxQcmVmYWNlIH0gZnJvbSAnZXB1Yi1tYWtlcjIvc3JjL2xpYi91dGlsJztcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzLWljb252JztcbmltcG9ydCBFcHViTWFrZXIsIHsgaGFzaFN1bSwgc2x1Z2lmeSB9IGZyb20gJ2VwdWItbWFrZXIyJztcbmltcG9ydCBQcm9taXNlID0gcmVxdWlyZSgnYmx1ZWJpcmQnKTtcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAndXBhdGgyJztcbmltcG9ydCAqIGFzIFN0clV0aWwgZnJvbSAnc3RyLXV0aWwnO1xuaW1wb3J0ICogYXMgbW9tZW50IGZyb20gJ21vbWVudCc7XG5pbXBvcnQgKiBhcyBub3ZlbEdsb2JieSBmcm9tICdub2RlLW5vdmVsLWdsb2JieSc7XG5pbXBvcnQgeyBtZGNvbmZfcGFyc2UsIElNZGNvbmZNZXRhLCBjaGtJbmZvIH0gZnJvbSAnbm9kZS1ub3ZlbC1pbmZvJztcbmltcG9ydCB7IHNwbGl0VHh0IH0gZnJvbSAnLi91dGlsJztcbmltcG9ydCB7IGNyZWF0ZVVVSUQgfSBmcm9tICdlcHViLW1ha2VyMi9zcmMvbGliL3V1aWQnO1xuaW1wb3J0ICogYXMgZGVlcG1lcmdlIGZyb20gJ2RlZXBtZXJnZS1wbHVzJztcbmltcG9ydCB7IG5vcm1hbGl6ZV9zdHJpcCB9IGZyb20gJ0Bub2RlLW5vdmVsL25vcm1hbGl6ZSc7XG5pbXBvcnQgeyBDb25zb2xlIH0gZnJvbSAnZGVidWctY29sb3IyJztcbmltcG9ydCB7IGNybGYgfSBmcm9tICdjcmxmLW5vcm1hbGl6ZSc7XG5cbmV4cG9ydCBjb25zdCBjb25zb2xlID0gbmV3IENvbnNvbGUobnVsbCwge1xuXHRlbmFibGVkOiB0cnVlLFxuXHRpbnNwZWN0T3B0aW9uczoge1xuXHRcdGNvbG9yczogdHJ1ZSxcblx0fSxcblx0Y2hhbGtPcHRpb25zOiB7XG5cdFx0ZW5hYmxlZDogdHJ1ZSxcblx0fSxcbn0pO1xuXG5jb25zb2xlLmVuYWJsZWRDb2xvciA9IHRydWU7XG5cbmV4cG9ydCBpbnRlcmZhY2UgSU9wdGlvbnNcbntcblx0LyoqXG5cdCAqIOWwj+iqqiB0eHQg55qE5Li76LOH5paZ5aS+6Lev5b6RXG5cdCAqIEB0eXBlIHtzdHJpbmd9XG5cdCAqL1xuXHRpbnB1dFBhdGg6IHN0cmluZyxcblx0b3V0cHV0UGF0aDogc3RyaW5nLFxuXG5cdC8qKlxuXHQgKiDlsI/oqqrlkI3nqLFJRFxuXHQgKi9cblx0bm92ZWxJRD86IHN0cmluZyxcblx0ZmlsZW5hbWU/OiBzdHJpbmcsXG5cblx0bm92ZWxDb25mPyxcblxuXHRlcHViVGVtcGxhdGU/LFxuXG5cdGVwdWJMYW5ndWFnZT86IHN0cmluZyxcblxuXHRwYWRFbmREYXRlPzogYm9vbGVhbixcblxuXHRnbG9iYnlPcHRpb25zPzogbm92ZWxHbG9iYnkuSU9wdGlvbnMsXG5cblx0dXNlVGl0bGU/OiBib29sZWFuLFxuXHRmaWxlbmFtZUxvY2FsPzogYm9vbGVhbiB8IHN0cmluZ1tdIHwgc3RyaW5nLFxuXG5cdG5vTG9nPzogYm9vbGVhbixcbn1cblxuZXhwb3J0IGNvbnN0IGRlZmF1bHRPcHRpb25zOiBQYXJ0aWFsPElPcHRpb25zPiA9IE9iamVjdC5mcmVlemUoe1xuXHRlcHViVGVtcGxhdGU6ICdsaWdodG5vdmVsJyxcblx0ZXB1Ykxhbmd1YWdlOiAnemgnLFxuXHQvL3BhZEVuZERhdGU6IHRydWUsXG5cblx0Z2xvYmJ5T3B0aW9uczoge1xuXHRcdGNoZWNrUm9tYW46IHRydWUsXG5cdFx0dXNlRGVmYXVsdFBhdHRlcm5zRXhjbHVkZTogdHJ1ZSxcblx0fSxcbn0pO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Tm92ZWxDb25mKG9wdGlvbnM6IElPcHRpb25zLCBjYWNoZSA9IHt9KTogUHJvbWlzZTxJTWRjb25mTWV0YT5cbntcblx0cmV0dXJuIFByb21pc2UucmVzb2x2ZSgpLnRoZW4oYXN5bmMgZnVuY3Rpb24gKClcblx0e1xuXHRcdGxldCBtZXRhOiBJTWRjb25mTWV0YTtcblx0XHRsZXQgY29uZlBhdGg6IHN0cmluZztcblxuXHRcdGlmIChvcHRpb25zLm5vdmVsQ29uZiAmJiB0eXBlb2Ygb3B0aW9ucy5ub3ZlbENvbmYgPT0gJ29iamVjdCcpXG5cdFx0e1xuXHRcdFx0bWV0YSA9IG9wdGlvbnMubm92ZWxDb25mO1xuXHRcdH1cblx0XHRlbHNlXG5cdFx0e1xuXHRcdFx0aWYgKHR5cGVvZiBvcHRpb25zLm5vdmVsQ29uZiA9PSAnc3RyaW5nJylcblx0XHRcdHtcblx0XHRcdFx0Y29uZlBhdGggPSBvcHRpb25zLm5vdmVsQ29uZjtcblx0XHRcdH1cblx0XHRcdGVsc2Vcblx0XHRcdHtcblx0XHRcdFx0Y29uZlBhdGggPSBvcHRpb25zLmlucHV0UGF0aDtcblx0XHRcdH1cblxuXHRcdFx0aWYgKGZzLmV4aXN0c1N5bmMocGF0aC5qb2luKGNvbmZQYXRoLCAnbWV0YS5tZCcpKSlcblx0XHRcdHtcblx0XHRcdFx0bGV0IGZpbGUgPSBwYXRoLmpvaW4oY29uZlBhdGgsICdtZXRhLm1kJyk7XG5cblx0XHRcdFx0bWV0YSA9IGF3YWl0IGZzLnJlYWRGaWxlKGZpbGUpXG5cdFx0XHRcdFx0LnRoZW4obWRjb25mX3BhcnNlKVxuXHRcdFx0XHQ7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIGlmIChmcy5leGlzdHNTeW5jKHBhdGguam9pbihjb25mUGF0aCwgJ1JFQURNRS5tZCcpKSlcblx0XHRcdHtcblx0XHRcdFx0bGV0IGZpbGUgPSBwYXRoLmpvaW4oY29uZlBhdGgsICdSRUFETUUubWQnKTtcblxuXHRcdFx0XHRtZXRhID0gYXdhaXQgZnMucmVhZEZpbGUoZmlsZSlcblx0XHRcdFx0XHQudGhlbihtZGNvbmZfcGFyc2UpXG5cdFx0XHRcdDtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRtZXRhID0gY2hrSW5mbyhtZXRhKTtcblxuXHRcdGlmICghbWV0YSB8fCAhbWV0YS5ub3ZlbCB8fCAhbWV0YS5ub3ZlbC50aXRsZSlcblx0XHR7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoYG5vdCBhIHZhbGlkIG5vdmVsSW5mbyBkYXRhYCk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIG1ldGE7XG5cdH0pXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtYWtlT3B0aW9ucyhvcHRpb25zOiBJT3B0aW9ucylcbntcblx0b3B0aW9ucyA9IE9iamVjdC5rZXlzKG9wdGlvbnMpXG5cdFx0LmZpbHRlcih2ID0+IHR5cGVvZiBvcHRpb25zW3ZdICE9ICd1bmRlZmluZWQnKVxuXHRcdC5yZWR1Y2UoZnVuY3Rpb24gKGEsIGIpXG5cdFx0e1xuXHRcdFx0YVtiXSA9IG9wdGlvbnNbYl07XG5cblx0XHRcdHJldHVybiBhXG5cdFx0fSwge30gYXMgSU9wdGlvbnMpXG5cdDtcblxuXHRyZXR1cm4gb3B0aW9ucyA9IGRlZXBtZXJnZS5hbGwoW3t9LCBkZWZhdWx0T3B0aW9ucywgb3B0aW9uc10pO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElOb3ZlbEVwdWJSZXR1cm5JbmZvXG57XG5cdGZpbGU6IHN0cmluZyxcblx0ZmlsZW5hbWU6IHN0cmluZyxcblx0ZXB1YjogRXB1Yk1ha2VyLFxuXG5cdG91dHB1dFBhdGg6IHN0cmluZyxcblx0YmFzZW5hbWU6IHN0cmluZyxcblx0ZXh0OiBzdHJpbmcsXG5cblx0c3RhdDoge1xuXHRcdHZvbHVtZTogbnVtYmVyLFxuXHRcdGNoYXB0ZXI6IG51bWJlcixcblx0XHRpbWFnZTogbnVtYmVyLFxuXHR9LFxufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlKG9wdGlvbnM6IElPcHRpb25zLCBjYWNoZSA9IHt9KTogUHJvbWlzZTxJTm92ZWxFcHViUmV0dXJuSW5mbz5cbntcblx0cmV0dXJuIFByb21pc2UucmVzb2x2ZSgpLnRoZW4oYXN5bmMgZnVuY3Rpb24gKClcblx0e1xuXHRcdC8vY29uc29sZS5sb2cob3B0aW9ucywgZGVmYXVsdE9wdGlvbnMpO1xuXG5cdFx0b3B0aW9ucyA9IG1ha2VPcHRpb25zKG9wdGlvbnMpO1xuXG5cdFx0Ly9jb25zb2xlLmRpcihvcHRpb25zLCB7Y29sb3JzOiB0cnVlfSk7XG5cblx0XHRsZXQgbm92ZWxJRCA9IG9wdGlvbnMubm92ZWxJRDtcblx0XHRsZXQgVFhUX1BBVEggPSBvcHRpb25zLmlucHV0UGF0aDtcblxuXHRcdGxldCBtZXRhID0gYXdhaXQgZ2V0Tm92ZWxDb25mKG9wdGlvbnMsIGNhY2hlKTtcblxuXHRcdGxldCBnbG9iYnlfcGF0dGVybnM6IHN0cmluZ1tdO1xuXHRcdGxldCBnbG9iYnlfb3B0aW9uczogbm92ZWxHbG9iYnkuSU9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHt9LCBvcHRpb25zLmdsb2JieU9wdGlvbnMsIHtcblx0XHRcdGN3ZDogVFhUX1BBVEgsXG5cdFx0XHQvL3VzZURlZmF1bHRQYXR0ZXJuc0V4Y2x1ZGU6IHRydWUsXG5cdFx0XHQvL2NoZWNrUm9tYW46IHRydWUsXG5cdFx0fSk7XG5cblx0XHR7XG5cdFx0XHRbZ2xvYmJ5X3BhdHRlcm5zLCBnbG9iYnlfb3B0aW9uc10gPSBub3ZlbEdsb2JieS5nZXRPcHRpb25zKGdsb2JieV9vcHRpb25zKTtcblx0XHR9XG5cblx0XHQvL2NvbnNvbGUubG9nKG9wdGlvbnMsIGdsb2JieV9vcHRpb25zKTtcblxuXHRcdC8vY29uc29sZS5kaXIob3B0aW9ucyk7XG5cblx0XHRjb25zb2xlLmluZm8obWV0YS5ub3ZlbC50aXRsZSk7XG5cdFx0Ly9jb25zb2xlLmxvZyhtZXRhLm5vdmVsLnByZWZhY2UpO1xuXG5cdFx0bGV0IGVwdWI6IEVwdWJNYWtlciA9IG5ldyBFcHViTWFrZXIoKVxuXHRcdFx0LndpdGhUZW1wbGF0ZShvcHRpb25zLmVwdWJUZW1wbGF0ZSlcblx0XHRcdC53aXRoTGFuZ3VhZ2Uob3B0aW9ucy5lcHViTGFuZ3VhZ2UpXG5cdFx0XHQud2l0aFV1aWQoY3JlYXRlVVVJRChoYXNoU3VtKFtcblx0XHRcdFx0bWV0YS5ub3ZlbC50aXRsZSxcblx0XHRcdFx0bWV0YS5ub3ZlbC5hdXRob3IsXG5cdFx0XHRdKSkpXG5cdFx0XHQud2l0aFRpdGxlKG1ldGEubm92ZWwudGl0bGUsIG1ldGEubm92ZWwudGl0bGVfc2hvcnQgfHwgbWV0YS5ub3ZlbC50aXRsZV96aClcblx0XHRcdC53aXRoQXV0aG9yKG1ldGEubm92ZWwuYXV0aG9yKVxuXHRcdFx0LmFkZEF1dGhvcihtZXRhLm5vdmVsLmF1dGhvcilcblx0XHRcdC53aXRoQ29sbGVjdGlvbih7XG5cdFx0XHRcdG5hbWU6IG1ldGEubm92ZWwudGl0bGUsXG5cdFx0XHR9KVxuXHRcdFx0LndpdGhJbmZvUHJlZmFjZShtZXRhLm5vdmVsLnByZWZhY2UpXG5cdFx0XHQuYWRkVGFnKG1ldGEubm92ZWwudGFncylcblx0XHRcdC5hZGRBdXRob3IobWV0YS5jb250cmlidXRlKVxuXHRcdDtcblxuXHRcdGlmIChvcHRpb25zLmZpbGVuYW1lKVxuXHRcdHtcblx0XHRcdGVwdWIuZXB1YkNvbmZpZy5maWxlbmFtZSA9IG9wdGlvbnMuZmlsZW5hbWU7XG5cdFx0fVxuXG5cdFx0aWYgKG1ldGEubm92ZWwuc291cmNlKVxuXHRcdHtcblx0XHRcdGVwdWIuYWRkTGlua3MobWV0YS5ub3ZlbC5zb3VyY2UpO1xuXHRcdH1cblxuXHRcdGlmIChtZXRhLm5vdmVsLnNlcmllcylcblx0XHR7XG5cdFx0XHRlcHViLndpdGhTZXJpZXMobWV0YS5ub3ZlbC5zZXJpZXMubmFtZSwgbWV0YS5ub3ZlbC5zZXJpZXMucG9zaXRpb24pO1xuXHRcdH1cblx0XHRlbHNlXG5cdFx0e1xuXHRcdFx0ZXB1Yi53aXRoU2VyaWVzKG1ldGEubm92ZWwudGl0bGUpO1xuXHRcdH1cblxuXHRcdGlmIChtZXRhLm5vdmVsLnB1Ymxpc2hlcilcblx0XHR7XG5cdFx0XHRlcHViLndpdGhQdWJsaXNoZXIobWV0YS5ub3ZlbC5wdWJsaXNoZXIgfHwgJ25vZGUtbm92ZWwnKTtcblx0XHR9XG5cblx0XHRpZiAobWV0YS5ub3ZlbC5kYXRlKVxuXHRcdHtcblx0XHRcdGVwdWIud2l0aE1vZGlmaWNhdGlvbkRhdGUobWV0YS5ub3ZlbC5kYXRlKTtcblx0XHR9XG5cblx0XHRpZiAobWV0YS5ub3ZlbC5zdGF0dXMpXG5cdFx0e1xuXHRcdFx0ZXB1Yi5hZGRUYWcobWV0YS5ub3ZlbC5zdGF0dXMpO1xuXHRcdH1cblxuXHRcdGlmIChtZXRhLm5vdmVsLmNvdmVyKVxuXHRcdHtcblx0XHRcdGVwdWIud2l0aENvdmVyKG1ldGEubm92ZWwuY292ZXIpO1xuXHRcdH1cblx0XHRlbHNlXG5cdFx0e1xuXHRcdFx0YXdhaXQgbm92ZWxHbG9iYnkuZ2xvYmJ5KFtcblx0XHRcdFx0XHQnY292ZXIuKicsXG5cdFx0XHRcdF0sIE9iamVjdC5hc3NpZ24oe30sIGdsb2JieV9vcHRpb25zLCB7XG5cdFx0XHRcdFx0YWJzb2x1dGU6IHRydWUsXG5cdFx0XHRcdH0pKVxuXHRcdFx0XHQudGhlbihscyA9PlxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0aWYgKGxzLmxlbmd0aClcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRlcHViLndpdGhDb3Zlcihsc1swXSk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0Y29uc29sZS5sb2cobHMpO1xuXHRcdFx0XHR9KVxuXHRcdFx0O1xuXHRcdH1cblxuXHRcdC8vcHJvY2Vzcy5leGl0KCk7XG5cblx0XHRsZXQgc3RhdDogSU5vdmVsRXB1YlJldHVybkluZm9bXCJzdGF0XCJdID0ge1xuXHRcdFx0dm9sdW1lOiAwLFxuXHRcdFx0Y2hhcHRlcjogMCxcblx0XHRcdGltYWdlOiAwLFxuXHRcdH07XG5cblx0XHRhd2FpdCBub3ZlbEdsb2JieVxuXHRcdFx0Lmdsb2JieUFTeW5jKGdsb2JieV9wYXR0ZXJucywgZ2xvYmJ5X29wdGlvbnMpXG5cdFx0XHQudGhlbihmdW5jdGlvbiAobHMpXG5cdFx0XHR7XG5cdFx0XHRcdC8vY29uc29sZS5sb2cobHMpO1xuXG5cdFx0XHRcdC8vcHJvY2Vzcy5leGl0KCk7XG5cblx0XHRcdFx0cmV0dXJuIGxzO1xuXHRcdFx0fSlcblx0XHRcdC50aGVuKF9scyA9PlxuXHRcdFx0e1xuXHRcdFx0XHRsZXQgaWR4ID0gMTtcblxuXHRcdFx0XHRsZXQgY2FjaGVUcmVlU2VjdGlvbiA9IHt9IGFzIHtcblx0XHRcdFx0XHRbazogc3RyaW5nXTogRXB1Yk1ha2VyLlNlY3Rpb24sXG5cdFx0XHRcdH07XG5cblx0XHRcdFx0Y29uc3QgU3ltQ2FjaGUgPSBTeW1ib2woJ2NhY2hlJyk7XG5cblx0XHRcdFx0cmV0dXJuIFByb21pc2Vcblx0XHRcdFx0XHQubWFwU2VyaWVzKE9iamVjdC5rZXlzKF9scyksIGFzeW5jIGZ1bmN0aW9uICh2YWxfZGlyKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGxldCBscyA9IF9sc1t2YWxfZGlyXTtcblx0XHRcdFx0XHRcdGxldCBkaXJuYW1lID0gbHNbMF0ucGF0aF9kaXI7XG5cdFx0XHRcdFx0XHRsZXQgdm9sdW1lX3RpdGxlID0gbHNbMF0udm9sdW1lX3RpdGxlO1xuXG5cdFx0XHRcdFx0XHRsZXQgdm9sdW1lID0gY2FjaGVUcmVlU2VjdGlvblt2YWxfZGlyXTtcblxuXHRcdFx0XHRcdFx0bGV0IF9uZXdfdG9wX2xldmVsOiBFcHViTWFrZXIuU2VjdGlvbjtcblxuXHRcdFx0XHRcdFx0aWYgKCFjYWNoZVRyZWVTZWN0aW9uW3ZhbF9kaXJdKVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRsZXQgX3RzMiA9IHZvbHVtZV90aXRsZS5zcGxpdCgnLycpO1xuXHRcdFx0XHRcdFx0XHRsZXQgX3RzID0gdmFsX2Rpci5zcGxpdCgnLycpO1xuXG5cdFx0XHRcdFx0XHRcdGxldCBfZHMgPSAocGF0aC5ub3JtYWxpemUoZGlybmFtZSkgYXMgc3RyaW5nKS5zcGxpdCgnLycpO1xuXG5cdFx0XHRcdFx0XHRcdGxldCBfbGFzdDogRXB1Yk1ha2VyLlNlY3Rpb247XG5cblx0XHRcdFx0XHRcdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBfdHMubGVuZ3RoOyBpKyspXG5cdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRsZXQgX25hdnMgPSBfdHMuc2xpY2UoMCwgaSArIDEpO1xuXHRcdFx0XHRcdFx0XHRcdGxldCBfbmF2ID0gX25hdnMuam9pbignLycpO1xuXG5cdFx0XHRcdFx0XHRcdFx0bGV0IF9uYXZfZGlyID0gX2RzLnNsaWNlKDAsIF9kcy5sZW5ndGggLSBfdHMubGVuZ3RoICsgaSArIDEpLmpvaW4oJy8nKTtcblxuXHRcdFx0XHRcdFx0XHRcdC8qXG5cdFx0XHRcdFx0XHRcdFx0Y29uc29sZS5kaXIoe1xuXHRcdFx0XHRcdFx0XHRcdFx0X25hdnMsXG5cdFx0XHRcdFx0XHRcdFx0XHRfbmF2LFxuXHRcdFx0XHRcdFx0XHRcdFx0X25hdl9kaXIsXG5cdFx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHRcdFx0Ki9cblxuXHRcdFx0XHRcdFx0XHRcdGlmICghY2FjaGVUcmVlU2VjdGlvbltfbmF2XSlcblx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRsZXQgdmlkID0gYHZvbHVtZSR7KGlkeCsrKS50b1N0cmluZygpLnBhZFN0YXJ0KDYsICcwJyl9YDtcblxuXHRcdFx0XHRcdFx0XHRcdFx0bGV0IHRpdGxlID0gbm9ybWFsaXplX3N0cmlwKF90czJbaV0sIHRydWUpO1xuXG5cdFx0XHRcdFx0XHRcdFx0XHRjYWNoZVRyZWVTZWN0aW9uW19uYXZdID0gbmV3IEVwdWJNYWtlci5TZWN0aW9uKCdhdXRvLXRvYycsIHZpZCwge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHR0aXRsZTogdGl0bGUsXG5cdFx0XHRcdFx0XHRcdFx0XHR9LCBmYWxzZSwgdHJ1ZSk7XG5cblx0XHRcdFx0XHRcdFx0XHRcdGNhY2hlVHJlZVNlY3Rpb25bX25hdl1bU3ltQ2FjaGVdID0gY2FjaGVUcmVlU2VjdGlvbltfbmF2XVtTeW1DYWNoZV0gfHwge307XG5cblx0XHRcdFx0XHRcdFx0XHRcdGlmIChpID09IDApXG5cdFx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdC8vZXB1Yi53aXRoU2VjdGlvbihjYWNoZVRyZWVTZWN0aW9uW19uYXZdKTtcblxuXHRcdFx0XHRcdFx0XHRcdFx0XHRfbmV3X3RvcF9sZXZlbCA9IGNhY2hlVHJlZVNlY3Rpb25bX25hdl07XG5cdFx0XHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0XHRcdHN0YXQudm9sdW1lKys7XG5cblx0XHRcdFx0XHRcdFx0XHRcdGF3YWl0IF9oYW5kbGVWb2x1bWUoY2FjaGVUcmVlU2VjdGlvbltfbmF2XSwgX25hdl9kaXIpXG5cdFx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdFx0aWYgKF9sYXN0KVxuXHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdF9sYXN0LndpdGhTdWJTZWN0aW9uKGNhY2hlVHJlZVNlY3Rpb25bX25hdl0pXG5cdFx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdFx0X2xhc3QgPSBjYWNoZVRyZWVTZWN0aW9uW19uYXZdO1xuXHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0dm9sdW1lID0gY2FjaGVUcmVlU2VjdGlvblt2YWxfZGlyXTtcblxuLy9cdFx0XHRcdFx0XHRcdGNvbnNvbGUuZGlyKHtcbi8vXHRcdFx0XHRcdFx0XHRcdGNhY2hlVHJlZVNlY3Rpb24sXG4vL1x0XHRcdFx0XHRcdFx0XHR2b2x1bWUsXG4vL1x0XHRcdFx0XHRcdFx0fSwge1xuLy9cdFx0XHRcdFx0XHRcdFx0ZGVwdGg6IDUsXG4vL1x0XHRcdFx0XHRcdFx0XHRjb2xvcnM6IHRydWUsXG4vL1x0XHRcdFx0XHRcdFx0fSk7XG4vL1x0XHRcdFx0XHRcdFx0cHJvY2Vzcy5leGl0KClcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0bGV0IHZpZDogc3RyaW5nID0gdm9sdW1lLmlkO1xuXG5cdFx0XHRcdFx0XHRhd2FpdCBfaGFuZGxlVm9sdW1lKHZvbHVtZSwgZGlybmFtZSlcblxuXHRcdFx0XHRcdFx0YXN5bmMgZnVuY3Rpb24gX2hhbmRsZVZvbHVtZSh2b2x1bWU6IEVwdWJNYWtlci5TZWN0aW9uLCBkaXJuYW1lOiBzdHJpbmcpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdGxldCB2aWQ6IHN0cmluZyA9IHZvbHVtZS5pZDtcblxuXHRcdFx0XHRcdFx0XHRpZiAoIXZvbHVtZVtTeW1DYWNoZV0uY292ZXIpXG5cdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHR2b2x1bWVbU3ltQ2FjaGVdLmNvdmVyID0gdHJ1ZTtcblxuXHRcdFx0XHRcdFx0XHRcdGxldCBmaWxlID0gcGF0aC5qb2luKGRpcm5hbWUsICdSRUFETUUubWQnKTtcblx0XHRcdFx0XHRcdFx0XHRsZXQgbWV0YSA9IGF3YWl0IGZzLnJlYWRGaWxlKGZpbGUpXG5cdFx0XHRcdFx0XHRcdFx0XHQudGhlbihmdW5jdGlvbiAoZGF0YSlcblx0XHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0cmV0dXJuIG1kY29uZl9wYXJzZShkYXRhLCB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0Ly8g55W25rKS5pyJ5YyF5ZCr5b+F6KaB55qE5YWn5a655pmC5LiN55Si55Sf6Yyv6KqkXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0dGhyb3c6IGZhbHNlLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdC8vIOWFgeioseS4jeaomea6lueahCBpbmZvIOWFp+WuuVxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdGxvd0NoZWNrTGV2ZWw6IHRydWUsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdFx0XHRcdC5jYXRjaChmdW5jdGlvbiAoKVxuXHRcdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gbnVsbDtcblx0XHRcdFx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHRcdFx0O1xuXG5cdFx0XHRcdFx0XHRcdFx0Ly9jb25zb2xlLmxvZyhmaWxlLCBtZXRhKTtcblxuXHRcdFx0XHRcdFx0XHRcdGF3YWl0IG5vdmVsR2xvYmJ5Lmdsb2JieShbXG5cdFx0XHRcdFx0XHRcdFx0XHRcdCdjb3Zlci4qJyxcblx0XHRcdFx0XHRcdFx0XHRcdF0sIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0Y3dkOiBkaXJuYW1lLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRhYnNvbHV0ZTogdHJ1ZSxcblx0XHRcdFx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHRcdFx0XHQudGhlbihhc3luYyAobHMpID0+XG5cdFx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdGlmIChscy5sZW5ndGgpXG5cdFx0XHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRsZXQgZXh0ID0gcGF0aC5leHRuYW1lKGxzWzBdKTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRsZXQgbmFtZSA9IGAke3ZpZH0tY292ZXIke2V4dH1gO1xuXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0ZXB1Yi53aXRoQWRkaXRpb25hbEZpbGUobHNbMF0sIG51bGwsIG5hbWUpO1xuXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0cmV0dXJuIG5hbWU7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHRcdFx0ZWxzZSBpZiAoZnMuZXhpc3RzU3luYyhmaWxlKSlcblx0XHRcdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdGlmIChtZXRhICYmIG1ldGEubm92ZWwpXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0aWYgKG1ldGEubm92ZWwuY292ZXIpXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGxldCBleHQgPSAnLnBuZyc7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGxldCBiYXNlbmFtZSA9IGAke3ZpZH0tY292ZXJgO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRsZXQgbmFtZSA9IGAke2Jhc2VuYW1lfSR7ZXh0fWA7XG5cblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0bGV0IGRhdGEgPSB0eXBlb2YgbWV0YS5ub3ZlbC5jb3ZlciA9PT0gJ3N0cmluZycgPyB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0dXJsOiBtZXRhLm5vdmVsLmNvdmVyLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHR9IDogbWV0YS5ub3ZlbC5jb3ZlcjtcblxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRkYXRhLmV4dCA9IG51bGw7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGRhdGEuYmFzZW5hbWUgPSBiYXNlbmFtZTtcblxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRlcHViLndpdGhBZGRpdGlvbmFsRmlsZShkYXRhLCBudWxsLCBuYW1lKTtcblxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gbmFtZTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHRcdFx0XHQudGhlbihmdW5jdGlvbiAobmFtZSlcblx0XHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0bGV0IF9vayA9IGZhbHNlO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRsZXQgZGF0YTogSVNlY3Rpb25Db250ZW50ID0ge307XG5cblx0XHRcdFx0XHRcdFx0XHRcdFx0aWYgKG5hbWUpXG5cdFx0XHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRfb2sgPSB0cnVlO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdGRhdGEuY292ZXIgPSB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRuYW1lLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdH07XG5cblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRzdGF0LmltYWdlICs9IDE7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRcdFx0XHRpZiAobWV0YSAmJiBtZXRhLm5vdmVsKVxuXHRcdFx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0aWYgKG1ldGEubm92ZWwucHJlZmFjZSlcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRfb2sgPSB0cnVlO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0Ly9kYXRhLmNvbnRlbnQgPSBjcmxmKG1ldGEubm92ZWwucHJlZmFjZSk7XG5cblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGRhdGEuY29udGVudCA9IGh0bWxQcmVmYWNlKHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0aW5mb1ByZWZhY2U6IG1ldGEubm92ZWwucHJlZmFjZSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdH0pLmluZm9QcmVmYWNlSFRNTDtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKG5hbWUsIF9vayk7XG5cblx0XHRcdFx0XHRcdFx0XHRcdFx0aWYgKF9vaylcblx0XHRcdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdHJldHVybiBkYXRhXG5cdFx0XHRcdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gbnVsbFxuXHRcdFx0XHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdFx0XHRcdC50aGVuKGZ1bmN0aW9uIChkYXRhKVxuXHRcdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRpZiAoZGF0YSlcblx0XHRcdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdC8vY29uc29sZS5sb2codm9sdW1lKTtcblxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdHZvbHVtZS5zZXRDb250ZW50KGRhdGEsIHRydWUpO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0XHRcdDtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKGRpcm5hbWUpO1xuXG5cdFx0XHRcdFx0XHQvL3ZvbHVtZS53aXRoU3ViU2VjdGlvbihuZXcgRXB1Yk1ha2VyLlNlY3Rpb24oJ2F1dG8tdG9jJywgbnVsbCwgbnVsbCwgZmFsc2UsIGZhbHNlKSk7XG5cblx0XHRcdFx0XHRcdGF3YWl0IFByb21pc2UubWFwU2VyaWVzKGxzLCBhc3luYyBmdW5jdGlvbiAocm93KVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKGZpbGVuYW1lKTtcblxuXHRcdFx0XHRcdFx0XHQvL2xldCBkYXRhID0gYXdhaXQgZnMucmVhZEZpbGUocGF0aC5qb2luKFRYVF9QQVRILCBkaXJuYW1lLCBmaWxlbmFtZSkpO1xuXHRcdFx0XHRcdFx0XHRsZXQgZGF0YTogc3RyaW5nIHwgQnVmZmVyID0gYXdhaXQgZnMucmVhZEZpbGUocm93LnBhdGgpO1xuXG5cdFx0XHRcdFx0XHRcdC8vY29uc29sZS5sb2coZGF0YSk7XG5cblx0XHRcdFx0XHRcdFx0aWYgKHJvdy5leHQgPT0gJy50eHQnKVxuXHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0ZGF0YSA9IHNwbGl0VHh0KGRhdGEudG9TdHJpbmcoKSk7XG5cdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRpZiAoQnVmZmVyLmlzQnVmZmVyKGRhdGEpKVxuXHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0ZGF0YSA9IGRhdGEudG9TdHJpbmcoKTtcblx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdGxldCBuYW1lID0gcm93LmNoYXB0ZXJfdGl0bGU7XG5cblx0XHRcdFx0XHRcdFx0aWYgKCFvcHRpb25zLm5vTG9nKVxuXHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0bGV0IHtcblx0XHRcdFx0XHRcdFx0XHRcdHNvdXJjZV9pZHgsXG5cdFx0XHRcdFx0XHRcdFx0XHR2b2x1bWVfdGl0bGUsXG5cdFx0XHRcdFx0XHRcdFx0XHRjaGFwdGVyX3RpdGxlLFxuXHRcdFx0XHRcdFx0XHRcdFx0ZGlyLFxuXHRcdFx0XHRcdFx0XHRcdFx0ZmlsZSxcblx0XHRcdFx0XHRcdFx0XHR9ID0gcm93O1xuXG5cdFx0XHRcdFx0XHRcdFx0Y29uc29sZS5kaXIoe1xuXHRcdFx0XHRcdFx0XHRcdFx0c291cmNlX2lkeCxcblx0XHRcdFx0XHRcdFx0XHRcdHZvbHVtZV90aXRsZSxcblx0XHRcdFx0XHRcdFx0XHRcdGNoYXB0ZXJfdGl0bGUsXG5cdFx0XHRcdFx0XHRcdFx0XHRkaXIsXG5cdFx0XHRcdFx0XHRcdFx0XHRmaWxlLFxuXHRcdFx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0bGV0IGNoYXB0ZXIgPSBuZXcgRXB1Yk1ha2VyLlNlY3Rpb24oJ2NoYXB0ZXInLCBgY2hhcHRlciR7KGlkeCsrKS50b1N0cmluZygpXG5cdFx0XHRcdFx0XHRcdFx0LnBhZFN0YXJ0KDQsICcwJyl9YCwge1xuXHRcdFx0XHRcdFx0XHRcdHRpdGxlOiBuYW1lLFxuXHRcdFx0XHRcdFx0XHRcdGNvbnRlbnQ6IGNybGYoZGF0YSksXG5cdFx0XHRcdFx0XHRcdH0sIHRydWUsIGZhbHNlKTtcblxuXHRcdFx0XHRcdFx0XHRzdGF0LmNoYXB0ZXIrKztcblxuXHRcdFx0XHRcdFx0XHR2b2x1bWUud2l0aFN1YlNlY3Rpb24oY2hhcHRlcik7XG5cdFx0XHRcdFx0XHR9KTtcblxuXHRcdFx0XHRcdFx0aWYgKCF2b2x1bWVbU3ltQ2FjaGVdLmltYWdlKVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHR2b2x1bWVbU3ltQ2FjaGVdLmltYWdlID0gdHJ1ZTtcblxuXHRcdFx0XHRcdFx0XHRhd2FpdCBub3ZlbEdsb2JieS5nbG9iYnkoW1xuXHRcdFx0XHRcdFx0XHRcdFx0Jyoue2pwZyxnaWYscG5nLGpwZWcsc3ZnfScsXG5cdFx0XHRcdFx0XHRcdFx0XHQnaW1hZ2UvKi57anBnLGdpZixwbmcsanBlZyxzdmd9Jyxcblx0XHRcdFx0XHRcdFx0XHRcdCdpbWFnZXMvKi57anBnLGdpZixwbmcsanBlZyxzdmd9Jyxcblx0XHRcdFx0XHRcdFx0XHRcdCchY292ZXIuKicsXG5cdFx0XHRcdFx0XHRcdFx0XHQnISoudHh0Jyxcblx0XHRcdFx0XHRcdFx0XHRdLCB7XG5cdFx0XHRcdFx0XHRcdFx0XHRjd2Q6IGRpcm5hbWUsXG5cdFx0XHRcdFx0XHRcdFx0XHRhYnNvbHV0ZTogdHJ1ZSxcblx0XHRcdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0XHRcdC50aGVuKGxzID0+XG5cdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0bGV0IGFyciA9IFtdO1xuXG5cdFx0XHRcdFx0XHRcdFx0XHRmb3IgKGxldCBpIGluIGxzKVxuXHRcdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRsZXQgaW1nID0gbHNbaV07XG5cblx0XHRcdFx0XHRcdFx0XHRcdFx0bGV0IGV4dCA9IHBhdGguZXh0bmFtZShpbWcpO1xuXG5cdFx0XHRcdFx0XHRcdFx0XHRcdGxldCBiYXNlbmFtZSA9IHBhdGguYmFzZW5hbWUoaW1nLCBleHQpO1xuXG5cdFx0XHRcdFx0XHRcdFx0XHRcdC8vIEB0cy1pZ25vcmVcblx0XHRcdFx0XHRcdFx0XHRcdFx0bGV0IG5hbWUgPSBzbHVnaWZ5KGJhc2VuYW1lKTtcblxuXHRcdFx0XHRcdFx0XHRcdFx0XHRpZiAoIW5hbWUgfHwgYXJyLmluY2x1ZGVzKG5hbWUpKVxuXHRcdFx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0bmFtZSA9IGhhc2hTdW0oW2ltZywgaSwgbmFtZV0pO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0XHRcdFx0Ly9uYW1lID0gYCR7dmlkfS8ke2l9LWAgKyBuYW1lICsgZXh0O1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRuYW1lID0gYCR7dmlkfS9gICsgbmFtZSArIGV4dDtcblxuXHRcdFx0XHRcdFx0XHRcdFx0XHRhcnIucHVzaCgnaW1hZ2UvJyArIG5hbWUpO1xuXG5cdFx0XHRcdFx0XHRcdFx0XHRcdGVwdWIud2l0aEFkZGl0aW9uYWxGaWxlKGltZywgJ2ltYWdlJywgbmFtZSk7XG5cdFx0XHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0XHRcdGlmIChhcnIubGVuZ3RoKVxuXHRcdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRpZiAodm9sdW1lLmNvbnRlbnQgJiYgdm9sdW1lLmNvbnRlbnQuY292ZXIgJiYgdm9sdW1lLmNvbnRlbnQuY292ZXIubmFtZSlcblx0XHRcdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdGFyci51bnNoaWZ0KHZvbHVtZS5jb250ZW50LmNvdmVyLm5hbWUpO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0XHRcdFx0bGV0IGNoYXB0ZXIgPSBuZXcgRXB1Yk1ha2VyLlNlY3Rpb24oJ25vbi1zcGVjaWZpYyBiYWNrbWF0dGVyJywgYGltYWdlJHsoaWR4KyspLnRvU3RyaW5nKClcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHQucGFkU3RhcnQoNCwgJzAnKX1gLCB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0dGl0bGU6ICfmj5LlnJYnLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdGNvbnRlbnQ6IGFyci5yZWR1Y2UoZnVuY3Rpb24gKGEsIGIpXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0bGV0IGh0bWwgPSBgPGZpZ3VyZSBjbGFzcz1cImZ1bGxwYWdlIEltYWdlQ29udGFpbmVyIHBhZ2UtYnJlYWstYmVmb3JlXCI+PGltZyBpZD1cIkNvdmVySW1hZ2VcIiBjbGFzcz1cIkNvdmVySW1hZ2VcIiBzcmM9XCIke2J9XCIgYWx0PVwiQ292ZXJcIiAvPjwvZmlndXJlPmA7XG5cblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGEucHVzaChodG1sKTtcblxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0cmV0dXJuIGE7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0fSwgW10pLmpvaW4oXCJcXG5cIiksXG5cdFx0XHRcdFx0XHRcdFx0XHRcdH0sIHRydWUsIGZhbHNlKTtcblxuXHRcdFx0XHRcdFx0XHRcdFx0XHRzdGF0LmltYWdlICs9IGFyci5sZW5ndGg7XG5cblx0XHRcdFx0XHRcdFx0XHRcdFx0dm9sdW1lLndpdGhTdWJTZWN0aW9uKGNoYXB0ZXIpO1xuXHRcdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHRcdDtcblxuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHQvL2VwdWIud2l0aFNlY3Rpb24odm9sdW1lKTtcblxuXHRcdFx0XHRcdFx0aWYgKF9uZXdfdG9wX2xldmVsKVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRlcHViLndpdGhTZWN0aW9uKF9uZXdfdG9wX2xldmVsKTtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0cmV0dXJuIHZvbHVtZTtcblx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdDtcblx0XHRcdH0pXG5cdFx0O1xuXG4vL1x0XHRjb25zb2xlLmxvZyhlcHViLmVwdWJDb25maWcuc2VjdGlvbnMpO1xuLy9cdFx0cHJvY2Vzcy5leGl0KCk7XG5cblx0XHRsZXQgZGF0YSA9IGF3YWl0IGVwdWIubWFrZUVwdWIoKTtcblxuXHRcdGxldCBfZmlsZV9kYXRhID0gbWFrZUZpbGVuYW1lKG9wdGlvbnMsIGVwdWIsIG1ldGEpO1xuXG5cdFx0bGV0IHsgZmlsZSwgZmlsZW5hbWUsIG5vdywgYmFzZW5hbWUsIGV4dCB9ID0gX2ZpbGVfZGF0YTtcblxuXHRcdGF3YWl0IGZzLm91dHB1dEZpbGUoZmlsZSwgZGF0YSk7XG5cblx0XHRjb25zb2xlLnN1Y2Nlc3MoZmlsZW5hbWUsIG5vdy5mb3JtYXQoKSk7XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0ZmlsZSxcblx0XHRcdGZpbGVuYW1lLFxuXHRcdFx0ZXB1YixcblxuXHRcdFx0b3V0cHV0UGF0aDogb3B0aW9ucy5vdXRwdXRQYXRoLFxuXG5cdFx0XHRiYXNlbmFtZSxcblx0XHRcdGV4dCxcblxuXHRcdFx0c3RhdCxcblx0XHR9O1xuXHR9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1ha2VGaWxlbmFtZShvcHRpb25zOiBJT3B0aW9ucywgZXB1YjogRXB1Yk1ha2VyLCBtZXRhOiBJTWRjb25mTWV0YSlcbntcblx0b3B0aW9ucyA9IG1ha2VPcHRpb25zKG9wdGlvbnMpO1xuXG5cdGxldCBmaWxlbmFtZSA9IGVwdWIuZ2V0RmlsZW5hbWUob3B0aW9ucy51c2VUaXRsZSwgdHJ1ZSk7XG5cblx0aWYgKCFvcHRpb25zLmZpbGVuYW1lKVxuXHR7XG5cdFx0aWYgKG9wdGlvbnMuZmlsZW5hbWVMb2NhbClcblx0XHR7XG5cdFx0XHQvLyBAdHMtaWdub3JlXG5cdFx0XHRpZiAobWV0YS5ub3ZlbC50aXRsZV9vdXRwdXQpXG5cdFx0XHR7XG5cdFx0XHRcdC8vIEB0cy1pZ25vcmVcblx0XHRcdFx0ZmlsZW5hbWUgPSBtZXRhLm5vdmVsLnRpdGxlX291dHB1dDtcblx0XHRcdH1cblx0XHRcdGVsc2UgaWYgKEFycmF5LmlzQXJyYXkob3B0aW9ucy5maWxlbmFtZUxvY2FsKSlcblx0XHRcdHtcblx0XHRcdFx0Zm9yIChsZXQgdiBvZiBvcHRpb25zLmZpbGVuYW1lTG9jYWwpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRpZiAobWV0YS5ub3ZlbFt2XSlcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRmaWxlbmFtZSA9IG1ldGEubm92ZWxbdl07XG5cdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGVsc2UgaWYgKG1ldGEubm92ZWwudGl0bGVfemgpXG5cdFx0XHR7XG5cdFx0XHRcdGZpbGVuYW1lID0gbWV0YS5ub3ZlbC50aXRsZV96aDtcblx0XHRcdH1cblx0XHRcdGVsc2UgaWYgKG1ldGEubm92ZWwudGl0bGVfc2hvcnQpXG5cdFx0XHR7XG5cdFx0XHRcdGZpbGVuYW1lID0gbWV0YS5ub3ZlbC50aXRsZV9zaG9ydDtcblx0XHRcdH1cblx0XHRcdGVsc2UgaWYgKG1ldGEubm92ZWwudGl0bGVfdHcpXG5cdFx0XHR7XG5cdFx0XHRcdGZpbGVuYW1lID0gbWV0YS5ub3ZlbC50aXRsZV90dztcblx0XHRcdH1cblx0XHRcdGVsc2UgaWYgKHR5cGVvZiBvcHRpb25zLmZpbGVuYW1lTG9jYWwgPT0gJ3N0cmluZycpXG5cdFx0XHR7XG5cdFx0XHRcdGZpbGVuYW1lID0gb3B0aW9ucy5maWxlbmFtZUxvY2FsO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdGNvbnN0IGJhc2VuYW1lID0gZmlsZW5hbWU7XG5cblx0bGV0IGV4dCA9IEVwdWJNYWtlci5kZWZhdWx0RXh0O1xuXG5cdGxldCBub3cgPSBtb21lbnQoKTtcblxuXHRpZiAob3B0aW9ucy5wYWRFbmREYXRlKVxuXHR7XG5cdFx0ZmlsZW5hbWUgKz0gJ18nICsgbm93LmZvcm1hdCgnWVlZWU1NRERfSEhtbXNzJyk7XG5cdH1cblxuXHRmaWxlbmFtZSArPSBleHQ7XG5cblx0bGV0IGZpbGUgPSBwYXRoLmpvaW4ob3B0aW9ucy5vdXRwdXRQYXRoLCBmaWxlbmFtZSk7XG5cblx0cmV0dXJuIHtcblx0XHRmaWxlLFxuXHRcdGV4dCxcblx0XHRmaWxlbmFtZSxcblx0XHRvcHRpb25zLFxuXHRcdG5vdyxcblx0XHRiYXNlbmFtZSxcblx0XHRlcHViLFxuXHRcdG1ldGEsXG5cdH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgY3JlYXRlO1xuIl19