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
        let titles = node_novel_info_1.getNovelTitleFromMeta(meta);
        if (titles && titles.length) {
            epub.addTitles(titles);
        }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHh0MmVwdWIzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidHh0MmVwdWIzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7R0FFRzs7QUFHSCxtREFBdUQ7QUFDdkQsK0JBQStCO0FBQy9CLDZDQUEwRDtBQUMxRCxvQ0FBcUM7QUFDckMsK0JBQStCO0FBRS9CLGlDQUFpQztBQUNqQyxpREFBaUQ7QUFDakQscURBQTRGO0FBQzVGLGlDQUFrQztBQUNsQyxtREFBc0Q7QUFDdEQsNENBQTRDO0FBQzVDLHFEQUF3RDtBQUN4RCwrQ0FBdUM7QUFDdkMsbURBQXNDO0FBRXpCLFFBQUEsT0FBTyxHQUFHLElBQUksc0JBQU8sQ0FBQyxJQUFJLEVBQUU7SUFDeEMsT0FBTyxFQUFFLElBQUk7SUFDYixjQUFjLEVBQUU7UUFDZixNQUFNLEVBQUUsSUFBSTtLQUNaO0lBQ0QsWUFBWSxFQUFFO1FBQ2IsT0FBTyxFQUFFLElBQUk7S0FDYjtDQUNELENBQUMsQ0FBQztBQUVILGVBQU8sQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDO0FBaUNmLFFBQUEsY0FBYyxHQUFzQixNQUFNLENBQUMsTUFBTSxDQUFDO0lBQzlELFlBQVksRUFBRSxZQUFZO0lBQzFCLFlBQVksRUFBRSxJQUFJO0lBQ2xCLG1CQUFtQjtJQUVuQixhQUFhLEVBQUU7UUFDZCxVQUFVLEVBQUUsSUFBSTtRQUNoQix5QkFBeUIsRUFBRSxJQUFJO0tBQy9CO0NBQ0QsQ0FBQyxDQUFDO0FBRUgsU0FBZ0IsWUFBWSxDQUFDLE9BQWlCLEVBQUUsS0FBSyxHQUFHLEVBQUU7SUFFekQsT0FBTyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUMsSUFBSSxDQUFDLEtBQUs7UUFFbEMsSUFBSSxJQUFpQixDQUFDO1FBQ3RCLElBQUksUUFBZ0IsQ0FBQztRQUVyQixJQUFJLE9BQU8sQ0FBQyxTQUFTLElBQUksT0FBTyxPQUFPLENBQUMsU0FBUyxJQUFJLFFBQVEsRUFDN0Q7WUFDQyxJQUFJLEdBQUcsT0FBTyxD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LENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQzthQUNsQztpQkFDSSxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUM1QjtnQkFDQyxRQUFRLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUM7YUFDL0I7aUJBQ0ksSUFBSSxPQUFPLE9BQU8sQ0FBQyxhQUFhLElBQUksUUFBUSxFQUNqRDtnQkFDQyxRQUFRLEdBQUcsT0FBTyxDQUFDLGFBQWEsQ0FBQzthQUNqQztTQUNEO0tBQ0Q7SUFFRCxNQUFNLFFBQVEsR0FBRyxRQUFRLENBQUM7SUFFMUIsSUFBSSxHQUFHLEdBQUcscUJBQVMsQ0FBQyxVQUFVLENBQUM7SUFFL0IsSUFBSSxHQUFHLEdBQUcsTUFBTSxFQUFFLENBQUM7SUFFbkIsSUFBSSxPQUFPLENBQUMsVUFBVSxFQUN0QjtRQUNDLFFBQVEsSUFBSSxHQUFHLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0tBQ2hEO0lBRUQsUUFBUSxJQUFJLEdBQUcsQ0FBQztJQUVoQixJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFFbkQsT0FBTztRQUNOLElBQUk7UUFDSixHQUFHO1FBQ0gsUUFBUTtRQUNSLE9BQU87UUFDUCxHQUFHO1FBQ0gsUUFBUTtRQUNSLElBQUk7UUFDSixJQUFJO0tBQ0osQ0FBQTtBQUNGLENBQUM7QUF2RUQsb0NBdUVDO0FBRUQsa0JBQWUsTUFBTSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDcmVhdGVkIGJ5IHVzZXIgb24gMjAxNy8xMi8xNi8wMTYuXG4gKi9cblxuaW1wb3J0IHsgSVNlY3Rpb25Db250ZW50IH0gZnJvbSAnZXB1Yi1tYWtlcjIvc3JjL2luZGV4JztcbmltcG9ydCB7IGh0bWxQcmVmYWNlIH0gZnJvbSAnZXB1Yi1tYWtlcjIvc3JjL2xpYi91dGlsJztcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzLWljb252JztcbmltcG9ydCBFcHViTWFrZXIsIHsgaGFzaFN1bSwgc2x1Z2lmeSB9IGZyb20gJ2VwdWItbWFrZXIyJztcbmltcG9ydCBQcm9taXNlID0gcmVxdWlyZSgnYmx1ZWJpcmQnKTtcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAndXBhdGgyJztcbmltcG9ydCAqIGFzIFN0clV0aWwgZnJvbSAnc3RyLXV0aWwnO1xuaW1wb3J0ICogYXMgbW9tZW50IGZyb20gJ21vbWVudCc7XG5pbXBvcnQgKiBhcyBub3ZlbEdsb2JieSBmcm9tICdub2RlLW5vdmVsLWdsb2JieSc7XG5pbXBvcnQgeyBtZGNvbmZfcGFyc2UsIElNZGNvbmZNZXRhLCBjaGtJbmZvLCBnZXROb3ZlbFRpdGxlRnJvbU1ldGEgfSBmcm9tICdub2RlLW5vdmVsLWluZm8nO1xuaW1wb3J0IHsgc3BsaXRUeHQgfSBmcm9tICcuL3V0aWwnO1xuaW1wb3J0IHsgY3JlYXRlVVVJRCB9IGZyb20gJ2VwdWItbWFrZXIyL3NyYy9saWIvdXVpZCc7XG5pbXBvcnQgKiBhcyBkZWVwbWVyZ2UgZnJvbSAnZGVlcG1lcmdlLXBsdXMnO1xuaW1wb3J0IHsgbm9ybWFsaXplX3N0cmlwIH0gZnJvbSAnQG5vZGUtbm92ZWwvbm9ybWFsaXplJztcbmltcG9ydCB7IENvbnNvbGUgfSBmcm9tICdkZWJ1Zy1jb2xvcjInO1xuaW1wb3J0IHsgY3JsZiB9IGZyb20gJ2NybGYtbm9ybWFsaXplJztcblxuZXhwb3J0IGNvbnN0IGNvbnNvbGUgPSBuZXcgQ29uc29sZShudWxsLCB7XG5cdGVuYWJsZWQ6IHRydWUsXG5cdGluc3BlY3RPcHRpb25zOiB7XG5cdFx0Y29sb3JzOiB0cnVlLFxuXHR9LFxuXHRjaGFsa09wdGlvbnM6IHtcblx0XHRlbmFibGVkOiB0cnVlLFxuXHR9LFxufSk7XG5cbmNvbnNvbGUuZW5hYmxlZENvbG9yID0gdHJ1ZTtcblxuZXhwb3J0IGludGVyZmFjZSBJT3B0aW9uc1xue1xuXHQvKipcblx0ICog5bCP6KqqIHR4dCDnmoTkuLvos4fmlpnlpL7ot6/lvpFcblx0ICogQHR5cGUge3N0cmluZ31cblx0ICovXG5cdGlucHV0UGF0aDogc3RyaW5nLFxuXHRvdXRwdXRQYXRoOiBzdHJpbmcsXG5cblx0LyoqXG5cdCAqIOWwj+iqquWQjeeosUlEXG5cdCAqL1xuXHRub3ZlbElEPzogc3RyaW5nLFxuXHRmaWxlbmFtZT86IHN0cmluZyxcblxuXHRub3ZlbENvbmY/LFxuXG5cdGVwdWJUZW1wbGF0ZT8sXG5cblx0ZXB1Ykxhbmd1YWdlPzogc3RyaW5nLFxuXG5cdHBhZEVuZERhdGU/OiBib29sZWFuLFxuXG5cdGdsb2JieU9wdGlvbnM/OiBub3ZlbEdsb2JieS5JT3B0aW9ucyxcblxuXHR1c2VUaXRsZT86IGJvb2xlYW4sXG5cdGZpbGVuYW1lTG9jYWw/OiBib29sZWFuIHwgc3RyaW5nW10gfCBzdHJpbmcsXG5cblx0bm9Mb2c/OiBib29sZWFuLFxufVxuXG5leHBvcnQgY29uc3QgZGVmYXVsdE9wdGlvbnM6IFBhcnRpYWw8SU9wdGlvbnM+ID0gT2JqZWN0LmZyZWV6ZSh7XG5cdGVwdWJUZW1wbGF0ZTogJ2xpZ2h0bm92ZWwnLFxuXHRlcHViTGFuZ3VhZ2U6ICd6aCcsXG5cdC8vcGFkRW5kRGF0ZTogdHJ1ZSxcblxuXHRnbG9iYnlPcHRpb25zOiB7XG5cdFx0Y2hlY2tSb21hbjogdHJ1ZSxcblx0XHR1c2VEZWZhdWx0UGF0dGVybnNFeGNsdWRlOiB0cnVlLFxuXHR9LFxufSk7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXROb3ZlbENvbmYob3B0aW9uczogSU9wdGlvbnMsIGNhY2hlID0ge30pOiBQcm9taXNlPElNZGNvbmZNZXRhPlxue1xuXHRyZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCkudGhlbihhc3luYyBmdW5jdGlvbiAoKVxuXHR7XG5cdFx0bGV0IG1ldGE6IElNZGNvbmZNZXRhO1xuXHRcdGxldCBjb25mUGF0aDogc3RyaW5nO1xuXG5cdFx0aWYgKG9wdGlvbnMubm92ZWxDb25mICYmIHR5cGVvZiBvcHRpb25zLm5vdmVsQ29uZiA9PSAnb2JqZWN0Jylcblx0XHR7XG5cdFx0XHRtZXRhID0gb3B0aW9ucy5ub3ZlbENvbmY7XG5cdFx0fVxuXHRcdGVsc2Vcblx0XHR7XG5cdFx0XHRpZiAodHlwZW9mIG9wdGlvbnMubm92ZWxDb25mID09ICdzdHJpbmcnKVxuXHRcdFx0e1xuXHRcdFx0XHRjb25mUGF0aCA9IG9wdGlvbnMubm92ZWxDb25mO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZVxuXHRcdFx0e1xuXHRcdFx0XHRjb25mUGF0aCA9IG9wdGlvbnMuaW5wdXRQYXRoO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZnMuZXhpc3RzU3luYyhwYXRoLmpvaW4oY29uZlBhdGgsICdtZXRhLm1kJykpKVxuXHRcdFx0e1xuXHRcdFx0XHRsZXQgZmlsZSA9IHBhdGguam9pbihjb25mUGF0aCwgJ21ldGEubWQnKTtcblxuXHRcdFx0XHRtZXRhID0gYXdhaXQgZnMucmVhZEZpbGUoZmlsZSlcblx0XHRcdFx0XHQudGhlbihtZGNvbmZfcGFyc2UpXG5cdFx0XHRcdDtcblx0XHRcdH1cblx0XHRcdGVsc2UgaWYgKGZzLmV4aXN0c1N5bmMocGF0aC5qb2luKGNvbmZQYXRoLCAnUkVBRE1FLm1kJykpKVxuXHRcdFx0e1xuXHRcdFx0XHRsZXQgZmlsZSA9IHBhdGguam9pbihjb25mUGF0aCwgJ1JFQURNRS5tZCcpO1xuXG5cdFx0XHRcdG1ldGEgPSBhd2FpdCBmcy5yZWFkRmlsZShmaWxlKVxuXHRcdFx0XHRcdC50aGVuKG1kY29uZl9wYXJzZSlcblx0XHRcdFx0O1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdG1ldGEgPSBjaGtJbmZvKG1ldGEpO1xuXG5cdFx0aWYgKCFtZXRhIHx8ICFtZXRhLm5vdmVsIHx8ICFtZXRhLm5vdmVsLnRpdGxlKVxuXHRcdHtcblx0XHRcdHRocm93IG5ldyBFcnJvcihgbm90IGEgdmFsaWQgbm92ZWxJbmZvIGRhdGFgKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gbWV0YTtcblx0fSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1ha2VPcHRpb25zKG9wdGlvbnM6IElPcHRpb25zKVxue1xuXHRvcHRpb25zID0gT2JqZWN0LmtleXMob3B0aW9ucylcblx0XHQuZmlsdGVyKHYgPT4gdHlwZW9mIG9wdGlvbnNbdl0gIT0gJ3VuZGVmaW5lZCcpXG5cdFx0LnJlZHVjZShmdW5jdGlvbiAoYSwgYilcblx0XHR7XG5cdFx0XHRhW2JdID0gb3B0aW9uc1tiXTtcblxuXHRcdFx0cmV0dXJuIGFcblx0XHR9LCB7fSBhcyBJT3B0aW9ucylcblx0O1xuXG5cdHJldHVybiBvcHRpb25zID0gZGVlcG1lcmdlLmFsbChbe30sIGRlZmF1bHRPcHRpb25zLCBvcHRpb25zXSk7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSU5vdmVsRXB1YlJldHVybkluZm9cbntcblx0ZmlsZTogc3RyaW5nLFxuXHRmaWxlbmFtZTogc3RyaW5nLFxuXHRlcHViOiBFcHViTWFrZXIsXG5cblx0b3V0cHV0UGF0aDogc3RyaW5nLFxuXHRiYXNlbmFtZTogc3RyaW5nLFxuXHRleHQ6IHN0cmluZyxcblxuXHRzdGF0OiB7XG5cdFx0dm9sdW1lOiBudW1iZXIsXG5cdFx0Y2hhcHRlcjogbnVtYmVyLFxuXHRcdGltYWdlOiBudW1iZXIsXG5cdH0sXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGUob3B0aW9uczogSU9wdGlvbnMsIGNhY2hlID0ge30pOiBQcm9taXNlPElOb3ZlbEVwdWJSZXR1cm5JbmZvPlxue1xuXHRyZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCkudGhlbihhc3luYyBmdW5jdGlvbiAoKVxuXHR7XG5cdFx0Ly9jb25zb2xlLmxvZyhvcHRpb25zLCBkZWZhdWx0T3B0aW9ucyk7XG5cblx0XHRvcHRpb25zID0gbWFrZU9wdGlvbnMob3B0aW9ucyk7XG5cblx0XHQvL2NvbnNvbGUuZGlyKG9wdGlvbnMsIHtjb2xvcnM6IHRydWV9KTtcblxuXHRcdGxldCBub3ZlbElEID0gb3B0aW9ucy5ub3ZlbElEO1xuXHRcdGxldCBUWFRfUEFUSCA9IG9wdGlvbnMuaW5wdXRQYXRoO1xuXG5cdFx0bGV0IG1ldGEgPSBhd2FpdCBnZXROb3ZlbENvbmYob3B0aW9ucywgY2FjaGUpO1xuXG5cdFx0bGV0IGdsb2JieV9wYXR0ZXJuczogc3RyaW5nW107XG5cdFx0bGV0IGdsb2JieV9vcHRpb25zOiBub3ZlbEdsb2JieS5JT3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe30sIG9wdGlvbnMuZ2xvYmJ5T3B0aW9ucywge1xuXHRcdFx0Y3dkOiBUWFRfUEFUSCxcblx0XHRcdC8vdXNlRGVmYXVsdFBhdHRlcm5zRXhjbHVkZTogdHJ1ZSxcblx0XHRcdC8vY2hlY2tSb21hbjogdHJ1ZSxcblx0XHR9KTtcblxuXHRcdHtcblx0XHRcdFtnbG9iYnlfcGF0dGVybnMsIGdsb2JieV9vcHRpb25zXSA9IG5vdmVsR2xvYmJ5LmdldE9wdGlvbnMoZ2xvYmJ5X29wdGlvbnMpO1xuXHRcdH1cblxuXHRcdC8vY29uc29sZS5sb2cob3B0aW9ucywgZ2xvYmJ5X29wdGlvbnMpO1xuXG5cdFx0Ly9jb25zb2xlLmRpcihvcHRpb25zKTtcblxuXHRcdGNvbnNvbGUuaW5mbyhtZXRhLm5vdmVsLnRpdGxlKTtcblx0XHQvL2NvbnNvbGUubG9nKG1ldGEubm92ZWwucHJlZmFjZSk7XG5cblx0XHRsZXQgZXB1YjogRXB1Yk1ha2VyID0gbmV3IEVwdWJNYWtlcigpXG5cdFx0XHQud2l0aFRlbXBsYXRlKG9wdGlvbnMuZXB1YlRlbXBsYXRlKVxuXHRcdFx0LndpdGhMYW5ndWFnZShvcHRpb25zLmVwdWJMYW5ndWFnZSlcblx0XHRcdC53aXRoVXVpZChjcmVhdGVVVUlEKGhhc2hTdW0oW1xuXHRcdFx0XHRtZXRhLm5vdmVsLnRpdGxlLFxuXHRcdFx0XHRtZXRhLm5vdmVsLmF1dGhvcixcblx0XHRcdF0pKSlcblx0XHRcdC53aXRoVGl0bGUobWV0YS5ub3ZlbC50aXRsZSwgbWV0YS5ub3ZlbC50aXRsZV9zaG9ydCB8fCBtZXRhLm5vdmVsLnRpdGxlX3poKVxuXHRcdFx0LndpdGhBdXRob3IobWV0YS5ub3ZlbC5hdXRob3IpXG5cdFx0XHQuYWRkQXV0aG9yKG1ldGEubm92ZWwuYXV0aG9yKVxuXHRcdFx0LndpdGhDb2xsZWN0aW9uKHtcblx0XHRcdFx0bmFtZTogbWV0YS5ub3ZlbC50aXRsZSxcblx0XHRcdH0pXG5cdFx0XHQud2l0aEluZm9QcmVmYWNlKG1ldGEubm92ZWwucHJlZmFjZSlcblx0XHRcdC5hZGRUYWcobWV0YS5ub3ZlbC50YWdzKVxuXHRcdFx0LmFkZEF1dGhvcihtZXRhLmNvbnRyaWJ1dGUpXG5cdFx0O1xuXG5cdFx0bGV0IHRpdGxlcyA9IGdldE5vdmVsVGl0bGVGcm9tTWV0YShtZXRhKTtcblx0XHRpZiAodGl0bGVzICYmIHRpdGxlcy5sZW5ndGgpXG5cdFx0e1xuXHRcdFx0ZXB1Yi5hZGRUaXRsZXModGl0bGVzKTtcblx0XHR9XG5cblx0XHRpZiAob3B0aW9ucy5maWxlbmFtZSlcblx0XHR7XG5cdFx0XHRlcHViLmVwdWJDb25maWcuZmlsZW5hbWUgPSBvcHRpb25zLmZpbGVuYW1lO1xuXHRcdH1cblxuXHRcdGlmIChtZXRhLm5vdmVsLnNvdXJjZSlcblx0XHR7XG5cdFx0XHRlcHViLmFkZExpbmtzKG1ldGEubm92ZWwuc291cmNlKTtcblx0XHR9XG5cblx0XHRpZiAobWV0YS5ub3ZlbC5zZXJpZXMpXG5cdFx0e1xuXHRcdFx0ZXB1Yi53aXRoU2VyaWVzKG1ldGEubm92ZWwuc2VyaWVzLm5hbWUsIG1ldGEubm92ZWwuc2VyaWVzLnBvc2l0aW9uKTtcblx0XHR9XG5cdFx0ZWxzZVxuXHRcdHtcblx0XHRcdGVwdWIud2l0aFNlcmllcyhtZXRhLm5vdmVsLnRpdGxlKTtcblx0XHR9XG5cblx0XHRpZiAobWV0YS5ub3ZlbC5wdWJsaXNoZXIpXG5cdFx0e1xuXHRcdFx0ZXB1Yi53aXRoUHVibGlzaGVyKG1ldGEubm92ZWwucHVibGlzaGVyIHx8ICdub2RlLW5vdmVsJyk7XG5cdFx0fVxuXG5cdFx0aWYgKG1ldGEubm92ZWwuZGF0ZSlcblx0XHR7XG5cdFx0XHRlcHViLndpdGhNb2RpZmljYXRpb25EYXRlKG1ldGEubm92ZWwuZGF0ZSk7XG5cdFx0fVxuXG5cdFx0aWYgKG1ldGEubm92ZWwuc3RhdHVzKVxuXHRcdHtcblx0XHRcdGVwdWIuYWRkVGFnKG1ldGEubm92ZWwuc3RhdHVzKTtcblx0XHR9XG5cblx0XHRpZiAobWV0YS5ub3ZlbC5jb3Zlcilcblx0XHR7XG5cdFx0XHRlcHViLndpdGhDb3ZlcihtZXRhLm5vdmVsLmNvdmVyKTtcblx0XHR9XG5cdFx0ZWxzZVxuXHRcdHtcblx0XHRcdGF3YWl0IG5vdmVsR2xvYmJ5Lmdsb2JieShbXG5cdFx0XHRcdFx0J2NvdmVyLionLFxuXHRcdFx0XHRdLCBPYmplY3QuYXNzaWduKHt9LCBnbG9iYnlfb3B0aW9ucywge1xuXHRcdFx0XHRcdGFic29sdXRlOiB0cnVlLFxuXHRcdFx0XHR9KSlcblx0XHRcdFx0LnRoZW4obHMgPT5cblx0XHRcdFx0e1xuXHRcdFx0XHRcdGlmIChscy5sZW5ndGgpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0ZXB1Yi53aXRoQ292ZXIobHNbMF0pO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGNvbnNvbGUubG9nKGxzKTtcblx0XHRcdFx0fSlcblx0XHRcdDtcblx0XHR9XG5cblx0XHQvL3Byb2Nlc3MuZXhpdCgpO1xuXG5cdFx0bGV0IHN0YXQ6IElOb3ZlbEVwdWJSZXR1cm5JbmZvW1wic3RhdFwiXSA9IHtcblx0XHRcdHZvbHVtZTogMCxcblx0XHRcdGNoYXB0ZXI6IDAsXG5cdFx0XHRpbWFnZTogMCxcblx0XHR9O1xuXG5cdFx0YXdhaXQgbm92ZWxHbG9iYnlcblx0XHRcdC5nbG9iYnlBU3luYyhnbG9iYnlfcGF0dGVybnMsIGdsb2JieV9vcHRpb25zKVxuXHRcdFx0LnRoZW4oZnVuY3Rpb24gKGxzKVxuXHRcdFx0e1xuXHRcdFx0XHQvL2NvbnNvbGUubG9nKGxzKTtcblxuXHRcdFx0XHQvL3Byb2Nlc3MuZXhpdCgpO1xuXG5cdFx0XHRcdHJldHVybiBscztcblx0XHRcdH0pXG5cdFx0XHQudGhlbihfbHMgPT5cblx0XHRcdHtcblx0XHRcdFx0bGV0IGlkeCA9IDE7XG5cblx0XHRcdFx0bGV0IGNhY2hlVHJlZVNlY3Rpb24gPSB7fSBhcyB7XG5cdFx0XHRcdFx0W2s6IHN0cmluZ106IEVwdWJNYWtlci5TZWN0aW9uLFxuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdGNvbnN0IFN5bUNhY2hlID0gU3ltYm9sKCdjYWNoZScpO1xuXG5cdFx0XHRcdHJldHVybiBQcm9taXNlXG5cdFx0XHRcdFx0Lm1hcFNlcmllcyhPYmplY3Qua2V5cyhfbHMpLCBhc3luYyBmdW5jdGlvbiAodmFsX2Rpcilcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRsZXQgbHMgPSBfbHNbdmFsX2Rpcl07XG5cdFx0XHRcdFx0XHRsZXQgZGlybmFtZSA9IGxzWzBdLnBhdGhfZGlyO1xuXHRcdFx0XHRcdFx0bGV0IHZvbHVtZV90aXRsZSA9IGxzWzBdLnZvbHVtZV90aXRsZTtcblxuXHRcdFx0XHRcdFx0bGV0IHZvbHVtZSA9IGNhY2hlVHJlZVNlY3Rpb25bdmFsX2Rpcl07XG5cblx0XHRcdFx0XHRcdGxldCBfbmV3X3RvcF9sZXZlbDogRXB1Yk1ha2VyLlNlY3Rpb247XG5cblx0XHRcdFx0XHRcdGlmICghY2FjaGVUcmVlU2VjdGlvblt2YWxfZGlyXSlcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0bGV0IF90czIgPSB2b2x1bWVfdGl0bGUuc3BsaXQoJy8nKTtcblx0XHRcdFx0XHRcdFx0bGV0IF90cyA9IHZhbF9kaXIuc3BsaXQoJy8nKTtcblxuXHRcdFx0XHRcdFx0XHRsZXQgX2RzID0gKHBhdGgubm9ybWFsaXplKGRpcm5hbWUpIGFzIHN0cmluZykuc3BsaXQoJy8nKTtcblxuXHRcdFx0XHRcdFx0XHRsZXQgX2xhc3Q6IEVwdWJNYWtlci5TZWN0aW9uO1xuXG5cdFx0XHRcdFx0XHRcdGZvciAobGV0IGkgPSAwOyBpIDwgX3RzLmxlbmd0aDsgaSsrKVxuXHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0bGV0IF9uYXZzID0gX3RzLnNsaWNlKDAsIGkgKyAxKTtcblx0XHRcdFx0XHRcdFx0XHRsZXQgX25hdiA9IF9uYXZzLmpvaW4oJy8nKTtcblxuXHRcdFx0XHRcdFx0XHRcdGxldCBfbmF2X2RpciA9IF9kcy5zbGljZSgwLCBfZHMubGVuZ3RoIC0gX3RzLmxlbmd0aCArIGkgKyAxKS5qb2luKCcvJyk7XG5cblx0XHRcdFx0XHRcdFx0XHQvKlxuXHRcdFx0XHRcdFx0XHRcdGNvbnNvbGUuZGlyKHtcblx0XHRcdFx0XHRcdFx0XHRcdF9uYXZzLFxuXHRcdFx0XHRcdFx0XHRcdFx0X25hdixcblx0XHRcdFx0XHRcdFx0XHRcdF9uYXZfZGlyLFxuXHRcdFx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdFx0XHRcdCovXG5cblx0XHRcdFx0XHRcdFx0XHRpZiAoIWNhY2hlVHJlZVNlY3Rpb25bX25hdl0pXG5cdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0bGV0IHZpZCA9IGB2b2x1bWUkeyhpZHgrKykudG9TdHJpbmcoKS5wYWRTdGFydCg2LCAnMCcpfWA7XG5cblx0XHRcdFx0XHRcdFx0XHRcdGxldCB0aXRsZSA9IG5vcm1hbGl6ZV9zdHJpcChfdHMyW2ldLCB0cnVlKTtcblxuXHRcdFx0XHRcdFx0XHRcdFx0Y2FjaGVUcmVlU2VjdGlvbltfbmF2XSA9IG5ldyBFcHViTWFrZXIuU2VjdGlvbignYXV0by10b2MnLCB2aWQsIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0dGl0bGU6IHRpdGxlLFxuXHRcdFx0XHRcdFx0XHRcdFx0fSwgZmFsc2UsIHRydWUpO1xuXG5cdFx0XHRcdFx0XHRcdFx0XHRjYWNoZVRyZWVTZWN0aW9uW19uYXZdW1N5bUNhY2hlXSA9IGNhY2hlVHJlZVNlY3Rpb25bX25hdl1bU3ltQ2FjaGVdIHx8IHt9O1xuXG5cdFx0XHRcdFx0XHRcdFx0XHRpZiAoaSA9PSAwKVxuXHRcdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0XHQvL2VwdWIud2l0aFNlY3Rpb24oY2FjaGVUcmVlU2VjdGlvbltfbmF2XSk7XG5cblx0XHRcdFx0XHRcdFx0XHRcdFx0X25ld190b3BfbGV2ZWwgPSBjYWNoZVRyZWVTZWN0aW9uW19uYXZdO1xuXHRcdFx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdFx0XHRzdGF0LnZvbHVtZSsrO1xuXG5cdFx0XHRcdFx0XHRcdFx0XHRhd2FpdCBfaGFuZGxlVm9sdW1lKGNhY2hlVHJlZVNlY3Rpb25bX25hdl0sIF9uYXZfZGlyKVxuXHRcdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRcdGlmIChfbGFzdClcblx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRfbGFzdC53aXRoU3ViU2VjdGlvbihjYWNoZVRyZWVTZWN0aW9uW19uYXZdKVxuXHRcdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRcdF9sYXN0ID0gY2FjaGVUcmVlU2VjdGlvbltfbmF2XTtcblx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdHZvbHVtZSA9IGNhY2hlVHJlZVNlY3Rpb25bdmFsX2Rpcl07XG5cbi8vXHRcdFx0XHRcdFx0XHRjb25zb2xlLmRpcih7XG4vL1x0XHRcdFx0XHRcdFx0XHRjYWNoZVRyZWVTZWN0aW9uLFxuLy9cdFx0XHRcdFx0XHRcdFx0dm9sdW1lLFxuLy9cdFx0XHRcdFx0XHRcdH0sIHtcbi8vXHRcdFx0XHRcdFx0XHRcdGRlcHRoOiA1LFxuLy9cdFx0XHRcdFx0XHRcdFx0Y29sb3JzOiB0cnVlLFxuLy9cdFx0XHRcdFx0XHRcdH0pO1xuLy9cdFx0XHRcdFx0XHRcdHByb2Nlc3MuZXhpdCgpXG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdGxldCB2aWQ6IHN0cmluZyA9IHZvbHVtZS5pZDtcblxuXHRcdFx0XHRcdFx0YXdhaXQgX2hhbmRsZVZvbHVtZSh2b2x1bWUsIGRpcm5hbWUpXG5cblx0XHRcdFx0XHRcdGFzeW5jIGZ1bmN0aW9uIF9oYW5kbGVWb2x1bWUodm9sdW1lOiBFcHViTWFrZXIuU2VjdGlvbiwgZGlybmFtZTogc3RyaW5nKVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRsZXQgdmlkOiBzdHJpbmcgPSB2b2x1bWUuaWQ7XG5cblx0XHRcdFx0XHRcdFx0aWYgKCF2b2x1bWVbU3ltQ2FjaGVdLmNvdmVyKVxuXHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0dm9sdW1lW1N5bUNhY2hlXS5jb3ZlciA9IHRydWU7XG5cblx0XHRcdFx0XHRcdFx0XHRsZXQgZmlsZSA9IHBhdGguam9pbihkaXJuYW1lLCAnUkVBRE1FLm1kJyk7XG5cdFx0XHRcdFx0XHRcdFx0bGV0IG1ldGEgPSBhd2FpdCBmcy5yZWFkRmlsZShmaWxlKVxuXHRcdFx0XHRcdFx0XHRcdFx0LnRoZW4oZnVuY3Rpb24gKGRhdGEpXG5cdFx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdHJldHVybiBtZGNvbmZfcGFyc2UoZGF0YSwge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdC8vIOeVtuaykuacieWMheWQq+W/heimgeeahOWFp+WuueaZguS4jeeUoueUn+mMr+iqpFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdHRocm93OiBmYWxzZSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHQvLyDlhYHoqLHkuI3mqJnmupbnmoQgaW5mbyDlhaflrrlcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRsb3dDaGVja0xldmVsOiB0cnVlLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHRcdFx0XHQuY2F0Y2goZnVuY3Rpb24gKClcblx0XHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0cmV0dXJuIG51bGw7XG5cdFx0XHRcdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0XHRcdDtcblxuXHRcdFx0XHRcdFx0XHRcdC8vY29uc29sZS5sb2coZmlsZSwgbWV0YSk7XG5cblx0XHRcdFx0XHRcdFx0XHRhd2FpdCBub3ZlbEdsb2JieS5nbG9iYnkoW1xuXHRcdFx0XHRcdFx0XHRcdFx0XHQnY292ZXIuKicsXG5cdFx0XHRcdFx0XHRcdFx0XHRdLCB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdGN3ZDogZGlybmFtZSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0YWJzb2x1dGU6IHRydWUsXG5cdFx0XHRcdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0XHRcdFx0LnRoZW4oYXN5bmMgKGxzKSA9PlxuXHRcdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRpZiAobHMubGVuZ3RoKVxuXHRcdFx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0bGV0IGV4dCA9IHBhdGguZXh0bmFtZShsc1swXSk7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0bGV0IG5hbWUgPSBgJHt2aWR9LWNvdmVyJHtleHR9YDtcblxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdGVwdWIud2l0aEFkZGl0aW9uYWxGaWxlKGxzWzBdLCBudWxsLCBuYW1lKTtcblxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdHJldHVybiBuYW1lO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0XHRcdGVsc2UgaWYgKGZzLmV4aXN0c1N5bmMoZmlsZSkpXG5cdFx0XHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRpZiAobWV0YSAmJiBtZXRhLm5vdmVsKVxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGlmIChtZXRhLm5vdmVsLmNvdmVyKVxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRsZXQgZXh0ID0gJy5wbmcnO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRsZXQgYmFzZW5hbWUgPSBgJHt2aWR9LWNvdmVyYDtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0bGV0IG5hbWUgPSBgJHtiYXNlbmFtZX0ke2V4dH1gO1xuXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGxldCBkYXRhID0gdHlwZW9mIG1ldGEubm92ZWwuY292ZXIgPT09ICdzdHJpbmcnID8ge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdHVybDogbWV0YS5ub3ZlbC5jb3Zlcixcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0fSA6IG1ldGEubm92ZWwuY292ZXI7XG5cblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0ZGF0YS5leHQgPSBudWxsO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRkYXRhLmJhc2VuYW1lID0gYmFzZW5hbWU7XG5cblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0ZXB1Yi53aXRoQWRkaXRpb25hbEZpbGUoZGF0YSwgbnVsbCwgbmFtZSk7XG5cblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0cmV0dXJuIG5hbWU7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0XHRcdFx0LnRoZW4oZnVuY3Rpb24gKG5hbWUpXG5cdFx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdGxldCBfb2sgPSBmYWxzZTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0bGV0IGRhdGE6IElTZWN0aW9uQ29udGVudCA9IHt9O1xuXG5cdFx0XHRcdFx0XHRcdFx0XHRcdGlmIChuYW1lKVxuXHRcdFx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0X29rID0gdHJ1ZTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRkYXRhLmNvdmVyID0ge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0bmFtZSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHR9O1xuXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0c3RhdC5pbWFnZSArPSAxO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0XHRcdFx0aWYgKG1ldGEgJiYgbWV0YS5ub3ZlbClcblx0XHRcdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdGlmIChtZXRhLm5vdmVsLnByZWZhY2UpXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0X29rID0gdHJ1ZTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdC8vZGF0YS5jb250ZW50ID0gY3JsZihtZXRhLm5vdmVsLnByZWZhY2UpO1xuXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRkYXRhLmNvbnRlbnQgPSBodG1sUHJlZmFjZSh7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGluZm9QcmVmYWNlOiBtZXRhLm5vdmVsLnByZWZhY2UsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHR9KS5pbmZvUHJlZmFjZUhUTUw7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0XHRcdFx0Ly9jb25zb2xlLmxvZyhuYW1lLCBfb2spO1xuXG5cdFx0XHRcdFx0XHRcdFx0XHRcdGlmIChfb2spXG5cdFx0XHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gZGF0YVxuXHRcdFx0XHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0XHRcdFx0cmV0dXJuIG51bGxcblx0XHRcdFx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHRcdFx0XHQudGhlbihmdW5jdGlvbiAoZGF0YSlcblx0XHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0aWYgKGRhdGEpXG5cdFx0XHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKHZvbHVtZSk7XG5cblx0XHRcdFx0XHRcdFx0XHRcdFx0XHR2b2x1bWUuc2V0Q29udGVudChkYXRhLCB0cnVlKTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdFx0XHQ7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0Ly9jb25zb2xlLmxvZyhkaXJuYW1lKTtcblxuXHRcdFx0XHRcdFx0Ly92b2x1bWUud2l0aFN1YlNlY3Rpb24obmV3IEVwdWJNYWtlci5TZWN0aW9uKCdhdXRvLXRvYycsIG51bGwsIG51bGwsIGZhbHNlLCBmYWxzZSkpO1xuXG5cdFx0XHRcdFx0XHRhd2FpdCBQcm9taXNlLm1hcFNlcmllcyhscywgYXN5bmMgZnVuY3Rpb24gKHJvdylcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0Ly9jb25zb2xlLmxvZyhmaWxlbmFtZSk7XG5cblx0XHRcdFx0XHRcdFx0Ly9sZXQgZGF0YSA9IGF3YWl0IGZzLnJlYWRGaWxlKHBhdGguam9pbihUWFRfUEFUSCwgZGlybmFtZSwgZmlsZW5hbWUpKTtcblx0XHRcdFx0XHRcdFx0bGV0IGRhdGE6IHN0cmluZyB8IEJ1ZmZlciA9IGF3YWl0IGZzLnJlYWRGaWxlKHJvdy5wYXRoKTtcblxuXHRcdFx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKGRhdGEpO1xuXG5cdFx0XHRcdFx0XHRcdGlmIChyb3cuZXh0ID09ICcudHh0Jylcblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdGRhdGEgPSBzcGxpdFR4dChkYXRhLnRvU3RyaW5nKCkpO1xuXHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0aWYgKEJ1ZmZlci5pc0J1ZmZlcihkYXRhKSlcblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdGRhdGEgPSBkYXRhLnRvU3RyaW5nKCk7XG5cdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRsZXQgbmFtZSA9IHJvdy5jaGFwdGVyX3RpdGxlO1xuXG5cdFx0XHRcdFx0XHRcdGlmICghb3B0aW9ucy5ub0xvZylcblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdGxldCB7XG5cdFx0XHRcdFx0XHRcdFx0XHRzb3VyY2VfaWR4LFxuXHRcdFx0XHRcdFx0XHRcdFx0dm9sdW1lX3RpdGxlLFxuXHRcdFx0XHRcdFx0XHRcdFx0Y2hhcHRlcl90aXRsZSxcblx0XHRcdFx0XHRcdFx0XHRcdGRpcixcblx0XHRcdFx0XHRcdFx0XHRcdGZpbGUsXG5cdFx0XHRcdFx0XHRcdFx0fSA9IHJvdztcblxuXHRcdFx0XHRcdFx0XHRcdGNvbnNvbGUuZGlyKHtcblx0XHRcdFx0XHRcdFx0XHRcdHNvdXJjZV9pZHgsXG5cdFx0XHRcdFx0XHRcdFx0XHR2b2x1bWVfdGl0bGUsXG5cdFx0XHRcdFx0XHRcdFx0XHRjaGFwdGVyX3RpdGxlLFxuXHRcdFx0XHRcdFx0XHRcdFx0ZGlyLFxuXHRcdFx0XHRcdFx0XHRcdFx0ZmlsZSxcblx0XHRcdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdGxldCBjaGFwdGVyID0gbmV3IEVwdWJNYWtlci5TZWN0aW9uKCdjaGFwdGVyJywgYGNoYXB0ZXIkeyhpZHgrKykudG9TdHJpbmcoKVxuXHRcdFx0XHRcdFx0XHRcdC5wYWRTdGFydCg0LCAnMCcpfWAsIHtcblx0XHRcdFx0XHRcdFx0XHR0aXRsZTogbmFtZSxcblx0XHRcdFx0XHRcdFx0XHRjb250ZW50OiBjcmxmKGRhdGEpLFxuXHRcdFx0XHRcdFx0XHR9LCB0cnVlLCBmYWxzZSk7XG5cblx0XHRcdFx0XHRcdFx0c3RhdC5jaGFwdGVyKys7XG5cblx0XHRcdFx0XHRcdFx0dm9sdW1lLndpdGhTdWJTZWN0aW9uKGNoYXB0ZXIpO1xuXHRcdFx0XHRcdFx0fSk7XG5cblx0XHRcdFx0XHRcdGlmICghdm9sdW1lW1N5bUNhY2hlXS5pbWFnZSlcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0dm9sdW1lW1N5bUNhY2hlXS5pbWFnZSA9IHRydWU7XG5cblx0XHRcdFx0XHRcdFx0YXdhaXQgbm92ZWxHbG9iYnkuZ2xvYmJ5KFtcblx0XHRcdFx0XHRcdFx0XHRcdCcqLntqcGcsZ2lmLHBuZyxqcGVnLHN2Z30nLFxuXHRcdFx0XHRcdFx0XHRcdFx0J2ltYWdlLyoue2pwZyxnaWYscG5nLGpwZWcsc3ZnfScsXG5cdFx0XHRcdFx0XHRcdFx0XHQnaW1hZ2VzLyoue2pwZyxnaWYscG5nLGpwZWcsc3ZnfScsXG5cdFx0XHRcdFx0XHRcdFx0XHQnIWNvdmVyLionLFxuXHRcdFx0XHRcdFx0XHRcdFx0JyEqLnR4dCcsXG5cdFx0XHRcdFx0XHRcdFx0XSwge1xuXHRcdFx0XHRcdFx0XHRcdFx0Y3dkOiBkaXJuYW1lLFxuXHRcdFx0XHRcdFx0XHRcdFx0YWJzb2x1dGU6IHRydWUsXG5cdFx0XHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdFx0XHQudGhlbihscyA9PlxuXHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdGxldCBhcnIgPSBbXTtcblxuXHRcdFx0XHRcdFx0XHRcdFx0Zm9yIChsZXQgaSBpbiBscylcblx0XHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0bGV0IGltZyA9IGxzW2ldO1xuXG5cdFx0XHRcdFx0XHRcdFx0XHRcdGxldCBleHQgPSBwYXRoLmV4dG5hbWUoaW1nKTtcblxuXHRcdFx0XHRcdFx0XHRcdFx0XHRsZXQgYmFzZW5hbWUgPSBwYXRoLmJhc2VuYW1lKGltZywgZXh0KTtcblxuXHRcdFx0XHRcdFx0XHRcdFx0XHQvLyBAdHMtaWdub3JlXG5cdFx0XHRcdFx0XHRcdFx0XHRcdGxldCBuYW1lID0gc2x1Z2lmeShiYXNlbmFtZSk7XG5cblx0XHRcdFx0XHRcdFx0XHRcdFx0aWYgKCFuYW1lIHx8IGFyci5pbmNsdWRlcyhuYW1lKSlcblx0XHRcdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdG5hbWUgPSBoYXNoU3VtKFtpbWcsIGksIG5hbWVdKTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdFx0XHRcdC8vbmFtZSA9IGAke3ZpZH0vJHtpfS1gICsgbmFtZSArIGV4dDtcblx0XHRcdFx0XHRcdFx0XHRcdFx0bmFtZSA9IGAke3ZpZH0vYCArIG5hbWUgKyBleHQ7XG5cblx0XHRcdFx0XHRcdFx0XHRcdFx0YXJyLnB1c2goJ2ltYWdlLycgKyBuYW1lKTtcblxuXHRcdFx0XHRcdFx0XHRcdFx0XHRlcHViLndpdGhBZGRpdGlvbmFsRmlsZShpbWcsICdpbWFnZScsIG5hbWUpO1xuXHRcdFx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdFx0XHRpZiAoYXJyLmxlbmd0aClcblx0XHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0aWYgKHZvbHVtZS5jb250ZW50ICYmIHZvbHVtZS5jb250ZW50LmNvdmVyICYmIHZvbHVtZS5jb250ZW50LmNvdmVyLm5hbWUpXG5cdFx0XHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRhcnIudW5zaGlmdCh2b2x1bWUuY29udGVudC5jb3Zlci5uYW1lKTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdFx0XHRcdGxldCBjaGFwdGVyID0gbmV3IEVwdWJNYWtlci5TZWN0aW9uKCdub24tc3BlY2lmaWMgYmFja21hdHRlcicsIGBpbWFnZSR7KGlkeCsrKS50b1N0cmluZygpXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0LnBhZFN0YXJ0KDQsICcwJyl9YCwge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdHRpdGxlOiAn5o+S5ZyWJyxcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRjb250ZW50OiBhcnIucmVkdWNlKGZ1bmN0aW9uIChhLCBiKVxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGxldCBodG1sID0gYDxmaWd1cmUgY2xhc3M9XCJmdWxscGFnZSBJbWFnZUNvbnRhaW5lciBwYWdlLWJyZWFrLWJlZm9yZVwiPjxpbWcgaWQ9XCJDb3ZlckltYWdlXCIgY2xhc3M9XCJDb3ZlckltYWdlXCIgc3JjPVwiJHtifVwiIGFsdD1cIkNvdmVyXCIgLz48L2ZpZ3VyZT5gO1xuXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRhLnB1c2goaHRtbCk7XG5cblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdHJldHVybiBhO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdH0sIFtdKS5qb2luKFwiXFxuXCIpLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHR9LCB0cnVlLCBmYWxzZSk7XG5cblx0XHRcdFx0XHRcdFx0XHRcdFx0c3RhdC5pbWFnZSArPSBhcnIubGVuZ3RoO1xuXG5cdFx0XHRcdFx0XHRcdFx0XHRcdHZvbHVtZS53aXRoU3ViU2VjdGlvbihjaGFwdGVyKTtcblx0XHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0XHQ7XG5cblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0Ly9lcHViLndpdGhTZWN0aW9uKHZvbHVtZSk7XG5cblx0XHRcdFx0XHRcdGlmIChfbmV3X3RvcF9sZXZlbClcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0ZXB1Yi53aXRoU2VjdGlvbihfbmV3X3RvcF9sZXZlbCk7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdHJldHVybiB2b2x1bWU7XG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0XHQ7XG5cdFx0XHR9KVxuXHRcdDtcblxuLy9cdFx0Y29uc29sZS5sb2coZXB1Yi5lcHViQ29uZmlnLnNlY3Rpb25zKTtcbi8vXHRcdHByb2Nlc3MuZXhpdCgpO1xuXG5cdFx0bGV0IGRhdGEgPSBhd2FpdCBlcHViLm1ha2VFcHViKCk7XG5cblx0XHRsZXQgX2ZpbGVfZGF0YSA9IG1ha2VGaWxlbmFtZShvcHRpb25zLCBlcHViLCBtZXRhKTtcblxuXHRcdGxldCB7IGZpbGUsIGZpbGVuYW1lLCBub3csIGJhc2VuYW1lLCBleHQgfSA9IF9maWxlX2RhdGE7XG5cblx0XHRhd2FpdCBmcy5vdXRwdXRGaWxlKGZpbGUsIGRhdGEpO1xuXG5cdFx0Y29uc29sZS5zdWNjZXNzKGZpbGVuYW1lLCBub3cuZm9ybWF0KCkpO1xuXG5cdFx0cmV0dXJuIHtcblx0XHRcdGZpbGUsXG5cdFx0XHRmaWxlbmFtZSxcblx0XHRcdGVwdWIsXG5cblx0XHRcdG91dHB1dFBhdGg6IG9wdGlvbnMub3V0cHV0UGF0aCxcblxuXHRcdFx0YmFzZW5hbWUsXG5cdFx0XHRleHQsXG5cblx0XHRcdHN0YXQsXG5cdFx0fTtcblx0fSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtYWtlRmlsZW5hbWUob3B0aW9uczogSU9wdGlvbnMsIGVwdWI6IEVwdWJNYWtlciwgbWV0YTogSU1kY29uZk1ldGEpXG57XG5cdG9wdGlvbnMgPSBtYWtlT3B0aW9ucyhvcHRpb25zKTtcblxuXHRsZXQgZmlsZW5hbWUgPSBlcHViLmdldEZpbGVuYW1lKG9wdGlvbnMudXNlVGl0bGUsIHRydWUpO1xuXG5cdGlmICghb3B0aW9ucy5maWxlbmFtZSlcblx0e1xuXHRcdGlmIChvcHRpb25zLmZpbGVuYW1lTG9jYWwpXG5cdFx0e1xuXHRcdFx0Ly8gQHRzLWlnbm9yZVxuXHRcdFx0aWYgKG1ldGEubm92ZWwudGl0bGVfb3V0cHV0KVxuXHRcdFx0e1xuXHRcdFx0XHQvLyBAdHMtaWdub3JlXG5cdFx0XHRcdGZpbGVuYW1lID0gbWV0YS5ub3ZlbC50aXRsZV9vdXRwdXQ7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIGlmIChBcnJheS5pc0FycmF5KG9wdGlvbnMuZmlsZW5hbWVMb2NhbCkpXG5cdFx0XHR7XG5cdFx0XHRcdGZvciAobGV0IHYgb2Ygb3B0aW9ucy5maWxlbmFtZUxvY2FsKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0aWYgKG1ldGEubm92ZWxbdl0pXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0ZmlsZW5hbWUgPSBtZXRhLm5vdmVsW3ZdO1xuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRlbHNlIGlmIChtZXRhLm5vdmVsLnRpdGxlX3poKVxuXHRcdFx0e1xuXHRcdFx0XHRmaWxlbmFtZSA9IG1ldGEubm92ZWwudGl0bGVfemg7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIGlmIChtZXRhLm5vdmVsLnRpdGxlX3Nob3J0KVxuXHRcdFx0e1xuXHRcdFx0XHRmaWxlbmFtZSA9IG1ldGEubm92ZWwudGl0bGVfc2hvcnQ7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIGlmIChtZXRhLm5vdmVsLnRpdGxlX3R3KVxuXHRcdFx0e1xuXHRcdFx0XHRmaWxlbmFtZSA9IG1ldGEubm92ZWwudGl0bGVfdHc7XG5cdFx0XHR9XG5cdFx0XHRlbHNlIGlmICh0eXBlb2Ygb3B0aW9ucy5maWxlbmFtZUxvY2FsID09ICdzdHJpbmcnKVxuXHRcdFx0e1xuXHRcdFx0XHRmaWxlbmFtZSA9IG9wdGlvbnMuZmlsZW5hbWVMb2NhbDtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRjb25zdCBiYXNlbmFtZSA9IGZpbGVuYW1lO1xuXG5cdGxldCBleHQgPSBFcHViTWFrZXIuZGVmYXVsdEV4dDtcblxuXHRsZXQgbm93ID0gbW9tZW50KCk7XG5cblx0aWYgKG9wdGlvbnMucGFkRW5kRGF0ZSlcblx0e1xuXHRcdGZpbGVuYW1lICs9ICdfJyArIG5vdy5mb3JtYXQoJ1lZWVlNTUREX0hIbW1zcycpO1xuXHR9XG5cblx0ZmlsZW5hbWUgKz0gZXh0O1xuXG5cdGxldCBmaWxlID0gcGF0aC5qb2luKG9wdGlvbnMub3V0cHV0UGF0aCwgZmlsZW5hbWUpO1xuXG5cdHJldHVybiB7XG5cdFx0ZmlsZSxcblx0XHRleHQsXG5cdFx0ZmlsZW5hbWUsXG5cdFx0b3B0aW9ucyxcblx0XHRub3csXG5cdFx0YmFzZW5hbWUsXG5cdFx0ZXB1Yixcblx0XHRtZXRhLFxuXHR9XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNyZWF0ZTtcbiJdfQ==