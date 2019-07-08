"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const epub_maker2_1 = require("epub-maker2");
const path = require("path");
const lazy_url_1 = require("lazy-url");
const fs_extra_1 = require("fs-extra");
const execall2_1 = require("execall2");
const transliteration_1 = require("transliteration");
const str_util_1 = require("str-util");
class EpubStore {
    constructor() {
        this.$cache = new Map();
        this.$names = new Set();
    }
    _name(_data, options) {
        const { input, isFile } = _data;
        if (!this.$cache.has(input)) {
            let { name = _data.name, ext = _data.ext, vid, basePath, chkExt = defaultChkExt, failbackExt, failbackName } = options;
            let i = 0;
            name = name || _data.name;
            name = transliteration_1.slugify(name) || name;
            let cur_name = name;
            if (isBadName(name) || isHashedLike(name)) {
                if (failbackName) {
                    cur_name = name = failbackName;
                }
                else {
                    name = 'img_';
                    cur_name = name + (++i).toString().padStart(3, '0');
                }
            }
            let oldExt = ext;
            if (failbackExt && chkExt(ext)) {
                ext = failbackExt;
            }
            let value;
            let basename;
            do {
                basename = cur_name;
                value = `${vid}/${cur_name}${ext}`;
                cur_name = name + (++i).toString().padStart(3, '0');
            } while (this.$names.has(value));
            this.$names.add(value);
            this.$cache.set(input, {
                uuid: input,
                input,
                vid,
                basePath,
                ext,
                basename,
                value,
                isFile,
                oldExt,
            });
        }
        return this.$cache.get(input);
    }
    get(input, options) {
        let _data = parsePath(input);
        if (_data) {
            return this._name(_data, options);
        }
    }
}
exports.EpubStore = EpubStore;
function defaultChkExt(ext) {
    return !ext || ext === '.' || /php|cgi|htm|js|ts/i.test(ext);
}
exports.defaultChkExt = defaultChkExt;
function isBadName(input) {
    return /index|^img$|\d{10,}/i.test(input) || isEncodeURI(input);
}
exports.isBadName = isBadName;
function isHashedLike(input, maxCount = 3) {
    let r = execall2_1.default(/([a-f][0-9]|[0-9][a-f])/ig, input);
    return r.length >= maxCount;
}
exports.isHashedLike = isHashedLike;
function isEncodeURI(input, maxCount = 3) {
    let r = execall2_1.default(/(%[0-9a-f]{2,})/ig, input);
    return r.length >= maxCount;
}
exports.isEncodeURI = isEncodeURI;
/**
 *
 * @example console.dir(parsePath(__filename))
 * @example console.dir(parsePath('https://xs.dmzj.com/img/1406/79/a7e62ec50db1db823c61a2127aec9827.jpg'))
 */
function parsePath(input, cwd) {
    try {
        const isFile = true;
        if (fs_extra_1.pathExistsSync(input)) {
            let data = path.parse(input);
            let { ext, name } = data;
            name = decodeURIComponent(name);
            return {
                isFile,
                input,
                ext,
                name,
                data,
            };
        }
        else if (fs_extra_1.pathExistsSync(input = path.join(cwd, input))) {
            let data = path.parse(input);
            let { ext, name } = data;
            name = decodeURIComponent(name);
            return {
                isFile,
                input,
                ext,
                name,
                data,
            };
        }
    }
    catch (e) {
    }
    try {
        const isFile = false;
        let u = new URL(input);
        if (u.protocol && u.host) {
            let pathname = decodeURIComponent(u.pathname);
            let ext = path.extname(pathname);
            let name = path.basename(pathname, ext);
            let data = new lazy_url_1.default(u).toObject();
            if (!name) {
                name = epub_maker2_1.hashSum(input);
            }
            return {
                isFile,
                input,
                ext,
                name,
                data,
            };
        }
    }
    catch (e) {
    }
    return null;
}
exports.parsePath = parsePath;
function handleAttachFile(input, plusData) {
    const { store, vid, epub, epubOptions, failbackExt, failbackName } = plusData || {};
    let data = store.get(input, {
        ...plusData,
        vid,
        failbackExt,
    });
    if (data) {
        let { value, input, basePath } = data;
        if (typeof basePath === 'undefined') {
            basePath = plusData.basePath;
        }
        let returnPath;
        if (basePath == null) {
            returnPath = `${value}`;
        }
        else {
            returnPath = `${basePath}/${value}`;
        }
        if (!data.isFile) {
            if (!epubOptions.downloadRemoteFile) {
                returnPath = input;
                return {
                    ok: false,
                    returnPath,
                    input,
                    value,
                    basePath,
                    isFile: data.isFile,
                    data,
                };
            }
            epub.withAdditionalFile(input, basePath, value);
        }
        else {
            epub.withAdditionalFile(input, basePath, value);
        }
        return {
            ok: true,
            returnPath,
            input,
            value,
            basePath,
            isFile: data.isFile,
            data,
        };
    }
}
exports.handleAttachFile = handleAttachFile;
function getAttachID(id, attach) {
    const { images } = attach || {};
    id = str_util_1.toHalfWidth(id).trim();
    if (!images[id]) {
        id = id.toLowerCase();
    }
    if (!images[id]) {
        id = id.toUpperCase();
    }
    let input = images[id];
    if (input && typeof input === 'string' && (input = input.trim())) {
        return {
            id, input,
        };
    }
}
exports.getAttachID = getAttachID;
//# sourceMappingURL=store.js.map