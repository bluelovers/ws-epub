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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHh0MmVwdWIzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidHh0MmVwdWIzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7R0FFRzs7QUFHSCxtREFBdUQ7QUFDdkQsK0JBQStCO0FBQy9CLDZDQUEwRDtBQUMxRCxvQ0FBcUM7QUFDckMsK0JBQStCO0FBRS9CLGlDQUFpQztBQUNqQyxpREFBaUQ7QUFDakQscURBQXFFO0FBQ3JFLGlDQUFrQztBQUNsQyxtREFBc0Q7QUFDdEQsNENBQTRDO0FBQzVDLHFEQUF3RDtBQUN4RCwrQ0FBdUM7QUFDdkMsbURBQXNDO0FBRXpCLFFBQUEsT0FBTyxHQUFHLElBQUksc0JBQU8sQ0FBQyxJQUFJLEVBQUU7SUFDeEMsT0FBTyxFQUFFLElBQUk7SUFDYixjQUFjLEVBQUU7UUFDZixNQUFNLEVBQUUsSUFBSTtLQUNaO0lBQ0QsWUFBWSxFQUFFO1FBQ2IsT0FBTyxFQUFFLElBQUk7S0FDYjtDQUNELENBQUMsQ0FBQztBQUVILGVBQU8sQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDO0FBaUNmLFFBQUEsY0FBYyxHQUFzQixNQUFNLENBQUMsTUFBTSxDQUFDO0lBQzlELFlBQVksRUFBRSxZQUFZO0lBQzFCLFlBQVksRUFBRSxJQUFJO0lBQ2xCLG1CQUFtQjtJQUVuQixhQUFhLEVBQUU7UUFDZCxVQUFVLEVBQUUsSUFBSTtRQUNoQix5QkFBeUIsRUFBRSxJQUFJO0tBQy9CO0NBQ0QsQ0FBQyxDQUFDO0FBRUgsU0FBZ0IsWUFBWSxDQUFDLE9BQWlCLEVBQUUsS0FBSyxHQUFHLEVBQUU7SUFFekQsT0FBTyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUMsSUFBSSxDQUFDLEtBQUs7UUFFbEMsSUFBSSxJQUFpQixDQUFDO1FBQ3RCLElBQUksUUFBZ0IsQ0FBQztRQUVyQixJQUFJLE9BQU8sQ0FBQyxTQUFTLElBQUksT0FBTyxPQUFPLENBQUMsU0FBUyxJQUFJLFFBQVEsRUFDN0Q7WUFDQyxJQUFJLEdBQUcsT0FBTyxD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LE1BQU0sUUFBUSxHQUFHLFFBQVEsQ0FBQztJQUUxQixJQUFJLEdBQUcsR0FBRyxxQkFBUyxDQUFDLFVBQVUsQ0FBQztJQUUvQixJQUFJLEdBQUcsR0FBRyxNQUFNLEVBQUUsQ0FBQztJQUVuQixJQUFJLE9BQU8sQ0FBQyxVQUFVLEVBQ3RCO1FBQ0MsUUFBUSxJQUFJLEdBQUcsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDLGlCQUFpQixDQUFDLENBQUM7S0FDaEQ7SUFFRCxRQUFRLElBQUksR0FBRyxDQUFDO0lBRWhCLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUVuRCxPQUFPO1FBQ04sSUFBSTtRQUNKLEdBQUc7UUFDSCxRQUFRO1FBQ1IsT0FBTztRQUNQLEdBQUc7UUFDSCxRQUFRO1FBQ1IsSUFBSTtRQUNKLElBQUk7S0FDSixDQUFBO0FBQ0YsQ0FBQztBQW5FRCxvQ0FtRUM7QUFFRCxrQkFBZSxNQUFNLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENyZWF0ZWQgYnkgdXNlciBvbiAyMDE3LzEyLzE2LzAxNi5cbiAqL1xuXG5pbXBvcnQgeyBJU2VjdGlvbkNvbnRlbnQgfSBmcm9tICdlcHViLW1ha2VyMi9zcmMvaW5kZXgnO1xuaW1wb3J0IHsgaHRtbFByZWZhY2UgfSBmcm9tICdlcHViLW1ha2VyMi9zcmMvbGliL3V0aWwnO1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMtaWNvbnYnO1xuaW1wb3J0IEVwdWJNYWtlciwgeyBoYXNoU3VtLCBzbHVnaWZ5IH0gZnJvbSAnZXB1Yi1tYWtlcjInO1xuaW1wb3J0IFByb21pc2UgPSByZXF1aXJlKCdibHVlYmlyZCcpO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICd1cGF0aDInO1xuaW1wb3J0ICogYXMgU3RyVXRpbCBmcm9tICdzdHItdXRpbCc7XG5pbXBvcnQgKiBhcyBtb21lbnQgZnJvbSAnbW9tZW50JztcbmltcG9ydCAqIGFzIG5vdmVsR2xvYmJ5IGZyb20gJ25vZGUtbm92ZWwtZ2xvYmJ5JztcbmltcG9ydCB7IG1kY29uZl9wYXJzZSwgSU1kY29uZk1ldGEsIGNoa0luZm8gfSBmcm9tICdub2RlLW5vdmVsLWluZm8nO1xuaW1wb3J0IHsgc3BsaXRUeHQgfSBmcm9tICcuL3V0aWwnO1xuaW1wb3J0IHsgY3JlYXRlVVVJRCB9IGZyb20gJ2VwdWItbWFrZXIyL3NyYy9saWIvdXVpZCc7XG5pbXBvcnQgKiBhcyBkZWVwbWVyZ2UgZnJvbSAnZGVlcG1lcmdlLXBsdXMnO1xuaW1wb3J0IHsgbm9ybWFsaXplX3N0cmlwIH0gZnJvbSAnQG5vZGUtbm92ZWwvbm9ybWFsaXplJztcbmltcG9ydCB7IENvbnNvbGUgfSBmcm9tICdkZWJ1Zy1jb2xvcjInO1xuaW1wb3J0IHsgY3JsZiB9IGZyb20gJ2NybGYtbm9ybWFsaXplJztcblxuZXhwb3J0IGNvbnN0IGNvbnNvbGUgPSBuZXcgQ29uc29sZShudWxsLCB7XG5cdGVuYWJsZWQ6IHRydWUsXG5cdGluc3BlY3RPcHRpb25zOiB7XG5cdFx0Y29sb3JzOiB0cnVlLFxuXHR9LFxuXHRjaGFsa09wdGlvbnM6IHtcblx0XHRlbmFibGVkOiB0cnVlLFxuXHR9LFxufSk7XG5cbmNvbnNvbGUuZW5hYmxlZENvbG9yID0gdHJ1ZTtcblxuZXhwb3J0IGludGVyZmFjZSBJT3B0aW9uc1xue1xuXHQvKipcblx0ICog5bCP6KqqIHR4dCDnmoTkuLvos4fmlpnlpL7ot6/lvpFcblx0ICogQHR5cGUge3N0cmluZ31cblx0ICovXG5cdGlucHV0UGF0aDogc3RyaW5nLFxuXHRvdXRwdXRQYXRoOiBzdHJpbmcsXG5cblx0LyoqXG5cdCAqIOWwj+iqquWQjeeosUlEXG5cdCAqL1xuXHRub3ZlbElEPzogc3RyaW5nLFxuXHRmaWxlbmFtZT86IHN0cmluZyxcblxuXHRub3ZlbENvbmY/LFxuXG5cdGVwdWJUZW1wbGF0ZT8sXG5cblx0ZXB1Ykxhbmd1YWdlPzogc3RyaW5nLFxuXG5cdHBhZEVuZERhdGU/OiBib29sZWFuLFxuXG5cdGdsb2JieU9wdGlvbnM/OiBub3ZlbEdsb2JieS5JT3B0aW9ucyxcblxuXHR1c2VUaXRsZT86IGJvb2xlYW4sXG5cdGZpbGVuYW1lTG9jYWw/OiBib29sZWFuIHwgc3RyaW5nW10gfCBzdHJpbmcsXG5cblx0bm9Mb2c/OiBib29sZWFuLFxufVxuXG5leHBvcnQgY29uc3QgZGVmYXVsdE9wdGlvbnM6IFBhcnRpYWw8SU9wdGlvbnM+ID0gT2JqZWN0LmZyZWV6ZSh7XG5cdGVwdWJUZW1wbGF0ZTogJ2xpZ2h0bm92ZWwnLFxuXHRlcHViTGFuZ3VhZ2U6ICd6aCcsXG5cdC8vcGFkRW5kRGF0ZTogdHJ1ZSxcblxuXHRnbG9iYnlPcHRpb25zOiB7XG5cdFx0Y2hlY2tSb21hbjogdHJ1ZSxcblx0XHR1c2VEZWZhdWx0UGF0dGVybnNFeGNsdWRlOiB0cnVlLFxuXHR9LFxufSk7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXROb3ZlbENvbmYob3B0aW9uczogSU9wdGlvbnMsIGNhY2hlID0ge30pOiBQcm9taXNlPElNZGNvbmZNZXRhPlxue1xuXHRyZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCkudGhlbihhc3luYyBmdW5jdGlvbiAoKVxuXHR7XG5cdFx0bGV0IG1ldGE6IElNZGNvbmZNZXRhO1xuXHRcdGxldCBjb25mUGF0aDogc3RyaW5nO1xuXG5cdFx0aWYgKG9wdGlvbnMubm92ZWxDb25mICYmIHR5cGVvZiBvcHRpb25zLm5vdmVsQ29uZiA9PSAnb2JqZWN0Jylcblx0XHR7XG5cdFx0XHRtZXRhID0gb3B0aW9ucy5ub3ZlbENvbmY7XG5cdFx0fVxuXHRcdGVsc2Vcblx0XHR7XG5cdFx0XHRpZiAodHlwZW9mIG9wdGlvbnMubm92ZWxDb25mID09ICdzdHJpbmcnKVxuXHRcdFx0e1xuXHRcdFx0XHRjb25mUGF0aCA9IG9wdGlvbnMubm92ZWxDb25mO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZVxuXHRcdFx0e1xuXHRcdFx0XHRjb25mUGF0aCA9IG9wdGlvbnMuaW5wdXRQYXRoO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoZnMuZXhpc3RzU3luYyhwYXRoLmpvaW4oY29uZlBhdGgsICdtZXRhLm1kJykpKVxuXHRcdFx0e1xuXHRcdFx0XHRsZXQgZmlsZSA9IHBhdGguam9pbihjb25mUGF0aCwgJ21ldGEubWQnKTtcblxuXHRcdFx0XHRtZXRhID0gYXdhaXQgZnMucmVhZEZpbGUoZmlsZSlcblx0XHRcdFx0XHQudGhlbihtZGNvbmZfcGFyc2UpXG5cdFx0XHRcdDtcblx0XHRcdH1cblx0XHRcdGVsc2UgaWYgKGZzLmV4aXN0c1N5bmMocGF0aC5qb2luKGNvbmZQYXRoLCAnUkVBRE1FLm1kJykpKVxuXHRcdFx0e1xuXHRcdFx0XHRsZXQgZmlsZSA9IHBhdGguam9pbihjb25mUGF0aCwgJ1JFQURNRS5tZCcpO1xuXG5cdFx0XHRcdG1ldGEgPSBhd2FpdCBmcy5yZWFkRmlsZShmaWxlKVxuXHRcdFx0XHRcdC50aGVuKG1kY29uZl9wYXJzZSlcblx0XHRcdFx0O1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdG1ldGEgPSBjaGtJbmZvKG1ldGEpO1xuXG5cdFx0aWYgKCFtZXRhIHx8ICFtZXRhLm5vdmVsIHx8ICFtZXRhLm5vdmVsLnRpdGxlKVxuXHRcdHtcblx0XHRcdHRocm93IG5ldyBFcnJvcihgbm90IGEgdmFsaWQgbm92ZWxJbmZvIGRhdGFgKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gbWV0YTtcblx0fSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1ha2VPcHRpb25zKG9wdGlvbnM6IElPcHRpb25zKVxue1xuXHRvcHRpb25zID0gT2JqZWN0LmtleXMob3B0aW9ucylcblx0XHQuZmlsdGVyKHYgPT4gdHlwZW9mIG9wdGlvbnNbdl0gIT0gJ3VuZGVmaW5lZCcpXG5cdFx0LnJlZHVjZShmdW5jdGlvbiAoYSwgYilcblx0XHR7XG5cdFx0XHRhW2JdID0gb3B0aW9uc1tiXTtcblxuXHRcdFx0cmV0dXJuIGFcblx0XHR9LCB7fSBhcyBJT3B0aW9ucylcblx0O1xuXG5cdHJldHVybiBvcHRpb25zID0gZGVlcG1lcmdlLmFsbChbe30sIGRlZmF1bHRPcHRpb25zLCBvcHRpb25zXSk7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSU5vdmVsRXB1YlJldHVybkluZm9cbntcblx0ZmlsZTogc3RyaW5nLFxuXHRmaWxlbmFtZTogc3RyaW5nLFxuXHRlcHViOiBFcHViTWFrZXIsXG5cblx0b3V0cHV0UGF0aDogc3RyaW5nLFxuXHRiYXNlbmFtZTogc3RyaW5nLFxuXHRleHQ6IHN0cmluZyxcblxuXHRzdGF0OiB7XG5cdFx0dm9sdW1lOiBudW1iZXIsXG5cdFx0Y2hhcHRlcjogbnVtYmVyLFxuXHRcdGltYWdlOiBudW1iZXIsXG5cdH0sXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGUob3B0aW9uczogSU9wdGlvbnMsIGNhY2hlID0ge30pOiBQcm9taXNlPElOb3ZlbEVwdWJSZXR1cm5JbmZvPlxue1xuXHRyZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCkudGhlbihhc3luYyBmdW5jdGlvbiAoKVxuXHR7XG5cdFx0Ly9jb25zb2xlLmxvZyhvcHRpb25zLCBkZWZhdWx0T3B0aW9ucyk7XG5cblx0XHRvcHRpb25zID0gbWFrZU9wdGlvbnMob3B0aW9ucyk7XG5cblx0XHQvL2NvbnNvbGUuZGlyKG9wdGlvbnMsIHtjb2xvcnM6IHRydWV9KTtcblxuXHRcdGxldCBub3ZlbElEID0gb3B0aW9ucy5ub3ZlbElEO1xuXHRcdGxldCBUWFRfUEFUSCA9IG9wdGlvbnMuaW5wdXRQYXRoO1xuXG5cdFx0bGV0IG1ldGEgPSBhd2FpdCBnZXROb3ZlbENvbmYob3B0aW9ucywgY2FjaGUpO1xuXG5cdFx0bGV0IGdsb2JieV9wYXR0ZXJuczogc3RyaW5nW107XG5cdFx0bGV0IGdsb2JieV9vcHRpb25zOiBub3ZlbEdsb2JieS5JT3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe30sIG9wdGlvbnMuZ2xvYmJ5T3B0aW9ucywge1xuXHRcdFx0Y3dkOiBUWFRfUEFUSCxcblx0XHRcdC8vdXNlRGVmYXVsdFBhdHRlcm5zRXhjbHVkZTogdHJ1ZSxcblx0XHRcdC8vY2hlY2tSb21hbjogdHJ1ZSxcblx0XHR9KTtcblxuXHRcdHtcblx0XHRcdFtnbG9iYnlfcGF0dGVybnMsIGdsb2JieV9vcHRpb25zXSA9IG5vdmVsR2xvYmJ5LmdldE9wdGlvbnMoZ2xvYmJ5X29wdGlvbnMpO1xuXHRcdH1cblxuXHRcdC8vY29uc29sZS5sb2cob3B0aW9ucywgZ2xvYmJ5X29wdGlvbnMpO1xuXG5cdFx0Ly9jb25zb2xlLmRpcihvcHRpb25zKTtcblxuXHRcdGNvbnNvbGUuaW5mbyhtZXRhLm5vdmVsLnRpdGxlKTtcblx0XHQvL2NvbnNvbGUubG9nKG1ldGEubm92ZWwucHJlZmFjZSk7XG5cblx0XHRsZXQgZXB1YjogRXB1Yk1ha2VyID0gbmV3IEVwdWJNYWtlcigpXG5cdFx0XHQud2l0aFRlbXBsYXRlKG9wdGlvbnMuZXB1YlRlbXBsYXRlKVxuXHRcdFx0LndpdGhMYW5ndWFnZShvcHRpb25zLmVwdWJMYW5ndWFnZSlcblx0XHRcdC53aXRoVXVpZChjcmVhdGVVVUlEKGhhc2hTdW0oW1xuXHRcdFx0XHRtZXRhLm5vdmVsLnRpdGxlLFxuXHRcdFx0XHRtZXRhLm5vdmVsLmF1dGhvcixcblx0XHRcdF0pKSlcblx0XHRcdC53aXRoVGl0bGUobWV0YS5ub3ZlbC50aXRsZSwgbWV0YS5ub3ZlbC50aXRsZV9zaG9ydCB8fCBtZXRhLm5vdmVsLnRpdGxlX3poKVxuXHRcdFx0LndpdGhBdXRob3IobWV0YS5ub3ZlbC5hdXRob3IpXG5cdFx0XHQuYWRkQXV0aG9yKG1ldGEubm92ZWwuYXV0aG9yKVxuXHRcdFx0LndpdGhDb2xsZWN0aW9uKHtcblx0XHRcdFx0bmFtZTogbWV0YS5ub3ZlbC50aXRsZSxcblx0XHRcdH0pXG5cdFx0XHQud2l0aEluZm9QcmVmYWNlKG1ldGEubm92ZWwucHJlZmFjZSlcblx0XHRcdC5hZGRUYWcobWV0YS5ub3ZlbC50YWdzKVxuXHRcdFx0LmFkZEF1dGhvcihtZXRhLmNvbnRyaWJ1dGUpXG5cdFx0O1xuXG5cdFx0aWYgKG9wdGlvbnMuZmlsZW5hbWUpXG5cdFx0e1xuXHRcdFx0ZXB1Yi5lcHViQ29uZmlnLmZpbGVuYW1lID0gb3B0aW9ucy5maWxlbmFtZTtcblx0XHR9XG5cblx0XHRpZiAobWV0YS5ub3ZlbC5zb3VyY2UpXG5cdFx0e1xuXHRcdFx0ZXB1Yi5hZGRMaW5rcyhtZXRhLm5vdmVsLnNvdXJjZSk7XG5cdFx0fVxuXG5cdFx0aWYgKG1ldGEubm92ZWwuc2VyaWVzKVxuXHRcdHtcblx0XHRcdGVwdWIud2l0aFNlcmllcyhtZXRhLm5vdmVsLnNlcmllcy5uYW1lLCBtZXRhLm5vdmVsLnNlcmllcy5wb3NpdGlvbik7XG5cdFx0fVxuXHRcdGVsc2Vcblx0XHR7XG5cdFx0XHRlcHViLndpdGhTZXJpZXMobWV0YS5ub3ZlbC50aXRsZSk7XG5cdFx0fVxuXG5cdFx0aWYgKG1ldGEubm92ZWwucHVibGlzaGVyKVxuXHRcdHtcblx0XHRcdGVwdWIud2l0aFB1Ymxpc2hlcihtZXRhLm5vdmVsLnB1Ymxpc2hlciB8fCAnbm9kZS1ub3ZlbCcpO1xuXHRcdH1cblxuXHRcdGlmIChtZXRhLm5vdmVsLmRhdGUpXG5cdFx0e1xuXHRcdFx0ZXB1Yi53aXRoTW9kaWZpY2F0aW9uRGF0ZShtZXRhLm5vdmVsLmRhdGUpO1xuXHRcdH1cblxuXHRcdGlmIChtZXRhLm5vdmVsLnN0YXR1cylcblx0XHR7XG5cdFx0XHRlcHViLmFkZFRhZyhtZXRhLm5vdmVsLnN0YXR1cyk7XG5cdFx0fVxuXG5cdFx0aWYgKG1ldGEubm92ZWwuY292ZXIpXG5cdFx0e1xuXHRcdFx0ZXB1Yi53aXRoQ292ZXIobWV0YS5ub3ZlbC5jb3Zlcik7XG5cdFx0fVxuXHRcdGVsc2Vcblx0XHR7XG5cdFx0XHRhd2FpdCBub3ZlbEdsb2JieS5nbG9iYnkoW1xuXHRcdFx0XHRcdCdjb3Zlci4qJyxcblx0XHRcdFx0XSwgT2JqZWN0LmFzc2lnbih7fSwgZ2xvYmJ5X29wdGlvbnMsIHtcblx0XHRcdFx0XHRhYnNvbHV0ZTogdHJ1ZSxcblx0XHRcdFx0fSkpXG5cdFx0XHRcdC50aGVuKGxzID0+XG5cdFx0XHRcdHtcblx0XHRcdFx0XHRpZiAobHMubGVuZ3RoKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGVwdWIud2l0aENvdmVyKGxzWzBdKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRjb25zb2xlLmxvZyhscyk7XG5cdFx0XHRcdH0pXG5cdFx0XHQ7XG5cdFx0fVxuXG5cdFx0Ly9wcm9jZXNzLmV4aXQoKTtcblxuXHRcdGxldCBzdGF0OiBJTm92ZWxFcHViUmV0dXJuSW5mb1tcInN0YXRcIl0gPSB7XG5cdFx0XHR2b2x1bWU6IDAsXG5cdFx0XHRjaGFwdGVyOiAwLFxuXHRcdFx0aW1hZ2U6IDAsXG5cdFx0fTtcblxuXHRcdGF3YWl0IG5vdmVsR2xvYmJ5XG5cdFx0XHQuZ2xvYmJ5QVN5bmMoZ2xvYmJ5X3BhdHRlcm5zLCBnbG9iYnlfb3B0aW9ucylcblx0XHRcdC50aGVuKGZ1bmN0aW9uIChscylcblx0XHRcdHtcblx0XHRcdFx0Ly9jb25zb2xlLmxvZyhscyk7XG5cblx0XHRcdFx0Ly9wcm9jZXNzLmV4aXQoKTtcblxuXHRcdFx0XHRyZXR1cm4gbHM7XG5cdFx0XHR9KVxuXHRcdFx0LnRoZW4oX2xzID0+XG5cdFx0XHR7XG5cdFx0XHRcdGxldCBpZHggPSAxO1xuXG5cdFx0XHRcdGxldCBjYWNoZVRyZWVTZWN0aW9uID0ge30gYXMge1xuXHRcdFx0XHRcdFtrOiBzdHJpbmddOiBFcHViTWFrZXIuU2VjdGlvbixcblx0XHRcdFx0fTtcblxuXHRcdFx0XHRjb25zdCBTeW1DYWNoZSA9IFN5bWJvbCgnY2FjaGUnKTtcblxuXHRcdFx0XHRyZXR1cm4gUHJvbWlzZVxuXHRcdFx0XHRcdC5tYXBTZXJpZXMoT2JqZWN0LmtleXMoX2xzKSwgYXN5bmMgZnVuY3Rpb24gKHZhbF9kaXIpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0bGV0IGxzID0gX2xzW3ZhbF9kaXJdO1xuXHRcdFx0XHRcdFx0bGV0IGRpcm5hbWUgPSBsc1swXS5wYXRoX2Rpcjtcblx0XHRcdFx0XHRcdGxldCB2b2x1bWVfdGl0bGUgPSBsc1swXS52b2x1bWVfdGl0bGU7XG5cblx0XHRcdFx0XHRcdGxldCB2b2x1bWUgPSBjYWNoZVRyZWVTZWN0aW9uW3ZhbF9kaXJdO1xuXG5cdFx0XHRcdFx0XHRsZXQgX25ld190b3BfbGV2ZWw6IEVwdWJNYWtlci5TZWN0aW9uO1xuXG5cdFx0XHRcdFx0XHRpZiAoIWNhY2hlVHJlZVNlY3Rpb25bdmFsX2Rpcl0pXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdGxldCBfdHMyID0gdm9sdW1lX3RpdGxlLnNwbGl0KCcvJyk7XG5cdFx0XHRcdFx0XHRcdGxldCBfdHMgPSB2YWxfZGlyLnNwbGl0KCcvJyk7XG5cblx0XHRcdFx0XHRcdFx0bGV0IF9kcyA9IChwYXRoLm5vcm1hbGl6ZShkaXJuYW1lKSBhcyBzdHJpbmcpLnNwbGl0KCcvJyk7XG5cblx0XHRcdFx0XHRcdFx0bGV0IF9sYXN0OiBFcHViTWFrZXIuU2VjdGlvbjtcblxuXHRcdFx0XHRcdFx0XHRmb3IgKGxldCBpID0gMDsgaSA8IF90cy5sZW5ndGg7IGkrKylcblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdGxldCBfbmF2cyA9IF90cy5zbGljZSgwLCBpICsgMSk7XG5cdFx0XHRcdFx0XHRcdFx0bGV0IF9uYXYgPSBfbmF2cy5qb2luKCcvJyk7XG5cblx0XHRcdFx0XHRcdFx0XHRsZXQgX25hdl9kaXIgPSBfZHMuc2xpY2UoMCwgX2RzLmxlbmd0aCAtIF90cy5sZW5ndGggKyBpICsgMSkuam9pbignLycpO1xuXG5cdFx0XHRcdFx0XHRcdFx0Lypcblx0XHRcdFx0XHRcdFx0XHRjb25zb2xlLmRpcih7XG5cdFx0XHRcdFx0XHRcdFx0XHRfbmF2cyxcblx0XHRcdFx0XHRcdFx0XHRcdF9uYXYsXG5cdFx0XHRcdFx0XHRcdFx0XHRfbmF2X2Rpcixcblx0XHRcdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdFx0XHQqL1xuXG5cdFx0XHRcdFx0XHRcdFx0aWYgKCFjYWNoZVRyZWVTZWN0aW9uW19uYXZdKVxuXHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdGxldCB2aWQgPSBgdm9sdW1lJHsoaWR4KyspLnRvU3RyaW5nKCkucGFkU3RhcnQoNiwgJzAnKX1gO1xuXG5cdFx0XHRcdFx0XHRcdFx0XHRsZXQgdGl0bGUgPSBub3JtYWxpemVfc3RyaXAoX3RzMltpXSwgdHJ1ZSk7XG5cblx0XHRcdFx0XHRcdFx0XHRcdGNhY2hlVHJlZVNlY3Rpb25bX25hdl0gPSBuZXcgRXB1Yk1ha2VyLlNlY3Rpb24oJ2F1dG8tdG9jJywgdmlkLCB7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdHRpdGxlOiB0aXRsZSxcblx0XHRcdFx0XHRcdFx0XHRcdH0sIGZhbHNlLCB0cnVlKTtcblxuXHRcdFx0XHRcdFx0XHRcdFx0Y2FjaGVUcmVlU2VjdGlvbltfbmF2XVtTeW1DYWNoZV0gPSBjYWNoZVRyZWVTZWN0aW9uW19uYXZdW1N5bUNhY2hlXSB8fCB7fTtcblxuXHRcdFx0XHRcdFx0XHRcdFx0aWYgKGkgPT0gMClcblx0XHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0Ly9lcHViLndpdGhTZWN0aW9uKGNhY2hlVHJlZVNlY3Rpb25bX25hdl0pO1xuXG5cdFx0XHRcdFx0XHRcdFx0XHRcdF9uZXdfdG9wX2xldmVsID0gY2FjaGVUcmVlU2VjdGlvbltfbmF2XTtcblx0XHRcdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRcdFx0c3RhdC52b2x1bWUrKztcblxuXHRcdFx0XHRcdFx0XHRcdFx0YXdhaXQgX2hhbmRsZVZvbHVtZShjYWNoZVRyZWVTZWN0aW9uW19uYXZdLCBfbmF2X2Rpcilcblx0XHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0XHRpZiAoX2xhc3QpXG5cdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0X2xhc3Qud2l0aFN1YlNlY3Rpb24oY2FjaGVUcmVlU2VjdGlvbltfbmF2XSlcblx0XHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0XHRfbGFzdCA9IGNhY2hlVHJlZVNlY3Rpb25bX25hdl07XG5cdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHR2b2x1bWUgPSBjYWNoZVRyZWVTZWN0aW9uW3ZhbF9kaXJdO1xuXG4vL1x0XHRcdFx0XHRcdFx0Y29uc29sZS5kaXIoe1xuLy9cdFx0XHRcdFx0XHRcdFx0Y2FjaGVUcmVlU2VjdGlvbixcbi8vXHRcdFx0XHRcdFx0XHRcdHZvbHVtZSxcbi8vXHRcdFx0XHRcdFx0XHR9LCB7XG4vL1x0XHRcdFx0XHRcdFx0XHRkZXB0aDogNSxcbi8vXHRcdFx0XHRcdFx0XHRcdGNvbG9yczogdHJ1ZSxcbi8vXHRcdFx0XHRcdFx0XHR9KTtcbi8vXHRcdFx0XHRcdFx0XHRwcm9jZXNzLmV4aXQoKVxuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRsZXQgdmlkOiBzdHJpbmcgPSB2b2x1bWUuaWQ7XG5cblx0XHRcdFx0XHRcdGF3YWl0IF9oYW5kbGVWb2x1bWUodm9sdW1lLCBkaXJuYW1lKVxuXG5cdFx0XHRcdFx0XHRhc3luYyBmdW5jdGlvbiBfaGFuZGxlVm9sdW1lKHZvbHVtZTogRXB1Yk1ha2VyLlNlY3Rpb24sIGRpcm5hbWU6IHN0cmluZylcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0bGV0IHZpZDogc3RyaW5nID0gdm9sdW1lLmlkO1xuXG5cdFx0XHRcdFx0XHRcdGlmICghdm9sdW1lW1N5bUNhY2hlXS5jb3Zlcilcblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdHZvbHVtZVtTeW1DYWNoZV0uY292ZXIgPSB0cnVlO1xuXG5cdFx0XHRcdFx0XHRcdFx0bGV0IGZpbGUgPSBwYXRoLmpvaW4oZGlybmFtZSwgJ1JFQURNRS5tZCcpO1xuXHRcdFx0XHRcdFx0XHRcdGxldCBtZXRhID0gYXdhaXQgZnMucmVhZEZpbGUoZmlsZSlcblx0XHRcdFx0XHRcdFx0XHRcdC50aGVuKGZ1bmN0aW9uIChkYXRhKVxuXHRcdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gbWRjb25mX3BhcnNlKGRhdGEsIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHQvLyDnlbbmspLmnInljIXlkKvlv4XopoHnmoTlhaflrrnmmYLkuI3nlKLnlJ/pjK/oqqRcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHR0aHJvdzogZmFsc2UsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0Ly8g5YWB6Kix5LiN5qiZ5rqW55qEIGluZm8g5YWn5a65XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0bG93Q2hlY2tMZXZlbDogdHJ1ZSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0XHRcdFx0LmNhdGNoKGZ1bmN0aW9uICgpXG5cdFx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdHJldHVybiBudWxsO1xuXHRcdFx0XHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdFx0XHQ7XG5cblx0XHRcdFx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKGZpbGUsIG1ldGEpO1xuXG5cdFx0XHRcdFx0XHRcdFx0YXdhaXQgbm92ZWxHbG9iYnkuZ2xvYmJ5KFtcblx0XHRcdFx0XHRcdFx0XHRcdFx0J2NvdmVyLionLFxuXHRcdFx0XHRcdFx0XHRcdFx0XSwge1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRjd2Q6IGRpcm5hbWUsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdGFic29sdXRlOiB0cnVlLFxuXHRcdFx0XHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdFx0XHRcdC50aGVuKGFzeW5jIChscykgPT5cblx0XHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0aWYgKGxzLmxlbmd0aClcblx0XHRcdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdGxldCBleHQgPSBwYXRoLmV4dG5hbWUobHNbMF0pO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdGxldCBuYW1lID0gYCR7dmlkfS1jb3ZlciR7ZXh0fWA7XG5cblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRlcHViLndpdGhBZGRpdGlvbmFsRmlsZShsc1swXSwgbnVsbCwgbmFtZSk7XG5cblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gbmFtZTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdFx0XHRlbHNlIGlmIChmcy5leGlzdHNTeW5jKGZpbGUpKVxuXHRcdFx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0aWYgKG1ldGEgJiYgbWV0YS5ub3ZlbClcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRpZiAobWV0YS5ub3ZlbC5jb3Zlcilcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0bGV0IGV4dCA9ICcucG5nJztcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0bGV0IGJhc2VuYW1lID0gYCR7dmlkfS1jb3ZlcmA7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGxldCBuYW1lID0gYCR7YmFzZW5hbWV9JHtleHR9YDtcblxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRsZXQgZGF0YSA9IHR5cGVvZiBtZXRhLm5vdmVsLmNvdmVyID09PSAnc3RyaW5nJyA/IHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHR1cmw6IG1ldGEubm92ZWwuY292ZXIsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdH0gOiBtZXRhLm5vdmVsLmNvdmVyO1xuXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGRhdGEuZXh0ID0gbnVsbDtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0ZGF0YS5iYXNlbmFtZSA9IGJhc2VuYW1lO1xuXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGVwdWIud2l0aEFkZGl0aW9uYWxGaWxlKGRhdGEsIG51bGwsIG5hbWUpO1xuXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdHJldHVybiBuYW1lO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdFx0XHRcdC50aGVuKGZ1bmN0aW9uIChuYW1lKVxuXHRcdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRsZXQgX29rID0gZmFsc2U7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdGxldCBkYXRhOiBJU2VjdGlvbkNvbnRlbnQgPSB7fTtcblxuXHRcdFx0XHRcdFx0XHRcdFx0XHRpZiAobmFtZSlcblx0XHRcdFx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdF9vayA9IHRydWU7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0ZGF0YS5jb3ZlciA9IHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdG5hbWUsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0fTtcblxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdHN0YXQuaW1hZ2UgKz0gMTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdFx0XHRcdGlmIChtZXRhICYmIG1ldGEubm92ZWwpXG5cdFx0XHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRpZiAobWV0YS5ub3ZlbC5wcmVmYWNlKVxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdF9vayA9IHRydWU7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHQvL2RhdGEuY29udGVudCA9IGNybGYobWV0YS5ub3ZlbC5wcmVmYWNlKTtcblxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0ZGF0YS5jb250ZW50ID0gaHRtbFByZWZhY2Uoe1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRpbmZvUHJlZmFjZTogbWV0YS5ub3ZlbC5wcmVmYWNlLFxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0fSkuaW5mb1ByZWZhY2VIVE1MO1xuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdFx0XHRcdC8vY29uc29sZS5sb2cobmFtZSwgX29rKTtcblxuXHRcdFx0XHRcdFx0XHRcdFx0XHRpZiAoX29rKVxuXHRcdFx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0cmV0dXJuIGRhdGFcblx0XHRcdFx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdFx0XHRcdHJldHVybiBudWxsXG5cdFx0XHRcdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0XHRcdFx0LnRoZW4oZnVuY3Rpb24gKGRhdGEpXG5cdFx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdGlmIChkYXRhKVxuXHRcdFx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0Ly9jb25zb2xlLmxvZyh2b2x1bWUpO1xuXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0dm9sdW1lLnNldENvbnRlbnQoZGF0YSwgdHJ1ZSk7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHRcdFx0O1xuXHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdC8vY29uc29sZS5sb2coZGlybmFtZSk7XG5cblx0XHRcdFx0XHRcdC8vdm9sdW1lLndpdGhTdWJTZWN0aW9uKG5ldyBFcHViTWFrZXIuU2VjdGlvbignYXV0by10b2MnLCBudWxsLCBudWxsLCBmYWxzZSwgZmFsc2UpKTtcblxuXHRcdFx0XHRcdFx0YXdhaXQgUHJvbWlzZS5tYXBTZXJpZXMobHMsIGFzeW5jIGZ1bmN0aW9uIChyb3cpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdC8vY29uc29sZS5sb2coZmlsZW5hbWUpO1xuXG5cdFx0XHRcdFx0XHRcdC8vbGV0IGRhdGEgPSBhd2FpdCBmcy5yZWFkRmlsZShwYXRoLmpvaW4oVFhUX1BBVEgsIGRpcm5hbWUsIGZpbGVuYW1lKSk7XG5cdFx0XHRcdFx0XHRcdGxldCBkYXRhOiBzdHJpbmcgfCBCdWZmZXIgPSBhd2FpdCBmcy5yZWFkRmlsZShyb3cucGF0aCk7XG5cblx0XHRcdFx0XHRcdFx0Ly9jb25zb2xlLmxvZyhkYXRhKTtcblxuXHRcdFx0XHRcdFx0XHRpZiAocm93LmV4dCA9PSAnLnR4dCcpXG5cdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRkYXRhID0gc3BsaXRUeHQoZGF0YS50b1N0cmluZygpKTtcblx0XHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRcdGlmIChCdWZmZXIuaXNCdWZmZXIoZGF0YSkpXG5cdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRkYXRhID0gZGF0YS50b1N0cmluZygpO1xuXHRcdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdFx0bGV0IG5hbWUgPSByb3cuY2hhcHRlcl90aXRsZTtcblxuXHRcdFx0XHRcdFx0XHRpZiAoIW9wdGlvbnMubm9Mb2cpXG5cdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRsZXQge1xuXHRcdFx0XHRcdFx0XHRcdFx0c291cmNlX2lkeCxcblx0XHRcdFx0XHRcdFx0XHRcdHZvbHVtZV90aXRsZSxcblx0XHRcdFx0XHRcdFx0XHRcdGNoYXB0ZXJfdGl0bGUsXG5cdFx0XHRcdFx0XHRcdFx0XHRkaXIsXG5cdFx0XHRcdFx0XHRcdFx0XHRmaWxlLFxuXHRcdFx0XHRcdFx0XHRcdH0gPSByb3c7XG5cblx0XHRcdFx0XHRcdFx0XHRjb25zb2xlLmRpcih7XG5cdFx0XHRcdFx0XHRcdFx0XHRzb3VyY2VfaWR4LFxuXHRcdFx0XHRcdFx0XHRcdFx0dm9sdW1lX3RpdGxlLFxuXHRcdFx0XHRcdFx0XHRcdFx0Y2hhcHRlcl90aXRsZSxcblx0XHRcdFx0XHRcdFx0XHRcdGRpcixcblx0XHRcdFx0XHRcdFx0XHRcdGZpbGUsXG5cdFx0XHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRsZXQgY2hhcHRlciA9IG5ldyBFcHViTWFrZXIuU2VjdGlvbignY2hhcHRlcicsIGBjaGFwdGVyJHsoaWR4KyspLnRvU3RyaW5nKClcblx0XHRcdFx0XHRcdFx0XHQucGFkU3RhcnQoNCwgJzAnKX1gLCB7XG5cdFx0XHRcdFx0XHRcdFx0dGl0bGU6IG5hbWUsXG5cdFx0XHRcdFx0XHRcdFx0Y29udGVudDogY3JsZihkYXRhKSxcblx0XHRcdFx0XHRcdFx0fSwgdHJ1ZSwgZmFsc2UpO1xuXG5cdFx0XHRcdFx0XHRcdHN0YXQuY2hhcHRlcisrO1xuXG5cdFx0XHRcdFx0XHRcdHZvbHVtZS53aXRoU3ViU2VjdGlvbihjaGFwdGVyKTtcblx0XHRcdFx0XHRcdH0pO1xuXG5cdFx0XHRcdFx0XHRpZiAoIXZvbHVtZVtTeW1DYWNoZV0uaW1hZ2UpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdHZvbHVtZVtTeW1DYWNoZV0uaW1hZ2UgPSB0cnVlO1xuXG5cdFx0XHRcdFx0XHRcdGF3YWl0IG5vdmVsR2xvYmJ5Lmdsb2JieShbXG5cdFx0XHRcdFx0XHRcdFx0XHQnKi57anBnLGdpZixwbmcsanBlZyxzdmd9Jyxcblx0XHRcdFx0XHRcdFx0XHRcdCdpbWFnZS8qLntqcGcsZ2lmLHBuZyxqcGVnLHN2Z30nLFxuXHRcdFx0XHRcdFx0XHRcdFx0J2ltYWdlcy8qLntqcGcsZ2lmLHBuZyxqcGVnLHN2Z30nLFxuXHRcdFx0XHRcdFx0XHRcdFx0JyFjb3Zlci4qJyxcblx0XHRcdFx0XHRcdFx0XHRcdCchKi50eHQnLFxuXHRcdFx0XHRcdFx0XHRcdF0sIHtcblx0XHRcdFx0XHRcdFx0XHRcdGN3ZDogZGlybmFtZSxcblx0XHRcdFx0XHRcdFx0XHRcdGFic29sdXRlOiB0cnVlLFxuXHRcdFx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHRcdFx0LnRoZW4obHMgPT5cblx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRsZXQgYXJyID0gW107XG5cblx0XHRcdFx0XHRcdFx0XHRcdGZvciAobGV0IGkgaW4gbHMpXG5cdFx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdGxldCBpbWcgPSBsc1tpXTtcblxuXHRcdFx0XHRcdFx0XHRcdFx0XHRsZXQgZXh0ID0gcGF0aC5leHRuYW1lKGltZyk7XG5cblx0XHRcdFx0XHRcdFx0XHRcdFx0bGV0IGJhc2VuYW1lID0gcGF0aC5iYXNlbmFtZShpbWcsIGV4dCk7XG5cblx0XHRcdFx0XHRcdFx0XHRcdFx0Ly8gQHRzLWlnbm9yZVxuXHRcdFx0XHRcdFx0XHRcdFx0XHRsZXQgbmFtZSA9IHNsdWdpZnkoYmFzZW5hbWUpO1xuXG5cdFx0XHRcdFx0XHRcdFx0XHRcdGlmICghbmFtZSB8fCBhcnIuaW5jbHVkZXMobmFtZSkpXG5cdFx0XHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRuYW1lID0gaGFzaFN1bShbaW1nLCBpLCBuYW1lXSk7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRcdFx0XHQvL25hbWUgPSBgJHt2aWR9LyR7aX0tYCArIG5hbWUgKyBleHQ7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdG5hbWUgPSBgJHt2aWR9L2AgKyBuYW1lICsgZXh0O1xuXG5cdFx0XHRcdFx0XHRcdFx0XHRcdGFyci5wdXNoKCdpbWFnZS8nICsgbmFtZSk7XG5cblx0XHRcdFx0XHRcdFx0XHRcdFx0ZXB1Yi53aXRoQWRkaXRpb25hbEZpbGUoaW1nLCAnaW1hZ2UnLCBuYW1lKTtcblx0XHRcdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRcdFx0aWYgKGFyci5sZW5ndGgpXG5cdFx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdGlmICh2b2x1bWUuY29udGVudCAmJiB2b2x1bWUuY29udGVudC5jb3ZlciAmJiB2b2x1bWUuY29udGVudC5jb3Zlci5uYW1lKVxuXHRcdFx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0YXJyLnVuc2hpZnQodm9sdW1lLmNvbnRlbnQuY292ZXIubmFtZSk7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0XHRcdFx0XHRsZXQgY2hhcHRlciA9IG5ldyBFcHViTWFrZXIuU2VjdGlvbignbm9uLXNwZWNpZmljIGJhY2ttYXR0ZXInLCBgaW1hZ2UkeyhpZHgrKykudG9TdHJpbmcoKVxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdC5wYWRTdGFydCg0LCAnMCcpfWAsIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHR0aXRsZTogJ+aPkuWclicsXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0Y29udGVudDogYXJyLnJlZHVjZShmdW5jdGlvbiAoYSwgYilcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRsZXQgaHRtbCA9IGA8ZmlndXJlIGNsYXNzPVwiZnVsbHBhZ2UgSW1hZ2VDb250YWluZXIgcGFnZS1icmVhay1iZWZvcmVcIj48aW1nIGlkPVwiQ292ZXJJbWFnZVwiIGNsYXNzPVwiQ292ZXJJbWFnZVwiIHNyYz1cIiR7Yn1cIiBhbHQ9XCJDb3ZlclwiIC8+PC9maWd1cmU+YDtcblxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdFx0YS5wdXNoKGh0bWwpO1xuXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gYTtcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHR9LCBbXSkuam9pbihcIlxcblwiKSxcblx0XHRcdFx0XHRcdFx0XHRcdFx0fSwgdHJ1ZSwgZmFsc2UpO1xuXG5cdFx0XHRcdFx0XHRcdFx0XHRcdHN0YXQuaW1hZ2UgKz0gYXJyLmxlbmd0aDtcblxuXHRcdFx0XHRcdFx0XHRcdFx0XHR2b2x1bWUud2l0aFN1YlNlY3Rpb24oY2hhcHRlcik7XG5cdFx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdFx0O1xuXG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdC8vZXB1Yi53aXRoU2VjdGlvbih2b2x1bWUpO1xuXG5cdFx0XHRcdFx0XHRpZiAoX25ld190b3BfbGV2ZWwpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdGVwdWIud2l0aFNlY3Rpb24oX25ld190b3BfbGV2ZWwpO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRyZXR1cm4gdm9sdW1lO1xuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0O1xuXHRcdFx0fSlcblx0XHQ7XG5cbi8vXHRcdGNvbnNvbGUubG9nKGVwdWIuZXB1YkNvbmZpZy5zZWN0aW9ucyk7XG4vL1x0XHRwcm9jZXNzLmV4aXQoKTtcblxuXHRcdGxldCBkYXRhID0gYXdhaXQgZXB1Yi5tYWtlRXB1YigpO1xuXG5cdFx0bGV0IF9maWxlX2RhdGEgPSBtYWtlRmlsZW5hbWUob3B0aW9ucywgZXB1YiwgbWV0YSk7XG5cblx0XHRsZXQgeyBmaWxlLCBmaWxlbmFtZSwgbm93LCBiYXNlbmFtZSwgZXh0IH0gPSBfZmlsZV9kYXRhO1xuXG5cdFx0YXdhaXQgZnMub3V0cHV0RmlsZShmaWxlLCBkYXRhKTtcblxuXHRcdGNvbnNvbGUuc3VjY2VzcyhmaWxlbmFtZSwgbm93LmZvcm1hdCgpKTtcblxuXHRcdHJldHVybiB7XG5cdFx0XHRmaWxlLFxuXHRcdFx0ZmlsZW5hbWUsXG5cdFx0XHRlcHViLFxuXG5cdFx0XHRvdXRwdXRQYXRoOiBvcHRpb25zLm91dHB1dFBhdGgsXG5cblx0XHRcdGJhc2VuYW1lLFxuXHRcdFx0ZXh0LFxuXG5cdFx0XHRzdGF0LFxuXHRcdH07XG5cdH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbWFrZUZpbGVuYW1lKG9wdGlvbnM6IElPcHRpb25zLCBlcHViOiBFcHViTWFrZXIsIG1ldGE6IElNZGNvbmZNZXRhKVxue1xuXHRvcHRpb25zID0gbWFrZU9wdGlvbnMob3B0aW9ucyk7XG5cblx0bGV0IGZpbGVuYW1lID0gZXB1Yi5nZXRGaWxlbmFtZShvcHRpb25zLnVzZVRpdGxlLCB0cnVlKTtcblxuXHRpZiAoIW9wdGlvbnMuZmlsZW5hbWUpXG5cdHtcblx0XHRpZiAob3B0aW9ucy5maWxlbmFtZUxvY2FsKVxuXHRcdHtcblx0XHRcdC8vIEB0cy1pZ25vcmVcblx0XHRcdGlmIChtZXRhLm5vdmVsLnRpdGxlX291dHB1dClcblx0XHRcdHtcblx0XHRcdFx0Ly8gQHRzLWlnbm9yZVxuXHRcdFx0XHRmaWxlbmFtZSA9IG1ldGEubm92ZWwudGl0bGVfb3V0cHV0O1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSBpZiAoQXJyYXkuaXNBcnJheShvcHRpb25zLmZpbGVuYW1lTG9jYWwpKVxuXHRcdFx0e1xuXHRcdFx0XHRmb3IgKGxldCB2IG9mIG9wdGlvbnMuZmlsZW5hbWVMb2NhbClcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGlmIChtZXRhLm5vdmVsW3ZdKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGZpbGVuYW1lID0gbWV0YS5ub3ZlbFt2XTtcblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0ZWxzZSBpZiAobWV0YS5ub3ZlbC50aXRsZV96aClcblx0XHRcdHtcblx0XHRcdFx0ZmlsZW5hbWUgPSBtZXRhLm5vdmVsLnRpdGxlX3poO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSBpZiAobWV0YS5ub3ZlbC50aXRsZV9zaG9ydClcblx0XHRcdHtcblx0XHRcdFx0ZmlsZW5hbWUgPSBtZXRhLm5vdmVsLnRpdGxlX3Nob3J0O1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSBpZiAodHlwZW9mIG9wdGlvbnMuZmlsZW5hbWVMb2NhbCA9PSAnc3RyaW5nJylcblx0XHRcdHtcblx0XHRcdFx0ZmlsZW5hbWUgPSBvcHRpb25zLmZpbGVuYW1lTG9jYWw7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0Y29uc3QgYmFzZW5hbWUgPSBmaWxlbmFtZTtcblxuXHRsZXQgZXh0ID0gRXB1Yk1ha2VyLmRlZmF1bHRFeHQ7XG5cblx0bGV0IG5vdyA9IG1vbWVudCgpO1xuXG5cdGlmIChvcHRpb25zLnBhZEVuZERhdGUpXG5cdHtcblx0XHRmaWxlbmFtZSArPSAnXycgKyBub3cuZm9ybWF0KCdZWVlZTU1ERF9ISG1tc3MnKTtcblx0fVxuXG5cdGZpbGVuYW1lICs9IGV4dDtcblxuXHRsZXQgZmlsZSA9IHBhdGguam9pbihvcHRpb25zLm91dHB1dFBhdGgsIGZpbGVuYW1lKTtcblxuXHRyZXR1cm4ge1xuXHRcdGZpbGUsXG5cdFx0ZXh0LFxuXHRcdGZpbGVuYW1lLFxuXHRcdG9wdGlvbnMsXG5cdFx0bm93LFxuXHRcdGJhc2VuYW1lLFxuXHRcdGVwdWIsXG5cdFx0bWV0YSxcblx0fVxufVxuXG5leHBvcnQgZGVmYXVsdCBjcmVhdGU7XG4iXX0=