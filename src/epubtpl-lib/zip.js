"use strict";
/**
 * Created by user on 2017/12/12/012.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const JSZip = require("jszip");
exports.JSZip = JSZip;
const path = require("path");
const ajax_1 = require("./ajax");
const util_1 = require("../lib/util");
/*
export async function addMimetype(zip: JSZip, epub: EpubMaker, options)
{
    return zip.file('mimetype', options.templates.mimetype);
}

export function addContainerInfo(zip: JSZip, epub: EpubMaker, options)
{
    return zip.folder('META-INF').file('container.xml', compileTpl(options.templates.container, epub.epubConfig));
}
*/
function parseFileSetting(coverUrl, epubConfig) {
    let cover;
    if (typeof coverUrl == 'string') {
        let r = /^(?:\w+:)?\/{2,3}.+/;
        //console.log(path.isAbsolute(coverUrl), coverUrl, r.exec(coverUrl));
        if (!path.isAbsolute(coverUrl) && r.exec(coverUrl)) {
            cover = {
                url: coverUrl,
            };
        }
        else {
            let cwd = epubConfig.cwd || process.cwd();
            cover = {
                file: path.isAbsolute(coverUrl) ? coverUrl : path.join(cwd, coverUrl),
            };
        }
        //console.log(cover);
    }
    else if (coverUrl && (coverUrl.url || coverUrl.file)) {
        cover = coverUrl;
    }
    return cover;
}
exports.parseFileSetting = parseFileSetting;
function addStaticFiles(zip, staticFiles) {
    let cache = {};
    return util_1.BPromise.mapSeries(staticFiles, async function (_file) {
        let file;
        if (!_file.data
            && _file.url
            && cache[_file.url]
            && cache[_file.url].data) {
            let cf = cache[_file.url];
            _file.data = cf.data;
            _file.mime = _file.mime || cf.mime;
        }
        file = await ajax_1.fetchFile(_file);
        if (_file.url) {
            cache[_file.url] = _file;
        }
        zip
            .folder(file.folder)
            .file(file.name, file.data);
        return file;
    })
        .tap(function () {
        cache = null;
    });
}
exports.addStaticFiles = addStaticFiles;
function addFiles(zip, epub, options) {
    let staticFiles = epub.epubConfig.additionalFiles.reduce(function (a, file) {
        a.push(Object.assign({}, file, {
            folder: file.folder ? path.join('EPUB', file.folder) : 'EPUB',
        }));
        return a;
    }, []);
    return addStaticFiles(zip, staticFiles)
        .then(function (staticFiles) {
        epub.epubConfig.additionalFiles.forEach((v, i) => {
            let s = staticFiles[i];
            v.mime = v.mime || s.mime;
            v.name = s.name;
            if (v.folder === null) {
                // @ts-ignore
                v.href = v.name;
            }
            else {
                // @ts-ignore
                v.href = [v.folder, v.name].join('/');
            }
            // @ts-ignore
            v.id = v.id || 'additionalFiles-' + util_1.hashSum(v.name);
        });
        //console.log(epub.epubConfig.additionalFiles, staticFiles);
        return staticFiles;
    });
}
exports.addFiles = addFiles;
async function addCover(zip, epub, options) {
    if (epub.epubConfig.cover) {
        epub.epubConfig.cover.basename = 'CoverDesign';
        let file = await ajax_1.fetchFile(epub.epubConfig.cover)
            .catch(e => {
            console.error(e && e.meggage || `can't fetch cover`);
            return null;
        });
        if (!file) {
            return false;
        }
        //file.name = `CoverDesign${file.ext}`;
        let filename = file.name = file.folder ? path.join(file.folder, file.name) : file.name;
        zip
            .folder('EPUB')
            //.folder('images')
            .file(filename, file.data);
        return filename;
    }
    return false;
}
exports.addCover = addCover;
function addSubSections(zip, section, cb, epub, options) {
    return util_1.BPromise
        .resolve(cb(zip, section, epub.epubConfig, options))
        .then(function () {
        return util_1.BPromise.mapSeries(section.subSections, function (subSection) {
            return addSubSections(zip, subSection, cb, epub, options);
        });
    });
}
exports.addSubSections = addSubSections;
exports.default = exports;
//# sourceMappingURL=zip.js.map