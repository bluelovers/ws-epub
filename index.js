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
const lib_1 = require("zero-width/lib");
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
        let path_novel = path.join(PATH_NOVEL_MAIN, fixText(fs_iconv_1.trimFilename(epub.metadata.title)));
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
                    $ = cheerio.load(doc);
                    let volume_title;
                    let a = $('section header h2').eq(0);
                    if (!a.length) {
                        a = $('h2, h3, h1').eq(0);
                    }
                    if (!a.length && !elem.title) {
                        let doc = await epub.getChapterRawAsync(elem.id);
                        let $ = cheerio.load(html_1.default(doc));
                        a = $('title').eq(0);
                    }
                    volume_title = (a.text() || elem.title).replace(/^\s+|\s+$/g, '');
                    volume_title = fixText(volume_title);
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
                    if (!a.length && !elem.title) {
                        let doc = await epub.getChapterRawAsync(elem.id);
                        let $ = cheerio.load(html_1.default(doc));
                        a = $('title').eq(0);
                    }
                    let volume_title = (a.text() || elem.title).replace(/^\s+|\s+$/g, '');
                    volume_title = fixText(volume_title);
                    currentVolume = volume_list[volume_list.length] = {
                        level: elem.level,
                        volume_index: volume_index,
                        volume_title,
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
                    if (!a.length && !elem.title) {
                        let doc = await epub.getChapterRawAsync(elem.id);
                        let $ = cheerio.load(html_1.default(doc));
                        a = $('title').eq(0);
                    }
                    chapter_title = (a.text() || elem.title).replace(/^\s+|\s+$/g, '');
                    chapter_title = fixText(chapter_title);
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
                    chapter_article = fixText(chapter_article);
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
function fixText(txt) {
    return lib_1.nbspToSpace(lib_1.default(txt));
}
exports.fixText = fixText;
exports.default = epubExtract;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7O0FBRUgsYUFBYTtBQUNiLGlDQUE4QztBQUM5Qyx1Q0FBdUM7QUFDdkMsbUNBQW1DO0FBQ25DLDZCQUE2QjtBQUM3QiwrQkFBK0I7QUFDL0IsdUNBQXdDO0FBRXhDLG9DQUFvQztBQUNwQyw2Q0FBNkM7QUFDN0MscUNBQWlDO0FBQ2pDLHdDQUE4RDtBQUVqRCxRQUFBLEtBQUssR0FBRyxNQUFNLENBQUM7QUFvQjVCLFNBQWdCLFdBQVcsQ0FBQyxPQUFlLEVBQUUsVUFBb0IsRUFBRTtJQUVsRSxJQUFJLEdBQUcsR0FBRyxPQUFPLENBQUMsR0FBRyxJQUFJLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQztJQUV2QywyQ0FBMkM7SUFFM0MscUNBQXFDO0lBQ3JDLHdDQUF3QztJQUV4QyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsRUFDN0I7UUFDQyxPQUFPLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsT0FBTyxDQUFDLENBQUM7S0FDbEM7SUFFRDtRQUNDLElBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLENBQUM7UUFFeEMsSUFBSSxDQUFDLE1BQU0sRUFDWDtZQUNDLE1BQU0sSUFBSSxLQUFLLENBQUMsd0JBQXdCLE9BQU8sR0FBRyxDQUFDLENBQUM7U0FDcEQ7S0FDRDtJQUVELElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUN0QjtRQUNDLE9BQU8sQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsYUFBSyxDQUFDLENBQUE7S0FDekM7U0FDSSxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEVBQzVDO1FBQ0MsT0FBTyxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMs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QUFNLEVBQUUsQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1NBQzlCO1FBRUQsT0FBTyxVQUFVLENBQUM7SUFDbkIsQ0FBQyxDQUFDLENBQ0Q7QUFDSCxDQUFDO0FBclZELGtDQXFWQztBQUVELFNBQWdCLE9BQU8sQ0FBQyxHQUFXO0lBRWxDLE9BQU8saUJBQVcsQ0FBQyxhQUFlLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQTtBQUN6QyxDQUFDO0FBSEQsMEJBR0M7QUFFRCxrQkFBZSxXQUFXLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENyZWF0ZWQgYnkgdXNlciBvbiAyMDE4LzIvNy8wMDcuXG4gKi9cblxuLy8gQHRzLWlnbm9yZVxuaW1wb3J0IHsgRVB1YiwgU1lNQk9MX1JBV19EQVRBIH0gZnJvbSAnZXB1YjInO1xuaW1wb3J0IHsgZml4VG9jIH0gZnJvbSAnZXB1YjIvbGliL3RvYyc7XG5pbXBvcnQgKiBhcyBjaGVlcmlvIGZyb20gJ2NoZWVyaW8nO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzLWljb252JztcbmltcG9ydCB7IHRyaW1GaWxlbmFtZSB9IGZyb20gJ2ZzLWljb252JztcblxuaW1wb3J0ICogYXMgUHJvbWlzZSBmcm9tICdibHVlYmlyZCc7XG5pbXBvcnQgKiBhcyBub3ZlbEluZm8gZnJvbSAnbm9kZS1ub3ZlbC1pbmZvJztcbmltcG9ydCBmaXhIdG1sIGZyb20gJy4vbGliL2h0bWwnO1xuaW1wb3J0IHJlbW92ZVplcm9XaWR0aCwgeyBuYnNwVG9TcGFjZSB9IGZyb20gJ3plcm8td2lkdGgvbGliJztcblxuZXhwb3J0IGNvbnN0IElES0VZID0gJ2VwdWInO1xuXG5leHBvcnQgaW50ZXJmYWNlIElPcHRpb25zXG57XG5cdG91dHB1dERpcj86IHN0cmluZyxcblx0Y3dkPzogc3RyaW5nLFxuXG5cdC8qKlxuXHQgKiBwcmludCBsb2cgbWVzc2FnZVxuXHQgKi9cblx0bG9nPzogYm9vbGVhbixcblxuXHRub0ZpcmVQcmVmaXg/OiBib29sZWFuLFxuXG5cdC8qKlxuXHQgKiDnlKjkvoblvLfliLbop6Pmsbrmn5Dkupvnm67pjITpjK/kuoIg5oiW6ICFIOeEoeazleiZleeQhuWkmuWxpOebrumMhOeahOWVj+mhjFxuXHQgKi9cblx0bm9Wb2x1bWU/OiBib29sZWFuLFxufVxuXG5leHBvcnQgZnVuY3Rpb24gZXB1YkV4dHJhY3Qoc3JjRmlsZTogc3RyaW5nLCBvcHRpb25zOiBJT3B0aW9ucyA9IHt9KTogUHJvbWlzZTxzdHJpbmc+XG57XG5cdGxldCBjd2QgPSBvcHRpb25zLmN3ZCB8fCBwcm9jZXNzLmN3ZCgpO1xuXG5cdC8vc3JjRmlsZSA9IHNyY0ZpbGUucmVwbGFjZSgvXFx1MjAyQS9nLCAnJyk7XG5cblx0Ly9jb25zb2xlLmxvZyhzcmNGaWxlLmNoYXJDb2RlQXQoMCkpO1xuXHQvL2NvbnNvbGUubG9nKHBhdGguaXNBYnNvbHV0ZShzcmNGaWxlKSk7XG5cblx0aWYgKCFwYXRoLmlzQWJzb2x1dGUoc3JjRmlsZSkpXG5cdHtcblx0XHRzcmNGaWxlID0gcGF0aC5qb2luKGN3ZCwgc3JjRmlsZSk7XG5cdH1cblxuXHR7XG5cdFx0bGV0IGV4aXN0cyA9IGZzLnBhdGhFeGlzdHNTeW5jKHNyY0ZpbGUpO1xuXG5cdFx0aWYgKCFleGlzdHMpXG5cdFx0e1xuXHRcdFx0dGhyb3cgbmV3IEVycm9yKGBmaWxlIGRvZXNuJ3QgZXhpc3QuIFwiJHtzcmNGaWxlfVwiYCk7XG5cdFx0fVxuXHR9XG5cblx0aWYgKCFvcHRpb25zLm91dHB1dERpcilcblx0e1xuXHRcdG9wdGlvbnMub3V0cHV0RGlyID0gcGF0aC5qb2luKGN3ZCwgSURLRVkpXG5cdH1cblx0ZWxzZSBpZiAoIXBhdGguaXNBYnNvbHV0ZShvcHRpb25zLm91dHB1dERpcikpXG5cdHtcblx0XHRvcHRpb25zLm91dHB1dERpciA9IHBhdGguam9pbihjd2QsIG9wdGlvbnMub3V0cHV0RGlyKTtcblx0fVxuXG5cdC8vY29uc29sZS5sb2coc3JjRmlsZSwgb3B0aW9ucy5vdXRwdXREaXIpO1xuXG5cdGNvbnN0IFBBVEhfTk9WRUxfTUFJTiA9IG9wdGlvbnMub3V0cHV0RGlyO1xuXG5cdC8vIEB0cy1pZ25vcmVcblx0cmV0dXJuIEVQdWIuY3JlYXRlQXN5bmMoc3JjRmlsZSlcblx0XHQudGhlbihhc3luYyBmdW5jdGlvbiAoZXB1Yilcblx0XHR7XG5cdFx0XHQvLyDlvLfliLbkv67mraPnhKHlsI3mh4nnmoQgdG9jXG5cdFx0XHRhd2FpdCBmaXhUb2MoZXB1Yik7XG5cblx0XHRcdGlmICghZXB1Yi5tZXRhZGF0YS50aXRsZSlcblx0XHRcdHtcblx0XHRcdFx0ZXB1Yi5tZXRhZGF0YS50aXRsZSA9IHBhdGguYmFzZW5hbWUoc3JjRmlsZSwgcGF0aC5leHRuYW1lKHNyY0ZpbGUpKVxuXHRcdFx0fVxuXG5cdFx0XHRsZXQgcGF0aF9ub3ZlbCA9IHBhdGguam9pbihQQVRIX05PVkVMX01BSU4sXG5cdFx0XHRcdGZpeFRleHQodHJpbUZpbGVuYW1lKGVwdWIubWV0YWRhdGEudGl0bGUpKVxuXHRcdFx0KTtcblxuXHRcdFx0bGV0IGN1cnJlbnRWb2x1bWU7XG5cdFx0XHRsZXQgdm9sdW1lX2xpc3QgPSBbXTtcblxuXHRcdFx0bGV0IGxhc3RMZXZlbCA9IDA7XG5cblx0XHRcdGF3YWl0IFByb21pc2UubWFwU2VyaWVzKGVwdWIudG9jLCBhc3luYyBmdW5jdGlvbiAoZWxlbSwgaW5kZXgpXG5cdFx0XHR7XG5cdFx0XHRcdGxldCBkb2M7XG5cdFx0XHRcdGxldCAkO1xuXG5cdFx0XHRcdGxldCBpc1ZvbHVtZTogYm9vbGVhbjtcblx0XHRcdFx0bGV0IHNraXA6IGJvb2xlYW47XG5cblx0XHRcdFx0aWYgKChlcHViLm1ldGFkYXRhLnN1YmplY3QgfHwgW10pLmluY2x1ZGVzKCdlcHViLW1ha2VyMicpKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0aWYgKC9eXFxkKyR8XnZvbHVtZVxcZCsvLnRlc3QoZWxlbS5pZCkgJiYgIWVsZW0ubGV2ZWwpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0aXNWb2x1bWUgPSB0cnVlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlIGlmICgvXlxcZCt8XmNoYXB0ZXJcXGQrLy50ZXN0KGVsZW0uaWQpKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGlzVm9sdW1lID0gZmFsc2U7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVsc2UgaWYgKC9eaW1hZ2VcXGQrLy50ZXN0KGVsZW0uaWQpKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGlzVm9sdW1lID0gZmFsc2U7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRza2lwID0gdHJ1ZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZSBpZiAoZXB1Yi5uY3hfZGVwdGggPiAxKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0aWYgKCFlbGVtLmxldmVsKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGlzVm9sdW1lID0gdHJ1ZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRsZXQgdm9sdW1lX2luZGV4ID0gaW5kZXg7XG5cdFx0XHRcdGxldCBjaGFwdGVyX2luZGV4ID0gaW5kZXg7XG5cblx0XHRcdFx0aWYgKCFza2lwKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0aWYgKG9wdGlvbnMubm9Wb2x1bWUpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0aXNWb2x1bWUgPSBmYWxzZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZSBpZiAoIWlzVm9sdW1lICYmIGxhc3RMZXZlbCAhPSBlbGVtLmxldmVsKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdC8vIOW8t+WItueUoueUn+ebrumMhFxuXG5cdFx0XHRcdFx0XHRkb2MgPSBhd2FpdCBlcHViLmdldENoYXB0ZXJBc3luYyhlbGVtLmlkKTtcblx0XHRcdFx0XHRcdCQgPSBjaGVlcmlvLmxvYWQoZG9jKTtcblxuXHRcdFx0XHRcdFx0bGV0IHZvbHVtZV90aXRsZTogc3RyaW5nO1xuXG5cdFx0XHRcdFx0XHRsZXQgYSA9ICQoJ3NlY3Rpb24gaGVhZGVyIGgyJykuZXEoMCk7XG5cblx0XHRcdFx0XHRcdGlmICghYS5sZW5ndGgpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdGEgPSAkKCdoMiwgaDMsIGgxJykuZXEoMCk7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdGlmICghYS5sZW5ndGggJiYgIWVsZW0udGl0bGUpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdGxldCBkb2MgPSBhd2FpdCBlcHViLmdldENoYXB0ZXJSYXdBc3luYyhlbGVtLmlkKTtcblx0XHRcdFx0XHRcdFx0bGV0ICQgPSBjaGVlcmlvLmxvYWQoZml4SHRtbChkb2MpKTtcblxuXHRcdFx0XHRcdFx0XHRhID0gJCgndGl0bGUnKS5lcSgwKTtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0dm9sdW1lX3RpdGxlID0gKGEudGV4dCgpIHx8IGVsZW0udGl0bGUpLnJlcGxhY2UoL15cXHMrfFxccyskL2csICcnKTtcblxuXHRcdFx0XHRcdFx0dm9sdW1lX3RpdGxlID0gZml4VGV4dCh2b2x1bWVfdGl0bGUpO1xuXG5cdFx0XHRcdFx0XHRjdXJyZW50Vm9sdW1lID0gdm9sdW1lX2xpc3Rbdm9sdW1lX2xpc3QubGVuZ3RoXSA9IHtcblx0XHRcdFx0XHRcdFx0bGV2ZWw6IGVsZW0ubGV2ZWwsXG5cdFx0XHRcdFx0XHRcdHZvbHVtZV9pbmRleDogdm9sdW1lX2luZGV4LFxuXHRcdFx0XHRcdFx0XHR2b2x1bWVfdGl0bGU6IHZvbHVtZV90aXRsZSB8fCAnbnVsbCcsXG5cdFx0XHRcdFx0XHRcdGNoYXB0ZXJfbGlzdDogW10sXG5cdFx0XHRcdFx0XHR9O1xuXG5cdFx0XHRcdFx0XHRsYXN0TGV2ZWwgPSBlbGVtLmxldmVsO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGlmIChpc1ZvbHVtZSlcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRkb2MgPSBhd2FpdCBlcHViLmdldENoYXB0ZXJBc3luYyhlbGVtLmlkKTtcblx0XHRcdFx0XHRcdCQgPSBjaGVlcmlvLmxvYWQoZG9jKTtcblxuXHRcdFx0XHRcdFx0bGV0IGEgPSAkKCdzZWN0aW9uIGhlYWRlciBoMicpLmVxKDApO1xuXG5cdFx0XHRcdFx0XHRpZiAoIWEubGVuZ3RoKVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRhID0gJCgnaDIsIGgzLCBoMScpLmVxKDApO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRpZiAoIWEubGVuZ3RoICYmICFlbGVtLnRpdGxlKVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRsZXQgZG9jID0gYXdhaXQgZXB1Yi5nZXRDaGFwdGVyUmF3QXN5bmMoZWxlbS5pZCk7XG5cdFx0XHRcdFx0XHRcdGxldCAkID0gY2hlZXJpby5sb2FkKGZpeEh0bWwoZG9jKSk7XG5cblx0XHRcdFx0XHRcdFx0YSA9ICQoJ3RpdGxlJykuZXEoMCk7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdGxldCB2b2x1bWVfdGl0bGUgPSAoYS50ZXh0KCkgfHwgZWxlbS50aXRsZSkucmVwbGFjZSgvXlxccyt8XFxzKyQvZywgJycpO1xuXG5cdFx0XHRcdFx0XHR2b2x1bWVfdGl0bGUgPSBmaXhUZXh0KHZvbHVtZV90aXRsZSk7XG5cblx0XHRcdFx0XHRcdGN1cnJlbnRWb2x1bWUgPSB2b2x1bWVfbGlzdFt2b2x1bWVfbGlzdC5sZW5ndGhdID0ge1xuXHRcdFx0XHRcdFx0XHRsZXZlbDogZWxlbS5sZXZlbCxcblx0XHRcdFx0XHRcdFx0dm9sdW1lX2luZGV4OiB2b2x1bWVfaW5kZXgsXG5cdFx0XHRcdFx0XHRcdHZvbHVtZV90aXRsZSxcblx0XHRcdFx0XHRcdFx0Y2hhcHRlcl9saXN0OiBbXSxcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGRvYyA9IGF3YWl0IGVwdWIuZ2V0Q2hhcHRlckFzeW5jKGVsZW0uaWQpO1xuXHRcdFx0XHRcdFx0JCA9IGNoZWVyaW8ubG9hZChmaXhIdG1sKGRvYykpO1xuXG5cdFx0XHRcdFx0XHRsZXQgY2hhcHRlcl90aXRsZTogc3RyaW5nO1xuXG5cdFx0XHRcdFx0XHRsZXQgYSA9ICQoJ3NlY3Rpb24gaGVhZGVyIGgyJykuZXEoMCk7XG5cblx0XHRcdFx0XHRcdGlmICghYS5sZW5ndGgpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdGEgPSAkKCdoMiwgaDMsIGgxJykuZXEoMCk7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdGlmICghYS5sZW5ndGggJiYgIWVsZW0udGl0bGUpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdGxldCBkb2MgPSBhd2FpdCBlcHViLmdldENoYXB0ZXJSYXdBc3luYyhlbGVtLmlkKTtcblx0XHRcdFx0XHRcdFx0bGV0ICQgPSBjaGVlcmlvLmxvYWQoZml4SHRtbChkb2MpKTtcblxuXHRcdFx0XHRcdFx0XHRhID0gJCgndGl0bGUnKS5lcSgwKTtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0Y2hhcHRlcl90aXRsZSA9IChhLnRleHQoKSB8fCBlbGVtLnRpdGxlKS5yZXBsYWNlKC9eXFxzK3xcXHMrJC9nLCAnJyk7XG5cblx0XHRcdFx0XHRcdGNoYXB0ZXJfdGl0bGUgPSBmaXhUZXh0KGNoYXB0ZXJfdGl0bGUpO1xuXG5cdFx0XHRcdFx0XHRhID0gJCgnc2VjdGlvbiBhcnRpY2xlJykuZXEoMCk7XG5cblx0XHRcdFx0XHRcdGlmICghYS5sZW5ndGgpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdGEgPSAkLnJvb3QoKTtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0YS5odG1sKChmdW5jdGlvbiAob2xkKVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRsZXQgaHRtbCA9IGZpeEh0bWwob2xkKTtcblxuXHRcdFx0XHRcdFx0XHRodG1sID0gaHRtbC5yZXBsYWNlKC8oXFwvcD4pKD89W15cXG5dKj88cCkvaWcsICckMVxcbicpO1xuXG5cdFx0XHRcdFx0XHRcdHJldHVybiBodG1sO1xuXHRcdFx0XHRcdFx0fSkoYS5odG1sKCkpKTtcblxuXHRcdFx0XHRcdFx0bGV0IGNoYXB0ZXJfYXJ0aWNsZSA9IGEudGV4dCgpLnJlcGxhY2UoL15bXFxyXFxuXSt8W1xcclxcblxcc10rJC9nLCAnJyk7XG5cblx0XHRcdFx0XHRcdGlmICghY3VycmVudFZvbHVtZSlcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0Y3VycmVudFZvbHVtZSA9IHZvbHVtZV9saXN0W3ZvbHVtZV9saXN0Lmxlbmd0aF0gPSB7XG5cdFx0XHRcdFx0XHRcdFx0bGV2ZWw6IE1hdGgubWF4KDAsIGVsZW0ubGV2ZWwgLSAxKSxcblx0XHRcdFx0XHRcdFx0XHR2b2x1bWVfaW5kZXg6IHZvbHVtZV9pbmRleCxcblx0XHRcdFx0XHRcdFx0XHR2b2x1bWVfdGl0bGU6ICdudWxsJyxcblx0XHRcdFx0XHRcdFx0XHRjaGFwdGVyX2xpc3Q6IFtdLFxuXHRcdFx0XHRcdFx0XHR9O1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRjaGFwdGVyX2FydGljbGUgPSBmaXhUZXh0KGNoYXB0ZXJfYXJ0aWNsZSk7XG5cblx0XHRcdFx0XHRcdGlmIChjaGFwdGVyX2FydGljbGUuaW5kZXhPZihjaGFwdGVyX3RpdGxlKSA9PSAwKVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRjaGFwdGVyX2FydGljbGUgPSBjaGFwdGVyX2FydGljbGVcblx0XHRcdFx0XHRcdFx0XHQuc2xpY2UoY2hhcHRlcl90aXRsZS5sZW5ndGgpXG5cdFx0XHRcdFx0XHRcdFx0LnJlcGxhY2UoL15bXFxyXFxuXSt8W1xcclxcblxcc10rJC9nLCAnJylcblx0XHRcdFx0XHRcdFx0O1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRjdXJyZW50Vm9sdW1lXG5cdFx0XHRcdFx0XHRcdC5jaGFwdGVyX2xpc3Rcblx0XHRcdFx0XHRcdFx0LnB1c2goe1xuXHRcdFx0XHRcdFx0XHRcdGxldmVsOiBlbGVtLmxldmVsLFxuXHRcdFx0XHRcdFx0XHRcdGNoYXB0ZXJfaW5kZXg6IGNoYXB0ZXJfaW5kZXgsXG5cdFx0XHRcdFx0XHRcdFx0Y2hhcHRlcl90aXRsZSxcblx0XHRcdFx0XHRcdFx0XHRjaGFwdGVyX2FydGljbGUsXG5cdFx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHQ7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblxuXHRcdFx0bGV0IG5vdmVsID0ge1xuXHRcdFx0XHRub3ZlbF90aXRsZTogZXB1Yi5tZXRhZGF0YS50aXRsZSxcblx0XHRcdFx0bm92ZWxfYXV0aG9yOiBlcHViLm1ldGFkYXRhLmNyZWF0b3IsXG5cblx0XHRcdFx0bm92ZWxfZGVzYzogZXB1Yi5tZXRhZGF0YS5kZXNjcmlwdGlvbixcblx0XHRcdFx0bm92ZWxfZGF0ZTogZXB1Yi5tZXRhZGF0YS5kYXRlLFxuXHRcdFx0XHRub3ZlbF9wdWJsaXNoZXI6IGVwdWIubWV0YWRhdGEucHVibGlzaGVyLFxuXG5cdFx0XHRcdHZvbHVtZV9saXN0LFxuXG5cdFx0XHRcdHRhZ3M6IGVwdWIubWV0YWRhdGEuc3ViamVjdCxcblxuXHRcdFx0XHRjb250cmlidXRlOiBlcHViLm1ldGFkYXRhLmNvbnRyaWJ1dGUsXG5cdFx0XHR9O1xuXG5cdFx0XHRhd2FpdCBQcm9taXNlLm1hcFNlcmllcyh2b2x1bWVfbGlzdCxhc3luYyBmdW5jdGlvbiAodm9sdW1lKVxuXHRcdFx0e1xuXHRcdFx0XHRsZXQgdmlkID0gdm9sdW1lLnZvbHVtZV9pbmRleC50b1N0cmluZygpLnBhZFN0YXJ0KDQsICcwJykgKyAnMCc7XG5cblx0XHRcdFx0bGV0IGRpcm5hbWUgPSBwYXRoLmpvaW4ocGF0aF9ub3ZlbCxcblx0XHRcdFx0XHRgJHt2aWR9ICR7dHJpbUZpbGVuYW1lKHZvbHVtZS52b2x1bWVfdGl0bGUpfWBcblx0XHRcdFx0XHQpXG5cdFx0XHRcdDtcblxuXHRcdFx0XHRyZXR1cm4gYXdhaXQgUHJvbWlzZS5tYXBTZXJpZXModm9sdW1lLmNoYXB0ZXJfbGlzdCwgYXN5bmMgZnVuY3Rpb24gKGNoYXB0ZXIpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRsZXQgZXh0ID0gJy50eHQnO1xuXG5cdFx0XHRcdFx0Ly8gQHRzLWlnbm9yZVxuXHRcdFx0XHRcdGxldCBuYW1lID0gdHJpbUZpbGVuYW1lKGNoYXB0ZXIuY2hhcHRlcl90aXRsZSk7XG5cblx0XHRcdFx0XHRpZiAoIW9wdGlvbnMubm9GaXJlUHJlZml4KVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdC8vIEB0cy1pZ25vcmVcblx0XHRcdFx0XHRcdGxldCBjaWQgPSBjaGFwdGVyLmNoYXB0ZXJfaW5kZXgudG9TdHJpbmcoKS5wYWRTdGFydCg0LCAnMCcpICsgJzAnO1xuXG5cdFx0XHRcdFx0XHRuYW1lID0gYCR7Y2lkfV8ke25hbWV9YDtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRsZXQgZmlsZSA9IHBhdGguam9pbihkaXJuYW1lLFxuXG5cdFx0XHRcdFx0XHRgJHtuYW1lfSR7ZXh0fWBcblx0XHRcdFx0XHQpO1xuXG5cdFx0XHRcdFx0Ly8gQHRzLWlnbm9yZVxuXHRcdFx0XHRcdGxldCB0ZXh0ID0gY2hhcHRlci5jaGFwdGVyX2FydGljbGU7XG5cblx0XHRcdFx0XHRhd2FpdCBmcy5vdXRwdXRGaWxlKGZpbGUsIHRleHQpO1xuXG5cdFx0XHRcdFx0aWYgKG9wdGlvbnMubG9nKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKGZpbGUpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHJldHVybiBmaWxlO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0pO1xuXG5cdFx0XHR7XG5cdFx0XHRcdGxldCBlcHViTWFrZXIyID0gZmFsc2U7XG5cdFx0XHRcdGxldCBub2RlTm92ZWwgPSBmYWxzZTtcblxuXHRcdFx0XHRlcHViTWFrZXIyID0gKGVwdWIubWV0YWRhdGEuc3ViamVjdCB8fCBbXSkuaW5jbHVkZXMoJ2VwdWItbWFrZXIyJyk7XG5cdFx0XHRcdG5vZGVOb3ZlbCA9IChlcHViLm1ldGFkYXRhLnN1YmplY3QgfHwgW10pLmluY2x1ZGVzKCdub2RlLW5vdmVsJyk7XG5cblx0XHRcdFx0bGV0IG9wdGlvbnMgPSB7fTtcblx0XHRcdFx0b3B0aW9uc1tJREtFWV0gPSB7XG5cdFx0XHRcdFx0J2VwdWItbWFrZXIyJzogZXB1Yk1ha2VyMixcblx0XHRcdFx0XHQnbm9kZS1ub3ZlbCc6IG5vZGVOb3ZlbCxcblx0XHRcdFx0fTtcblxuXHRcdFx0XHRsZXQgbWQgPSBub3ZlbEluZm8uc3RyaW5naWZ5KHtcblx0XHRcdFx0XHRvcHRpb25zLFxuXHRcdFx0XHR9LCBub3ZlbCwge1xuXHRcdFx0XHRcdHRhZ3M6IFtcblx0XHRcdFx0XHRcdElES0VZLFxuXHRcdFx0XHRcdFx0XCJlcHViLWV4dHJhY3RcIixcblx0XHRcdFx0XHRcdFwibm9kZS1ub3ZlbFwiLFxuXHRcdFx0XHRcdF0sXG5cblx0XHRcdFx0XHRvcHRpb25zOiB7XG5cdFx0XHRcdFx0XHR0ZXh0bGF5b3V0OiB7XG5cdFx0XHRcdFx0XHRcdGFsbG93X2xmMjogdHJ1ZSxcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0bGV0IGZpbGUgPSBwYXRoLmpvaW4ocGF0aF9ub3ZlbCwgYFJFQURNRS5tZGApO1xuXHRcdFx0XHRhd2FpdCBmcy5vdXRwdXRGaWxlKGZpbGUsIG1kKTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHBhdGhfbm92ZWw7XG5cdFx0fSlcblx0XHQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmaXhUZXh0KHR4dDogc3RyaW5nKVxue1xuXHRyZXR1cm4gbmJzcFRvU3BhY2UocmVtb3ZlWmVyb1dpZHRoKHR4dCkpXG59XG5cbmV4cG9ydCBkZWZhdWx0IGVwdWJFeHRyYWN0O1xuIl19