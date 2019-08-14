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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7O0FBRUgsYUFBYTtBQUNiLGlDQUE4QztBQUM5Qyx1Q0FBdUM7QUFDdkMsbUNBQW1DO0FBQ25DLDZCQUE2QjtBQUM3QiwrQkFBK0I7QUFDL0IsdUNBQXdDO0FBRXhDLG9DQUFvQztBQUNwQyw2Q0FBNkM7QUFDN0MscUNBQWlDO0FBQ2pDLHdDQUE4RDtBQUVqRCxRQUFBLEtBQUssR0FBRyxNQUFNLENBQUM7QUFnQjVCLFNBQWdCLFdBQVcsQ0FBQyxPQUFlLEVBQUUsVUFBb0IsRUFBRTtJQUVsRSxJQUFJLEdBQUcsR0FBRyxPQUFPLENBQUMsR0FBRyxJQUFJLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQztJQUV2QywyQ0FBMkM7SUFFM0MscUNBQXFDO0lBQ3JDLHdDQUF3QztJQUV4QyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsRUFDN0I7UUFDQyxPQUFPLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsT0FBTyxDQUFDLENBQUM7S0FDbEM7SUFFRDtRQUNDLElBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLENBQUM7UUFFeEMsSUFBSSxDQUFDLE1BQU0sRUFDWDtZQUNDLE1BQU0sSUFBSSxLQUFLLENBQUMsd0JBQXdCLE9BQU8sR0FBRyxDQUFDLENBQUM7U0FDcEQ7S0FDRDtJQUVELElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUN0QjtRQUNDLE9BQU8sQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsYUFBSyxDQUFDLENBQUE7S0FDekM7U0FDSSxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEVBQzVDO1FBQ0MsT0FBTyxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMs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QUFNLEVBQUUsQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1NBQzlCO1FBRUQsT0FBTyxVQUFVLENBQUM7SUFDbkIsQ0FBQyxDQUFDLENBQ0Q7QUFDSCxDQUFDO0FBclZELGtDQXFWQztBQUVELFNBQWdCLE9BQU8sQ0FBQyxHQUFXO0lBRWxDLE9BQU8saUJBQVcsQ0FBQyxhQUFlLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQTtBQUN6QyxDQUFDO0FBSEQsMEJBR0M7QUFFRCxrQkFBZSxXQUFXLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENyZWF0ZWQgYnkgdXNlciBvbiAyMDE4LzIvNy8wMDcuXG4gKi9cblxuLy8gQHRzLWlnbm9yZVxuaW1wb3J0IHsgRVB1YiwgU1lNQk9MX1JBV19EQVRBIH0gZnJvbSAnZXB1YjInO1xuaW1wb3J0IHsgZml4VG9jIH0gZnJvbSAnZXB1YjIvbGliL3RvYyc7XG5pbXBvcnQgKiBhcyBjaGVlcmlvIGZyb20gJ2NoZWVyaW8nO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzLWljb252JztcbmltcG9ydCB7IHRyaW1GaWxlbmFtZSB9IGZyb20gJ2ZzLWljb252JztcblxuaW1wb3J0ICogYXMgUHJvbWlzZSBmcm9tICdibHVlYmlyZCc7XG5pbXBvcnQgKiBhcyBub3ZlbEluZm8gZnJvbSAnbm9kZS1ub3ZlbC1pbmZvJztcbmltcG9ydCBmaXhIdG1sIGZyb20gJy4vbGliL2h0bWwnO1xuaW1wb3J0IHJlbW92ZVplcm9XaWR0aCwgeyBuYnNwVG9TcGFjZSB9IGZyb20gJ3plcm8td2lkdGgvbGliJztcblxuZXhwb3J0IGNvbnN0IElES0VZID0gJ2VwdWInO1xuXG5leHBvcnQgaW50ZXJmYWNlIElPcHRpb25zXG57XG5cdG91dHB1dERpcj86IHN0cmluZyxcblx0Y3dkPzogc3RyaW5nLFxuXHRsb2c/OiBib29sZWFuLFxuXG5cdG5vRmlyZVByZWZpeD86IGJvb2xlYW4sXG5cblx0LyoqXG5cdCAqIOeUqOS+huW8t+WItuino+axuuafkOS6m+ebrumMhOmMr+S6giDmiJbogIUg54Sh5rOV6JmV55CG5aSa5bGk55uu6YyE55qE5ZWP6aGMXG5cdCAqL1xuXHRub1ZvbHVtZT86IGJvb2xlYW4sXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlcHViRXh0cmFjdChzcmNGaWxlOiBzdHJpbmcsIG9wdGlvbnM6IElPcHRpb25zID0ge30pOiBQcm9taXNlPHN0cmluZz5cbntcblx0bGV0IGN3ZCA9IG9wdGlvbnMuY3dkIHx8IHByb2Nlc3MuY3dkKCk7XG5cblx0Ly9zcmNGaWxlID0gc3JjRmlsZS5yZXBsYWNlKC9cXHUyMDJBL2csICcnKTtcblxuXHQvL2NvbnNvbGUubG9nKHNyY0ZpbGUuY2hhckNvZGVBdCgwKSk7XG5cdC8vY29uc29sZS5sb2cocGF0aC5pc0Fic29sdXRlKHNyY0ZpbGUpKTtcblxuXHRpZiAoIXBhdGguaXNBYnNvbHV0ZShzcmNGaWxlKSlcblx0e1xuXHRcdHNyY0ZpbGUgPSBwYXRoLmpvaW4oY3dkLCBzcmNGaWxlKTtcblx0fVxuXG5cdHtcblx0XHRsZXQgZXhpc3RzID0gZnMucGF0aEV4aXN0c1N5bmMoc3JjRmlsZSk7XG5cblx0XHRpZiAoIWV4aXN0cylcblx0XHR7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoYGZpbGUgZG9lc24ndCBleGlzdC4gXCIke3NyY0ZpbGV9XCJgKTtcblx0XHR9XG5cdH1cblxuXHRpZiAoIW9wdGlvbnMub3V0cHV0RGlyKVxuXHR7XG5cdFx0b3B0aW9ucy5vdXRwdXREaXIgPSBwYXRoLmpvaW4oY3dkLCBJREtFWSlcblx0fVxuXHRlbHNlIGlmICghcGF0aC5pc0Fic29sdXRlKG9wdGlvbnMub3V0cHV0RGlyKSlcblx0e1xuXHRcdG9wdGlvbnMub3V0cHV0RGlyID0gcGF0aC5qb2luKGN3ZCwgb3B0aW9ucy5vdXRwdXREaXIpO1xuXHR9XG5cblx0Ly9jb25zb2xlLmxvZyhzcmNGaWxlLCBvcHRpb25zLm91dHB1dERpcik7XG5cblx0Y29uc3QgUEFUSF9OT1ZFTF9NQUlOID0gb3B0aW9ucy5vdXRwdXREaXI7XG5cblx0Ly8gQHRzLWlnbm9yZVxuXHRyZXR1cm4gRVB1Yi5jcmVhdGVBc3luYyhzcmNGaWxlKVxuXHRcdC50aGVuKGFzeW5jIGZ1bmN0aW9uIChlcHViKVxuXHRcdHtcblx0XHRcdC8vIOW8t+WItuS/ruato+eEoeWwjeaHieeahCB0b2Ncblx0XHRcdGF3YWl0IGZpeFRvYyhlcHViKTtcblxuXHRcdFx0aWYgKCFlcHViLm1ldGFkYXRhLnRpdGxlKVxuXHRcdFx0e1xuXHRcdFx0XHRlcHViLm1ldGFkYXRhLnRpdGxlID0gcGF0aC5iYXNlbmFtZShzcmNGaWxlLCBwYXRoLmV4dG5hbWUoc3JjRmlsZSkpXG5cdFx0XHR9XG5cblx0XHRcdGxldCBwYXRoX25vdmVsID0gcGF0aC5qb2luKFBBVEhfTk9WRUxfTUFJTixcblx0XHRcdFx0Zml4VGV4dCh0cmltRmlsZW5hbWUoZXB1Yi5tZXRhZGF0YS50aXRsZSkpXG5cdFx0XHQpO1xuXG5cdFx0XHRsZXQgY3VycmVudFZvbHVtZTtcblx0XHRcdGxldCB2b2x1bWVfbGlzdCA9IFtdO1xuXG5cdFx0XHRsZXQgbGFzdExldmVsID0gMDtcblxuXHRcdFx0YXdhaXQgUHJvbWlzZS5tYXBTZXJpZXMoZXB1Yi50b2MsIGFzeW5jIGZ1bmN0aW9uIChlbGVtLCBpbmRleClcblx0XHRcdHtcblx0XHRcdFx0bGV0IGRvYztcblx0XHRcdFx0bGV0ICQ7XG5cblx0XHRcdFx0bGV0IGlzVm9sdW1lOiBib29sZWFuO1xuXHRcdFx0XHRsZXQgc2tpcDogYm9vbGVhbjtcblxuXHRcdFx0XHRpZiAoKGVwdWIubWV0YWRhdGEuc3ViamVjdCB8fCBbXSkuaW5jbHVkZXMoJ2VwdWItbWFrZXIyJykpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRpZiAoL15cXGQrJHxedm9sdW1lXFxkKy8udGVzdChlbGVtLmlkKSAmJiAhZWxlbS5sZXZlbClcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRpc1ZvbHVtZSA9IHRydWU7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVsc2UgaWYgKC9eXFxkK3xeY2hhcHRlclxcZCsvLnRlc3QoZWxlbS5pZCkpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0aXNWb2x1bWUgPSBmYWxzZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZSBpZiAoL15pbWFnZVxcZCsvLnRlc3QoZWxlbS5pZCkpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0aXNWb2x1bWUgPSBmYWxzZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdHNraXAgPSB0cnVlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlIGlmIChlcHViLm5jeF9kZXB0aCA+IDEpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRpZiAoIWVsZW0ubGV2ZWwpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0aXNWb2x1bWUgPSB0cnVlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdGxldCB2b2x1bWVfaW5kZXggPSBpbmRleDtcblx0XHRcdFx0bGV0IGNoYXB0ZXJfaW5kZXggPSBpbmRleDtcblxuXHRcdFx0XHRpZiAoIXNraXApXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRpZiAob3B0aW9ucy5ub1ZvbHVtZSlcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRpc1ZvbHVtZSA9IGZhbHNlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlIGlmICghaXNWb2x1bWUgJiYgbGFzdExldmVsICE9IGVsZW0ubGV2ZWwpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0Ly8g5by35Yi255Si55Sf55uu6YyEXG5cblx0XHRcdFx0XHRcdGRvYyA9IGF3YWl0IGVwdWIuZ2V0Q2hhcHRlckFzeW5jKGVsZW0uaWQpO1xuXHRcdFx0XHRcdFx0JCA9IGNoZWVyaW8ubG9hZChkb2MpO1xuXG5cdFx0XHRcdFx0XHRsZXQgdm9sdW1lX3RpdGxlOiBzdHJpbmc7XG5cblx0XHRcdFx0XHRcdGxldCBhID0gJCgnc2VjdGlvbiBoZWFkZXIgaDInKS5lcSgwKTtcblxuXHRcdFx0XHRcdFx0aWYgKCFhLmxlbmd0aClcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0YSA9ICQoJ2gyLCBoMywgaDEnKS5lcSgwKTtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0aWYgKCFhLmxlbmd0aCAmJiAhZWxlbS50aXRsZSlcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0bGV0IGRvYyA9IGF3YWl0IGVwdWIuZ2V0Q2hhcHRlclJhd0FzeW5jKGVsZW0uaWQpO1xuXHRcdFx0XHRcdFx0XHRsZXQgJCA9IGNoZWVyaW8ubG9hZChmaXhIdG1sKGRvYykpO1xuXG5cdFx0XHRcdFx0XHRcdGEgPSAkKCd0aXRsZScpLmVxKDApO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHR2b2x1bWVfdGl0bGUgPSAoYS50ZXh0KCkgfHwgZWxlbS50aXRsZSkucmVwbGFjZSgvXlxccyt8XFxzKyQvZywgJycpO1xuXG5cdFx0XHRcdFx0XHR2b2x1bWVfdGl0bGUgPSBmaXhUZXh0KHZvbHVtZV90aXRsZSk7XG5cblx0XHRcdFx0XHRcdGN1cnJlbnRWb2x1bWUgPSB2b2x1bWVfbGlzdFt2b2x1bWVfbGlzdC5sZW5ndGhdID0ge1xuXHRcdFx0XHRcdFx0XHRsZXZlbDogZWxlbS5sZXZlbCxcblx0XHRcdFx0XHRcdFx0dm9sdW1lX2luZGV4OiB2b2x1bWVfaW5kZXgsXG5cdFx0XHRcdFx0XHRcdHZvbHVtZV90aXRsZTogdm9sdW1lX3RpdGxlIHx8ICdudWxsJyxcblx0XHRcdFx0XHRcdFx0Y2hhcHRlcl9saXN0OiBbXSxcblx0XHRcdFx0XHRcdH07XG5cblx0XHRcdFx0XHRcdGxhc3RMZXZlbCA9IGVsZW0ubGV2ZWw7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0aWYgKGlzVm9sdW1lKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGRvYyA9IGF3YWl0IGVwdWIuZ2V0Q2hhcHRlckFzeW5jKGVsZW0uaWQpO1xuXHRcdFx0XHRcdFx0JCA9IGNoZWVyaW8ubG9hZChkb2MpO1xuXG5cdFx0XHRcdFx0XHRsZXQgYSA9ICQoJ3NlY3Rpb24gaGVhZGVyIGgyJykuZXEoMCk7XG5cblx0XHRcdFx0XHRcdGlmICghYS5sZW5ndGgpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdGEgPSAkKCdoMiwgaDMsIGgxJykuZXEoMCk7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdGlmICghYS5sZW5ndGggJiYgIWVsZW0udGl0bGUpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdGxldCBkb2MgPSBhd2FpdCBlcHViLmdldENoYXB0ZXJSYXdBc3luYyhlbGVtLmlkKTtcblx0XHRcdFx0XHRcdFx0bGV0ICQgPSBjaGVlcmlvLmxvYWQoZml4SHRtbChkb2MpKTtcblxuXHRcdFx0XHRcdFx0XHRhID0gJCgndGl0bGUnKS5lcSgwKTtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0bGV0IHZvbHVtZV90aXRsZSA9IChhLnRleHQoKSB8fCBlbGVtLnRpdGxlKS5yZXBsYWNlKC9eXFxzK3xcXHMrJC9nLCAnJyk7XG5cblx0XHRcdFx0XHRcdHZvbHVtZV90aXRsZSA9IGZpeFRleHQodm9sdW1lX3RpdGxlKTtcblxuXHRcdFx0XHRcdFx0Y3VycmVudFZvbHVtZSA9IHZvbHVtZV9saXN0W3ZvbHVtZV9saXN0Lmxlbmd0aF0gPSB7XG5cdFx0XHRcdFx0XHRcdGxldmVsOiBlbGVtLmxldmVsLFxuXHRcdFx0XHRcdFx0XHR2b2x1bWVfaW5kZXg6IHZvbHVtZV9pbmRleCxcblx0XHRcdFx0XHRcdFx0dm9sdW1lX3RpdGxlLFxuXHRcdFx0XHRcdFx0XHRjaGFwdGVyX2xpc3Q6IFtdLFxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0ZG9jID0gYXdhaXQgZXB1Yi5nZXRDaGFwdGVyQXN5bmMoZWxlbS5pZCk7XG5cdFx0XHRcdFx0XHQkID0gY2hlZXJpby5sb2FkKGZpeEh0bWwoZG9jKSk7XG5cblx0XHRcdFx0XHRcdGxldCBjaGFwdGVyX3RpdGxlOiBzdHJpbmc7XG5cblx0XHRcdFx0XHRcdGxldCBhID0gJCgnc2VjdGlvbiBoZWFkZXIgaDInKS5lcSgwKTtcblxuXHRcdFx0XHRcdFx0aWYgKCFhLmxlbmd0aClcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0YSA9ICQoJ2gyLCBoMywgaDEnKS5lcSgwKTtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0aWYgKCFhLmxlbmd0aCAmJiAhZWxlbS50aXRsZSlcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0bGV0IGRvYyA9IGF3YWl0IGVwdWIuZ2V0Q2hhcHRlclJhd0FzeW5jKGVsZW0uaWQpO1xuXHRcdFx0XHRcdFx0XHRsZXQgJCA9IGNoZWVyaW8ubG9hZChmaXhIdG1sKGRvYykpO1xuXG5cdFx0XHRcdFx0XHRcdGEgPSAkKCd0aXRsZScpLmVxKDApO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRjaGFwdGVyX3RpdGxlID0gKGEudGV4dCgpIHx8IGVsZW0udGl0bGUpLnJlcGxhY2UoL15cXHMrfFxccyskL2csICcnKTtcblxuXHRcdFx0XHRcdFx0Y2hhcHRlcl90aXRsZSA9IGZpeFRleHQoY2hhcHRlcl90aXRsZSk7XG5cblx0XHRcdFx0XHRcdGEgPSAkKCdzZWN0aW9uIGFydGljbGUnKS5lcSgwKTtcblxuXHRcdFx0XHRcdFx0aWYgKCFhLmxlbmd0aClcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0YSA9ICQucm9vdCgpO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRhLmh0bWwoKGZ1bmN0aW9uIChvbGQpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdGxldCBodG1sID0gZml4SHRtbChvbGQpO1xuXG5cdFx0XHRcdFx0XHRcdGh0bWwgPSBodG1sLnJlcGxhY2UoLyhcXC9wPikoPz1bXlxcbl0qPzxwKS9pZywgJyQxXFxuJyk7XG5cblx0XHRcdFx0XHRcdFx0cmV0dXJuIGh0bWw7XG5cdFx0XHRcdFx0XHR9KShhLmh0bWwoKSkpO1xuXG5cdFx0XHRcdFx0XHRsZXQgY2hhcHRlcl9hcnRpY2xlID0gYS50ZXh0KCkucmVwbGFjZSgvXltcXHJcXG5dK3xbXFxyXFxuXFxzXSskL2csICcnKTtcblxuXHRcdFx0XHRcdFx0aWYgKCFjdXJyZW50Vm9sdW1lKVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRjdXJyZW50Vm9sdW1lID0gdm9sdW1lX2xpc3Rbdm9sdW1lX2xpc3QubGVuZ3RoXSA9IHtcblx0XHRcdFx0XHRcdFx0XHRsZXZlbDogTWF0aC5tYXgoMCwgZWxlbS5sZXZlbCAtIDEpLFxuXHRcdFx0XHRcdFx0XHRcdHZvbHVtZV9pbmRleDogdm9sdW1lX2luZGV4LFxuXHRcdFx0XHRcdFx0XHRcdHZvbHVtZV90aXRsZTogJ251bGwnLFxuXHRcdFx0XHRcdFx0XHRcdGNoYXB0ZXJfbGlzdDogW10sXG5cdFx0XHRcdFx0XHRcdH07XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdGNoYXB0ZXJfYXJ0aWNsZSA9IGZpeFRleHQoY2hhcHRlcl9hcnRpY2xlKTtcblxuXHRcdFx0XHRcdFx0aWYgKGNoYXB0ZXJfYXJ0aWNsZS5pbmRleE9mKGNoYXB0ZXJfdGl0bGUpID09IDApXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdGNoYXB0ZXJfYXJ0aWNsZSA9IGNoYXB0ZXJfYXJ0aWNsZVxuXHRcdFx0XHRcdFx0XHRcdC5zbGljZShjaGFwdGVyX3RpdGxlLmxlbmd0aClcblx0XHRcdFx0XHRcdFx0XHQucmVwbGFjZSgvXltcXHJcXG5dK3xbXFxyXFxuXFxzXSskL2csICcnKVxuXHRcdFx0XHRcdFx0XHQ7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdGN1cnJlbnRWb2x1bWVcblx0XHRcdFx0XHRcdFx0LmNoYXB0ZXJfbGlzdFxuXHRcdFx0XHRcdFx0XHQucHVzaCh7XG5cdFx0XHRcdFx0XHRcdFx0bGV2ZWw6IGVsZW0ubGV2ZWwsXG5cdFx0XHRcdFx0XHRcdFx0Y2hhcHRlcl9pbmRleDogY2hhcHRlcl9pbmRleCxcblx0XHRcdFx0XHRcdFx0XHRjaGFwdGVyX3RpdGxlLFxuXHRcdFx0XHRcdFx0XHRcdGNoYXB0ZXJfYXJ0aWNsZSxcblx0XHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdDtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXG5cdFx0XHRsZXQgbm92ZWwgPSB7XG5cdFx0XHRcdG5vdmVsX3RpdGxlOiBlcHViLm1ldGFkYXRhLnRpdGxlLFxuXHRcdFx0XHRub3ZlbF9hdXRob3I6IGVwdWIubWV0YWRhdGEuY3JlYXRvcixcblxuXHRcdFx0XHRub3ZlbF9kZXNjOiBlcHViLm1ldGFkYXRhLmRlc2NyaXB0aW9uLFxuXHRcdFx0XHRub3ZlbF9kYXRlOiBlcHViLm1ldGFkYXRhLmRhdGUsXG5cdFx0XHRcdG5vdmVsX3B1Ymxpc2hlcjogZXB1Yi5tZXRhZGF0YS5wdWJsaXNoZXIsXG5cblx0XHRcdFx0dm9sdW1lX2xpc3QsXG5cblx0XHRcdFx0dGFnczogZXB1Yi5tZXRhZGF0YS5zdWJqZWN0LFxuXG5cdFx0XHRcdGNvbnRyaWJ1dGU6IGVwdWIubWV0YWRhdGEuY29udHJpYnV0ZSxcblx0XHRcdH07XG5cblx0XHRcdGF3YWl0IFByb21pc2UubWFwU2VyaWVzKHZvbHVtZV9saXN0LGFzeW5jIGZ1bmN0aW9uICh2b2x1bWUpXG5cdFx0XHR7XG5cdFx0XHRcdGxldCB2aWQgPSB2b2x1bWUudm9sdW1lX2luZGV4LnRvU3RyaW5nKCkucGFkU3RhcnQoNCwgJzAnKSArICcwJztcblxuXHRcdFx0XHRsZXQgZGlybmFtZSA9IHBhdGguam9pbihwYXRoX25vdmVsLFxuXHRcdFx0XHRcdGAke3ZpZH0gJHt0cmltRmlsZW5hbWUodm9sdW1lLnZvbHVtZV90aXRsZSl9YFxuXHRcdFx0XHRcdClcblx0XHRcdFx0O1xuXG5cdFx0XHRcdHJldHVybiBhd2FpdCBQcm9taXNlLm1hcFNlcmllcyh2b2x1bWUuY2hhcHRlcl9saXN0LCBhc3luYyBmdW5jdGlvbiAoY2hhcHRlcilcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGxldCBleHQgPSAnLnR4dCc7XG5cblx0XHRcdFx0XHQvLyBAdHMtaWdub3JlXG5cdFx0XHRcdFx0bGV0IG5hbWUgPSB0cmltRmlsZW5hbWUoY2hhcHRlci5jaGFwdGVyX3RpdGxlKTtcblxuXHRcdFx0XHRcdGlmICghb3B0aW9ucy5ub0ZpcmVQcmVmaXgpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0Ly8gQHRzLWlnbm9yZVxuXHRcdFx0XHRcdFx0bGV0IGNpZCA9IGNoYXB0ZXIuY2hhcHRlcl9pbmRleC50b1N0cmluZygpLnBhZFN0YXJ0KDQsICcwJykgKyAnMCc7XG5cblx0XHRcdFx0XHRcdG5hbWUgPSBgJHtjaWR9XyR7bmFtZX1gO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGxldCBmaWxlID0gcGF0aC5qb2luKGRpcm5hbWUsXG5cblx0XHRcdFx0XHRcdGAke25hbWV9JHtleHR9YFxuXHRcdFx0XHRcdCk7XG5cblx0XHRcdFx0XHQvLyBAdHMtaWdub3JlXG5cdFx0XHRcdFx0bGV0IHRleHQgPSBjaGFwdGVyLmNoYXB0ZXJfYXJ0aWNsZTtcblxuXHRcdFx0XHRcdGF3YWl0IGZzLm91dHB1dEZpbGUoZmlsZSwgdGV4dCk7XG5cblx0XHRcdFx0XHRpZiAob3B0aW9ucy5sb2cpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0Y29uc29sZS5sb2coZmlsZSk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0cmV0dXJuIGZpbGU7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSk7XG5cblx0XHRcdHtcblx0XHRcdFx0bGV0IGVwdWJNYWtlcjIgPSBmYWxzZTtcblx0XHRcdFx0bGV0IG5vZGVOb3ZlbCA9IGZhbHNlO1xuXG5cdFx0XHRcdGVwdWJNYWtlcjIgPSAoZXB1Yi5tZXRhZGF0YS5zdWJqZWN0IHx8IFtdKS5pbmNsdWRlcygnZXB1Yi1tYWtlcjInKTtcblx0XHRcdFx0bm9kZU5vdmVsID0gKGVwdWIubWV0YWRhdGEuc3ViamVjdCB8fCBbXSkuaW5jbHVkZXMoJ25vZGUtbm92ZWwnKTtcblxuXHRcdFx0XHRsZXQgb3B0aW9ucyA9IHt9O1xuXHRcdFx0XHRvcHRpb25zW0lES0VZXSA9IHtcblx0XHRcdFx0XHQnZXB1Yi1tYWtlcjInOiBlcHViTWFrZXIyLFxuXHRcdFx0XHRcdCdub2RlLW5vdmVsJzogbm9kZU5vdmVsLFxuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdGxldCBtZCA9IG5vdmVsSW5mby5zdHJpbmdpZnkoe1xuXHRcdFx0XHRcdG9wdGlvbnMsXG5cdFx0XHRcdH0sIG5vdmVsLCB7XG5cdFx0XHRcdFx0dGFnczogW1xuXHRcdFx0XHRcdFx0SURLRVksXG5cdFx0XHRcdFx0XHRcImVwdWItZXh0cmFjdFwiLFxuXHRcdFx0XHRcdFx0XCJub2RlLW5vdmVsXCIsXG5cdFx0XHRcdFx0XSxcblxuXHRcdFx0XHRcdG9wdGlvbnM6IHtcblx0XHRcdFx0XHRcdHRleHRsYXlvdXQ6IHtcblx0XHRcdFx0XHRcdFx0YWxsb3dfbGYyOiB0cnVlLFxuXHRcdFx0XHRcdFx0fSxcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHR9KTtcblxuXHRcdFx0XHRsZXQgZmlsZSA9IHBhdGguam9pbihwYXRoX25vdmVsLCBgUkVBRE1FLm1kYCk7XG5cdFx0XHRcdGF3YWl0IGZzLm91dHB1dEZpbGUoZmlsZSwgbWQpO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gcGF0aF9ub3ZlbDtcblx0XHR9KVxuXHRcdDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZpeFRleHQodHh0OiBzdHJpbmcpXG57XG5cdHJldHVybiBuYnNwVG9TcGFjZShyZW1vdmVaZXJvV2lkdGgodHh0KSlcbn1cblxuZXhwb3J0IGRlZmF1bHQgZXB1YkV4dHJhY3Q7XG4iXX0=