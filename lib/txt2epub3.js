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
