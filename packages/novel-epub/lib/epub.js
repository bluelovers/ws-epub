"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._withSection = exports.createMarkdownSection = exports.createContributeSection = exports.addContributeSection = exports._hookAfterEpub = exports._hookAfterVolume = exports._handleVolumeImageEach = exports._handleVolumeImage = exports.getAttachMetaByRow = exports.getAttachMeta = exports.makeChapterID = exports.makeVolumeID = exports.makePrefixID = exports.addMarkdown = exports._handleVolume = exports.EnumPrefixIDTitle = exports.EnumPrefixIDType = exports.SymCache = void 0;
const epub_maker2_1 = require("epub-maker2");
const log_1 = require("./log");
const util_1 = require("./util");
const util_2 = require("epub-maker2/src/lib/util");
const crlf_normalize_1 = require("crlf-normalize");
const array_hyper_unique_1 = require("array-hyper-unique");
const store_1 = require("./store");
const html_1 = require("./html");
const md_1 = require("./md");
const ext_1 = require("./ext");
const str_util_1 = require("str-util");
const Bluebird = require("bluebird");
const path = require("upath2");
const fs = require("fs-iconv");
const novelGlobby = require("node-novel-globby/g");
exports.SymCache = Symbol('cache');
var EnumPrefixIDType;
(function (EnumPrefixIDType) {
    EnumPrefixIDType["VOLUME"] = "volume";
    EnumPrefixIDType["CHAPTER"] = "chapter";
    EnumPrefixIDType["IMAGE"] = "image";
    EnumPrefixIDType["CONTRIBUTE"] = "contribute";
    EnumPrefixIDType["FOREWORD"] = "foreword";
})(EnumPrefixIDType = exports.EnumPrefixIDType || (exports.EnumPrefixIDType = {}));
var EnumPrefixIDTitle;
(function (EnumPrefixIDTitle) {
    EnumPrefixIDTitle["IMAGE"] = "\u63D2\u5716";
    EnumPrefixIDTitle["CONTRIBUTE"] = "CONTRIBUTE";
    EnumPrefixIDTitle["FOREWORD"] = "FOREWORD";
})(EnumPrefixIDTitle = exports.EnumPrefixIDTitle || (exports.EnumPrefixIDTitle = {}));
function _handleVolume(volume, dirname, _data_) {
    return Bluebird
        .resolve(null)
        .then(async function () {
        const { processReturn, epub } = _data_;
        const { stat } = processReturn.data;
        let vid = volume.id;
        if (!volume[exports.SymCache].cover) {
            volume[exports.SymCache].cover = true;
            let file = path.join(dirname, 'README.md');
            let meta = await util_1.fsLowCheckLevelMdconfAsync(file).catch(e => null);
            //console.log(file, meta);
            await Bluebird.resolve(novelGlobby.globby([
                'cover.*',
            ], {
                cwd: dirname,
                absolute: true,
            }))
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
                        data.content = util_2.htmlPreface({
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
                .tap(function (data) {
                if (data) {
                    //console.log(volume);
                    volume.setContent(data, true);
                }
            });
        }
        if (!volume[exports.SymCache].foreword) {
            volume[exports.SymCache].foreword = true;
            let file = path.join(dirname, 'FOREWORD.md');
            if (fs.pathExistsSync(file)) {
                addMarkdown({
                    volume,
                    dirname,
                    _data_,
                    file,
                    epubType: "foreword" /* FOREWORD */,
                    epubPrefix: "foreword" /* FOREWORD */,
                    epubTitle: "FOREWORD" /* FOREWORD */,
                });
            }
        }
    });
}
exports._handleVolume = _handleVolume;
function addMarkdown(options) {
    return Bluebird.resolve(options)
        .then(async () => {
        let { volume, _data_, file, dirname } = options;
        const vid = volume.id;
        const { processReturn } = _data_;
        let source = await fs.readFile(file);
        let mdReturn = md_1.handleMarkdown(source, {
            ..._data_,
            cwd: dirname,
            vid,
        });
        let chapter = createMarkdownSection({
            target: volume,
            mdReturn,
            processReturn,
            epubType: options.epubType,
            epubTitle: options.epubTitle,
            epubPrefix: options.epubPrefix,
        });
        return chapter;
    });
}
exports.addMarkdown = addMarkdown;
function makePrefixID(count_idx, prefix) {
    return `${prefix}${(count_idx).toString().padStart(6, '0')}`;
}
exports.makePrefixID = makePrefixID;
function makeVolumeID(count_idx) {
    return makePrefixID(count_idx, "volume" /* VOLUME */);
}
exports.makeVolumeID = makeVolumeID;
function makeChapterID(count_idx) {
    return makePrefixID(count_idx, "chapter" /* CHAPTER */);
}
exports.makeChapterID = makeChapterID;
function getAttachMeta(dirname) {
    return util_1.fsLowCheckLevelMdconfAsync(path.join(dirname, 'ATTACH.md'))
        // @ts-ignore
        .then((v) => {
        if (v.attach) {
            return v.attach;
        }
        // @ts-ignore
        else if (v.novel && v.novel.attach) {
            // @ts-ignore
            return v.novel.attach;
        }
        return v;
    })
        // @ts-ignore
        .then((attach) => {
        if (attach && attach.images) {
            attach.images = Object.entries(attach.images)
                .reduce((a, [k, v]) => {
                a[k] = v;
                let k2 = k.toString().toLowerCase();
                if (a[k2] == null) {
                    a[k2] = v;
                }
                k2 = k2.toUpperCase();
                if (a[k2] == null) {
                    a[k2] = v;
                }
                return a;
            }, {});
        }
        return attach;
    })
        .catch(e => null);
}
exports.getAttachMeta = getAttachMeta;
const AttachMetaMap = new Map();
async function getAttachMetaByRow(row) {
    if (!AttachMetaMap.has(row.path_dir)) {
        let data = await getAttachMeta(row.path_dir);
        AttachMetaMap.set(row.path_dir, data);
    }
    return AttachMetaMap.get(row.path_dir);
}
exports.getAttachMetaByRow = getAttachMetaByRow;
function _handleVolumeImage(volume, dirname, _data_) {
    const globImages = [
        ...ext_1.toGlobExtImage(),
        '!cover.*',
        '!*.txt',
    ];
    const baseImagePath = 'image';
    const failbackExt = '.png';
    return Bluebird.resolve(null)
        .then(async function () {
        if (volume[exports.SymCache].image) {
            return [];
        }
        const { processReturn, epub, epubOptions, store, cwdRoot } = _data_;
        const { stat } = processReturn.data;
        let vid;
        if (volume instanceof epub_maker2_1.default) {
            vid = '';
        }
        else {
            vid = volume.id;
        }
        volume[exports.SymCache].image = true;
        return novelGlobby.globby(globImages, {
            cwd: dirname,
            absolute: true,
        })
            .then(async (ls) => {
            let arr = [];
            let arr2 = [];
            for (let i in ls) {
                let img = ls[i];
                /*
                let ext = path.extname(img);

                let basename = path.basename(img, ext);

                // @ts-ignore
                let name = slugify(basename);

                if (!name || arr.includes(name))
                {
                    name = hashSum([img, i, name]);
                }

                //name = `${vid}/${i}-` + name + ext;
                name = `${vid}/` + name + ext;

                arr.push('image/' + name);

                epub.withAdditionalFile(img, 'image', name);
                 */
                let ret = store_1.handleAttachFile(img, {
                    vid,
                    epub,
                    epubOptions,
                    store,
                    basePath: baseImagePath,
                    failbackExt,
                    cwd: dirname,
                    cwdRoot,
                });
                if (ret && !arr.includes(ret.returnPath)) {
                    arr.push(ret.returnPath);
                    arr2.push({
                        attr: ` alt="（IMG：${str_util_1.toFullWidth('' + ret.data.basename)}）"`,
                        src: ret.returnPath,
                    });
                }
            }
            let md_attach = await getAttachMeta(dirname);
            if (md_attach && (md_attach.images)) {
                Object.values(md_attach.images)
                    .forEach(v => {
                    if (v) {
                        let ret = store_1.handleAttachFile(v, {
                            vid,
                            epub,
                            epubOptions,
                            store,
                            basePath: baseImagePath,
                            failbackExt,
                            cwd: dirname,
                            cwdRoot,
                        });
                        if (ret && !arr.includes(ret.returnPath)) {
                            arr.push(ret.returnPath);
                            arr2.push({
                                attr: ` alt="（插圖${str_util_1.toFullWidth(v)}）"`,
                                src: ret.returnPath,
                            });
                        }
                    }
                });
            }
            arr = array_hyper_unique_1.array_unique(arr);
            if (arr.length) {
                if (volume instanceof epub_maker2_1.default.Section) {
                    if (volume.content && volume.content.cover && volume.content.cover.name) {
                        arr.unshift(volume.content.cover.name);
                    }
                }
                let chapter = new epub_maker2_1.default.Section("non-specific backmatter" /* NON_SPECIFIC_BACKMATTER */, makePrefixID(processReturn.temp.count_idx++, "image" /* IMAGE */), {
                    title: "\u63D2\u5716" /* IMAGE */,
                    content: arr2.reduce(function (a, b) {
                        let html = html_1.novelImage(b.src, {
                            attr: b.attr,
                        });
                        a.push(html);
                        return a;
                    }, []).join(crlf_normalize_1.LF),
                }, true, false);
                stat.image += arr.length;
                //volume.withSubSection(chapter);
                _withSection(volume, chapter);
            }
            return ls;
        });
    });
}
exports._handleVolumeImage = _handleVolumeImage;
function _handleVolumeImageEach(ls, _data_) {
    const { processReturn, epub, store, epubOptions, cwd } = _data_;
    const temp = processReturn.temp;
    return Bluebird
        .resolve(array_hyper_unique_1.array_unique(ls))
        .mapSeries(async function (row) {
        let key = row.vol_key;
        let volume = temp.cacheTreeSection[key];
        return _handleVolumeImage(volume, row.dirname, _data_)
            .tap(function (ls) {
            if (0 && ls.length) {
                log_1.console.log({
                    volume,
                    ls,
                });
            }
        });
    });
}
exports._handleVolumeImageEach = _handleVolumeImageEach;
function _hookAfterVolume(ls, _data_, afterVolumeTasks) {
    const { processReturn, epub, store, epubOptions, cwd } = _data_;
    const temp = processReturn.temp;
    ls = array_hyper_unique_1.array_unique(ls);
    return Bluebird
        .resolve(ls)
        .mapSeries(async function (row, index) {
        let key = row.vol_key;
        let volume = temp.cacheTreeSection[key];
        return Bluebird.props({
            index,
            row,
            volume,
            mapData: Bluebird.mapSeries(afterVolumeTasks, async (fn, index) => {
                return {
                    index,
                    fn,
                    ret: await fn(volume, row.dirname, _data_, row),
                };
            })
        });
    });
}
exports._hookAfterVolume = _hookAfterVolume;
function _hookAfterEpub(epub, _data_, afterEpubTasks) {
    return Bluebird
        .resolve(epub)
        .then(async function (epub) {
        return Bluebird.props({
            epub,
            mapData: Bluebird.mapSeries(afterEpubTasks, async (fn, index) => {
                return {
                    index,
                    fn,
                    ret: await fn(epub, _data_),
                };
            })
        });
    });
}
exports._hookAfterEpub = _hookAfterEpub;
function addContributeSection(volume, dirname, _data_, row) {
    return Bluebird.resolve(volume)
        .then(async (volume) => {
        if (volume[exports.SymCache].contribute != null) {
            return;
        }
        volume[exports.SymCache].contribute = false;
        return novelGlobby.globby([
            'CONTRIBUTE.md',
        ], {
            cwd: dirname,
            absolute: true,
            deep: 0,
        })
            .then(async (ls) => {
            if (ls.length) {
                const vid = volume.id;
                const attach = await getAttachMetaByRow(row.value);
                const { processReturn } = _data_;
                let file = ls[0];
                let source = await fs.readFile(file);
                let mdReturn = md_1.handleMarkdown(source, {
                    ..._data_,
                    cwd: dirname,
                    vid,
                    attach,
                });
                let chapter = createContributeSection({
                    target: volume,
                    mdReturn,
                    processReturn,
                });
                return volume[exports.SymCache].contribute = true;
            }
        });
    });
}
exports.addContributeSection = addContributeSection;
function createContributeSection(options) {
    return createMarkdownSection({
        ...options,
        epubType: "non-specific backmatter" /* NON_SPECIFIC_BACKMATTER */,
        epubTitle: "CONTRIBUTE" /* CONTRIBUTE */,
        epubPrefix: "contribute" /* CONTRIBUTE */,
    });
}
exports.createContributeSection = createContributeSection;
function createMarkdownSection(options) {
    const { target, mdReturn, processReturn, } = options;
    let title = mdReturn.mdEnv.title || options.epubTitle;
    let chapter = new epub_maker2_1.default.Section(options.epubType, makePrefixID(processReturn.temp.count_idx++, options.epubPrefix), {
        title,
        content: mdReturn.mdHtml,
    }, true, false);
    return _withSection(target, chapter);
}
exports.createMarkdownSection = createMarkdownSection;
function _withSection(target, chapter) {
    if (target instanceof epub_maker2_1.default) {
        target.withSection(chapter);
    }
    else {
        target.withSubSection(chapter);
    }
    return chapter;
}
exports._withSection = _withSection;
//# sourceMappingURL=epub.js.map