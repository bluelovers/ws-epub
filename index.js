"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const epub2_1 = require("epub2");
const toc_1 = require("epub2/lib/toc");
const cheerio = require("cheerio");
const path = require("path");
const fs = require("fs-iconv");
const fs_iconv_1 = require("fs-iconv");
const Promise = require("bluebird");
const novelInfo = require("node-novel-info");
const html_1 = require("./lib/html");
exports.IDKEY = 'epub';
function epubExtract(srcFile, options = {}) {
    let cwd = options.cwd || process.cwd();
    if (!path.isAbsolute(srcFile)) {
        srcFile = path.join(cwd, srcFile);
    }
    {
        let exists = fs.pathExistsSync(srcFile);
        if (!exists) {
            throw new Error(`file not exists. "${srcFile}"`);
        }
    }
    if (!options.outputDir) {
        options.outputDir = path.join(cwd, exports.IDKEY);
    }
    else if (!path.isAbsolute(options.outputDir)) {
        options.outputDir = path.join(cwd, options.outputDir);
    }
    const PATH_NOVEL_MAIN = options.outputDir;
    return epub2_1.EPub.createAsync(srcFile)
        .then(async function (epub) {
        await toc_1.fixToc(epub);
        if (!epub.metadata.title) {
            epub.metadata.title = path.basename(srcFile, path.extname(srcFile));
        }
        let path_novel = path.join(PATH_NOVEL_MAIN, fs_iconv_1.trimFilename(epub.metadata.title));
        let currentVolume;
        let volume_list = [];
        let lastLevel = 0;
        await Promise.mapSeries(epub.toc, async function (elem, index) {
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
            else if (epub.ncx_depth > 1) {
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
                    doc = await epub.getChapterAsync(elem.id);
                    $ = cheerio.load(doc);
                    let volume_title;
                    let a = $('section header h2').eq(0);
                    if (!a.length) {
                        a = $('h2, h3, h1').eq(0);
                    }
                    volume_title = (a.text() || elem.title).replace(/^\s+|\s+$/g, '');
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
                    $ = cheerio.load(doc);
                    let a = $('section header h2').eq(0);
                    if (!a.length) {
                        a = $('h2, h3, h1').eq(0);
                    }
                    currentVolume = volume_list[volume_list.length] = {
                        level: elem.level,
                        volume_index: volume_index,
                        volume_title: (a.text() || elem.title).replace(/^\s+|\s+$/g, ''),
                        chapter_list: [],
                    };
                }
                else {
                    doc = await epub.getChapterAsync(elem.id);
                    $ = cheerio.load(html_1.default(doc));
                    let chapter_title;
                    let a = $('section header h2').eq(0);
                    if (!a.length) {
                        a = $('h2, h3, h1').eq(0);
                    }
                    chapter_title = (a.text() || elem.title).replace(/^\s+|\s+$/g, '');
                    a = $('section article').eq(0);
                    if (!a.length) {
                        a = $.root();
                    }
                    a.html((function (old) {
                        let html = html_1.default(old);
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
            contribute: epub.metadata.contribute,
        };
        await Promise.mapSeries(volume_list, async function (volume) {
            let vid = volume.volume_index.toString().padStart(4, '0') + '0';
            let dirname = path.join(path_novel, `${vid} ${fs_iconv_1.trimFilename(volume.volume_title)}`);
            return await Promise.mapSeries(volume.chapter_list, async function (chapter) {
                let ext = '.txt';
                let name = fs_iconv_1.trimFilename(chapter.chapter_title);
                if (!options.noFirePrefix) {
                    let cid = chapter.chapter_index.toString().padStart(4, '0') + '0';
                    name = `${cid}_${name}`;
                }
                let file = path.join(dirname, `${name}${ext}`);
                let text = chapter.chapter_article;
                await fs.outputFile(file, text);
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
            let md = novelInfo.stringify({
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
            let file = path.join(path_novel, `README.md`);
            await fs.outputFile(file, md);
        }
        return path_novel;
    });
}
exports.epubExtract = epubExtract;
exports.default = epubExtract;
