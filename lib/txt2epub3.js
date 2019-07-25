"use strict";
/**
 * Created by user on 2017/12/16/016.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const epub_maker2_1 = require("epub-maker2");
const node_novel_info_1 = require("node-novel-info");
const util_1 = require("./util");
const log_1 = require("./log");
exports.console = log_1.console;
const uuid_1 = require("epub-maker2/src/lib/uuid");
const crlf_normalize_1 = require("crlf-normalize");
const class_1 = require("node-novel-info/class");
const glob_sort_1 = require("node-novel-globby/lib/glob-sort");
const node_novel_globby_1 = require("node-novel-globby");
const epub_1 = require("./epub");
const fs = require("fs-iconv");
const Bluebird = require("bluebird");
const path = require("upath2");
const moment = require("moment");
const novelGlobby = require("node-novel-globby/g");
const deepmerge = require("deepmerge-plus");
const util_2 = require("util");
const store_1 = require("./store");
const html_1 = require("./html");
const md_1 = require("./md");
exports.defaultOptions = Object.freeze({
    epubTemplate: 'lightnovel',
    //epubLanguage: 'zh',
    epubLanguage: 'zh-Hant-TW',
    //padEndDate: true,
    globbyOptions: {
        checkRoman: true,
        useDefaultPatternsExclude: true,
    },
});
function getNovelConf(options, cache = {}) {
    return Bluebird.resolve().then(async function () {
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
        return meta;
    })
        .catch((e) => {
        if (e.message == 'Error: mdconf_parse' || e.message == 'mdconf_parse') {
            return null;
        }
        return Bluebird.reject(e);
    })
        .tap(meta => {
        if (!meta || !meta.novel || !meta.novel.title) {
            throw new Error(`not a valid novelInfo data, ${util_2.inspect(options)}`);
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
    options = deepmerge.all([{}, exports.defaultOptions, options]);
    if (options.iconv) {
        switch (options.iconv) {
            case 'chs':
            case 'cn':
            case 'zhs':
                options.iconv = 'cn';
                break;
            case 'cht':
            case 'tw':
            case 'zht':
                options.iconv = 'tw';
                break;
            default:
                break;
        }
    }
    return options;
}
exports.makeOptions = makeOptions;
function create(options, cache = {}) {
    return Bluebird.resolve().then(async function () {
        //console.log(options, defaultOptions);
        options = makeOptions(options);
        //console.dir(options, {colors: true});
        const novelID = options.novelID;
        const TXT_PATH = util_1.pathDirNormalize(options.inputPath);
        let meta = await getNovelConf(options, cache);
        const metaLib = new class_1.NodeNovelInfo(meta, {
            throw: false,
            lowCheckLevel: true,
        });
        let globby_patterns;
        let globby_options = Object.assign({}, options.globbyOptions, {
            cwd: TXT_PATH,
        });
        {
            [globby_patterns, globby_options] = novelGlobby.getOptions2(globby_options);
        }
        //console.log(options, globby_options);
        //console.dir(options);
        log_1.console.info(meta.novel.title);
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
            .addTag(metaLib.tags())
            .addAuthor(metaLib.contributes());
        if (options.vertical) {
            epub.setVertical(options.vertical);
        }
        epub.addTitles(metaLib.titles());
        if (options.filename) {
            epub.epubConfig.filename = options.filename;
        }
        metaLib.sources()
            .forEach(link => epub.addLinks(link));
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
                log_1.console.log(ls);
            });
        }
        if (options.epubContextDate) {
            epub.withContextDate(options.epubContextDate);
        }
        //process.exit();
        let store = new store_1.EpubStore();
        const processReturn = await novelGlobby
            .globbyASync(globby_patterns, globby_options)
            .tap(function (ls) {
            return ls;
        })
            .then(function (ls) {
            return glob_sort_1.sortTree(ls, null, globby_options);
        })
            .then(function (ls) {
            //console.dir(ls);
            return novelGlobby.globToListArrayDeep(ls, globby_options);
        })
            .tap(function (ls) {
            /*
            console.dir(ls, {
                depth: null,
                colors: true,
            });
            process.exit();
         */
            return ls;
        })
            .then(_ls => {
            //let idx = 1;
            //let cacheTreeSection = {} as Record<string, EpubMaker.Section>;
            //const SymCache = Symbol('cache');
            //let _new_top_level: EpubMaker.Section;
            //let _old_top_level: EpubMaker.Section;
            return node_novel_globby_1.foreachArrayDeepAsync(_ls, async ({ value, index, array, cache, }) => {
                const { volume_title, chapter_title } = value;
                const { temp, data } = cache;
                const { stat } = data;
                const { cacheTreeSection } = temp;
                let vs_ret = node_novel_globby_1.eachVolumeTitle(volume_title, true);
                const dirname = value.path_dir;
                let _ds = path.normalize(dirname).split('/');
                const volume = await Bluebird
                    .resolve(vs_ret.titles_full)
                    .reduce(async function (vp, key, index) {
                    let title = vs_ret.titles[index];
                    key += '.dir';
                    if (0
                        && temp.prev_volume_dir
                        && temp.prev_volume_dir != dirname
                        && (dirname.length < temp.prev_volume_dir.length
                        //|| temp.prev_volume_dir.indexOf(dirname) == -1
                        )) {
                        await epub_1._handleVolumeImage(temp.prev_volume, temp.prev_volume_row.dirname, {
                            epub,
                            processReturn: cache,
                            epubOptions: options,
                            store,
                            cwd: dirname,
                            cwdRoot: TXT_PATH,
                        })
                            .tap(ls => {
                            log_1.console.log(ls);
                            if (ls.length) {
                                log_1.console.log({
                                    prev_volume_dir: temp.prev_volume_dir,
                                    dirname,
                                    len: dirname.length < temp.prev_volume_dir.length,
                                    indexOf: temp.prev_volume_dir.indexOf(dirname),
                                });
                            }
                        });
                    }
                    let vc;
                    if (temp.cache_vol[key] == null) {
                        let _nav_dir = _ds.slice(0, _ds.length - vs_ret.level + index + 1).join('/');
                        //data.toc.push('- '.repeat(index + 1) + title);
                        /*
                        console.log({
                            key,
                            _nav_dir,
                        });
                         */
                        temp.count_d++;
                        stat.volume++;
                        temp.cache_vol[key] = (temp.cache_vol[key] | 0);
                        let vid = epub_1.makeVolumeID(temp.count_idx++);
                        vc = cacheTreeSection[key] = new epub_maker2_1.default.Section('auto-toc', vid, {
                            title: title,
                        }, false, true);
                        vc[epub_1.SymCache] = vc[epub_1.SymCache] || {};
                        await epub_1._handleVolume(vc, _nav_dir, {
                            epub,
                            store,
                            epubOptions: options,
                            processReturn: cache,
                            cwd: dirname,
                            cwdRoot: TXT_PATH,
                        });
                        if (index == 0) {
                            if (temp._old_top_level) {
                                await epub_1._handleVolumeImageEach(temp.cache_top_subs[temp._old_top_level.id], {
                                    epub,
                                    processReturn: cache,
                                    epubOptions: options,
                                    store,
                                    cwd: dirname,
                                    cwdRoot: TXT_PATH,
                                });
                                if (!epub.hasSection(temp._old_top_level)) {
                                    epub.withSection(temp._old_top_level);
                                }
                            }
                            temp._old_top_level = temp._new_top_level;
                            temp._new_top_level = vc;
                            temp.cache_top_subs[vc.id] = temp.cache_top_subs[vc.id] || [];
                            temp.cache_top_subs[vc.id].push({
                                vol_key: key,
                                dirname: _nav_dir,
                            });
                        }
                    }
                    vc = cacheTreeSection[key];
                    if (vp && !vp.hasSubSection(vc)) {
                        vp.withSubSection(vc);
                    }
                    return vc;
                }, null);
                const row = value;
                let name = value.chapter_title;
                let txt = await fs.loadFile(value.path, {
                    autoDecode: true,
                })
                    .then(async function (data) {
                    let txt = crlf_normalize_1.crlf(data.toString());
                    if (value.ext == '.txt') {
                        let attach = await epub_1.getAttachMetaByRow(row);
                        return html_1.splitTxt(txt, {
                            attach,
                            store,
                            vid: volume.id,
                            epub,
                            epubOptions: options,
                            cwd: dirname,
                            cwdRoot: TXT_PATH,
                        });
                    }
                    return txt;
                });
                if (!options.noLog) {
                    let { source_idx, volume_title, chapter_title, dir, file, } = row;
                    log_1.console.dir({
                        source_idx,
                        volume_title,
                        chapter_title,
                        dir,
                        file,
                    });
                }
                let chapter = new epub_maker2_1.default.Section("chapter" /* CHAPTER */, epub_1.makeChapterID(temp.count_idx++), {
                    title: name,
                    content: txt,
                }, true, false);
                stat.chapter++;
                volume.withSubSection(chapter);
                let vi = vs_ret.level - 1;
                let vol_key = vs_ret.titles_full[vi];
                temp.cache_vol[vol_key]++;
                temp.prev_volume_title = volume_title;
                temp.prev_volume_dir = dirname;
                temp.prev_volume = volume;
                temp.prev_volume_row = {
                    vol_key: vol_key + '.dir',
                    dirname,
                    value,
                };
                temp.cache_volume_row.push(temp.prev_volume_row);
                return volume;
            }, {
                data: {
                    stat: {
                        volume: 0,
                        chapter: 0,
                        image: 0,
                    },
                },
                temp: {
                    cache_vol: {},
                    prev_volume_title: null,
                    prev_volume_dir: null,
                    prev_volume: null,
                    prev_volume_row: null,
                    cache_top_subs: {},
                    cache_volume_row: [],
                    count_idx: 0,
                    count_f: 0,
                    count_d: 0,
                    cacheTreeSection: {},
                },
            })
                .tap(async (processReturn) => {
                const { temp } = processReturn;
                /*
                await _handleVolumeImageEach(temp.cache_volume_row, {
                    epub,
                    processReturn,
                    epubOptions: options,
                    store,
                    cwdRoot: TXT_PATH,
                });
                 */
                await epub_1._hookAfterVolume(temp.cache_volume_row, {
                    epub,
                    processReturn,
                    epubOptions: options,
                    store,
                    cwdRoot: TXT_PATH,
                }, [
                    epub_1._handleVolumeImage,
                    epub_1.addContributeSection,
                ]);
                if (temp._old_top_level && !epub.hasSection(temp._old_top_level)) {
                    epub.withSection(temp._old_top_level);
                }
                if (temp._new_top_level && !epub.hasSection(temp._new_top_level)) {
                    epub.withSection(temp._new_top_level);
                }
            });
        })
            .tap(async (processReturn) => {
            epub_1._hookAfterEpub(epub, {
                epub,
                processReturn,
                epubOptions: options,
                store,
                cwd: TXT_PATH,
                cwdRoot: TXT_PATH,
            }, [
                async (epub, _data_) => {
                    const { cwdRoot } = _data_;
                    novelGlobby.globby([
                        'CONTRIBUTE.md',
                    ], {
                        cwd: cwdRoot,
                        absolute: true,
                        deep: 0,
                    })
                        .then(async (ls) => {
                        if (ls.length) {
                            let file = ls[0];
                            let source = await fs.readFile(file);
                            let mdReturn = md_1.handleMarkdown(source, {
                                ..._data_,
                                cwd: cwdRoot,
                            });
                            epub_1.createContributeSection({
                                target: epub,
                                mdReturn,
                                processReturn,
                            });
                        }
                    });
                },
            ]);
        });
        //console.dir(epub.epubConfig.sections[0]);
        //console.dir(epub.epubConfig.landmarks.slice(0, 2));
        //process.exit();
        let data = await epub.makeEpub();
        let _file_data = makeFilename(options, epub, meta);
        let { file, filename, now, basename, ext } = _file_data;
        await fs.outputFile(file, data);
        const stat = processReturn.data.stat;
        log_1.console.success(filename, now.format(), stat);
        return {
            file,
            filename,
            epub,
            outputPath: options.outputPath,
            basename,
            ext,
            stat,
            store,
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
//# sourceMappingURL=txt2epub3.js.map