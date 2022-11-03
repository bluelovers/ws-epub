"use strict";
/**
 * Created by user on 2019/7/10.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isEncodeURI = exports.isHashedLike = exports.isBadName = exports.saveTxt = exports.padNum = exports.load = exports.saveAttach = exports.files = exports.buffer = exports.fixFilename = exports.autoExtract = void 0;
const tslib_1 = require("tslib");
const jszip_1 = tslib_1.__importDefault(require("jszip"));
const bluebird_1 = tslib_1.__importDefault(require("bluebird"));
const fs_iconv_1 = require("fs-iconv");
const iconv_jschardet_1 = require("iconv-jschardet");
const jsdom_extra_1 = require("jsdom-extra");
const upath2_1 = tslib_1.__importDefault(require("upath2"));
const mdconf2_1 = require("mdconf2");
const debug_color2_1 = require("debug-color2");
const execall2_1 = require("execall2");
const lodash_1 = require("lodash");
const jquery_1 = require("@node-novel/epub-util/lib/extract/jquery");
const html_1 = require("@node-novel/epub-util/lib/extract/html");
const text_1 = require("@node-novel/epub-util/lib/extract/text");
function autoExtract(srcFile, setting) {
    return load(srcFile)
        .tap(async (data) => {
        const cwd = setting && setting.cwd || upath2_1.default.join(process.cwd(), fixFilename(upath2_1.default.basename(srcFile)));
        let options = {
            ...data,
            cwd,
        };
        debug_color2_1.console.dir({
            srcFile,
            cwd,
        });
        return bluebird_1.default.all([
            saveTxt(options),
            saveAttach(options)
        ]);
    });
}
exports.autoExtract = autoExtract;
exports.default = autoExtract;
function fixFilename(file) {
    return (0, fs_iconv_1.trimFilename)(decodeURIComponent(file));
}
exports.fixFilename = fixFilename;
function buffer(buf, cache = {}) {
    return bluebird_1.default.resolve(jszip_1.default.loadAsync(buf, {
        // @ts-ignore
        decodeFileName(bytes) {
            return decodeURIComponent((0, iconv_jschardet_1.decode)(bytes));
        },
    }))
        .then(async (zip) => {
        let txts = await files(zip.file(/\.(?:xhtml|html?)$/), cache);
        return bluebird_1.default.props({
            zip,
            txts,
            files: zip.files,
            cache,
        });
    });
}
exports.buffer = buffer;
function files(files, cache = {}) {
    if (cache._attach == null) {
        cache._attach = {};
    }
    return bluebird_1.default.resolve(files)
        .map(async (file, index) => {
        let buf = await file.async("nodebuffer")
            .then(iconv_jschardet_1.decode)
            .then(buf => {
            return (0, html_1.fixHtml2)(buf.toString());
        });
        let jsdom = await (0, jsdom_extra_1.asyncJSDOM)(buf);
        let { $, document } = jsdom;
        (0, jquery_1.fixJQuery)($('body'), $);
        $('body').html(function (i, old) {
            return (0, html_1.fixHtml2)(old);
        });
        let title = document.title;
        let _parse = upath2_1.default.parse(file.name);
        let _id = fixFilename(_parse.name).replace(/[^\w_\-]+/g, '').slice(0, 20);
        // @ts-ignore
        cache._attach[_parse.dir] = cache._attach[_parse.dir] || {};
        cache._attach[_parse.dir].images = cache._attach[_parse.dir].images || {};
        let imgs = {};
        $('img').each((i, elem) => {
            let _this = $(elem);
            let src = (_this.attr('src') || '').trim();
            if (src) {
                let _name = _id + i.toString().padStart(3, '0');
                while (cache._attach[_parse.dir].images[_name] != null) {
                    _name = _id + (++i).toString().padStart(3, '0');
                }
                src = decodeURIComponent(src);
                imgs[_name] = src;
                cache._attach[_parse.dir].images[_name] = src;
                _this.after(`\n(圖片${_name})\n`);
                _this.remove();
            }
        });
        let innerText = (0, text_1.fixText)($(document.body).text());
        let name = file.name;
        name = name.replace(/\d+/g, (s) => {
            return padNum(s, 4);
        });
        return {
            index,
            name,
            isDir: file.dir,
            title,
            innerText,
            imgs,
        };
    });
}
exports.files = files;
function saveAttach(options) {
    return bluebird_1.default.resolve(Object.entries(options.cache._attach))
        .map(async ([dir, data]) => {
        let cwd = upath2_1.default.join(options.cwd, dir);
        data = (0, lodash_1.cloneDeep)(data);
        await bluebird_1.default
            .resolve(Object.entries(data.images))
            .map(async ([id, src], index, length) => {
            let _parse = upath2_1.default.parse(src);
            let _src = upath2_1.default.join(_parse.dir, id + _parse.ext);
            let _img = upath2_1.default.join(dir, src);
            let _img_path = upath2_1.default.join(cwd, _src);
            data.images[id] = _src;
            return bluebird_1.default
                .resolve(options.zip.file(_img))
                .then(v => v.async('nodebuffer'))
                .then(buf => {
                debug_color2_1.console.gray(`[img][${padNum(index)}/${padNum(length)}]`, _img_path);
                return (0, fs_iconv_1.outputFile)(_img_path, buf);
            })
                .catch(e => {
                debug_color2_1.console.error(e.message, {
                    dir,
                    name: src,
                    _img,
                });
            });
        });
        return (0, fs_iconv_1.outputFile)(upath2_1.default.join(cwd, 'ATTACH.md'), (0, mdconf2_1.stringify)({
            attach: data,
        }));
    });
}
exports.saveAttach = saveAttach;
function load(file, cache = {}) {
    return bluebird_1.default.resolve((0, fs_iconv_1.readFile)(file)).then(buf => buffer(buf, cache));
}
exports.load = load;
function padNum(n, size = 3) {
    return n.toString().padStart(size, '0');
}
exports.padNum = padNum;
function saveTxt(options) {
    return bluebird_1.default
        .resolve(options.txts)
        .map(async (file, index, length) => {
        let _parse = upath2_1.default.parse(file.name);
        let filename = upath2_1.default.join(options.cwd, _parse.dir, _parse.name + '_' + fixFilename(file.title) + '.txt');
        debug_color2_1.console.gray.log(`[txt][${padNum(index)}/${padNum(length)}]`, filename);
        await (0, fs_iconv_1.outputFile)(filename, file.innerText);
        return filename;
    });
}
exports.saveTxt = saveTxt;
function isBadName(input) {
    return /index|^img$|\d{10,}/i.test(input) || isEncodeURI(input) || isHashedLike(input);
}
exports.isBadName = isBadName;
function isHashedLike(input, maxCount = 3) {
    let r = (0, execall2_1.execall)(/([a-f][0-9]|[0-9][a-f])/ig, input);
    return r.length >= maxCount;
}
exports.isHashedLike = isHashedLike;
function isEncodeURI(input, maxCount = 3) {
    let r = (0, execall2_1.execall)(/(%[0-9a-f]{2,})/ig, input);
    return r.length >= maxCount;
}
exports.isEncodeURI = isEncodeURI;
//# sourceMappingURL=index.js.map