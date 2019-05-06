"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const epub_maker2_1 = require("epub-maker2");
const Bluebird = require("bluebird");
const util_1 = require("./util");
const util_2 = require("epub-maker2/src/lib/util");
const path = require("upath2");
const fs = require("fs-iconv");
const novelGlobby = require("node-novel-globby/g");
const crlf_normalize_1 = require("crlf-normalize");
const array_hyper_unique_1 = require("array-hyper-unique");
exports.default = exports;
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
function _handleVolumeImage(volume, dirname, _data_) {
    return Bluebird.resolve(null)
        .then(async function () {
        if (volume[exports.SymCache].image) {
            return [];
        }
        const { processReturn, epub } = _data_;
        const { stat } = processReturn.data;
        const vid = volume.id;
        volume[exports.SymCache].image = true;
        return novelGlobby.globby([
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
    const { processReturn, epub } = _data_;
    const temp = processReturn.temp;
    return Bluebird
        .resolve(array_hyper_unique_1.array_unique(ls))
        .mapSeries(async function (row) {
        let key = row.vol_key;
        let volume = temp.cacheTreeSection[key];
        return _handleVolumeImage(volume, row.dirname, {
            epub,
            processReturn,
        })
            .tap(function (ls) {
            if (0 && ls.length) {
                util_1.console.log({
                    volume,
                    ls,
                });
            }
        });
    });
}
exports._handleVolumeImageEach = _handleVolumeImageEach;
//# sourceMappingURL=epub.js.map