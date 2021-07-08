"use strict";
/**
 * Created by user on 2017/12/16/016.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeFilename = exports.create = exports.makeOptions = exports.getNovelConf = exports.defaultOptions = exports.console = void 0;
const tslib_1 = require("tslib");
const epub_maker2_1 = (0, tslib_1.__importStar)(require("epub-maker2"));
const node_novel_info_1 = require("node-novel-info");
const util_1 = require("./util");
const log_1 = require("./log");
Object.defineProperty(exports, "console", { enumerable: true, get: function () { return log_1.console; } });
const uuid_1 = require("epub-maker2/src/lib/uuid");
const crlf_normalize_1 = require("crlf-normalize");
const class_1 = require("node-novel-info/class");
const sort_tree_1 = require("@lazy-glob/sort-tree");
const util_2 = require("node-novel-globby/lib/util");
const epub_1 = require("./epub");
const bluebird_1 = (0, tslib_1.__importDefault)(require("bluebird"));
const upath2_1 = (0, tslib_1.__importDefault)(require("upath2"));
const moment_1 = (0, tslib_1.__importDefault)(require("moment"));
const novelGlobby = (0, tslib_1.__importStar)(require("node-novel-globby/g"));
const deepmerge_plus_1 = (0, tslib_1.__importDefault)(require("deepmerge-plus"));
const util_3 = require("util");
const store_1 = require("./store");
const html_1 = require("./html");
const md_1 = require("./md");
const const_1 = require("@node-novel/epub-util/lib/const");
const fs_iconv_1 = require("fs-iconv");
const fs_extra_1 = require("fs-extra");
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
    return bluebird_1.default.resolve().then(async function () {
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
            if ((0, fs_extra_1.pathExistsSync)(upath2_1.default.join(confPath, 'meta.md'))) {
                let file = upath2_1.default.join(confPath, 'meta.md');
                meta = await (0, fs_extra_1.readFile)(file)
                    .then(node_novel_info_1.mdconf_parse);
            }
            else if ((0, fs_extra_1.pathExistsSync)(upath2_1.default.join(confPath, 'README.md'))) {
                let file = upath2_1.default.join(confPath, 'README.md');
                meta = await (0, fs_extra_1.readFile)(file)
                    .then(node_novel_info_1.mdconf_parse);
            }
        }
        meta = (0, node_novel_info_1.chkInfo)(meta);
        return meta;
    })
        .catch((e) => {
        if (e.message == 'Error: mdconf_parse' || e.message == 'mdconf_parse') {
            return null;
        }
        return bluebird_1.default.reject(e);
    })
        .tap(meta => {
        if (!meta || !meta.novel || !meta.novel.title) {
            throw new Error(`not a valid novelInfo data, ${(0, util_3.inspect)(options)}`);
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
    options = deepmerge_plus_1.default.all([{}, exports.defaultOptions, options]);
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
    return bluebird_1.default.resolve().then(async function () {
        //console.log(options, defaultOptions);
        options = makeOptions(options);
        //console.dir(options, {colors: true});
        const novelID = options.novelID;
        const TXT_PATH = (0, util_1.pathDirNormalize)(options.inputPath);
        let meta = await getNovelConf(options, cache);
        const metaLib = new class_1.NodeNovelInfo(meta, {
            throw: false,
            lowCheckLevel: true,
        });
        let globby_patterns;
        let globby_options = Object.assign({}, options.globbyOptions, {
            cwd: TXT_PATH,
            //useDefaultPatternsExclude: true,
            //checkRoman: true,
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
            .withUuid((0, uuid_1.createUUID)((0, epub_maker2_1.hashSum)([
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
                // @ts-ignore
            ], Object.assign({}, globby_options, {
                absolute: true,
            }))
                .then(ls => {
                if (ls.length) {
                    epub.withCover(ls[0]);
                }
                //console.log(ls);
            });
        }
        if (options.epubContextDate) {
            if (typeof options.epubContextDate == 'boolean') {
                options.epubContextDate = (0, const_1.createEpubContextDate)();
            }
            epub.withContextDate(options.epubContextDate);
        }
        //process.exit();
        const store = new store_1.EpubStore();
        let count_idx = 0;
        {
            let file = upath2_1.default.join(TXT_PATH, 'FOREWORD.md');
            if ((0, fs_extra_1.pathExistsSync)(file)) {
                let source = await (0, fs_extra_1.readFile)(file);
                let mdReturn = (0, md_1.handleMarkdown)(source, {
                    cwd: TXT_PATH,
                });
                (0, epub_1.createMarkdownSection)({
                    target: epub,
                    mdReturn,
                    processReturn: {
                        // @ts-ignore
                        temp: {
                            count_idx,
                        }
                    },
                    epubType: "foreword" /* FOREWORD */,
                    epubTitle: "FOREWORD" /* FOREWORD */,
                    epubPrefix: "foreword" /* FOREWORD */,
                });
                count_idx++;
            }
        }
        ;
        const processReturn = await novelGlobby
            .globbyASync(globby_patterns, globby_options)
            .tap(function (ls) {
            return ls;
        })
            .then(function (ls) {
            return (0, sort_tree_1.sortTree)(ls, null, globby_options);
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
            return (0, util_2.foreachArrayDeepAsync)(_ls, async ({ value, index, array, cache, }) => {
                const { volume_title, chapter_title } = value;
                const { temp, data } = cache;
                const { stat } = data;
                const { cacheTreeSection } = temp;
                /**
                 * 去除掉排序ID後的章節名稱
                 */
                let vs_ret = (0, util_2.eachVolumeTitle)(volume_title, true);
                /**
                 * 章節名稱 含 排序用的ID 來避免同一個資料夾下 有兩個相同 章節名稱
                 */
                let vs_ret2 = (0, util_2.eachVolumeTitle)(value.dir, false);
                const dirname = value.path_dir;
                let _ds = upath2_1.default.normalize(dirname).split('/');
                const volume = await bluebird_1.default
                    .resolve(vs_ret2.titles_full)
                    .reduce(async function (vp, key, index) {
                    let title = vs_ret.titles[index];
                    key += '.dir';
                    if (0
                        && temp.prev_volume_dir
                        && temp.prev_volume_dir != dirname
                        && (dirname.length < temp.prev_volume_dir.length
                        //|| temp.prev_volume_dir.indexOf(dirname) == -1
                        )) {
                        await (0, epub_1._handleVolumeImage)(temp.prev_volume, temp.prev_volume_row.dirname, {
                            epub,
                            processReturn: cache,
                            epubOptions: options,
                            store,
                            cwd: dirname,
                            cwdRoot: TXT_PATH,
                        })
                            .tap(ls => {
                            //console.log(ls);
                            if (0 && ls.length) {
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
                        let vid = (0, epub_1.makeVolumeID)(temp.count_idx++);
                        vc = cacheTreeSection[key] = new epub_maker2_1.default.Section('auto-toc', vid, {
                            title: title,
                        }, false, true);
                        vc[epub_1.SymCache] = vc[epub_1.SymCache] || {};
                        await (0, epub_1._handleVolume)(vc, _nav_dir, {
                            epub,
                            store,
                            epubOptions: options,
                            processReturn: cache,
                            cwd: dirname,
                            cwdRoot: TXT_PATH,
                        });
                        if (index == 0) {
                            if (temp._old_top_level) {
                                await (0, epub_1._handleVolumeImageEach)(temp.cache_top_subs[temp._old_top_level.id], {
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
                let txt = await (0, fs_iconv_1.loadFile)(value.path, {
                    autoDecode: true,
                })
                    .then(async function (data) {
                    let txt = (0, crlf_normalize_1.crlf)(data.toString());
                    if (value.ext == '.txt') {
                        let attach = await (0, epub_1.getAttachMetaByRow)(row);
                        return (0, html_1.splitTxt)(txt, {
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
                    let { source_idx, source_totals, volume_title, chapter_title, dir, file, } = row;
                    /*
                    console.dir({
                        source_idx,
                        volume_title,
                        chapter_title,
                        dir,
                        file,
                    });
                     */
                    log_1.console.info(`${source_idx}／${source_totals}`, volume_title, chapter_title);
                }
                let chapter = new epub_maker2_1.default.Section("chapter" /* CHAPTER */, (0, epub_1.makeChapterID)(temp.count_idx++), {
                    title: name,
                    content: txt,
                }, true, false);
                stat.chapter++;
                volume.withSubSection(chapter);
                let vi = vs_ret.level - 1;
                let vol_key = vs_ret2.titles_full[vi];
                temp.cache_vol[vol_key]++;
                temp.prev_volume_title = volume_title;
                temp.prev_volume_dir = dirname;
                temp.prev_volume = volume;
                temp.prev_volume_row = {
                    vol_key: vol_key + '.dir',
                    dirname,
                    value,
                };
                temp.
                    cache_volume_row.push(temp.prev_volume_row);
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
                    count_idx: count_idx,
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
                await (0, epub_1._hookAfterVolume)(temp.cache_volume_row, {
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
            await (0, epub_1._hookAfterEpub)(epub, {
                epub,
                processReturn,
                epubOptions: options,
                store,
                cwd: TXT_PATH,
                cwdRoot: TXT_PATH,
            }, [
                async (epub, _data_) => {
                    const { cwdRoot } = _data_;
                    await novelGlobby.globby([
                        'CONTRIBUTE.md',
                    ], {
                        cwd: cwdRoot,
                        absolute: true,
                        deep: 0,
                    })
                        .then(async (ls) => {
                        if (ls.length) {
                            let file = ls[0];
                            let source = await (0, fs_extra_1.readFile)(file);
                            let mdReturn = (0, md_1.handleMarkdown)(source, {
                                ..._data_,
                                cwd: cwdRoot,
                            });
                            (0, epub_1.createContributeSection)({
                                target: epub,
                                mdReturn,
                                processReturn,
                            });
                        }
                    });
                    if (epub[epub_1.SymCache] == null) {
                        epub[epub_1.SymCache] = {};
                    }
                    await (0, epub_1._handleVolumeImage)(epub, TXT_PATH, {
                        epub,
                        processReturn: processReturn,
                        epubOptions: options,
                        store,
                        cwd: cwdRoot,
                        cwdRoot: TXT_PATH,
                    });
                },
            ]);
        });
        //console.dir(epub.epubConfig.sections[0]);
        //console.dir(epub.epubConfig.landmarks.slice(0, 2));
        //process.exit();
        if (options.beforeMakeEpub) {
            options.beforeMakeEpub({
                TXT_PATH: TXT_PATH,
                epub,
                options,
                processReturn,
            });
        }
        let data = await epub.makeEpub();
        let _file_data = makeFilename(options, epub, meta);
        let { file, filename, now, basename, ext } = _file_data;
        await (0, fs_extra_1.outputFile)(file, data);
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
    let now = (0, moment_1.default)();
    if (options.padEndDate) {
        filename += '_' + now.format('YYYYMMDD_HHmmss');
    }
    filename += ext;
    let file = upath2_1.default.join(options.outputPath, filename);
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