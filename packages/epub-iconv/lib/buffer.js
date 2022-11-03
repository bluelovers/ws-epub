"use strict";
/**
 * Created by user on 2019/7/31.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleZipBuffer = exports.handleZipObject = exports.loadZipBuffer = void 0;
const tslib_1 = require("tslib");
const jszip_1 = tslib_1.__importDefault(require("jszip"));
const bluebird_1 = tslib_1.__importDefault(require("bluebird"));
const iconv_jschardet_1 = tslib_1.__importDefault(require("iconv-jschardet"));
const min_1 = require("@lazy-cjk/zh-convert/min");
const const_1 = require("@node-novel/epub-util/lib/const");
const options_1 = require("./options");
function loadZipBuffer(zipBuffer) {
    return bluebird_1.default.resolve(zipBuffer)
        .then(zipBuffer => jszip_1.default.loadAsync(zipBuffer));
}
exports.loadZipBuffer = loadZipBuffer;
function cn2tw_min(input) {
    return (0, min_1.cn2tw_min)(input, {
        safe: false
    });
}
function handleZipObject(zip, options) {
    return bluebird_1.default.resolve(zip)
        .then(async (zip) => {
        let fnIconv;
        options = (0, options_1.handleOptions)(options);
        {
            options.iconvFn = options.iconvFn || {};
            let { tw = cn2tw_min, cn = min_1.tw2cn_min } = options.iconvFn;
            options.iconvFn.tw = tw;
            options.iconvFn.cn = cn;
        }
        ;
        if (options.iconvFn && options.iconvFn[options.iconv]) {
            fnIconv = options.iconvFn[options.iconv];
        }
        else {
            switch (options.iconv) {
                case 'cn':
                    fnIconv = options.iconvFn.cn || min_1.tw2cn_min;
                    break;
                case 'tw':
                default:
                    fnIconv = options.iconvFn.tw || cn2tw_min;
                    break;
            }
        }
        await bluebird_1.default
            .resolve(zip.file(/\.(?:x?html?|txt)$/))
            .map(async (zipFile) => {
            let buf = await zipFile
                .async('nodebuffer')
                .then(buf => iconv_jschardet_1.default.encode(buf, 'utf8'))
                .then(buf => fnIconv(buf.toString()))
                .then(buf => Buffer.from(buf));
            return zip.file(zipFile.name, buf, {
                date: zipFile.date,
                createFolders: false,
            });
        });
        return zip;
    });
}
exports.handleZipObject = handleZipObject;
function handleZipBuffer(zipBuffer, options) {
    return loadZipBuffer(zipBuffer)
        .then(buf => handleZipObject(buf, options))
        .then(zip => zip.generateAsync((0, const_1.createJSZipGeneratorOptions)()));
}
exports.handleZipBuffer = handleZipBuffer;
//# sourceMappingURL=buffer.js.map