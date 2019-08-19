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
    //console.log(srcFile, options.outputDir);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7O0FBRUgsYUFBYTtBQUNiLGlDQUE4QztBQUM5Qyx1Q0FBdUM7QUFDdkMsbUNBQW1DO0FBQ25DLDZCQUE2QjtBQUM3QiwrQkFBK0I7QUFDL0IsdUNBQXdDO0FBRXhDLG9DQUFvQztBQUNwQyw2Q0FBNkM7QUFDN0MscUNBQXNDO0FBRXRDLGlFQUFpRTtBQXFYeEQsa0JBclhBLGNBQU8sQ0FxWEE7QUFwWGhCLHVFQUF1RTtBQUUxRCxRQUFBLEtBQUssR0FBRyxNQUFNLENBQUM7QUFvQjVCLFNBQWdCLFdBQVcsQ0FBQyxPQUFlLEVBQUUsVUFBb0IsRUFBRTtJQUVsRSxJQUFJLEdBQUcsR0FBRyxPQUFPLENBQUMsR0FBRyxJQUFJLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQztJQUV2QywyQ0FBMkM7SUFFM0MscUNBQXFDO0lBQ3JDLHdDQUF3QztJQUV4QyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsRUFDN0I7UUFDQyxPQUFPLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsT0FBTyxDQUFDLENBQUM7S0FDbEM7SUFFRDtRQUNDLElBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLENBQUM7UUFFeEMsSUFBSSxDQUFDLE1BQU0sRUFDWDtZQUNDLE1BQU0sSUFBSSxLQUFLLENBQUMsd0JBQXdCLE9BQU8sR0FBRyxDQUFDLENBQUM7U0FDcEQ7S0FDRDtJQUVELElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUN0QjtRQUNDLE9BQU8sQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsYUFBSyxDQUFDLENBQUE7S0FDekM7U0FDSSxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEVB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QyxDQUFDO1lBQzlDLE1BQU0sRUFBRSxDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7U0FDOUI7UUFFRCxPQUFPLFVBQVUsQ0FBQztJQUNuQixDQUFDLENBQUMsQ0FDRDtBQUNILENBQUM7QUFuVkQsa0NBbVZDO0FBRUQsU0FBZ0IsVUFBVSxDQUFDLEdBQVc7SUFFckMsSUFBSSxDQUFDLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxlQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztJQUVwQyxvQkFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsQ0FBQztJQUV0QixPQUFPLENBQUMsQ0FBQTtBQUNULENBQUM7QUFQRCxnQ0FPQztBQUlELGtCQUFlLFdBQVcsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ3JlYXRlZCBieSB1c2VyIG9uIDIwMTgvMi83LzAwNy5cbiAqL1xuXG4vLyBAdHMtaWdub3JlXG5pbXBvcnQgeyBFUHViLCBTWU1CT0xfUkFXX0RBVEEgfSBmcm9tICdlcHViMic7XG5pbXBvcnQgeyBmaXhUb2MgfSBmcm9tICdlcHViMi9saWIvdG9jJztcbmltcG9ydCAqIGFzIGNoZWVyaW8gZnJvbSAnY2hlZXJpbyc7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMtaWNvbnYnO1xuaW1wb3J0IHsgdHJpbUZpbGVuYW1lIH0gZnJvbSAnZnMtaWNvbnYnO1xuXG5pbXBvcnQgKiBhcyBQcm9taXNlIGZyb20gJ2JsdWViaXJkJztcbmltcG9ydCAqIGFzIG5vdmVsSW5mbyBmcm9tICdub2RlLW5vdmVsLWluZm8nO1xuaW1wb3J0IHsgZml4SHRtbDIgfSBmcm9tICcuL2xpYi9odG1sJztcbmltcG9ydCByZW1vdmVaZXJvV2lkdGgsIHsgbmJzcFRvU3BhY2UgfSBmcm9tICd6ZXJvLXdpZHRoL2xpYic7XG5pbXBvcnQgeyBmaXhUZXh0IH0gZnJvbSAnQG5vZGUtbm92ZWwvZXB1Yi11dGlsL2xpYi9leHRyYWN0L3RleHQnO1xuaW1wb3J0IHsgZml4Q2hlZXJpbyB9IGZyb20gJ0Bub2RlLW5vdmVsL2VwdWItdXRpbC9saWIvZXh0cmFjdC9jaGVlcmlvJztcblxuZXhwb3J0IGNvbnN0IElES0VZID0gJ2VwdWInO1xuXG5leHBvcnQgaW50ZXJmYWNlIElPcHRpb25zXG57XG5cdG91dHB1dERpcj86IHN0cmluZyxcblx0Y3dkPzogc3RyaW5nLFxuXG5cdC8qKlxuXHQgKiBwcmludCBsb2cgbWVzc2FnZVxuXHQgKi9cblx0bG9nPzogYm9vbGVhbixcblxuXHRub0ZpcmVQcmVmaXg/OiBib29sZWFuLFxuXG5cdC8qKlxuXHQgKiDnlKjkvoblvLfliLbop6Pmsbrmn5Dkupvnm67pjITpjK/kuoIg5oiW6ICFIOeEoeazleiZleeQhuWkmuWxpOebrumMhOeahOWVj+mhjFxuXHQgKi9cblx0bm9Wb2x1bWU/OiBib29sZWFuLFxufVxuXG5leHBvcnQgZnVuY3Rpb24gZXB1YkV4dHJhY3Qoc3JjRmlsZTogc3RyaW5nLCBvcHRpb25zOiBJT3B0aW9ucyA9IHt9KTogUHJvbWlzZTxzdHJpbmc+XG57XG5cdGxldCBjd2QgPSBvcHRpb25zLmN3ZCB8fCBwcm9jZXNzLmN3ZCgpO1xuXG5cdC8vc3JjRmlsZSA9IHNyY0ZpbGUucmVwbGFjZSgvXFx1MjAyQS9nLCAnJyk7XG5cblx0Ly9jb25zb2xlLmxvZyhzcmNGaWxlLmNoYXJDb2RlQXQoMCkpO1xuXHQvL2NvbnNvbGUubG9nKHBhdGguaXNBYnNvbHV0ZShzcmNGaWxlKSk7XG5cblx0aWYgKCFwYXRoLmlzQWJzb2x1dGUoc3JjRmlsZSkpXG5cdHtcblx0XHRzcmNGaWxlID0gcGF0aC5qb2luKGN3ZCwgc3JjRmlsZSk7XG5cdH1cblxuXHR7XG5cdFx0bGV0IGV4aXN0cyA9IGZzLnBhdGhFeGlzdHNTeW5jKHNyY0ZpbGUpO1xuXG5cdFx0aWYgKCFleGlzdHMpXG5cdFx0e1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKGBmaWxlIGRvZXNuJ3QgZXhpc3QuIFwiJHtzcmNGaWxlfVwiYCk7XG5cdFx0fVxuXHR9XG5cblx0aWYgKCFvcHRpb25zLm91dHB1dERpcilcblx0e1xuXHRcdG9wdGlvbnMub3V0cHV0RGlyID0gcGF0aC5qb2luKGN3ZCwgSURLRVkpXG5cdH1cblx0ZWxzZSBpZiAoIXBhdGguaXNBYnNvbHV0ZShvcHRpb25zLm91dHB1dERpcikpXG5cdHtcblx0XHRvcHRpb25zLm91dHB1dERpciA9IHBhdGguam9pbihjd2QsIG9wdGlvbnMub3V0cHV0RGlyKTtcblx0fVxuXG5cdC8vY29uc29sZS5sb2coc3JjRmlsZSwgb3B0aW9ucy5vdXRwdXREaXIpO1xuXG5cdGNvbnN0IFBBVEhfTk9WRUxfTUFJTiA9IG9wdGlvbnMub3V0cHV0RGlyO1xuXG5cdC8vIEB0cy1pZ25vcmVcblx0cmV0dXJuIEVQdWIuY3JlYXRlQXN5bmMoc3JjRmlsZSlcblx0XHQudGhlbihhc3luYyBmdW5jdGlvbiAoZXB1Yilcblx0XHR7XG5cdFx0XHQvLyDlvLfliLbkv67mraPnhKHlsI3mh4nnmoQgdG9jXG5cdFx0XHRhd2FpdCBmaXhUb2MoZXB1Yik7XG5cblx0XHRcdGlmICghZXB1Yi5tZXRhZGF0YS50aXRsZSlcblx0XHRcdHtcblx0XHRcdFx0ZXB1Yi5tZXRhZGF0YS50aXRsZSA9IHBhdGguYmFzZW5hbWUoc3JjRmlsZSwgcGF0aC5leHRuYW1lKHNyY0ZpbGUpKVxuXHRcdFx0fVxuXG5cdFx0XHRsZXQgcGF0aF9ub3ZlbCA9IHBhdGguam9pbihQQVRIX05PVkVMX01BSU4sXG5cdFx0XHRcdGZpeFRleHQodHJpbUZpbGVuYW1lKGVwdWIubWV0YWRhdGEudGl0bGUpKVxuXHRcdFx0KTtcblxuXHRcdFx0bGV0IGN1cnJlbnRWb2x1bWU7XG5cdFx0XHRsZXQgdm9sdW1lX2xpc3QgPSBbXTtcblxuXHRcdFx0bGV0IGxhc3RMZXZlbCA9IDA7XG5cblx0XHRcdGF3YWl0IFByb21pc2UubWFwU2VyaWVzKGVwdWIudG9jLCBhc3luYyBmdW5jdGlvbiAoZWxlbSwgaW5kZXgpXG5cdFx0XHR7XG5cdFx0XHRcdGxldCBkb2M7XG5cdFx0XHRcdGxldCAkO1xuXG5cdFx0XHRcdGxldCBpc1ZvbHVtZTogYm9vbGVhbjtcblx0XHRcdFx0bGV0IHNraXA6IGJvb2xlYW47XG5cblx0XHRcdFx0aWYgKChlcHViLm1ldGFkYXRhLnN1YmplY3QgfHwgW10pLmluY2x1ZGVzKCdlcHViLW1ha2VyMicpKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0aWYgKC9eXFxkKyR8XnZvbHVtZVxcZCsvLnRlc3QoZWxlbS5pZCkgJiYgIWVsZW0ubGV2ZWwpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0aXNWb2x1bWUgPSB0cnVlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlIGlmICgvXlxcZCt8XmNoYXB0ZXJcXGQrLy50ZXN0KGVsZW0uaWQpKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGlzVm9sdW1lID0gZmFsc2U7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVsc2UgaWYgKC9eaW1hZ2VcXGQrLy50ZXN0KGVsZW0uaWQpKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGlzVm9sdW1lID0gZmFsc2U7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRza2lwID0gdHJ1ZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZSBpZiAoZXB1Yi5uY3hfZGVwdGggPiAxKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0aWYgKCFlbGVtLmxldmVsKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGlzVm9sdW1lID0gdHJ1ZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRsZXQgdm9sdW1lX2luZGV4ID0gaW5kZXg7XG5cdFx0XHRcdGxldCBjaGFwdGVyX2luZGV4ID0gaW5kZXg7XG5cblx0XHRcdFx0aWYgKCFza2lwKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0aWYgKG9wdGlvbnMubm9Wb2x1bWUpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0aXNWb2x1bWUgPSBmYWxzZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZSBpZiAoIWlzVm9sdW1lICYmIGxhc3RMZXZlbCAhPSBlbGVtLmxldmVsKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdC8vIOW8t+WItueUoueUn+ebrumMhFxuXHRcdFx0XHRcdFx0ZG9jID0gYXdhaXQgZXB1Yi5nZXRDaGFwdGVyQXN5bmMoZWxlbS5pZCk7XG5cdFx0XHRcdFx0XHQkID0gZ2V0Q2hlZXJpbyhkb2MgPSBmaXhIdG1sMihkb2MpKTtcblxuXHRcdFx0XHRcdFx0bGV0IHZvbHVtZV90aXRsZTogc3RyaW5nO1xuXG5cdFx0XHRcdFx0XHRsZXQgYSA9ICQoJ3NlY3Rpb24gaGVhZGVyIGgyJykuZXEoMCk7XG5cblx0XHRcdFx0XHRcdGlmICghYS5sZW5ndGgpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdGEgPSAkKCdoMiwgaDMsIGgxJykuZXEoMCk7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdGlmICghYS5sZW5ndGggJiYgIWVsZW0udGl0bGUpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdGxldCBkb2MgPSBhd2FpdCBlcHViLmdldENoYXB0ZXJSYXdBc3luYyhlbGVtLmlkKTtcblx0XHRcdFx0XHRcdFx0bGV0ICQgPSBnZXRDaGVlcmlvKGRvYyk7XG5cdFx0XHRcdFx0XHRcdGEgPSAkKCd0aXRsZScpLmVxKDApO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHR2b2x1bWVfdGl0bGUgPSAoYS50ZXh0KCkgfHwgZWxlbS50aXRsZSkucmVwbGFjZSgvXlxccyt8XFxzKyQvZywgJycpO1xuXG5cdFx0XHRcdFx0XHR2b2x1bWVfdGl0bGUgPSBmaXhUZXh0KHZvbHVtZV90aXRsZSk7XG5cblx0XHRcdFx0XHRcdGN1cnJlbnRWb2x1bWUgPSB2b2x1bWVfbGlzdFt2b2x1bWVfbGlzdC5sZW5ndGhdID0ge1xuXHRcdFx0XHRcdFx0XHRsZXZlbDogZWxlbS5sZXZlbCxcblx0XHRcdFx0XHRcdFx0dm9sdW1lX2luZGV4OiB2b2x1bWVfaW5kZXgsXG5cdFx0XHRcdFx0XHRcdHZvbHVtZV90aXRsZTogdm9sdW1lX3RpdGxlIHx8ICdudWxsJyxcblx0XHRcdFx0XHRcdFx0Y2hhcHRlcl9saXN0OiBbXSxcblx0XHRcdFx0XHRcdH07XG5cblx0XHRcdFx0XHRcdGxhc3RMZXZlbCA9IGVsZW0ubGV2ZWw7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0aWYgKGlzVm9sdW1lKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGRvYyA9IGF3YWl0IGVwdWIuZ2V0Q2hhcHRlckFzeW5jKGVsZW0uaWQpO1xuXHRcdFx0XHRcdFx0JCA9IGdldENoZWVyaW8oZG9jID0gZml4SHRtbDIoZG9jKSk7XG5cblx0XHRcdFx0XHRcdGxldCBhID0gJCgnc2VjdGlvbiBoZWFkZXIgaDInKS5lcSgwKTtcblxuXHRcdFx0XHRcdFx0aWYgKCFhLmxlbmd0aClcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0YSA9ICQoJ2gyLCBoMywgaDEnKS5lcSgwKTtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0aWYgKCFhLmxlbmd0aCAmJiAhZWxlbS50aXRsZSlcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0bGV0IGRvYyA9IGF3YWl0IGVwdWIuZ2V0Q2hhcHRlclJhd0FzeW5jKGVsZW0uaWQpO1xuXHRcdFx0XHRcdFx0XHRsZXQgJCA9IGdldENoZWVyaW8oZG9jKTtcblxuXHRcdFx0XHRcdFx0XHRhID0gJCgndGl0bGUnKS5lcSgwKTtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0bGV0IHZvbHVtZV90aXRsZSA9IChhLnRleHQoKSB8fCBlbGVtLnRpdGxlKS5yZXBsYWNlKC9eXFxzK3xcXHMrJC9nLCAnJyk7XG5cblx0XHRcdFx0XHRcdHZvbHVtZV90aXRsZSA9IGZpeFRleHQodm9sdW1lX3RpdGxlKTtcblxuXHRcdFx0XHRcdFx0Y3VycmVudFZvbHVtZSA9IHZvbHVtZV9saXN0W3ZvbHVtZV9saXN0Lmxlbmd0aF0gPSB7XG5cdFx0XHRcdFx0XHRcdGxldmVsOiBlbGVtLmxldmVsLFxuXHRcdFx0XHRcdFx0XHR2b2x1bWVfaW5kZXg6IHZvbHVtZV9pbmRleCxcblx0XHRcdFx0XHRcdFx0dm9sdW1lX3RpdGxlLFxuXHRcdFx0XHRcdFx0XHRjaGFwdGVyX2xpc3Q6IFtdLFxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0ZG9jID0gYXdhaXQgZXB1Yi5nZXRDaGFwdGVyQXN5bmMoZWxlbS5pZCk7XG5cdFx0XHRcdFx0XHQkID0gZ2V0Q2hlZXJpbyhkb2MgPSBmaXhIdG1sMihkb2MpKTtcblxuXHRcdFx0XHRcdFx0bGV0IGNoYXB0ZXJfdGl0bGU6IHN0cmluZztcblxuXHRcdFx0XHRcdFx0bGV0IGEgPSAkKCdzZWN0aW9uIGhlYWRlciBoMicpLmVxKDApO1xuXG5cdFx0XHRcdFx0XHRpZiAoIWEubGVuZ3RoKVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRhID0gJCgnaDIsIGgzLCBoMScpLmVxKDApO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRpZiAoIWEubGVuZ3RoICYmICFlbGVtLnRpdGxlKVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRsZXQgZG9jID0gYXdhaXQgZXB1Yi5nZXRDaGFwdGVyUmF3QXN5bmMoZWxlbS5pZCk7XG5cdFx0XHRcdFx0XHRcdGxldCAkID0gZ2V0Q2hlZXJpbyhkb2MgPSBmaXhIdG1sMihkb2MpKTtcblxuXHRcdFx0XHRcdFx0XHRhID0gJCgndGl0bGUnKS5lcSgwKTtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0Y2hhcHRlcl90aXRsZSA9IChhLnRleHQoKSB8fCBlbGVtLnRpdGxlKS5yZXBsYWNlKC9eXFxzK3xcXHMrJC9nLCAnJyk7XG5cblx0XHRcdFx0XHRcdGNoYXB0ZXJfdGl0bGUgPSBmaXhUZXh0KGNoYXB0ZXJfdGl0bGUpO1xuXG5cdFx0XHRcdFx0XHRhID0gJCgnc2VjdGlvbiBhcnRpY2xlJykuZXEoMCk7XG5cblx0XHRcdFx0XHRcdGlmICghYS5sZW5ndGgpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdGEgPSAkLnJvb3QoKTtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0YS5odG1sKChmdW5jdGlvbiAob2xkKVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRsZXQgaHRtbCA9IGZpeEh0bWwyKG9sZCk7XG5cblx0XHRcdFx0XHRcdFx0aHRtbCA9IGh0bWwucmVwbGFjZSgvKFxcL3A+KSg/PVteXFxuXSo/PHApL2lnLCAnJDFcXG4nKTtcblxuXHRcdFx0XHRcdFx0XHRyZXR1cm4gaHRtbDtcblx0XHRcdFx0XHRcdH0pKGEuaHRtbCgpKSk7XG5cblx0XHRcdFx0XHRcdGxldCBjaGFwdGVyX2FydGljbGUgPSBhLnRleHQoKS5yZXBsYWNlKC9eW1xcclxcbl0rfFtcXHJcXG5cXHNdKyQvZywgJycpO1xuXG5cdFx0XHRcdFx0XHRpZiAoIWN1cnJlbnRWb2x1bWUpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdGN1cnJlbnRWb2x1bWUgPSB2b2x1bWVfbGlzdFt2b2x1bWVfbGlzdC5sZW5ndGhdID0ge1xuXHRcdFx0XHRcdFx0XHRcdGxldmVsOiBNYXRoLm1heCgwLCBlbGVtLmxldmVsIC0gMSksXG5cdFx0XHRcdFx0XHRcdFx0dm9sdW1lX2luZGV4OiB2b2x1bWVfaW5kZXgsXG5cdFx0XHRcdFx0XHRcdFx0dm9sdW1lX3RpdGxlOiAnbnVsbCcsXG5cdFx0XHRcdFx0XHRcdFx0Y2hhcHRlcl9saXN0OiBbXSxcblx0XHRcdFx0XHRcdFx0fTtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0Y2hhcHRlcl9hcnRpY2xlID0gZml4VGV4dChjaGFwdGVyX2FydGljbGUpO1xuXG5cdFx0XHRcdFx0XHRpZiAoY2hhcHRlcl9hcnRpY2xlLmluZGV4T2YoY2hhcHRlcl90aXRsZSkgPT0gMClcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0Y2hhcHRlcl9hcnRpY2xlID0gY2hhcHRlcl9hcnRpY2xlXG5cdFx0XHRcdFx0XHRcdFx0LnNsaWNlKGNoYXB0ZXJfdGl0bGUubGVuZ3RoKVxuXHRcdFx0XHRcdFx0XHRcdC5yZXBsYWNlKC9eW1xcclxcbl0rfFtcXHJcXG5cXHNdKyQvZywgJycpXG5cdFx0XHRcdFx0XHRcdDtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0Y3VycmVudFZvbHVtZVxuXHRcdFx0XHRcdFx0XHQuY2hhcHRlcl9saXN0XG5cdFx0XHRcdFx0XHRcdC5wdXNoKHtcblx0XHRcdFx0XHRcdFx0XHRsZXZlbDogZWxlbS5sZXZlbCxcblx0XHRcdFx0XHRcdFx0XHRjaGFwdGVyX2luZGV4OiBjaGFwdGVyX2luZGV4LFxuXHRcdFx0XHRcdFx0XHRcdGNoYXB0ZXJfdGl0bGUsXG5cdFx0XHRcdFx0XHRcdFx0Y2hhcHRlcl9hcnRpY2xlLFxuXHRcdFx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdFx0O1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cblx0XHRcdGxldCBub3ZlbCA9IHtcblx0XHRcdFx0bm92ZWxfdGl0bGU6IGVwdWIubWV0YWRhdGEudGl0bGUsXG5cdFx0XHRcdG5vdmVsX2F1dGhvcjogZXB1Yi5tZXRhZGF0YS5jcmVhdG9yLFxuXG5cdFx0XHRcdG5vdmVsX2Rlc2M6IGVwdWIubWV0YWRhdGEuZGVzY3JpcHRpb24sXG5cdFx0XHRcdG5vdmVsX2RhdGU6IGVwdWIubWV0YWRhdGEuZGF0ZSxcblx0XHRcdFx0bm92ZWxfcHVibGlzaGVyOiBlcHViLm1ldGFkYXRhLnB1Ymxpc2hlcixcblxuXHRcdFx0XHR2b2x1bWVfbGlzdCxcblxuXHRcdFx0XHR0YWdzOiBlcHViLm1ldGFkYXRhLnN1YmplY3QsXG5cblx0XHRcdFx0Y29udHJpYnV0ZTogZXB1Yi5tZXRhZGF0YS5jb250cmlidXRlLFxuXHRcdFx0fTtcblxuXHRcdFx0YXdhaXQgUHJvbWlzZS5tYXBTZXJpZXModm9sdW1lX2xpc3QsYXN5bmMgZnVuY3Rpb24gKHZvbHVtZSlcblx0XHRcdHtcblx0XHRcdFx0bGV0IHZpZCA9IHZvbHVtZS52b2x1bWVfaW5kZXgudG9TdHJpbmcoKS5wYWRTdGFydCg0LCAnMCcpICsgJzAnO1xuXG5cdFx0XHRcdGxldCBkaXJuYW1lID0gcGF0aC5qb2luKHBhdGhfbm92ZWwsXG5cdFx0XHRcdFx0YCR7dmlkfSAke3RyaW1GaWxlbmFtZSh2b2x1bWUudm9sdW1lX3RpdGxlKX1gXG5cdFx0XHRcdFx0KVxuXHRcdFx0XHQ7XG5cblx0XHRcdFx0cmV0dXJuIFByb21pc2UubWFwU2VyaWVzKHZvbHVtZS5jaGFwdGVyX2xpc3QsIGFzeW5jIGZ1bmN0aW9uIChjaGFwdGVyKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0bGV0IGV4dCA9ICcudHh0JztcblxuXHRcdFx0XHRcdC8vIEB0cy1pZ25vcmVcblx0XHRcdFx0XHRsZXQgbmFtZSA9IHRyaW1GaWxlbmFtZShjaGFwdGVyLmNoYXB0ZXJfdGl0bGUpO1xuXG5cdFx0XHRcdFx0aWYgKCFvcHRpb25zLm5vRmlyZVByZWZpeClcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHQvLyBAdHMtaWdub3JlXG5cdFx0XHRcdFx0XHRsZXQgY2lkID0gY2hhcHRlci5jaGFwdGVyX2luZGV4LnRvU3RyaW5nKCkucGFkU3RhcnQoNCwgJzAnKSArICcwJztcblxuXHRcdFx0XHRcdFx0bmFtZSA9IGAke2NpZH1fJHtuYW1lfWA7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0bGV0IGZpbGUgPSBwYXRoLmpvaW4oZGlybmFtZSxcblxuXHRcdFx0XHRcdFx0YCR7bmFtZX0ke2V4dH1gXG5cdFx0XHRcdFx0KTtcblxuXHRcdFx0XHRcdC8vIEB0cy1pZ25vcmVcblx0XHRcdFx0XHRsZXQgdGV4dCA9IGNoYXB0ZXIuY2hhcHRlcl9hcnRpY2xlO1xuXG5cdFx0XHRcdFx0YXdhaXQgZnMub3V0cHV0RmlsZShmaWxlLCB0ZXh0KTtcblxuXHRcdFx0XHRcdGlmIChvcHRpb25zLmxvZylcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRjb25zb2xlLmxvZyhmaWxlKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRyZXR1cm4gZmlsZTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9KTtcblxuXHRcdFx0e1xuXHRcdFx0XHRsZXQgZXB1Yk1ha2VyMiA9IGZhbHNlO1xuXHRcdFx0XHRsZXQgbm9kZU5vdmVsID0gZmFsc2U7XG5cblx0XHRcdFx0ZXB1Yk1ha2VyMiA9IChlcHViLm1ldGFkYXRhLnN1YmplY3QgfHwgW10pLmluY2x1ZGVzKCdlcHViLW1ha2VyMicpO1xuXHRcdFx0XHRub2RlTm92ZWwgPSAoZXB1Yi5tZXRhZGF0YS5zdWJqZWN0IHx8IFtdKS5pbmNsdWRlcygnbm9kZS1ub3ZlbCcpO1xuXG5cdFx0XHRcdGxldCBvcHRpb25zID0ge307XG5cdFx0XHRcdG9wdGlvbnNbSURLRVldID0ge1xuXHRcdFx0XHRcdCdlcHViLW1ha2VyMic6IGVwdWJNYWtlcjIsXG5cdFx0XHRcdFx0J25vZGUtbm92ZWwnOiBub2RlTm92ZWwsXG5cdFx0XHRcdH07XG5cblx0XHRcdFx0bGV0IG1kID0gbm92ZWxJbmZvLnN0cmluZ2lmeSh7XG5cdFx0XHRcdFx0b3B0aW9ucyxcblx0XHRcdFx0fSwgbm92ZWwsIHtcblx0XHRcdFx0XHR0YWdzOiBbXG5cdFx0XHRcdFx0XHRJREtFWSxcblx0XHRcdFx0XHRcdFwiZXB1Yi1leHRyYWN0XCIsXG5cdFx0XHRcdFx0XHRcIm5vZGUtbm92ZWxcIixcblx0XHRcdFx0XHRdLFxuXG5cdFx0XHRcdFx0b3B0aW9uczoge1xuXHRcdFx0XHRcdFx0dGV4dGxheW91dDoge1xuXHRcdFx0XHRcdFx0XHRhbGxvd19sZjI6IHRydWUsXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdGxldCBmaWxlID0gcGF0aC5qb2luKHBhdGhfbm92ZWwsIGBSRUFETUUubWRgKTtcblx0XHRcdFx0YXdhaXQgZnMub3V0cHV0RmlsZShmaWxlLCBtZCk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBwYXRoX25vdmVsO1xuXHRcdH0pXG5cdFx0O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q2hlZXJpbyhkb2M6IHN0cmluZylcbntcblx0bGV0ICQgPSBjaGVlcmlvLmxvYWQoZml4SHRtbDIoZG9jKSk7XG5cblx0Zml4Q2hlZXJpbygnYm9keScsICQpO1xuXG5cdHJldHVybiAkXG59XG5cbmV4cG9ydCB7IGZpeFRleHQgfVxuXG5leHBvcnQgZGVmYXVsdCBlcHViRXh0cmFjdDtcbiJdfQ==