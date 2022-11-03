"use strict";
/**
 * Created by user on 2018/2/7/007.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.fixText = exports.getCheerio = exports.epubExtract = exports.IDKEY = void 0;
const tslib_1 = require("tslib");
const epub2_1 = require("epub2");
const toc_1 = require("epub2/lib/toc");
const cheerio_1 = tslib_1.__importDefault(require("cheerio"));
const path_1 = tslib_1.__importDefault(require("path"));
const fs_iconv_1 = tslib_1.__importDefault(require("fs-iconv"));
const fs_iconv_2 = require("fs-iconv");
const bluebird_1 = tslib_1.__importDefault(require("bluebird"));
const node_novel_info_1 = tslib_1.__importDefault(require("node-novel-info"));
const html_1 = require("./lib/html");
const text_1 = require("@node-novel/epub-util/lib/extract/text");
Object.defineProperty(exports, "fixText", { enumerable: true, get: function () { return text_1.fixText; } });
const cheerio_2 = require("@node-novel/epub-util/lib/extract/cheerio");
exports.IDKEY = 'epub';
function epubExtract(srcFile, options = {}) {
    let cwd = options.cwd || process.cwd();
    //srcFile = srcFile.replace(/\u202A/g, '');
    //console.log(srcFile.charCodeAt(0));
    //console.log(path.isAbsolute(srcFile));
    if (!path_1.default.isAbsolute(srcFile)) {
        srcFile = path_1.default.join(cwd, srcFile);
    }
    {
        let exists = fs_iconv_1.default.pathExistsSync(srcFile);
        if (!exists) {
            throw new Error(`file doesn't exist. "${srcFile}"`);
        }
    }
    if (!options.outputDir) {
        options.outputDir = path_1.default.join(cwd, exports.IDKEY);
    }
    else if (!path_1.default.isAbsolute(options.outputDir)) {
        options.outputDir = path_1.default.join(cwd, options.outputDir);
    }
    const PATH_NOVEL_MAIN = options.outputDir;
    // @ts-ignore
    return epub2_1.EPub.createAsync(srcFile)
        .then(async function (epub) {
        // 強制修正無對應的 toc
        await (0, toc_1.fixToc)(epub);
        if (!epub.metadata.title) {
            epub.metadata.title = path_1.default.basename(srcFile, path_1.default.extname(srcFile));
        }
        let path_novel = path_1.default.join(PATH_NOVEL_MAIN, (0, text_1.fixText)((0, fs_iconv_2.trimFilename)(epub.metadata.title)));
        let currentVolume;
        let volume_list = [];
        let lastLevel = 0;
        await bluebird_1.default.mapSeries(epub.toc, async function (elem, index) {
            let doc;
            let $;
            let isVolume;
            let skip;
            if ((epub.metadata.subject || []).includes('epub-maker2')) {
                if (/^\d+$|^volume\d+/.test(elem.id) && !elem.level) {
                    isVolume = true;
                }
                else if (/^\d+|^chapter\d+/.test(elem.id)) {
                    isVolume = false;
                }
                else if (/^image\d+/.test(elem.id)) {
                    isVolume = false;
                }
                else {
                    skip = true;
                }
            }
            else if (epub.ncx_depth >= 0) {
                if (!elem.level) {
                    isVolume = true;
                }
            }
            let volume_index = index;
            let chapter_index = index;
            if (!skip) {
                if (options.noVolume) {
                    isVolume = false;
                }
                else if (!isVolume && lastLevel != elem.level) {
                    // 強制產生目錄
                    doc = await epub.getChapterAsync(elem.id);
                    $ = getCheerio(doc = (0, html_1.fixHtml2)(doc));
                    let volume_title;
                    let a = $('section header h2').eq(0);
                    if (!a.length) {
                        a = $('h2, h3, h1').eq(0);
                    }
                    if (!a.length && !elem.title) {
                        let doc = await epub.getChapterRawAsync(elem.id);
                        let $ = getCheerio(doc);
                        a = $('title').eq(0);
                    }
                    volume_title = (a.text() || elem.title).replace(/^\s+|\s+$/g, '');
                    volume_title = (0, text_1.fixText)(volume_title);
                    currentVolume = volume_list[volume_list.length] = {
                        level: elem.level,
                        volume_index: volume_index,
                        volume_title: volume_title || 'null',
                        chapter_list: [],
                    };
                    lastLevel = elem.level;
                }
                if (isVolume) {
                    doc = await epub.getChapterAsync(elem.id);
                    $ = getCheerio(doc = (0, html_1.fixHtml2)(doc));
                    let a = $('section header h2').eq(0);
                    if (!a.length) {
                        a = $('h2, h3, h1').eq(0);
                    }
                    if (!a.length && !elem.title) {
                        let doc = await epub.getChapterRawAsync(elem.id);
                        let $ = getCheerio(doc);
                        a = $('title').eq(0);
                    }
                    let volume_title = (a.text() || elem.title).replace(/^\s+|\s+$/g, '');
                    volume_title = (0, text_1.fixText)(volume_title);
                    currentVolume = volume_list[volume_list.length] = {
                        level: elem.level,
                        volume_index: volume_index,
                        volume_title,
                        chapter_list: [],
                    };
                }
                else {
                    doc = await epub.getChapterAsync(elem.id);
                    $ = getCheerio(doc = (0, html_1.fixHtml2)(doc));
                    let chapter_title;
                    let a = $('section header h2').eq(0);
                    if (!a.length) {
                        a = $('h2, h3, h1').eq(0);
                    }
                    if (!a.length && !elem.title) {
                        let doc = await epub.getChapterRawAsync(elem.id);
                        let $ = getCheerio(doc = (0, html_1.fixHtml2)(doc));
                        a = $('title').eq(0);
                    }
                    chapter_title = (a.text() || elem.title).replace(/^\s+|\s+$/g, '');
                    chapter_title = (0, text_1.fixText)(chapter_title);
                    a = $('section article').eq(0);
                    if (!a.length) {
                        a = $.root();
                    }
                    a.html((function (old) {
                        let html = (0, html_1.fixHtml2)(old);
                        html = html.replace(/(\/p>)(?=[^\n]*?<p)/ig, '$1\n');
                        return html;
                    })(a.html()));
                    let chapter_article = a.text().replace(/^[\r\n]+|[\r\n\s]+$/g, '');
                    if (!currentVolume) {
                        currentVolume = volume_list[volume_list.length] = {
                            level: Math.max(0, elem.level - 1),
                            volume_index: volume_index,
                            volume_title: 'null',
                            chapter_list: [],
                        };
                    }
                    chapter_article = (0, text_1.fixText)(chapter_article);
                    if (chapter_article.indexOf(chapter_title) == 0) {
                        chapter_article = chapter_article
                            .slice(chapter_title.length)
                            .replace(/^[\r\n]+|[\r\n\s]+$/g, '');
                    }
                    currentVolume
                        .chapter_list
                        .push({
                        level: elem.level,
                        chapter_index: chapter_index,
                        chapter_title,
                        chapter_article,
                    });
                }
            }
        });
        let novel = {
            novel_title: epub.metadata.title,
            novel_author: epub.metadata.creator,
            novel_desc: epub.metadata.description,
            novel_date: epub.metadata.date,
            novel_publisher: epub.metadata.publisher,
            volume_list,
            tags: epub.metadata.subject,
            contribute: epub.metadata['contribute'],
        };
        await bluebird_1.default.mapSeries(volume_list, async function (volume) {
            let vid = volume.volume_index.toString().padStart(4, '0') + '0';
            let dirname = path_1.default.join(path_novel, `${vid} ${(0, fs_iconv_2.trimFilename)(volume.volume_title)}`);
            return bluebird_1.default.mapSeries(volume.chapter_list, async function (chapter) {
                let ext = '.txt';
                // @ts-ignore
                let name = (0, fs_iconv_2.trimFilename)(chapter.chapter_title);
                if (!options.noFirePrefix) {
                    // @ts-ignore
                    let cid = chapter.chapter_index.toString().padStart(4, '0') + '0';
                    name = `${cid}_${name}`;
                }
                let file = path_1.default.join(dirname, `${name}${ext}`);
                // @ts-ignore
                let text = chapter.chapter_article;
                await fs_iconv_1.default.outputFile(file, text);
                if (options.log) {
                    console.log(file);
                }
                return file;
            });
        });
        {
            let epubMaker2 = false;
            let nodeNovel = false;
            epubMaker2 = (epub.metadata.subject || []).includes('epub-maker2');
            nodeNovel = (epub.metadata.subject || []).includes('node-novel');
            let options = {};
            options[exports.IDKEY] = {
                'epub-maker2': epubMaker2,
                'node-novel': nodeNovel,
            };
            let md = node_novel_info_1.default.stringify({
                options,
            }, novel, {
                tags: [
                    exports.IDKEY,
                    "epub-extract",
                    "node-novel",
                ],
                options: {
                    textlayout: {
                        allow_lf2: true,
                    },
                },
            });
            let file = path_1.default.join(path_novel, `README.md`);
            await fs_iconv_1.default.outputFile(file, md);
        }
        return path_novel;
    });
}
exports.epubExtract = epubExtract;
function getCheerio(doc) {
    let $ = cheerio_1.default.load((0, html_1.fixHtml2)(doc));
    (0, cheerio_2.fixCheerio)('body', $);
    return $;
}
exports.getCheerio = getCheerio;
exports.default = epubExtract;
//# sourceMappingURL=index.js.map