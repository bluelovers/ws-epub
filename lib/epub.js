"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const epub_maker2_1 = require("epub-maker2");
const Bluebird = require("bluebird");
const log_1 = require("./log");
const util_1 = require("./util");
const util_2 = require("epub-maker2/src/lib/util");
const path = require("upath2");
const fs = require("fs-iconv");
const novelGlobby = require("node-novel-globby/g");
const crlf_normalize_1 = require("crlf-normalize");
const array_hyper_unique_1 = require("array-hyper-unique");
const store_1 = require("./store");
exports.SymCache = Symbol('cache');
var EnumPrefixIDType;
(function (EnumPrefixIDType) {
    EnumPrefixIDType["VOLUME"] = "volume";
    EnumPrefixIDType["CHAPTER"] = "chapter";
    EnumPrefixIDType["IMAGE"] = "image";
})(EnumPrefixIDType = exports.EnumPrefixIDType || (exports.EnumPrefixIDType = {}));
var EnumPrefixIDTitle;
(function (EnumPrefixIDTitle) {
    EnumPrefixIDTitle["IMAGE"] = "\u63D2\u5716";
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
    });
}
exports._handleVolume = _handleVolume;
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
        .then(attach => {
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
    return Bluebird.resolve(null)
        .then(async function () {
        if (volume[exports.SymCache].image) {
            return [];
        }
        const { processReturn, epub, epubOptions, store } = _data_;
        const { stat } = processReturn.data;
        const vid = volume.id;
        volume[exports.SymCache].image = true;
        return novelGlobby.globby([
            '*.{jpg,gif,png,jpeg,svg,webp,apng}',
            'image/*.{jpg,gif,png,jpeg,svg,webp,apng}',
            'images/*.{jpg,gif,png,jpeg,svg,webp,apng}',
            '!cover.*',
            '!*.txt',
        ], {
            cwd: dirname,
            absolute: true,
        })
            .then(async (ls) => {
            let arr = [];
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
                    basePath: 'image',
                    failbackExt: '.jpg',
                    cwd: dirname,
                });
                if (ret) {
                    arr.push(ret.returnPath);
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
                            basePath: 'image',
                            failbackExt: '.jpg',
                            cwd: dirname,
                        });
                        if (ret) {
                            arr.push(ret.returnPath);
                        }
                    }
                });
            }
            if (arr.length) {
                if (volume.content && volume.content.cover && volume.content.cover.name) {
                    arr.unshift(volume.content.cover.name);
                }
                let chapter = new epub_maker2_1.default.Section("non-specific backmatter" /* NON_SPECIFIC_BACKMATTER */, makePrefixID(processReturn.temp.count_idx++, "image" /* IMAGE */), {
                    title: "\u63D2\u5716" /* IMAGE */,
                    content: arr.reduce(function (a, b) {
                        let html = htmlImage(b);
                        a.push(html);
                        return a;
                    }, []).join(crlf_normalize_1.LF),
                }, true, false);
                stat.image += arr.length;
                volume.withSubSection(chapter);
            }
            return ls;
        });
    });
}
exports._handleVolumeImage = _handleVolumeImage;
function htmlImage(src) {
    return `<figure class="fullpage ImageContainer page-break-before"><img id="CoverImage" class="CoverImage" src="${src}" alt="Cover" /></figure>`;
}
exports.htmlImage = htmlImage;
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
//# sourceMappingURL=epub.js.map