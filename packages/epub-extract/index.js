"use strict";
/**
 * Created by user on 2018/2/7/007.
 */
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-ignore
const epub2_1 = require("epub2");
const toc_1 = require("epub2/lib/toc");
const cheerio = require("cheerio");
const path = require("path");
const fs = require("fs-iconv");
const fs_iconv_1 = require("fs-iconv");
const Promise = require("bluebird");
const novelInfo = require("node-novel-info");
const html_1 = require("./lib/html");
const text_1 = require("@node-novel/epub-util/lib/extract/text");
exports.fixText = text_1.fixText;
const cheerio_1 = require("@node-novel/epub-util/lib/extract/cheerio");
exports.IDKEY = 'epub';
function epubExtract(srcFile, options = {}) {
    let cwd = options.cwd || process.cwd();
    //srcFile = srcFile.replace(/\u202A/g, '');
    //console.log(srcFile.charCodeAt(0));
    //console.log(path.isAbsolute(srcFile));
    if (!path.isAbsolute(srcFile)) {
        srcFile = path.join(cwd, srcFile);
    }
    {
        let exists = fs.pathExistsSync(srcFile);
        if (!exists) {
            throw new Error(`file doesn't exist. "${srcFile}"`);
        }
    }
    if (!options.outputDir) {
        options.outputDir = path.join(cwd, exports.IDKEY);
    }
    else if (!path.isAbsolute(options.outputDir)) {
        options.outputDir = path.join(cwd, options.outputDir);
    }
    const PATH_NOVEL_MAIN = options.outputDir;
    // @ts-ignore
    return epub2_1.EPub.createAsync(srcFile)
        .then(async function (epub) {
        // 強制修正無對應的 toc
        await toc_1.fixToc(epub);
        if (!epub.metadata.title) {
            epub.metadata.title = path.basename(srcFile, path.extname(srcFile));
        }
        let path_novel = path.join(PATH_NOVEL_MAIN, text_1.fixText(fs_iconv_1.trimFilename(epub.metadata.title)));
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
                    $ = getCheerio(doc = html_1.fixHtml2(doc));
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
                    volume_title = text_1.fixText(volume_title);
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
                    $ = getCheerio(doc = html_1.fixHtml2(doc));
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
                    volume_title = text_1.fixText(volume_title);
                    currentVolume = volume_list[volume_list.length] = {
                        level: elem.level,
                        volume_index: volume_index,
                        volume_title,
                        chapter_list: [],
                    };
                }
                else {
                    doc = await epub.getChapterAsync(elem.id);
                    $ = getCheerio(doc = html_1.fixHtml2(doc));
                    let chapter_title;
                    let a = $('section header h2').eq(0);
                    if (!a.length) {
                        a = $('h2, h3, h1').eq(0);
                    }
                    if (!a.length && !elem.title) {
                        let doc = await epub.getChapterRawAsync(elem.id);
                        let $ = getCheerio(doc = html_1.fixHtml2(doc));
                        a = $('title').eq(0);
                    }
                    chapter_title = (a.text() || elem.title).replace(/^\s+|\s+$/g, '');
                    chapter_title = text_1.fixText(chapter_title);
                    a = $('section article').eq(0);
                    if (!a.length) {
                        a = $.root();
                    }
                    a.html((function (old) {
                        let html = html_1.fixHtml2(old);
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
                    chapter_article = text_1.fixText(chapter_article);
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
            return Promise.mapSeries(volume.chapter_list, async function (chapter) {
                let ext = '.txt';
                // @ts-ignore
                let name = fs_iconv_1.trimFilename(chapter.chapter_title);
                if (!options.noFirePrefix) {
                    // @ts-ignore
                    let cid = chapter.chapter_index.toString().padStart(4, '0') + '0';
                    name = `${cid}_${name}`;
                }
                let file = path.join(dirname, `${name}${ext}`);
                // @ts-ignore
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
function getCheerio(doc) {
    let $ = cheerio.load(html_1.fixHtml2(doc));
    cheerio_1.fixCheerio('body', $);
    return $;
}
exports.getCheerio = getCheerio;
exports.default = epubExtract;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7O0FBRUgsYUFBYTtBQUNiLGlDQUE4QztBQUM5Qyx1Q0FBdUM7QUFDdkMsbUNBQW1DO0FBQ25DLDZCQUE2QjtBQUM3QiwrQkFBK0I7QUFDL0IsdUNBQXdDO0FBRXhDLG9DQUFvQztBQUNwQyw2Q0FBNkM7QUFDN0MscUNBQXNDO0FBRXRDLGlFQUFpRTtBQW1YeEQsa0JBblhBLGNBQU8sQ0FtWEE7QUFsWGhCLHVFQUF1RTtBQUUxRCxRQUFBLEtBQUssR0FBRyxNQUFNLENBQUM7QUFvQjVCLFNBQWdCLFdBQVcsQ0FBQyxPQUFlLEVBQUUsVUFBb0IsRUFBRTtJQUVsRSxJQUFJLEdBQUcsR0FBRyxPQUFPLENBQUMsR0FBRyxJQUFJLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQztJQUV2QywyQ0FBMkM7SUFFM0MscUNBQXFDO0lBQ3JDLHdDQUF3QztJQUV4QyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsRUFDN0I7UUFDQyxPQUFPLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsT0FBTyxDQUFDLENBQUM7S0FDbEM7SUFFRDtRQUNDLElBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLENBQUM7UUFFeEMsSUFBSSxDQUFDLE1BQU0sRUFDWDtZQUNDLE1BQU0sSUFBSSxLQUFLLENBQUMsd0JBQXdCLE9BQU8sR0FBRyxDQUFDLENBQUM7U0FDcEQ7S0FDRDtJQUVELElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUN0QjtRQUNDLE9BQU8sQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsYUFBSyxDQUFDLENBQUE7S0FDekM7U0FDSSxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEVB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TUFBTSxFQUFFLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQztTQUM5QjtRQUVELE9BQU8sVUFBVSxDQUFDO0lBQ25CLENBQUMsQ0FBQyxDQUNEO0FBQ0gsQ0FBQztBQWpWRCxrQ0FpVkM7QUFFRCxTQUFnQixVQUFVLENBQUMsR0FBVztJQUVyQyxJQUFJLENBQUMsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLGVBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBRXBDLG9CQUFVLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBRXRCLE9BQU8sQ0FBQyxDQUFBO0FBQ1QsQ0FBQztBQVBELGdDQU9DO0FBSUQsa0JBQWUsV0FBVyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDcmVhdGVkIGJ5IHVzZXIgb24gMjAxOC8yLzcvMDA3LlxuICovXG5cbi8vIEB0cy1pZ25vcmVcbmltcG9ydCB7IEVQdWIsIFNZTUJPTF9SQVdfREFUQSB9IGZyb20gJ2VwdWIyJztcbmltcG9ydCB7IGZpeFRvYyB9IGZyb20gJ2VwdWIyL2xpYi90b2MnO1xuaW1wb3J0ICogYXMgY2hlZXJpbyBmcm9tICdjaGVlcmlvJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcy1pY29udic7XG5pbXBvcnQgeyB0cmltRmlsZW5hbWUgfSBmcm9tICdmcy1pY29udic7XG5cbmltcG9ydCAqIGFzIFByb21pc2UgZnJvbSAnYmx1ZWJpcmQnO1xuaW1wb3J0ICogYXMgbm92ZWxJbmZvIGZyb20gJ25vZGUtbm92ZWwtaW5mbyc7XG5pbXBvcnQgeyBmaXhIdG1sMiB9IGZyb20gJy4vbGliL2h0bWwnO1xuaW1wb3J0IHJlbW92ZVplcm9XaWR0aCwgeyBuYnNwVG9TcGFjZSB9IGZyb20gJ3plcm8td2lkdGgvbGliJztcbmltcG9ydCB7IGZpeFRleHQgfSBmcm9tICdAbm9kZS1ub3ZlbC9lcHViLXV0aWwvbGliL2V4dHJhY3QvdGV4dCc7XG5pbXBvcnQgeyBmaXhDaGVlcmlvIH0gZnJvbSAnQG5vZGUtbm92ZWwvZXB1Yi11dGlsL2xpYi9leHRyYWN0L2NoZWVyaW8nO1xuXG5leHBvcnQgY29uc3QgSURLRVkgPSAnZXB1Yic7XG5cbmV4cG9ydCBpbnRlcmZhY2UgSU9wdGlvbnNcbntcblx0b3V0cHV0RGlyPzogc3RyaW5nLFxuXHRjd2Q/OiBzdHJpbmcsXG5cblx0LyoqXG5cdCAqIHByaW50IGxvZyBtZXNzYWdlXG5cdCAqL1xuXHRsb2c/OiBib29sZWFuLFxuXG5cdG5vRmlyZVByZWZpeD86IGJvb2xlYW4sXG5cblx0LyoqXG5cdCAqIOeUqOS+huW8t+WItuino+axuuafkOS6m+ebrumMhOmMr+S6giDmiJbogIUg54Sh5rOV6JmV55CG5aSa5bGk55uu6YyE55qE5ZWP6aGMXG5cdCAqL1xuXHRub1ZvbHVtZT86IGJvb2xlYW4sXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlcHViRXh0cmFjdChzcmNGaWxlOiBzdHJpbmcsIG9wdGlvbnM6IElPcHRpb25zID0ge30pOiBQcm9taXNlPHN0cmluZz5cbntcblx0bGV0IGN3ZCA9IG9wdGlvbnMuY3dkIHx8IHByb2Nlc3MuY3dkKCk7XG5cblx0Ly9zcmNGaWxlID0gc3JjRmlsZS5yZXBsYWNlKC9cXHUyMDJBL2csICcnKTtcblxuXHQvL2NvbnNvbGUubG9nKHNyY0ZpbGUuY2hhckNvZGVBdCgwKSk7XG5cdC8vY29uc29sZS5sb2cocGF0aC5pc0Fic29sdXRlKHNyY0ZpbGUpKTtcblxuXHRpZiAoIXBhdGguaXNBYnNvbHV0ZShzcmNGaWxlKSlcblx0e1xuXHRcdHNyY0ZpbGUgPSBwYXRoLmpvaW4oY3dkLCBzcmNGaWxlKTtcblx0fVxuXG5cdHtcblx0XHRsZXQgZXhpc3RzID0gZnMucGF0aEV4aXN0c1N5bmMoc3JjRmlsZSk7XG5cblx0XHRpZiAoIWV4aXN0cylcblx0XHR7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoYGZpbGUgZG9lc24ndCBleGlzdC4gXCIke3NyY0ZpbGV9XCJgKTtcblx0XHR9XG5cdH1cblxuXHRpZiAoIW9wdGlvbnMub3V0cHV0RGlyKVxuXHR7XG5cdFx0b3B0aW9ucy5vdXRwdXREaXIgPSBwYXRoLmpvaW4oY3dkLCBJREtFWSlcblx0fVxuXHRlbHNlIGlmICghcGF0aC5pc0Fic29sdXRlKG9wdGlvbnMub3V0cHV0RGlyKSlcblx0e1xuXHRcdG9wdGlvbnMub3V0cHV0RGlyID0gcGF0aC5qb2luKGN3ZCwgb3B0aW9ucy5vdXRwdXREaXIpO1xuXHR9XG5cblx0Y29uc3QgUEFUSF9OT1ZFTF9NQUlOID0gb3B0aW9ucy5vdXRwdXREaXI7XG5cblx0Ly8gQHRzLWlnbm9yZVxuXHRyZXR1cm4gRVB1Yi5jcmVhdGVBc3luYyhzcmNGaWxlKVxuXHRcdC50aGVuKGFzeW5jIGZ1bmN0aW9uIChlcHViKVxuXHRcdHtcblx0XHRcdC8vIOW8t+WItuS/ruato+eEoeWwjeaHieeahCB0b2Ncblx0XHRcdGF3YWl0IGZpeFRvYyhlcHViKTtcblxuXHRcdFx0aWYgKCFlcHViLm1ldGFkYXRhLnRpdGxlKVxuXHRcdFx0e1xuXHRcdFx0XHRlcHViLm1ldGFkYXRhLnRpdGxlID0gcGF0aC5iYXNlbmFtZShzcmNGaWxlLCBwYXRoLmV4dG5hbWUoc3JjRmlsZSkpXG5cdFx0XHR9XG5cblx0XHRcdGxldCBwYXRoX25vdmVsID0gcGF0aC5qb2luKFBBVEhfTk9WRUxfTUFJTixcblx0XHRcdFx0Zml4VGV4dCh0cmltRmlsZW5hbWUoZXB1Yi5tZXRhZGF0YS50aXRsZSkpXG5cdFx0XHQpO1xuXG5cdFx0XHRsZXQgY3VycmVudFZvbHVtZTtcblx0XHRcdGxldCB2b2x1bWVfbGlzdCA9IFtdO1xuXG5cdFx0XHRsZXQgbGFzdExldmVsID0gMDtcblxuXHRcdFx0YXdhaXQgUHJvbWlzZS5tYXBTZXJpZXMoZXB1Yi50b2MsIGFzeW5jIGZ1bmN0aW9uIChlbGVtLCBpbmRleClcblx0XHRcdHtcblx0XHRcdFx0bGV0IGRvYztcblx0XHRcdFx0bGV0ICQ7XG5cblx0XHRcdFx0bGV0IGlzVm9sdW1lOiBib29sZWFuO1xuXHRcdFx0XHRsZXQgc2tpcDogYm9vbGVhbjtcblxuXHRcdFx0XHRpZiAoKGVwdWIubWV0YWRhdGEuc3ViamVjdCB8fCBbXSkuaW5jbHVkZXMoJ2VwdWItbWFrZXIyJykpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRpZiAoL15cXGQrJHxedm9sdW1lXFxkKy8udGVzdChlbGVtLmlkKSAmJiAhZWxlbS5sZXZlbClcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRpc1ZvbHVtZSA9IHRydWU7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVsc2UgaWYgKC9eXFxkK3xeY2hhcHRlclxcZCsvLnRlc3QoZWxlbS5pZCkpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0aXNWb2x1bWUgPSBmYWxzZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZSBpZiAoL15pbWFnZVxcZCsvLnRlc3QoZWxlbS5pZCkpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0aXNWb2x1bWUgPSBmYWxzZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdHNraXAgPSB0cnVlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlIGlmIChlcHViLm5jeF9kZXB0aCA+PSAwKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0aWYgKCFlbGVtLmxldmVsKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGlzVm9sdW1lID0gdHJ1ZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRsZXQgdm9sdW1lX2luZGV4ID0gaW5kZXg7XG5cdFx0XHRcdGxldCBjaGFwdGVyX2luZGV4ID0gaW5kZXg7XG5cblx0XHRcdFx0aWYgKCFza2lwKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0aWYgKG9wdGlvbnMubm9Wb2x1bWUpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0aXNWb2x1bWUgPSBmYWxzZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZSBpZiAoIWlzVm9sdW1lICYmIGxhc3RMZXZlbCAhPSBlbGVtLmxldmVsKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdC8vIOW8t+WItueUoueUn+ebrumMhFxuXHRcdFx0XHRcdFx0ZG9jID0gYXdhaXQgZXB1Yi5nZXRDaGFwdGVyQXN5bmMoZWxlbS5pZCk7XG5cdFx0XHRcdFx0XHQkID0gZ2V0Q2hlZXJpbyhkb2MgPSBmaXhIdG1sMihkb2MpKTtcblxuXHRcdFx0XHRcdFx0bGV0IHZvbHVtZV90aXRsZTogc3RyaW5nO1xuXG5cdFx0XHRcdFx0XHRsZXQgYSA9ICQoJ3NlY3Rpb24gaGVhZGVyIGgyJykuZXEoMCk7XG5cblx0XHRcdFx0XHRcdGlmICghYS5sZW5ndGgpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdGEgPSAkKCdoMiwgaDMsIGgxJykuZXEoMCk7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdGlmICghYS5sZW5ndGggJiYgIWVsZW0udGl0bGUpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdGxldCBkb2MgPSBhd2FpdCBlcHViLmdldENoYXB0ZXJSYXdBc3luYyhlbGVtLmlkKTtcblx0XHRcdFx0XHRcdFx0bGV0ICQgPSBnZXRDaGVlcmlvKGRvYyk7XG5cdFx0XHRcdFx0XHRcdGEgPSAkKCd0aXRsZScpLmVxKDApO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHR2b2x1bWVfdGl0bGUgPSAoYS50ZXh0KCkgfHwgZWxlbS50aXRsZSkucmVwbGFjZSgvXlxccyt8XFxzKyQvZywgJycpO1xuXG5cdFx0XHRcdFx0XHR2b2x1bWVfdGl0bGUgPSBmaXhUZXh0KHZvbHVtZV90aXRsZSk7XG5cblx0XHRcdFx0XHRcdGN1cnJlbnRWb2x1bWUgPSB2b2x1bWVfbGlzdFt2b2x1bWVfbGlzdC5sZW5ndGhdID0ge1xuXHRcdFx0XHRcdFx0XHRsZXZlbDogZWxlbS5sZXZlbCxcblx0XHRcdFx0XHRcdFx0dm9sdW1lX2luZGV4OiB2b2x1bWVfaW5kZXgsXG5cdFx0XHRcdFx0XHRcdHZvbHVtZV90aXRsZTogdm9sdW1lX3RpdGxlIHx8ICdudWxsJyxcblx0XHRcdFx0XHRcdFx0Y2hhcHRlcl9saXN0OiBbXSxcblx0XHRcdFx0XHRcdH07XG5cblx0XHRcdFx0XHRcdGxhc3RMZXZlbCA9IGVsZW0ubGV2ZWw7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0aWYgKGlzVm9sdW1lKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGRvYyA9IGF3YWl0IGVwdWIuZ2V0Q2hhcHRlckFzeW5jKGVsZW0uaWQpO1xuXHRcdFx0XHRcdFx0JCA9IGdldENoZWVyaW8oZG9jID0gZml4SHRtbDIoZG9jKSk7XG5cblx0XHRcdFx0XHRcdGxldCBhID0gJCgnc2VjdGlvbiBoZWFkZXIgaDInKS5lcSgwKTtcblxuXHRcdFx0XHRcdFx0aWYgKCFhLmxlbmd0aClcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0YSA9ICQoJ2gyLCBoMywgaDEnKS5lcSgwKTtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0aWYgKCFhLmxlbmd0aCAmJiAhZWxlbS50aXRsZSlcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0bGV0IGRvYyA9IGF3YWl0IGVwdWIuZ2V0Q2hhcHRlclJhd0FzeW5jKGVsZW0uaWQpO1xuXHRcdFx0XHRcdFx0XHRsZXQgJCA9IGdldENoZWVyaW8oZG9jKTtcblxuXHRcdFx0XHRcdFx0XHRhID0gJCgndGl0bGUnKS5lcSgwKTtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0bGV0IHZvbHVtZV90aXRsZSA9IChhLnRleHQoKSB8fCBlbGVtLnRpdGxlKS5yZXBsYWNlKC9eXFxzK3xcXHMrJC9nLCAnJyk7XG5cblx0XHRcdFx0XHRcdHZvbHVtZV90aXRsZSA9IGZpeFRleHQodm9sdW1lX3RpdGxlKTtcblxuXHRcdFx0XHRcdFx0Y3VycmVudFZvbHVtZSA9IHZvbHVtZV9saXN0W3ZvbHVtZV9saXN0Lmxlbmd0aF0gPSB7XG5cdFx0XHRcdFx0XHRcdGxldmVsOiBlbGVtLmxldmVsLFxuXHRcdFx0XHRcdFx0XHR2b2x1bWVfaW5kZXg6IHZvbHVtZV9pbmRleCxcblx0XHRcdFx0XHRcdFx0dm9sdW1lX3RpdGxlLFxuXHRcdFx0XHRcdFx0XHRjaGFwdGVyX2xpc3Q6IFtdLFxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0ZG9jID0gYXdhaXQgZXB1Yi5nZXRDaGFwdGVyQXN5bmMoZWxlbS5pZCk7XG5cdFx0XHRcdFx0XHQkID0gZ2V0Q2hlZXJpbyhkb2MgPSBmaXhIdG1sMihkb2MpKTtcblxuXHRcdFx0XHRcdFx0bGV0IGNoYXB0ZXJfdGl0bGU6IHN0cmluZztcblxuXHRcdFx0XHRcdFx0bGV0IGEgPSAkKCdzZWN0aW9uIGhlYWRlciBoMicpLmVxKDApO1xuXG5cdFx0XHRcdFx0XHRpZiAoIWEubGVuZ3RoKVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRhID0gJCgnaDIsIGgzLCBoMScpLmVxKDApO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRpZiAoIWEubGVuZ3RoICYmICFlbGVtLnRpdGxlKVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRsZXQgZG9jID0gYXdhaXQgZXB1Yi5nZXRDaGFwdGVyUmF3QXN5bmMoZWxlbS5pZCk7XG5cdFx0XHRcdFx0XHRcdGxldCAkID0gZ2V0Q2hlZXJpbyhkb2MgPSBmaXhIdG1sMihkb2MpKTtcblxuXHRcdFx0XHRcdFx0XHRhID0gJCgndGl0bGUnKS5lcSgwKTtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0Y2hhcHRlcl90aXRsZSA9IChhLnRleHQoKSB8fCBlbGVtLnRpdGxlKS5yZXBsYWNlKC9eXFxzK3xcXHMrJC9nLCAnJyk7XG5cblx0XHRcdFx0XHRcdGNoYXB0ZXJfdGl0bGUgPSBmaXhUZXh0KGNoYXB0ZXJfdGl0bGUpO1xuXG5cdFx0XHRcdFx0XHRhID0gJCgnc2VjdGlvbiBhcnRpY2xlJykuZXEoMCk7XG5cblx0XHRcdFx0XHRcdGlmICghYS5sZW5ndGgpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdGEgPSAkLnJvb3QoKTtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0YS5odG1sKChmdW5jdGlvbiAob2xkKVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRsZXQgaHRtbCA9IGZpeEh0bWwyKG9sZCk7XG5cblx0XHRcdFx0XHRcdFx0aHRtbCA9IGh0bWwucmVwbGFjZSgvKFxcL3A+KSg/PVteXFxuXSo/PHApL2lnLCAnJDFcXG4nKTtcblxuXHRcdFx0XHRcdFx0XHRyZXR1cm4gaHRtbDtcblx0XHRcdFx0XHRcdH0pKGEuaHRtbCgpKSk7XG5cblx0XHRcdFx0XHRcdGxldCBjaGFwdGVyX2FydGljbGUgPSBhLnRleHQoKS5yZXBsYWNlKC9eW1xcclxcbl0rfFtcXHJcXG5cXHNdKyQvZywgJycpO1xuXG5cdFx0XHRcdFx0XHRpZiAoIWN1cnJlbnRWb2x1bWUpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdGN1cnJlbnRWb2x1bWUgPSB2b2x1bWVfbGlzdFt2b2x1bWVfbGlzdC5sZW5ndGhdID0ge1xuXHRcdFx0XHRcdFx0XHRcdGxldmVsOiBNYXRoLm1heCgwLCBlbGVtLmxldmVsIC0gMSksXG5cdFx0XHRcdFx0XHRcdFx0dm9sdW1lX2luZGV4OiB2b2x1bWVfaW5kZXgsXG5cdFx0XHRcdFx0XHRcdFx0dm9sdW1lX3RpdGxlOiAnbnVsbCcsXG5cdFx0XHRcdFx0XHRcdFx0Y2hhcHRlcl9saXN0OiBbXSxcblx0XHRcdFx0XHRcdFx0fTtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0Y2hhcHRlcl9hcnRpY2xlID0gZml4VGV4dChjaGFwdGVyX2FydGljbGUpO1xuXG5cdFx0XHRcdFx0XHRpZiAoY2hhcHRlcl9hcnRpY2xlLmluZGV4T2YoY2hhcHRlcl90aXRsZSkgPT0gMClcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0Y2hhcHRlcl9hcnRpY2xlID0gY2hhcHRlcl9hcnRpY2xlXG5cdFx0XHRcdFx0XHRcdFx0LnNsaWNlKGNoYXB0ZXJfdGl0bGUubGVuZ3RoKVxuXHRcdFx0XHRcdFx0XHRcdC5yZXBsYWNlKC9eW1xcclxcbl0rfFtcXHJcXG5cXHNdKyQvZywgJycpXG5cdFx0XHRcdFx0XHRcdDtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0Y3VycmVudFZvbHVtZVxuXHRcdFx0XHRcdFx0XHQuY2hhcHRlcl9saXN0XG5cdFx0XHRcdFx0XHRcdC5wdXNoKHtcblx0XHRcdFx0XHRcdFx0XHRsZXZlbDogZWxlbS5sZXZlbCxcblx0XHRcdFx0XHRcdFx0XHRjaGFwdGVyX2luZGV4OiBjaGFwdGVyX2luZGV4LFxuXHRcdFx0XHRcdFx0XHRcdGNoYXB0ZXJfdGl0bGUsXG5cdFx0XHRcdFx0XHRcdFx0Y2hhcHRlcl9hcnRpY2xlLFxuXHRcdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0O1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cblx0XHRcdGxldCBub3ZlbCA9IHtcblx0XHRcdFx0bm92ZWxfdGl0bGU6IGVwdWIubWV0YWRhdGEudGl0bGUsXG5cdFx0XHRcdG5vdmVsX2F1dGhvcjogZXB1Yi5tZXRhZGF0YS5jcmVhdG9yLFxuXG5cdFx0XHRcdG5vdmVsX2Rlc2M6IGVwdWIubWV0YWRhdGEuZGVzY3JpcHRpb24sXG5cdFx0XHRcdG5vdmVsX2RhdGU6IGVwdWIubWV0YWRhdGEuZGF0ZSxcblx0XHRcdFx0bm92ZWxfcHVibGlzaGVyOiBlcHViLm1ldGFkYXRhLnB1Ymxpc2hlcixcblxuXHRcdFx0XHR2b2x1bWVfbGlzdCxcblxuXHRcdFx0XHR0YWdzOiBlcHViLm1ldGFkYXRhLnN1YmplY3QsXG5cblx0XHRcdFx0Y29udHJpYnV0ZTogZXB1Yi5tZXRhZGF0YS5jb250cmlidXRlLFxuXHRcdFx0fTtcblxuXHRcdFx0YXdhaXQgUHJvbWlzZS5tYXBTZXJpZXModm9sdW1lX2xpc3QsYXN5bmMgZnVuY3Rpb24gKHZvbHVtZSlcblx0XHRcdHtcblx0XHRcdFx0bGV0IHZpZCA9IHZvbHVtZS52b2x1bWVfaW5kZXgudG9TdHJpbmcoKS5wYWRTdGFydCg0LCAnMCcpICsgJzAnO1xuXG5cdFx0XHRcdGxldCBkaXJuYW1lID0gcGF0aC5qb2luKHBhdGhfbm92ZWwsXG5cdFx0XHRcdFx0YCR7dmlkfSAke3RyaW1GaWxlbmFtZSh2b2x1bWUudm9sdW1lX3RpdGxlKX1gXG5cdFx0XHRcdFx0KVxuXHRcdFx0XHQ7XG5cblx0XHRcdFx0cmV0dXJuIFByb21pc2UubWFwU2VyaWVzKHZvbHVtZS5jaGFwdGVyX2xpc3QsIGFzeW5jIGZ1bmN0aW9uIChjaGFwdGVyKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0bGV0IGV4dCA9ICcudHh0JztcblxuXHRcdFx0XHRcdC8vIEB0cy1pZ25vcmVcblx0XHRcdFx0XHRsZXQgbmFtZSA9IHRyaW1GaWxlbmFtZShjaGFwdGVyLmNoYXB0ZXJfdGl0bGUpO1xuXG5cdFx0XHRcdFx0aWYgKCFvcHRpb25zLm5vRmlyZVByZWZpeClcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHQvLyBAdHMtaWdub3JlXG5cdFx0XHRcdFx0XHRsZXQgY2lkID0gY2hhcHRlci5jaGFwdGVyX2luZGV4LnRvU3RyaW5nKCkucGFkU3RhcnQoNCwgJzAnKSArICcwJztcblxuXHRcdFx0XHRcdFx0bmFtZSA9IGAke2NpZH1fJHtuYW1lfWA7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0bGV0IGZpbGUgPSBwYXRoLmpvaW4oZGlybmFtZSxcblxuXHRcdFx0XHRcdFx0YCR7bmFtZX0ke2V4dH1gXG5cdFx0XHRcdFx0KTtcblxuXHRcdFx0XHRcdC8vIEB0cy1pZ25vcmVcblx0XHRcdFx0XHRsZXQgdGV4dCA9IGNoYXB0ZXIuY2hhcHRlcl9hcnRpY2xlO1xuXG5cdFx0XHRcdFx0YXdhaXQgZnMub3V0cHV0RmlsZShmaWxlLCB0ZXh0KTtcblxuXHRcdFx0XHRcdGlmIChvcHRpb25zLmxvZylcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRjb25zb2xlLmxvZyhmaWxlKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRyZXR1cm4gZmlsZTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9KTtcblxuXHRcdFx0e1xuXHRcdFx0XHRsZXQgZXB1Yk1ha2VyMiA9IGZhbHNlO1xuXHRcdFx0XHRsZXQgbm9kZU5vdmVsID0gZmFsc2U7XG5cblx0XHRcdFx0ZXB1Yk1ha2VyMiA9IChlcHViLm1ldGFkYXRhLnN1YmplY3QgfHwgW10pLmluY2x1ZGVzKCdlcHViLW1ha2VyMicpO1xuXHRcdFx0XHRub2RlTm92ZWwgPSAoZXB1Yi5tZXRhZGF0YS5zdWJqZWN0IHx8IFtdKS5pbmNsdWRlcygnbm9kZS1ub3ZlbCcpO1xuXG5cdFx0XHRcdGxldCBvcHRpb25zID0ge307XG5cdFx0XHRcdG9wdGlvbnNbSURLRVldID0ge1xuXHRcdFx0XHRcdCdlcHViLW1ha2VyMic6IGVwdWJNYWtlcjIsXG5cdFx0XHRcdFx0J25vZGUtbm92ZWwnOiBub2RlTm92ZWwsXG5cdFx0XHRcdH07XG5cblx0XHRcdFx0bGV0IG1kID0gbm92ZWxJbmZvLnN0cmluZ2lmeSh7XG5cdFx0XHRcdFx0b3B0aW9ucyxcblx0XHRcdFx0fSwgbm92ZWwsIHtcblx0XHRcdFx0XHR0YWdzOiBbXG5cdFx0XHRcdFx0XHRJREtFWSxcblx0XHRcdFx0XHRcdFwiZXB1Yi1leHRyYWN0XCIsXG5cdFx0XHRcdFx0XHRcIm5vZGUtbm92ZWxcIixcblx0XHRcdFx0XHRdLFxuXG5cdFx0XHRcdFx0b3B0aW9uczoge1xuXHRcdFx0XHRcdFx0dGV4dGxheW91dDoge1xuXHRcdFx0XHRcdFx0XHRhbGxvd19sZjI6IHRydWUsXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdGxldCBmaWxlID0gcGF0aC5qb2luKHBhdGhfbm92ZWwsIGBSRUFETUUubWRgKTtcblx0XHRcdFx0YXdhaXQgZnMub3V0cHV0RmlsZShmaWxlLCBtZCk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBwYXRoX25vdmVsO1xuXHRcdH0pXG5cdFx0O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q2hlZXJpbyhkb2M6IHN0cmluZylcbntcblx0bGV0ICQgPSBjaGVlcmlvLmxvYWQoZml4SHRtbDIoZG9jKSk7XG5cblx0Zml4Q2hlZXJpbygnYm9keScsICQpO1xuXG5cdHJldHVybiAkXG59XG5cbmV4cG9ydCB7IGZpeFRleHQgfVxuXG5leHBvcnQgZGVmYXVsdCBlcHViRXh0cmFjdDtcbiJdfQ==