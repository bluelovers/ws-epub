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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHh0MmVwdWIzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidHh0MmVwdWIzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7R0FFRzs7QUFHSCxtREFBdUQ7QUFDdkQsK0JBQStCO0FBQy9CLDZDQUEwRDtBQUMxRCxvQ0FBcUM7QUFDckMsK0JBQStCO0FBRS9CLGlDQUFpQztBQUNqQyxpREFBaUQ7QUFDakQscURBQXFFO0FBQ3JFLGlDQUFrQztBQUNsQyxtREFBc0Q7QUFDdEQsNENBQTRDO0FBQzVDLHFEQUF3RDtBQUN4RCwrQ0FBdUM7QUFDdkMsbURBQXNDO0FBRXpCLFFBQUEsT0FBTyxHQUFHLElBQUksc0JBQU8sQ0FBQyxJQUFJLEVBQUU7SUFDeEMsT0FBTyxFQUFFLElBQUk7SUFDYixjQUFjLEVBQUU7UUFDZixNQUFNLEVBQUUsSUFBSTtLQUNaO0lBQ0QsWUFBWSxFQUFFO1FBQ2IsT0FBTyxFQUFFLElBQUk7S0FDYjtDQUNELENBQUMsQ0FBQztBQUVILGVBQU8sQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDO0FBaUNmLFFBQUEsY0FBYyxHQUFzQixNQUFNLENBQUMsTUFBTSxDQUFDO0lBQzlELFlBQVksRUFBRSxZQUFZO0lBQzFCLFlBQVksRUFBRSxJQUFJO0lBQ2xCLG1CQUFtQjtJQUVuQixhQUFhLEVBQUU7UUFDZCxVQUFVLEVBQUUsSUFBSTtRQUNoQix5QkFBeUIsRUFBRSxJQUFJO0tBQy9CO0NBQ0QsQ0FBQyxDQUFDO0FBRUgsU0FBZ0IsWUFBWSxDQUFDLE9BQWlCLEVBQUUsS0FBSyxHQUFHLEVBQUU7SUFFekQsT0FBTyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUMsSUFBSSxDQUFDLEtBQUs7UUFFbEMsSUFBSSxJQUFpQixDQUFDO1FBQ3RCLElBQUksUUFBZ0IsQ0FBQztRQUVyQixJQUFJLE9BQU8sQ0FBQyxTQUFTLElBQUksT0FBTyxPQUFPLENBQUMsU0FBUyxJQUFJLFFBQVEsRUFDN0Q7WUFDQyxJQUFJLEdBQUcsT0FBTyxD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LE1BQU0sUUFBUSxHQUFHLFFBQVEsQ0FBQztJQUUxQixJQUFJLEdBQUcsR0FBRyxxQkFBUyxDQUFDLFVBQVUsQ0FBQztJQUUvQixJQUFJLEdBQUcsR0FBRyxNQUFNLEVBQUUsQ0FBQztJQUVuQixJQUFJLE9BQU8sQ0FBQyxVQUFVLEVBQ3RCO1FBQ0MsUUFBUSxJQUFJLEdBQUcsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLGlCQUFpQixDQUFDLENBQUM7S0FDaEQ7SUFFRCxRQUFRLElBQUksR0FBRyxDQUFDO0lBRWhCLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUVuRCxPQUFPO1FBQ04sSUFBSTtRQUNKLEdBQUc7UUFDSCxRQUFRO1FBQ1IsT0FBTztRQUNQLEdBQUc7UUFDSCxRQUFRO1FBQ1IsSUFBSTtRQUNKLElBQUk7S0FDSixDQUFBO0FBQ0YsQ0FBQztBQW5FRCxvQ0FtRUM7QUFFRCxrQkFBZSxNQUFNLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcclxuICogQ3JlYXRlZCBieSB1c2VyIG9uIDIwMTcvMTIvMTYvMDE2LlxyXG4gKi9cclxuXHJcbmltcG9ydCB7IElTZWN0aW9uQ29udGVudCB9IGZyb20gJ2VwdWItbWFrZXIyL3NyYy9pbmRleCc7XHJcbmltcG9ydCB7IGh0bWxQcmVmYWNlIH0gZnJvbSAnZXB1Yi1tYWtlcjIvc3JjL2xpYi91dGlsJztcclxuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMtaWNvbnYnO1xyXG5pbXBvcnQgRXB1Yk1ha2VyLCB7IGhhc2hTdW0sIHNsdWdpZnkgfSBmcm9tICdlcHViLW1ha2VyMic7XHJcbmltcG9ydCBQcm9taXNlID0gcmVxdWlyZSgnYmx1ZWJpcmQnKTtcclxuaW1wb3J0ICogYXMgcGF0aCBmcm9tICd1cGF0aDInO1xyXG5pbXBvcnQgKiBhcyBTdHJVdGlsIGZyb20gJ3N0ci11dGlsJztcclxuaW1wb3J0ICogYXMgbW9tZW50IGZyb20gJ21vbWVudCc7XHJcbmltcG9ydCAqIGFzIG5vdmVsR2xvYmJ5IGZyb20gJ25vZGUtbm92ZWwtZ2xvYmJ5JztcclxuaW1wb3J0IHsgbWRjb25mX3BhcnNlLCBJTWRjb25mTWV0YSwgY2hrSW5mbyB9IGZyb20gJ25vZGUtbm92ZWwtaW5mbyc7XHJcbmltcG9ydCB7IHNwbGl0VHh0IH0gZnJvbSAnLi91dGlsJztcclxuaW1wb3J0IHsgY3JlYXRlVVVJRCB9IGZyb20gJ2VwdWItbWFrZXIyL3NyYy9saWIvdXVpZCc7XHJcbmltcG9ydCAqIGFzIGRlZXBtZXJnZSBmcm9tICdkZWVwbWVyZ2UtcGx1cyc7XHJcbmltcG9ydCB7IG5vcm1hbGl6ZV9zdHJpcCB9IGZyb20gJ0Bub2RlLW5vdmVsL25vcm1hbGl6ZSc7XHJcbmltcG9ydCB7IENvbnNvbGUgfSBmcm9tICdkZWJ1Zy1jb2xvcjInO1xyXG5pbXBvcnQgeyBjcmxmIH0gZnJvbSAnY3JsZi1ub3JtYWxpemUnO1xyXG5cclxuZXhwb3J0IGNvbnN0IGNvbnNvbGUgPSBuZXcgQ29uc29sZShudWxsLCB7XHJcblx0ZW5hYmxlZDogdHJ1ZSxcclxuXHRpbnNwZWN0T3B0aW9uczoge1xyXG5cdFx0Y29sb3JzOiB0cnVlLFxyXG5cdH0sXHJcblx0Y2hhbGtPcHRpb25zOiB7XHJcblx0XHRlbmFibGVkOiB0cnVlLFxyXG5cdH0sXHJcbn0pO1xyXG5cclxuY29uc29sZS5lbmFibGVkQ29sb3IgPSB0cnVlO1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJT3B0aW9uc1xyXG57XHJcblx0LyoqXHJcblx0ICog5bCP6KqqIHR4dCDnmoTkuLvos4fmlpnlpL7ot6/lvpFcclxuXHQgKiBAdHlwZSB7c3RyaW5nfVxyXG5cdCAqL1xyXG5cdGlucHV0UGF0aDogc3RyaW5nLFxyXG5cdG91dHB1dFBhdGg6IHN0cmluZyxcclxuXHJcblx0LyoqXHJcblx0ICog5bCP6Kqq5ZCN56ixSURcclxuXHQgKi9cclxuXHRub3ZlbElEPzogc3RyaW5nLFxyXG5cdGZpbGVuYW1lPzogc3RyaW5nLFxyXG5cclxuXHRub3ZlbENvbmY/LFxyXG5cclxuXHRlcHViVGVtcGxhdGU/LFxyXG5cclxuXHRlcHViTGFuZ3VhZ2U/OiBzdHJpbmcsXHJcblxyXG5cdHBhZEVuZERhdGU/OiBib29sZWFuLFxyXG5cclxuXHRnbG9iYnlPcHRpb25zPzogbm92ZWxHbG9iYnkuSU9wdGlvbnMsXHJcblxyXG5cdHVzZVRpdGxlPzogYm9vbGVhbixcclxuXHRmaWxlbmFtZUxvY2FsPzogYm9vbGVhbiB8IHN0cmluZ1tdIHwgc3RyaW5nLFxyXG5cclxuXHRub0xvZz86IGJvb2xlYW4sXHJcbn1cclxuXHJcbmV4cG9ydCBjb25zdCBkZWZhdWx0T3B0aW9uczogUGFydGlhbDxJT3B0aW9ucz4gPSBPYmplY3QuZnJlZXplKHtcclxuXHRlcHViVGVtcGxhdGU6ICdsaWdodG5vdmVsJyxcclxuXHRlcHViTGFuZ3VhZ2U6ICd6aCcsXHJcblx0Ly9wYWRFbmREYXRlOiB0cnVlLFxyXG5cclxuXHRnbG9iYnlPcHRpb25zOiB7XHJcblx0XHRjaGVja1JvbWFuOiB0cnVlLFxyXG5cdFx0dXNlRGVmYXVsdFBhdHRlcm5zRXhjbHVkZTogdHJ1ZSxcclxuXHR9LFxyXG59KTtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXROb3ZlbENvbmYob3B0aW9uczogSU9wdGlvbnMsIGNhY2hlID0ge30pOiBQcm9taXNlPElNZGNvbmZNZXRhPlxyXG57XHJcblx0cmV0dXJuIFByb21pc2UucmVzb2x2ZSgpLnRoZW4oYXN5bmMgZnVuY3Rpb24gKClcclxuXHR7XHJcblx0XHRsZXQgbWV0YTogSU1kY29uZk1ldGE7XHJcblx0XHRsZXQgY29uZlBhdGg6IHN0cmluZztcclxuXHJcblx0XHRpZiAob3B0aW9ucy5ub3ZlbENvbmYgJiYgdHlwZW9mIG9wdGlvbnMubm92ZWxDb25mID09ICdvYmplY3QnKVxyXG5cdFx0e1xyXG5cdFx0XHRtZXRhID0gb3B0aW9ucy5ub3ZlbENvbmY7XHJcblx0XHR9XHJcblx0XHRlbHNlXHJcblx0XHR7XHJcblx0XHRcdGlmICh0eXBlb2Ygb3B0aW9ucy5ub3ZlbENvbmYgPT0gJ3N0cmluZycpXHJcblx0XHRcdHtcclxuXHRcdFx0XHRjb25mUGF0aCA9IG9wdGlvbnMubm92ZWxDb25mO1xyXG5cdFx0XHR9XHJcblx0XHRcdGVsc2VcclxuXHRcdFx0e1xyXG5cdFx0XHRcdGNvbmZQYXRoID0gb3B0aW9ucy5pbnB1dFBhdGg7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGlmIChmcy5leGlzdHNTeW5jKHBhdGguam9pbihjb25mUGF0aCwgJ21ldGEubWQnKSkpXHJcblx0XHRcdHtcclxuXHRcdFx0XHRsZXQgZmlsZSA9IHBhdGguam9pbihjb25mUGF0aCwgJ21ldGEubWQnKTtcclxuXHJcblx0XHRcdFx0bWV0YSA9IGF3YWl0IGZzLnJlYWRGaWxlKGZpbGUpXHJcblx0XHRcdFx0XHQudGhlbihtZGNvbmZfcGFyc2UpXHJcblx0XHRcdFx0O1xyXG5cdFx0XHR9XHJcblx0XHRcdGVsc2UgaWYgKGZzLmV4aXN0c1N5bmMocGF0aC5qb2luKGNvbmZQYXRoLCAnUkVBRE1FLm1kJykpKVxyXG5cdFx0XHR7XHJcblx0XHRcdFx0bGV0IGZpbGUgPSBwYXRoLmpvaW4oY29uZlBhdGgsICdSRUFETUUubWQnKTtcclxuXHJcblx0XHRcdFx0bWV0YSA9IGF3YWl0IGZzLnJlYWRGaWxlKGZpbGUpXHJcblx0XHRcdFx0XHQudGhlbihtZGNvbmZfcGFyc2UpXHJcblx0XHRcdFx0O1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0bWV0YSA9IGNoa0luZm8obWV0YSk7XHJcblxyXG5cdFx0aWYgKCFtZXRhIHx8ICFtZXRhLm5vdmVsIHx8ICFtZXRhLm5vdmVsLnRpdGxlKVxyXG5cdFx0e1xyXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoYG5vdCBhIHZhbGlkIG5vdmVsSW5mbyBkYXRhYCk7XHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIG1ldGE7XHJcblx0fSlcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIG1ha2VPcHRpb25zKG9wdGlvbnM6IElPcHRpb25zKVxyXG57XHJcblx0b3B0aW9ucyA9IE9iamVjdC5rZXlzKG9wdGlvbnMpXHJcblx0XHQuZmlsdGVyKHYgPT4gdHlwZW9mIG9wdGlvbnNbdl0gIT0gJ3VuZGVmaW5lZCcpXHJcblx0XHQucmVkdWNlKGZ1bmN0aW9uIChhLCBiKVxyXG5cdFx0e1xyXG5cdFx0XHRhW2JdID0gb3B0aW9uc1tiXTtcclxuXHJcblx0XHRcdHJldHVybiBhXHJcblx0XHR9LCB7fSBhcyBJT3B0aW9ucylcclxuXHQ7XHJcblxyXG5cdHJldHVybiBvcHRpb25zID0gZGVlcG1lcmdlLmFsbChbe30sIGRlZmF1bHRPcHRpb25zLCBvcHRpb25zXSk7XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgSU5vdmVsRXB1YlJldHVybkluZm9cclxue1xyXG5cdGZpbGU6IHN0cmluZyxcclxuXHRmaWxlbmFtZTogc3RyaW5nLFxyXG5cdGVwdWI6IEVwdWJNYWtlcixcclxuXHJcblx0b3V0cHV0UGF0aDogc3RyaW5nLFxyXG5cdGJhc2VuYW1lOiBzdHJpbmcsXHJcblx0ZXh0OiBzdHJpbmcsXHJcblxyXG5cdHN0YXQ6IHtcclxuXHRcdHZvbHVtZTogbnVtYmVyLFxyXG5cdFx0Y2hhcHRlcjogbnVtYmVyLFxyXG5cdFx0aW1hZ2U6IG51bWJlcixcclxuXHR9LFxyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlKG9wdGlvbnM6IElPcHRpb25zLCBjYWNoZSA9IHt9KTogUHJvbWlzZTxJTm92ZWxFcHViUmV0dXJuSW5mbz5cclxue1xyXG5cdHJldHVybiBQcm9taXNlLnJlc29sdmUoKS50aGVuKGFzeW5jIGZ1bmN0aW9uICgpXHJcblx0e1xyXG5cdFx0Ly9jb25zb2xlLmxvZyhvcHRpb25zLCBkZWZhdWx0T3B0aW9ucyk7XHJcblxyXG5cdFx0b3B0aW9ucyA9IG1ha2VPcHRpb25zKG9wdGlvbnMpO1xyXG5cclxuXHRcdC8vY29uc29sZS5kaXIob3B0aW9ucywge2NvbG9yczogdHJ1ZX0pO1xyXG5cclxuXHRcdGxldCBub3ZlbElEID0gb3B0aW9ucy5ub3ZlbElEO1xyXG5cdFx0bGV0IFRYVF9QQVRIID0gb3B0aW9ucy5pbnB1dFBhdGg7XHJcblxyXG5cdFx0bGV0IG1ldGEgPSBhd2FpdCBnZXROb3ZlbENvbmYob3B0aW9ucywgY2FjaGUpO1xyXG5cclxuXHRcdGxldCBnbG9iYnlfcGF0dGVybnM6IHN0cmluZ1tdO1xyXG5cdFx0bGV0IGdsb2JieV9vcHRpb25zOiBub3ZlbEdsb2JieS5JT3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe30sIG9wdGlvbnMuZ2xvYmJ5T3B0aW9ucywge1xyXG5cdFx0XHRjd2Q6IFRYVF9QQVRILFxyXG5cdFx0XHQvL3VzZURlZmF1bHRQYXR0ZXJuc0V4Y2x1ZGU6IHRydWUsXHJcblx0XHRcdC8vY2hlY2tSb21hbjogdHJ1ZSxcclxuXHRcdH0pO1xyXG5cclxuXHRcdHtcclxuXHRcdFx0W2dsb2JieV9wYXR0ZXJucywgZ2xvYmJ5X29wdGlvbnNdID0gbm92ZWxHbG9iYnkuZ2V0T3B0aW9ucyhnbG9iYnlfb3B0aW9ucyk7XHJcblx0XHR9XHJcblxyXG5cdFx0Ly9jb25zb2xlLmxvZyhvcHRpb25zLCBnbG9iYnlfb3B0aW9ucyk7XHJcblxyXG5cdFx0Ly9jb25zb2xlLmRpcihvcHRpb25zKTtcclxuXHJcblx0XHRjb25zb2xlLmluZm8obWV0YS5ub3ZlbC50aXRsZSk7XHJcblx0XHQvL2NvbnNvbGUubG9nKG1ldGEubm92ZWwucHJlZmFjZSk7XHJcblxyXG5cdFx0bGV0IGVwdWI6IEVwdWJNYWtlciA9IG5ldyBFcHViTWFrZXIoKVxyXG5cdFx0XHQud2l0aFRlbXBsYXRlKG9wdGlvbnMuZXB1YlRlbXBsYXRlKVxyXG5cdFx0XHQud2l0aExhbmd1YWdlKG9wdGlvbnMuZXB1Ykxhbmd1YWdlKVxyXG5cdFx0XHQud2l0aFV1aWQoY3JlYXRlVVVJRChoYXNoU3VtKFtcclxuXHRcdFx0XHRtZXRhLm5vdmVsLnRpdGxlLFxyXG5cdFx0XHRcdG1ldGEubm92ZWwuYXV0aG9yLFxyXG5cdFx0XHRdKSkpXHJcblx0XHRcdC53aXRoVGl0bGUobWV0YS5ub3ZlbC50aXRsZSwgbWV0YS5ub3ZlbC50aXRsZV9zaG9ydCB8fCBtZXRhLm5vdmVsLnRpdGxlX3poKVxyXG5cdFx0XHQud2l0aEF1dGhvcihtZXRhLm5vdmVsLmF1dGhvcilcclxuXHRcdFx0LmFkZEF1dGhvcihtZXRhLm5vdmVsLmF1dGhvcilcclxuXHRcdFx0LndpdGhDb2xsZWN0aW9uKHtcclxuXHRcdFx0XHRuYW1lOiBtZXRhLm5vdmVsLnRpdGxlLFxyXG5cdFx0XHR9KVxyXG5cdFx0XHQud2l0aEluZm9QcmVmYWNlKG1ldGEubm92ZWwucHJlZmFjZSlcclxuXHRcdFx0LmFkZFRhZyhtZXRhLm5vdmVsLnRhZ3MpXHJcblx0XHRcdC5hZGRBdXRob3IobWV0YS5jb250cmlidXRlKVxyXG5cdFx0O1xyXG5cclxuXHRcdGlmIChvcHRpb25zLmZpbGVuYW1lKVxyXG5cdFx0e1xyXG5cdFx0XHRlcHViLmVwdWJDb25maWcuZmlsZW5hbWUgPSBvcHRpb25zLmZpbGVuYW1lO1xyXG5cdFx0fVxyXG5cclxuXHRcdGlmIChtZXRhLm5vdmVsLnNvdXJjZSlcclxuXHRcdHtcclxuXHRcdFx0ZXB1Yi5hZGRMaW5rcyhtZXRhLm5vdmVsLnNvdXJjZSk7XHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKG1ldGEubm92ZWwuc2VyaWVzKVxyXG5cdFx0e1xyXG5cdFx0XHRlcHViLndpdGhTZXJpZXMobWV0YS5ub3ZlbC5zZXJpZXMubmFtZSwgbWV0YS5ub3ZlbC5zZXJpZXMucG9zaXRpb24pO1xyXG5cdFx0fVxyXG5cdFx0ZWxzZVxyXG5cdFx0e1xyXG5cdFx0XHRlcHViLndpdGhTZXJpZXMobWV0YS5ub3ZlbC50aXRsZSk7XHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKG1ldGEubm92ZWwucHVibGlzaGVyKVxyXG5cdFx0e1xyXG5cdFx0XHRlcHViLndpdGhQdWJsaXNoZXIobWV0YS5ub3ZlbC5wdWJsaXNoZXIgfHwgJ25vZGUtbm92ZWwnKTtcclxuXHRcdH1cclxuXHJcblx0XHRpZiAobWV0YS5ub3ZlbC5kYXRlKVxyXG5cdFx0e1xyXG5cdFx0XHRlcHViLndpdGhNb2RpZmljYXRpb25EYXRlKG1ldGEubm92ZWwuZGF0ZSk7XHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKG1ldGEubm92ZWwuc3RhdHVzKVxyXG5cdFx0e1xyXG5cdFx0XHRlcHViLmFkZFRhZyhtZXRhLm5vdmVsLnN0YXR1cyk7XHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKG1ldGEubm92ZWwuY292ZXIpXHJcblx0XHR7XHJcblx0XHRcdGVwdWIud2l0aENvdmVyKG1ldGEubm92ZWwuY292ZXIpO1xyXG5cdFx0fVxyXG5cdFx0ZWxzZVxyXG5cdFx0e1xyXG5cdFx0XHRhd2FpdCBub3ZlbEdsb2JieS5nbG9iYnkoW1xyXG5cdFx0XHRcdFx0J2NvdmVyLionLFxyXG5cdFx0XHRcdF0sIE9iamVjdC5hc3NpZ24oe30sIGdsb2JieV9vcHRpb25zLCB7XHJcblx0XHRcdFx0XHRhYnNvbHV0ZTogdHJ1ZSxcclxuXHRcdFx0XHR9KSlcclxuXHRcdFx0XHQudGhlbihscyA9PlxyXG5cdFx0XHRcdHtcclxuXHRcdFx0XHRcdGlmIChscy5sZW5ndGgpXHJcblx0XHRcdFx0XHR7XHJcblx0XHRcdFx0XHRcdGVwdWIud2l0aENvdmVyKGxzWzBdKTtcclxuXHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHRjb25zb2xlLmxvZyhscyk7XHJcblx0XHRcdFx0fSlcclxuXHRcdFx0O1xyXG5cdFx0fVxyXG5cclxuXHRcdC8vcHJvY2Vzcy5leGl0KCk7XHJcblxyXG5cdFx0bGV0IHN0YXQ6IElOb3ZlbEVwdWJSZXR1cm5JbmZvW1wic3RhdFwiXSA9IHtcclxuXHRcdFx0dm9sdW1lOiAwLFxyXG5cdFx0XHRjaGFwdGVyOiAwLFxyXG5cdFx0XHRpbWFnZTogMCxcclxuXHRcdH07XHJcblxyXG5cdFx0YXdhaXQgbm92ZWxHbG9iYnlcclxuXHRcdFx0Lmdsb2JieUFTeW5jKGdsb2JieV9wYXR0ZXJucywgZ2xvYmJ5X29wdGlvbnMpXHJcblx0XHRcdC50aGVuKGZ1bmN0aW9uIChscylcclxuXHRcdFx0e1xyXG5cdFx0XHRcdC8vY29uc29sZS5sb2cobHMpO1xyXG5cclxuXHRcdFx0XHQvL3Byb2Nlc3MuZXhpdCgpO1xyXG5cclxuXHRcdFx0XHRyZXR1cm4gbHM7XHJcblx0XHRcdH0pXHJcblx0XHRcdC50aGVuKF9scyA9PlxyXG5cdFx0XHR7XHJcblx0XHRcdFx0bGV0IGlkeCA9IDE7XHJcblxyXG5cdFx0XHRcdGxldCBjYWNoZVRyZWVTZWN0aW9uID0ge30gYXMge1xyXG5cdFx0XHRcdFx0W2s6IHN0cmluZ106IEVwdWJNYWtlci5TZWN0aW9uLFxyXG5cdFx0XHRcdH07XHJcblxyXG5cdFx0XHRcdGNvbnN0IFN5bUNhY2hlID0gU3ltYm9sKCdjYWNoZScpO1xyXG5cclxuXHRcdFx0XHRyZXR1cm4gUHJvbWlzZVxyXG5cdFx0XHRcdFx0Lm1hcFNlcmllcyhPYmplY3Qua2V5cyhfbHMpLCBhc3luYyBmdW5jdGlvbiAodmFsX2RpcilcclxuXHRcdFx0XHRcdHtcclxuXHRcdFx0XHRcdFx0bGV0IGxzID0gX2xzW3ZhbF9kaXJdO1xyXG5cdFx0XHRcdFx0XHRsZXQgZGlybmFtZSA9IGxzWzBdLnBhdGhfZGlyO1xyXG5cdFx0XHRcdFx0XHRsZXQgdm9sdW1lX3RpdGxlID0gbHNbMF0udm9sdW1lX3RpdGxlO1xyXG5cclxuXHRcdFx0XHRcdFx0bGV0IHZvbHVtZSA9IGNhY2hlVHJlZVNlY3Rpb25bdmFsX2Rpcl07XHJcblxyXG5cdFx0XHRcdFx0XHRsZXQgX25ld190b3BfbGV2ZWw6IEVwdWJNYWtlci5TZWN0aW9uO1xyXG5cclxuXHRcdFx0XHRcdFx0aWYgKCFjYWNoZVRyZWVTZWN0aW9uW3ZhbF9kaXJdKVxyXG5cdFx0XHRcdFx0XHR7XHJcblx0XHRcdFx0XHRcdFx0bGV0IF90czIgPSB2b2x1bWVfdGl0bGUuc3BsaXQoJy8nKTtcclxuXHRcdFx0XHRcdFx0XHRsZXQgX3RzID0gdmFsX2Rpci5zcGxpdCgnLycpO1xyXG5cclxuXHRcdFx0XHRcdFx0XHRsZXQgX2RzID0gKHBhdGgubm9ybWFsaXplKGRpcm5hbWUpIGFzIHN0cmluZykuc3BsaXQoJy8nKTtcclxuXHJcblx0XHRcdFx0XHRcdFx0bGV0IF9sYXN0OiBFcHViTWFrZXIuU2VjdGlvbjtcclxuXHJcblx0XHRcdFx0XHRcdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBfdHMubGVuZ3RoOyBpKyspXHJcblx0XHRcdFx0XHRcdFx0e1xyXG5cdFx0XHRcdFx0XHRcdFx0bGV0IF9uYXZzID0gX3RzLnNsaWNlKDAsIGkgKyAxKTtcclxuXHRcdFx0XHRcdFx0XHRcdGxldCBfbmF2ID0gX25hdnMuam9pbignLycpO1xyXG5cclxuXHRcdFx0XHRcdFx0XHRcdGxldCBfbmF2X2RpciA9IF9kcy5zbGljZSgwLCBfZHMubGVuZ3RoIC0gX3RzLmxlbmd0aCArIGkgKyAxKS5qb2luKCcvJyk7XHJcblxyXG5cdFx0XHRcdFx0XHRcdFx0LypcclxuXHRcdFx0XHRcdFx0XHRcdGNvbnNvbGUuZGlyKHtcclxuXHRcdFx0XHRcdFx0XHRcdFx0X25hdnMsXHJcblx0XHRcdFx0XHRcdFx0XHRcdF9uYXYsXHJcblx0XHRcdFx0XHRcdFx0XHRcdF9uYXZfZGlyLFxyXG5cdFx0XHRcdFx0XHRcdFx0fSk7XHJcblx0XHRcdFx0XHRcdFx0XHQqL1xyXG5cclxuXHRcdFx0XHRcdFx0XHRcdGlmICghY2FjaGVUcmVlU2VjdGlvbltfbmF2XSlcclxuXHRcdFx0XHRcdFx0XHRcdHtcclxuXHRcdFx0XHRcdFx0XHRcdFx0bGV0IHZpZCA9IGB2b2x1bWUkeyhpZHgrKykudG9TdHJpbmcoKS5wYWRTdGFydCg2LCAnMCcpfWA7XHJcblxyXG5cdFx0XHRcdFx0XHRcdFx0XHRsZXQgdGl0bGUgPSBub3JtYWxpemVfc3RyaXAoX3RzMltpXSwgdHJ1ZSk7XHJcblxyXG5cdFx0XHRcdFx0XHRcdFx0XHRjYWNoZVRyZWVTZWN0aW9uW19uYXZdID0gbmV3IEVwdWJNYWtlci5TZWN0aW9uKCdhdXRvLXRvYycsIHZpZCwge1xyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdHRpdGxlOiB0aXRsZSxcclxuXHRcdFx0XHRcdFx0XHRcdFx0fSwgZmFsc2UsIHRydWUpO1xyXG5cclxuXHRcdFx0XHRcdFx0XHRcdFx0Y2FjaGVUcmVlU2VjdGlvbltfbmF2XVtTeW1DYWNoZV0gPSBjYWNoZVRyZWVTZWN0aW9uW19uYXZdW1N5bUNhY2hlXSB8fCB7fTtcclxuXHJcblx0XHRcdFx0XHRcdFx0XHRcdGlmIChpID09IDApXHJcblx0XHRcdFx0XHRcdFx0XHRcdHtcclxuXHRcdFx0XHRcdFx0XHRcdFx0XHQvL2VwdWIud2l0aFNlY3Rpb24oY2FjaGVUcmVlU2VjdGlvbltfbmF2XSk7XHJcblxyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdF9uZXdfdG9wX2xldmVsID0gY2FjaGVUcmVlU2VjdGlvbltfbmF2XTtcclxuXHRcdFx0XHRcdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdFx0XHRcdFx0c3RhdC52b2x1bWUrKztcclxuXHJcblx0XHRcdFx0XHRcdFx0XHRcdGF3YWl0IF9oYW5kbGVWb2x1bWUoY2FjaGVUcmVlU2VjdGlvbltfbmF2XSwgX25hdl9kaXIpXHJcblx0XHRcdFx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0XHRcdFx0aWYgKF9sYXN0KVxyXG5cdFx0XHRcdFx0XHRcdFx0e1xyXG5cdFx0XHRcdFx0XHRcdFx0XHRfbGFzdC53aXRoU3ViU2VjdGlvbihjYWNoZVRyZWVTZWN0aW9uW19uYXZdKVxyXG5cdFx0XHRcdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdFx0XHRcdF9sYXN0ID0gY2FjaGVUcmVlU2VjdGlvbltfbmF2XTtcclxuXHRcdFx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0XHRcdHZvbHVtZSA9IGNhY2hlVHJlZVNlY3Rpb25bdmFsX2Rpcl07XHJcblxyXG4vL1x0XHRcdFx0XHRcdFx0Y29uc29sZS5kaXIoe1xyXG4vL1x0XHRcdFx0XHRcdFx0XHRjYWNoZVRyZWVTZWN0aW9uLFxyXG4vL1x0XHRcdFx0XHRcdFx0XHR2b2x1bWUsXHJcbi8vXHRcdFx0XHRcdFx0XHR9LCB7XHJcbi8vXHRcdFx0XHRcdFx0XHRcdGRlcHRoOiA1LFxyXG4vL1x0XHRcdFx0XHRcdFx0XHRjb2xvcnM6IHRydWUsXHJcbi8vXHRcdFx0XHRcdFx0XHR9KTtcclxuLy9cdFx0XHRcdFx0XHRcdHByb2Nlc3MuZXhpdCgpXHJcblx0XHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHRcdGxldCB2aWQ6IHN0cmluZyA9IHZvbHVtZS5pZDtcclxuXHJcblx0XHRcdFx0XHRcdGF3YWl0IF9oYW5kbGVWb2x1bWUodm9sdW1lLCBkaXJuYW1lKVxyXG5cclxuXHRcdFx0XHRcdFx0YXN5bmMgZnVuY3Rpb24gX2hhbmRsZVZvbHVtZSh2b2x1bWU6IEVwdWJNYWtlci5TZWN0aW9uLCBkaXJuYW1lOiBzdHJpbmcpXHJcblx0XHRcdFx0XHRcdHtcclxuXHRcdFx0XHRcdFx0XHRsZXQgdmlkOiBzdHJpbmcgPSB2b2x1bWUuaWQ7XHJcblxyXG5cdFx0XHRcdFx0XHRcdGlmICghdm9sdW1lW1N5bUNhY2hlXS5jb3ZlcilcclxuXHRcdFx0XHRcdFx0XHR7XHJcblx0XHRcdFx0XHRcdFx0XHR2b2x1bWVbU3ltQ2FjaGVdLmNvdmVyID0gdHJ1ZTtcclxuXHJcblx0XHRcdFx0XHRcdFx0XHRsZXQgZmlsZSA9IHBhdGguam9pbihkaXJuYW1lLCAnUkVBRE1FLm1kJyk7XHJcblx0XHRcdFx0XHRcdFx0XHRsZXQgbWV0YSA9IGF3YWl0IGZzLnJlYWRGaWxlKGZpbGUpXHJcblx0XHRcdFx0XHRcdFx0XHRcdC50aGVuKGZ1bmN0aW9uIChkYXRhKVxyXG5cdFx0XHRcdFx0XHRcdFx0XHR7XHJcblx0XHRcdFx0XHRcdFx0XHRcdFx0cmV0dXJuIG1kY29uZl9wYXJzZShkYXRhLCB7XHJcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHQvLyDnlbbmspLmnInljIXlkKvlv4XopoHnmoTlhaflrrnmmYLkuI3nlKLnlJ/pjK/oqqRcclxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdHRocm93OiBmYWxzZSxcclxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdC8vIOWFgeioseS4jeaomea6lueahCBpbmZvIOWFp+WuuVxyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0bG93Q2hlY2tMZXZlbDogdHJ1ZSxcclxuXHRcdFx0XHRcdFx0XHRcdFx0XHR9KTtcclxuXHRcdFx0XHRcdFx0XHRcdFx0fSlcclxuXHRcdFx0XHRcdFx0XHRcdFx0LmNhdGNoKGZ1bmN0aW9uICgpXHJcblx0XHRcdFx0XHRcdFx0XHRcdHtcclxuXHRcdFx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gbnVsbDtcclxuXHRcdFx0XHRcdFx0XHRcdFx0fSlcclxuXHRcdFx0XHRcdFx0XHRcdDtcclxuXHJcblx0XHRcdFx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKGZpbGUsIG1ldGEpO1xyXG5cclxuXHRcdFx0XHRcdFx0XHRcdGF3YWl0IG5vdmVsR2xvYmJ5Lmdsb2JieShbXHJcblx0XHRcdFx0XHRcdFx0XHRcdFx0J2NvdmVyLionLFxyXG5cdFx0XHRcdFx0XHRcdFx0XHRdLCB7XHJcblx0XHRcdFx0XHRcdFx0XHRcdFx0Y3dkOiBkaXJuYW1lLFxyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdGFic29sdXRlOiB0cnVlLFxyXG5cdFx0XHRcdFx0XHRcdFx0XHR9KVxyXG5cdFx0XHRcdFx0XHRcdFx0XHQudGhlbihhc3luYyAobHMpID0+XHJcblx0XHRcdFx0XHRcdFx0XHRcdHtcclxuXHRcdFx0XHRcdFx0XHRcdFx0XHRpZiAobHMubGVuZ3RoKVxyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdHtcclxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdGxldCBleHQgPSBwYXRoLmV4dG5hbWUobHNbMF0pO1xyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0bGV0IG5hbWUgPSBgJHt2aWR9LWNvdmVyJHtleHR9YDtcclxuXHJcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRlcHViLndpdGhBZGRpdGlvbmFsRmlsZShsc1swXSwgbnVsbCwgbmFtZSk7XHJcblxyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0cmV0dXJuIG5hbWU7XHJcblx0XHRcdFx0XHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdGVsc2UgaWYgKGZzLmV4aXN0c1N5bmMoZmlsZSkpXHJcblx0XHRcdFx0XHRcdFx0XHRcdFx0e1xyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0aWYgKG1ldGEgJiYgbWV0YS5ub3ZlbClcclxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdHtcclxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0aWYgKG1ldGEubm92ZWwuY292ZXIpXHJcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdHtcclxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRsZXQgZXh0ID0gJy5wbmcnO1xyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGxldCBiYXNlbmFtZSA9IGAke3ZpZH0tY292ZXJgO1xyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGxldCBuYW1lID0gYCR7YmFzZW5hbWV9JHtleHR9YDtcclxuXHJcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0bGV0IGRhdGEgPSB0eXBlb2YgbWV0YS5ub3ZlbC5jb3ZlciA9PT0gJ3N0cmluZycgPyB7XHJcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHR1cmw6IG1ldGEubm92ZWwuY292ZXIsXHJcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0fSA6IG1ldGEubm92ZWwuY292ZXI7XHJcblxyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGRhdGEuZXh0ID0gbnVsbDtcclxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRkYXRhLmJhc2VuYW1lID0gYmFzZW5hbWU7XHJcblxyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGVwdWIud2l0aEFkZGl0aW9uYWxGaWxlKGRhdGEsIG51bGwsIG5hbWUpO1xyXG5cclxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gbmFtZTtcclxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0XHRcdFx0fSlcclxuXHRcdFx0XHRcdFx0XHRcdFx0LnRoZW4oZnVuY3Rpb24gKG5hbWUpXHJcblx0XHRcdFx0XHRcdFx0XHRcdHtcclxuXHRcdFx0XHRcdFx0XHRcdFx0XHRsZXQgX29rID0gZmFsc2U7XHJcblx0XHRcdFx0XHRcdFx0XHRcdFx0bGV0IGRhdGE6IElTZWN0aW9uQ29udGVudCA9IHt9O1xyXG5cclxuXHRcdFx0XHRcdFx0XHRcdFx0XHRpZiAobmFtZSlcclxuXHRcdFx0XHRcdFx0XHRcdFx0XHR7XHJcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRfb2sgPSB0cnVlO1xyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0ZGF0YS5jb3ZlciA9IHtcclxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0bmFtZSxcclxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdH07XHJcblxyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0c3RhdC5pbWFnZSArPSAxO1xyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHRcdFx0XHRcdFx0aWYgKG1ldGEgJiYgbWV0YS5ub3ZlbClcclxuXHRcdFx0XHRcdFx0XHRcdFx0XHR7XHJcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRpZiAobWV0YS5ub3ZlbC5wcmVmYWNlKVxyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0e1xyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRfb2sgPSB0cnVlO1xyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHQvL2RhdGEuY29udGVudCA9IGNybGYobWV0YS5ub3ZlbC5wcmVmYWNlKTtcclxuXHJcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGRhdGEuY29udGVudCA9IGh0bWxQcmVmYWNlKHtcclxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRpbmZvUHJlZmFjZTogbWV0YS5ub3ZlbC5wcmVmYWNlLFxyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHR9KS5pbmZvUHJlZmFjZUhUTUw7XHJcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdFx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKG5hbWUsIF9vayk7XHJcblxyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdGlmIChfb2spXHJcblx0XHRcdFx0XHRcdFx0XHRcdFx0e1xyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0cmV0dXJuIGRhdGFcclxuXHRcdFx0XHRcdFx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdHJldHVybiBudWxsXHJcblx0XHRcdFx0XHRcdFx0XHRcdH0pXHJcblx0XHRcdFx0XHRcdFx0XHRcdC50aGVuKGZ1bmN0aW9uIChkYXRhKVxyXG5cdFx0XHRcdFx0XHRcdFx0XHR7XHJcblx0XHRcdFx0XHRcdFx0XHRcdFx0aWYgKGRhdGEpXHJcblx0XHRcdFx0XHRcdFx0XHRcdFx0e1xyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0Ly9jb25zb2xlLmxvZyh2b2x1bWUpO1xyXG5cclxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdHZvbHVtZS5zZXRDb250ZW50KGRhdGEsIHRydWUpO1xyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0XHRcdFx0fSlcclxuXHRcdFx0XHRcdFx0XHRcdDtcclxuXHRcdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHRcdC8vY29uc29sZS5sb2coZGlybmFtZSk7XHJcblxyXG5cdFx0XHRcdFx0XHQvL3ZvbHVtZS53aXRoU3ViU2VjdGlvbihuZXcgRXB1Yk1ha2VyLlNlY3Rpb24oJ2F1dG8tdG9jJywgbnVsbCwgbnVsbCwgZmFsc2UsIGZhbHNlKSk7XHJcblxyXG5cdFx0XHRcdFx0XHRhd2FpdCBQcm9taXNlLm1hcFNlcmllcyhscywgYXN5bmMgZnVuY3Rpb24gKHJvdylcclxuXHRcdFx0XHRcdFx0e1xyXG5cdFx0XHRcdFx0XHRcdC8vY29uc29sZS5sb2coZmlsZW5hbWUpO1xyXG5cclxuXHRcdFx0XHRcdFx0XHQvL2xldCBkYXRhID0gYXdhaXQgZnMucmVhZEZpbGUocGF0aC5qb2luKFRYVF9QQVRILCBkaXJuYW1lLCBmaWxlbmFtZSkpO1xyXG5cdFx0XHRcdFx0XHRcdGxldCBkYXRhOiBzdHJpbmcgfCBCdWZmZXIgPSBhd2FpdCBmcy5yZWFkRmlsZShyb3cucGF0aCk7XHJcblxyXG5cdFx0XHRcdFx0XHRcdC8vY29uc29sZS5sb2coZGF0YSk7XHJcblxyXG5cdFx0XHRcdFx0XHRcdGlmIChyb3cuZXh0ID09ICcudHh0JylcclxuXHRcdFx0XHRcdFx0XHR7XHJcblx0XHRcdFx0XHRcdFx0XHRkYXRhID0gc3BsaXRUeHQoZGF0YS50b1N0cmluZygpKTtcclxuXHRcdFx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0XHRcdGlmIChCdWZmZXIuaXNCdWZmZXIoZGF0YSkpXHJcblx0XHRcdFx0XHRcdFx0e1xyXG5cdFx0XHRcdFx0XHRcdFx0ZGF0YSA9IGRhdGEudG9TdHJpbmcoKTtcclxuXHRcdFx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0XHRcdGxldCBuYW1lID0gcm93LmNoYXB0ZXJfdGl0bGU7XHJcblxyXG5cdFx0XHRcdFx0XHRcdGlmICghb3B0aW9ucy5ub0xvZylcclxuXHRcdFx0XHRcdFx0XHR7XHJcblx0XHRcdFx0XHRcdFx0XHRsZXQge1xyXG5cdFx0XHRcdFx0XHRcdFx0XHRzb3VyY2VfaWR4LFxyXG5cdFx0XHRcdFx0XHRcdFx0XHR2b2x1bWVfdGl0bGUsXHJcblx0XHRcdFx0XHRcdFx0XHRcdGNoYXB0ZXJfdGl0bGUsXHJcblx0XHRcdFx0XHRcdFx0XHRcdGRpcixcclxuXHRcdFx0XHRcdFx0XHRcdFx0ZmlsZSxcclxuXHRcdFx0XHRcdFx0XHRcdH0gPSByb3c7XHJcblxyXG5cdFx0XHRcdFx0XHRcdFx0Y29uc29sZS5kaXIoe1xyXG5cdFx0XHRcdFx0XHRcdFx0XHRzb3VyY2VfaWR4LFxyXG5cdFx0XHRcdFx0XHRcdFx0XHR2b2x1bWVfdGl0bGUsXHJcblx0XHRcdFx0XHRcdFx0XHRcdGNoYXB0ZXJfdGl0bGUsXHJcblx0XHRcdFx0XHRcdFx0XHRcdGRpcixcclxuXHRcdFx0XHRcdFx0XHRcdFx0ZmlsZSxcclxuXHRcdFx0XHRcdFx0XHRcdH0pO1xyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHRcdFx0bGV0IGNoYXB0ZXIgPSBuZXcgRXB1Yk1ha2VyLlNlY3Rpb24oJ2NoYXB0ZXInLCBgY2hhcHRlciR7KGlkeCsrKS50b1N0cmluZygpXHJcblx0XHRcdFx0XHRcdFx0XHQucGFkU3RhcnQoNCwgJzAnKX1gLCB7XHJcblx0XHRcdFx0XHRcdFx0XHR0aXRsZTogbmFtZSxcclxuXHRcdFx0XHRcdFx0XHRcdGNvbnRlbnQ6IGNybGYoZGF0YSksXHJcblx0XHRcdFx0XHRcdFx0fSwgdHJ1ZSwgZmFsc2UpO1xyXG5cclxuXHRcdFx0XHRcdFx0XHRzdGF0LmNoYXB0ZXIrKztcclxuXHJcblx0XHRcdFx0XHRcdFx0dm9sdW1lLndpdGhTdWJTZWN0aW9uKGNoYXB0ZXIpO1xyXG5cdFx0XHRcdFx0XHR9KTtcclxuXHJcblx0XHRcdFx0XHRcdGlmICghdm9sdW1lW1N5bUNhY2hlXS5pbWFnZSlcclxuXHRcdFx0XHRcdFx0e1xyXG5cdFx0XHRcdFx0XHRcdHZvbHVtZVtTeW1DYWNoZV0uaW1hZ2UgPSB0cnVlO1xyXG5cclxuXHRcdFx0XHRcdFx0XHRhd2FpdCBub3ZlbEdsb2JieS5nbG9iYnkoW1xyXG5cdFx0XHRcdFx0XHRcdFx0XHQnKi57anBnLGdpZixwbmcsanBlZyxzdmd9JyxcclxuXHRcdFx0XHRcdFx0XHRcdFx0J2ltYWdlLyoue2pwZyxnaWYscG5nLGpwZWcsc3ZnfScsXHJcblx0XHRcdFx0XHRcdFx0XHRcdCdpbWFnZXMvKi57anBnLGdpZixwbmcsanBlZyxzdmd9JyxcclxuXHRcdFx0XHRcdFx0XHRcdFx0JyFjb3Zlci4qJyxcclxuXHRcdFx0XHRcdFx0XHRcdFx0JyEqLnR4dCcsXHJcblx0XHRcdFx0XHRcdFx0XHRdLCB7XHJcblx0XHRcdFx0XHRcdFx0XHRcdGN3ZDogZGlybmFtZSxcclxuXHRcdFx0XHRcdFx0XHRcdFx0YWJzb2x1dGU6IHRydWUsXHJcblx0XHRcdFx0XHRcdFx0XHR9KVxyXG5cdFx0XHRcdFx0XHRcdFx0LnRoZW4obHMgPT5cclxuXHRcdFx0XHRcdFx0XHRcdHtcclxuXHRcdFx0XHRcdFx0XHRcdFx0bGV0IGFyciA9IFtdO1xyXG5cclxuXHRcdFx0XHRcdFx0XHRcdFx0Zm9yIChsZXQgaSBpbiBscylcclxuXHRcdFx0XHRcdFx0XHRcdFx0e1xyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdGxldCBpbWcgPSBsc1tpXTtcclxuXHJcblx0XHRcdFx0XHRcdFx0XHRcdFx0bGV0IGV4dCA9IHBhdGguZXh0bmFtZShpbWcpO1xyXG5cclxuXHRcdFx0XHRcdFx0XHRcdFx0XHRsZXQgYmFzZW5hbWUgPSBwYXRoLmJhc2VuYW1lKGltZywgZXh0KTtcclxuXHJcblx0XHRcdFx0XHRcdFx0XHRcdFx0Ly8gQHRzLWlnbm9yZVxyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdGxldCBuYW1lID0gc2x1Z2lmeShiYXNlbmFtZSk7XHJcblxyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdGlmICghbmFtZSB8fCBhcnIuaW5jbHVkZXMobmFtZSkpXHJcblx0XHRcdFx0XHRcdFx0XHRcdFx0e1xyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0bmFtZSA9IGhhc2hTdW0oW2ltZywgaSwgbmFtZV0pO1xyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHRcdFx0XHRcdFx0Ly9uYW1lID0gYCR7dmlkfS8ke2l9LWAgKyBuYW1lICsgZXh0O1xyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdG5hbWUgPSBgJHt2aWR9L2AgKyBuYW1lICsgZXh0O1xyXG5cclxuXHRcdFx0XHRcdFx0XHRcdFx0XHRhcnIucHVzaCgnaW1hZ2UvJyArIG5hbWUpO1xyXG5cclxuXHRcdFx0XHRcdFx0XHRcdFx0XHRlcHViLndpdGhBZGRpdGlvbmFsRmlsZShpbWcsICdpbWFnZScsIG5hbWUpO1xyXG5cdFx0XHRcdFx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0XHRcdFx0XHRpZiAoYXJyLmxlbmd0aClcclxuXHRcdFx0XHRcdFx0XHRcdFx0e1xyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdGlmICh2b2x1bWUuY29udGVudCAmJiB2b2x1bWUuY29udGVudC5jb3ZlciAmJiB2b2x1bWUuY29udGVudC5jb3Zlci5uYW1lKVxyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdHtcclxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdGFyci51bnNoaWZ0KHZvbHVtZS5jb250ZW50LmNvdmVyLm5hbWUpO1xyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHRcdFx0XHRcdFx0bGV0IGNoYXB0ZXIgPSBuZXcgRXB1Yk1ha2VyLlNlY3Rpb24oJ25vbi1zcGVjaWZpYyBiYWNrbWF0dGVyJywgYGltYWdlJHsoaWR4KyspLnRvU3RyaW5nKClcclxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdC5wYWRTdGFydCg0LCAnMCcpfWAsIHtcclxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdHRpdGxlOiAn5o+S5ZyWJyxcclxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdGNvbnRlbnQ6IGFyci5yZWR1Y2UoZnVuY3Rpb24gKGEsIGIpXHJcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHR7XHJcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGxldCBodG1sID0gYDxmaWd1cmUgY2xhc3M9XCJmdWxscGFnZSBJbWFnZUNvbnRhaW5lciBwYWdlLWJyZWFrLWJlZm9yZVwiPjxpbWcgaWQ9XCJDb3ZlckltYWdlXCIgY2xhc3M9XCJDb3ZlckltYWdlXCIgc3JjPVwiJHtifVwiIGFsdD1cIkNvdmVyXCIgLz48L2ZpZ3VyZT5gO1xyXG5cclxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0YS5wdXNoKGh0bWwpO1xyXG5cclxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0cmV0dXJuIGE7XHJcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHR9LCBbXSkuam9pbihcIlxcblwiKSxcclxuXHRcdFx0XHRcdFx0XHRcdFx0XHR9LCB0cnVlLCBmYWxzZSk7XHJcblxyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdHN0YXQuaW1hZ2UgKz0gYXJyLmxlbmd0aDtcclxuXHJcblx0XHRcdFx0XHRcdFx0XHRcdFx0dm9sdW1lLndpdGhTdWJTZWN0aW9uKGNoYXB0ZXIpO1xyXG5cdFx0XHRcdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdFx0XHR9KVxyXG5cdFx0XHRcdFx0XHRcdDtcclxuXHJcblx0XHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHRcdC8vZXB1Yi53aXRoU2VjdGlvbih2b2x1bWUpO1xyXG5cclxuXHRcdFx0XHRcdFx0aWYgKF9uZXdfdG9wX2xldmVsKVxyXG5cdFx0XHRcdFx0XHR7XHJcblx0XHRcdFx0XHRcdFx0ZXB1Yi53aXRoU2VjdGlvbihfbmV3X3RvcF9sZXZlbCk7XHJcblx0XHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHRcdHJldHVybiB2b2x1bWU7XHJcblx0XHRcdFx0XHR9KVxyXG5cdFx0XHRcdFx0O1xyXG5cdFx0XHR9KVxyXG5cdFx0O1xyXG5cclxuLy9cdFx0Y29uc29sZS5sb2coZXB1Yi5lcHViQ29uZmlnLnNlY3Rpb25zKTtcclxuLy9cdFx0cHJvY2Vzcy5leGl0KCk7XHJcblxyXG5cdFx0bGV0IGRhdGEgPSBhd2FpdCBlcHViLm1ha2VFcHViKCk7XHJcblxyXG5cdFx0bGV0IF9maWxlX2RhdGEgPSBtYWtlRmlsZW5hbWUob3B0aW9ucywgZXB1YiwgbWV0YSk7XHJcblxyXG5cdFx0bGV0IHsgZmlsZSwgZmlsZW5hbWUsIG5vdywgYmFzZW5hbWUsIGV4dCB9ID0gX2ZpbGVfZGF0YTtcclxuXHJcblx0XHRhd2FpdCBmcy5vdXRwdXRGaWxlKGZpbGUsIGRhdGEpO1xyXG5cclxuXHRcdGNvbnNvbGUuc3VjY2VzcyhmaWxlbmFtZSwgbm93LmZvcm1hdCgpKTtcclxuXHJcblx0XHRyZXR1cm4ge1xyXG5cdFx0XHRmaWxlLFxyXG5cdFx0XHRmaWxlbmFtZSxcclxuXHRcdFx0ZXB1YixcclxuXHJcblx0XHRcdG91dHB1dFBhdGg6IG9wdGlvbnMub3V0cHV0UGF0aCxcclxuXHJcblx0XHRcdGJhc2VuYW1lLFxyXG5cdFx0XHRleHQsXHJcblxyXG5cdFx0XHRzdGF0LFxyXG5cdFx0fTtcclxuXHR9KTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIG1ha2VGaWxlbmFtZShvcHRpb25zOiBJT3B0aW9ucywgZXB1YjogRXB1Yk1ha2VyLCBtZXRhOiBJTWRjb25mTWV0YSlcclxue1xyXG5cdG9wdGlvbnMgPSBtYWtlT3B0aW9ucyhvcHRpb25zKTtcclxuXHJcblx0bGV0IGZpbGVuYW1lID0gZXB1Yi5nZXRGaWxlbmFtZShvcHRpb25zLnVzZVRpdGxlLCB0cnVlKTtcclxuXHJcblx0aWYgKCFvcHRpb25zLmZpbGVuYW1lKVxyXG5cdHtcclxuXHRcdGlmIChvcHRpb25zLmZpbGVuYW1lTG9jYWwpXHJcblx0XHR7XHJcblx0XHRcdC8vIEB0cy1pZ25vcmVcclxuXHRcdFx0aWYgKG1ldGEubm92ZWwudGl0bGVfb3V0cHV0KVxyXG5cdFx0XHR7XHJcblx0XHRcdFx0Ly8gQHRzLWlnbm9yZVxyXG5cdFx0XHRcdGZpbGVuYW1lID0gbWV0YS5ub3ZlbC50aXRsZV9vdXRwdXQ7XHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSBpZiAoQXJyYXkuaXNBcnJheShvcHRpb25zLmZpbGVuYW1lTG9jYWwpKVxyXG5cdFx0XHR7XHJcblx0XHRcdFx0Zm9yIChsZXQgdiBvZiBvcHRpb25zLmZpbGVuYW1lTG9jYWwpXHJcblx0XHRcdFx0e1xyXG5cdFx0XHRcdFx0aWYgKG1ldGEubm92ZWxbdl0pXHJcblx0XHRcdFx0XHR7XHJcblx0XHRcdFx0XHRcdGZpbGVuYW1lID0gbWV0YS5ub3ZlbFt2XTtcclxuXHRcdFx0XHRcdFx0YnJlYWs7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHRcdGVsc2UgaWYgKG1ldGEubm92ZWwudGl0bGVfemgpXHJcblx0XHRcdHtcclxuXHRcdFx0XHRmaWxlbmFtZSA9IG1ldGEubm92ZWwudGl0bGVfemg7XHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSBpZiAobWV0YS5ub3ZlbC50aXRsZV9zaG9ydClcclxuXHRcdFx0e1xyXG5cdFx0XHRcdGZpbGVuYW1lID0gbWV0YS5ub3ZlbC50aXRsZV9zaG9ydDtcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIGlmICh0eXBlb2Ygb3B0aW9ucy5maWxlbmFtZUxvY2FsID09ICdzdHJpbmcnKVxyXG5cdFx0XHR7XHJcblx0XHRcdFx0ZmlsZW5hbWUgPSBvcHRpb25zLmZpbGVuYW1lTG9jYWw7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGNvbnN0IGJhc2VuYW1lID0gZmlsZW5hbWU7XHJcblxyXG5cdGxldCBleHQgPSBFcHViTWFrZXIuZGVmYXVsdEV4dDtcclxuXHJcblx0bGV0IG5vdyA9IG1vbWVudCgpO1xyXG5cclxuXHRpZiAob3B0aW9ucy5wYWRFbmREYXRlKVxyXG5cdHtcclxuXHRcdGZpbGVuYW1lICs9ICdfJyArIG5vdy5mb3JtYXQoJ1lZWVlNTUREX0hIbW1zcycpO1xyXG5cdH1cclxuXHJcblx0ZmlsZW5hbWUgKz0gZXh0O1xyXG5cclxuXHRsZXQgZmlsZSA9IHBhdGguam9pbihvcHRpb25zLm91dHB1dFBhdGgsIGZpbGVuYW1lKTtcclxuXHJcblx0cmV0dXJuIHtcclxuXHRcdGZpbGUsXHJcblx0XHRleHQsXHJcblx0XHRmaWxlbmFtZSxcclxuXHRcdG9wdGlvbnMsXHJcblx0XHRub3csXHJcblx0XHRiYXNlbmFtZSxcclxuXHRcdGVwdWIsXHJcblx0XHRtZXRhLFxyXG5cdH1cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgY3JlYXRlO1xyXG4iXX0=