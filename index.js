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
            throw new Error(`file not exists. "${srcFile}"`);
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
                    if (!a.length && !elem.title) {
                        let doc = await epub.getChapterRawAsync(elem.id);
                        let $ = cheerio.load(html_1.default(doc));
                        a = $('title').eq(0);
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
exports.default = epubExtract;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7O0FBRUgsYUFBYTtBQUNiLGlDQUE4QztBQUM5Qyx1Q0FBdUM7QUFDdkMsbUNBQW1DO0FBQ25DLDZCQUE2QjtBQUM3QiwrQkFBK0I7QUFDL0IsdUNBQXdDO0FBRXhDLG9DQUFvQztBQUNwQyw2Q0FBNkM7QUFDN0MscUNBQWlDO0FBRXBCLFFBQUEsS0FBSyxHQUFHLE1BQU0sQ0FBQztBQWdCNUIsU0FBZ0IsV0FBVyxDQUFDLE9BQWUsRUFBRSxVQUFvQixFQUFFO0lBRWxFLElBQUksR0FBRyxHQUFHLE9BQU8sQ0FBQyxHQUFHLElBQUksT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDO0lBRXZDLDJDQUEyQztJQUUzQyxxQ0FBcUM7SUFDckMsd0NBQXdDO0lBRXhDLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxFQUM3QjtRQUNDLE9BQU8sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxPQUFPLENBQUMsQ0FBQztLQUNsQztJQUVEO1FBQ0MsSUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUV4QyxJQUFJLENBQUMsTUFBTSxFQUNYO1lBQ0MsTUFBTSxJQUFJLEtBQUssQ0FBQyxxQkFBcUIsT0FBTyxHQUFHLENBQUMsQ0FBQztTQUNqRDtLQUNEO0lBRUQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQ3RCO1FBQ0MsT0FBTyxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxhQUFLLENBQUMsQ0FBQTtLQUN6QztTQUNJLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsRUFDNUM7UUFDQyxPQUFPLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsR0FB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QUNiLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFSDtZQUNDLElBQUksVUFBVSxHQUFHLEtBQUssQ0FBQztZQUN2QixJQUFJLFNBQVMsR0FBRyxLQUFLLENBQUM7WUFFdEIsVUFBVSxHQUFHLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLElBQUksRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBQ25FLFNBQVMsR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxJQUFJLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUVqRSxJQUFJLE9BQU8sR0FBRyxFQUFFLENBQUM7WUFDakIsT0FBTyxDQUFDLGFBQUssQ0FBQyxHQUFHO2dCQUNoQixhQUFhLEVBQUUsVUFBVTtnQkFDekIsWUFBWSxFQUFFLFNBQVM7YUFDdkIsQ0FBQztZQUVGLElBQUksRUFBRSxHQUFHLFNBQVMsQ0FBQyxTQUFTLENBQUM7Z0JBQzVCLE9BQU87YUFDUCxFQUFFLEtBQUssRUFBRTtnQkFDVCxJQUFJLEVBQUU7b0JBQ0wsYUFBSztvQkFDTCxjQUFjO29CQUNkLFlBQVk7aUJBQ1o7Z0JBRUQsT0FBTyxFQUFFO29CQUNSLFVBQVUsRUFBRTt3QkFDWCxTQUFTLEVBQUUsSUFBSTtxQkFDZjtpQkFDRDthQUNELENBQUMsQ0FBQztZQUVILElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1lBQzlDLE1BQU0sRUFBRSxDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUM7U0FDOUI7UUFFRCxPQUFPLFVBQVUsQ0FBQztJQUNuQixDQUFDLENBQUMsQ0FDRDtBQUNILENBQUM7QUEzVUQsa0NBMlVDO0FBRUQsa0JBQWUsV0FBVyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDcmVhdGVkIGJ5IHVzZXIgb24gMjAxOC8yLzcvMDA3LlxuICovXG5cbi8vIEB0cy1pZ25vcmVcbmltcG9ydCB7IEVQdWIsIFNZTUJPTF9SQVdfREFUQSB9IGZyb20gJ2VwdWIyJztcbmltcG9ydCB7IGZpeFRvYyB9IGZyb20gJ2VwdWIyL2xpYi90b2MnO1xuaW1wb3J0ICogYXMgY2hlZXJpbyBmcm9tICdjaGVlcmlvJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcy1pY29udic7XG5pbXBvcnQgeyB0cmltRmlsZW5hbWUgfSBmcm9tICdmcy1pY29udic7XG5cbmltcG9ydCAqIGFzIFByb21pc2UgZnJvbSAnYmx1ZWJpcmQnO1xuaW1wb3J0ICogYXMgbm92ZWxJbmZvIGZyb20gJ25vZGUtbm92ZWwtaW5mbyc7XG5pbXBvcnQgZml4SHRtbCBmcm9tICcuL2xpYi9odG1sJztcblxuZXhwb3J0IGNvbnN0IElES0VZID0gJ2VwdWInO1xuXG5leHBvcnQgaW50ZXJmYWNlIElPcHRpb25zXG57XG5cdG91dHB1dERpcj86IHN0cmluZyxcblx0Y3dkPzogc3RyaW5nLFxuXHRsb2c/OiBib29sZWFuLFxuXG5cdG5vRmlyZVByZWZpeD86IGJvb2xlYW4sXG5cblx0LyoqXG5cdCAqIOeUqOS+huW8t+WItuino+axuuafkOS6m+ebrumMhOmMr+S6giDmiJbogIUg54Sh5rOV6JmV55CG5aSa5bGk55uu6YyE55qE5ZWP6aGMXG5cdCAqL1xuXHRub1ZvbHVtZT86IGJvb2xlYW4sXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlcHViRXh0cmFjdChzcmNGaWxlOiBzdHJpbmcsIG9wdGlvbnM6IElPcHRpb25zID0ge30pOiBQcm9taXNlPHN0cmluZz5cbntcblx0bGV0IGN3ZCA9IG9wdGlvbnMuY3dkIHx8IHByb2Nlc3MuY3dkKCk7XG5cblx0Ly9zcmNGaWxlID0gc3JjRmlsZS5yZXBsYWNlKC9cXHUyMDJBL2csICcnKTtcblxuXHQvL2NvbnNvbGUubG9nKHNyY0ZpbGUuY2hhckNvZGVBdCgwKSk7XG5cdC8vY29uc29sZS5sb2cocGF0aC5pc0Fic29sdXRlKHNyY0ZpbGUpKTtcblxuXHRpZiAoIXBhdGguaXNBYnNvbHV0ZShzcmNGaWxlKSlcblx0e1xuXHRcdHNyY0ZpbGUgPSBwYXRoLmpvaW4oY3dkLCBzcmNGaWxlKTtcblx0fVxuXG5cdHtcblx0XHRsZXQgZXhpc3RzID0gZnMucGF0aEV4aXN0c1N5bmMoc3JjRmlsZSk7XG5cblx0XHRpZiAoIWV4aXN0cylcblx0XHR7XG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoYGZpbGUgbm90IGV4aXN0cy4gXCIke3NyY0ZpbGV9XCJgKTtcblx0XHR9XG5cdH1cblxuXHRpZiAoIW9wdGlvbnMub3V0cHV0RGlyKVxuXHR7XG5cdFx0b3B0aW9ucy5vdXRwdXREaXIgPSBwYXRoLmpvaW4oY3dkLCBJREtFWSlcblx0fVxuXHRlbHNlIGlmICghcGF0aC5pc0Fic29sdXRlKG9wdGlvbnMub3V0cHV0RGlyKSlcblx0e1xuXHRcdG9wdGlvbnMub3V0cHV0RGlyID0gcGF0aC5qb2luKGN3ZCwgb3B0aW9ucy5vdXRwdXREaXIpO1xuXHR9XG5cblx0Ly9jb25zb2xlLmxvZyhzcmNGaWxlLCBvcHRpb25zLm91dHB1dERpcik7XG5cblx0Y29uc3QgUEFUSF9OT1ZFTF9NQUlOID0gb3B0aW9ucy5vdXRwdXREaXI7XG5cblx0Ly8gQHRzLWlnbm9yZVxuXHRyZXR1cm4gRVB1Yi5jcmVhdGVBc3luYyhzcmNGaWxlKVxuXHRcdC50aGVuKGFzeW5jIGZ1bmN0aW9uIChlcHViKVxuXHRcdHtcblx0XHRcdC8vIOW8t+WItuS/ruato+eEoeWwjeaHieeahCB0b2Ncblx0XHRcdGF3YWl0IGZpeFRvYyhlcHViKTtcblxuXHRcdFx0aWYgKCFlcHViLm1ldGFkYXRhLnRpdGxlKVxuXHRcdFx0e1xuXHRcdFx0XHRlcHViLm1ldGFkYXRhLnRpdGxlID0gcGF0aC5iYXNlbmFtZShzcmNGaWxlLCBwYXRoLmV4dG5hbWUoc3JjRmlsZSkpXG5cdFx0XHR9XG5cblx0XHRcdGxldCBwYXRoX25vdmVsID0gcGF0aC5qb2luKFBBVEhfTk9WRUxfTUFJTixcblx0XHRcdFx0dHJpbUZpbGVuYW1lKGVwdWIubWV0YWRhdGEudGl0bGUpXG5cdFx0XHQpO1xuXG5cdFx0XHRsZXQgY3VycmVudFZvbHVtZTtcblx0XHRcdGxldCB2b2x1bWVfbGlzdCA9IFtdO1xuXG5cdFx0XHRsZXQgbGFzdExldmVsID0gMDtcblxuXHRcdFx0YXdhaXQgUHJvbWlzZS5tYXBTZXJpZXMoZXB1Yi50b2MsIGFzeW5jIGZ1bmN0aW9uIChlbGVtLCBpbmRleClcblx0XHRcdHtcblx0XHRcdFx0bGV0IGRvYztcblx0XHRcdFx0bGV0ICQ7XG5cblx0XHRcdFx0bGV0IGlzVm9sdW1lOiBib29sZWFuO1xuXHRcdFx0XHRsZXQgc2tpcDogYm9vbGVhbjtcblxuXHRcdFx0XHRpZiAoKGVwdWIubWV0YWRhdGEuc3ViamVjdCB8fCBbXSkuaW5jbHVkZXMoJ2VwdWItbWFrZXIyJykpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRpZiAoL15cXGQrJHxedm9sdW1lXFxkKy8udGVzdChlbGVtLmlkKSAmJiAhZWxlbS5sZXZlbClcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRpc1ZvbHVtZSA9IHRydWU7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVsc2UgaWYgKC9eXFxkK3xeY2hhcHRlclxcZCsvLnRlc3QoZWxlbS5pZCkpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0aXNWb2x1bWUgPSBmYWxzZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZSBpZiAoL15pbWFnZVxcZCsvLnRlc3QoZWxlbS5pZCkpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0aXNWb2x1bWUgPSBmYWxzZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdHNraXAgPSB0cnVlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlIGlmIChlcHViLm5jeF9kZXB0aCA+IDEpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRpZiAoIWVsZW0ubGV2ZWwpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0aXNWb2x1bWUgPSB0cnVlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdGxldCB2b2x1bWVfaW5kZXggPSBpbmRleDtcblx0XHRcdFx0bGV0IGNoYXB0ZXJfaW5kZXggPSBpbmRleDtcblxuXHRcdFx0XHRpZiAoIXNraXApXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRpZiAob3B0aW9ucy5ub1ZvbHVtZSlcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRpc1ZvbHVtZSA9IGZhbHNlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlIGlmICghaXNWb2x1bWUgJiYgbGFzdExldmVsICE9IGVsZW0ubGV2ZWwpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0Ly8g5by35Yi255Si55Sf55uu6YyEXG5cblx0XHRcdFx0XHRcdGRvYyA9IGF3YWl0IGVwdWIuZ2V0Q2hhcHRlckFzeW5jKGVsZW0uaWQpO1xuXHRcdFx0XHRcdFx0JCA9IGNoZWVyaW8ubG9hZChkb2MpO1xuXG5cdFx0XHRcdFx0XHRsZXQgdm9sdW1lX3RpdGxlOiBzdHJpbmc7XG5cblx0XHRcdFx0XHRcdGxldCBhID0gJCgnc2VjdGlvbiBoZWFkZXIgaDInKS5lcSgwKTtcblxuXHRcdFx0XHRcdFx0aWYgKCFhLmxlbmd0aClcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0YSA9ICQoJ2gyLCBoMywgaDEnKS5lcSgwKTtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0aWYgKCFhLmxlbmd0aCAmJiAhZWxlbS50aXRsZSlcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0bGV0IGRvYyA9IGF3YWl0IGVwdWIuZ2V0Q2hhcHRlclJhd0FzeW5jKGVsZW0uaWQpO1xuXHRcdFx0XHRcdFx0XHRsZXQgJCA9IGNoZWVyaW8ubG9hZChmaXhIdG1sKGRvYykpO1xuXG5cdFx0XHRcdFx0XHRcdGEgPSAkKCd0aXRsZScpLmVxKDApO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHR2b2x1bWVfdGl0bGUgPSAoYS50ZXh0KCkgfHwgZWxlbS50aXRsZSkucmVwbGFjZSgvXlxccyt8XFxzKyQvZywgJycpO1xuXG5cdFx0XHRcdFx0XHRjdXJyZW50Vm9sdW1lID0gdm9sdW1lX2xpc3Rbdm9sdW1lX2xpc3QubGVuZ3RoXSA9IHtcblx0XHRcdFx0XHRcdFx0bGV2ZWw6IGVsZW0ubGV2ZWwsXG5cdFx0XHRcdFx0XHRcdHZvbHVtZV9pbmRleDogdm9sdW1lX2luZGV4LFxuXHRcdFx0XHRcdFx0XHR2b2x1bWVfdGl0bGU6IHZvbHVtZV90aXRsZSB8fCAnbnVsbCcsXG5cdFx0XHRcdFx0XHRcdGNoYXB0ZXJfbGlzdDogW10sXG5cdFx0XHRcdFx0XHR9O1xuXG5cdFx0XHRcdFx0XHRsYXN0TGV2ZWwgPSBlbGVtLmxldmVsO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGlmIChpc1ZvbHVtZSlcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRkb2MgPSBhd2FpdCBlcHViLmdldENoYXB0ZXJBc3luYyhlbGVtLmlkKTtcblx0XHRcdFx0XHRcdCQgPSBjaGVlcmlvLmxvYWQoZG9jKTtcblxuXHRcdFx0XHRcdFx0bGV0IGEgPSAkKCdzZWN0aW9uIGhlYWRlciBoMicpLmVxKDApO1xuXG5cdFx0XHRcdFx0XHRpZiAoIWEubGVuZ3RoKVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRhID0gJCgnaDIsIGgzLCBoMScpLmVxKDApO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRpZiAoIWEubGVuZ3RoICYmICFlbGVtLnRpdGxlKVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRsZXQgZG9jID0gYXdhaXQgZXB1Yi5nZXRDaGFwdGVyUmF3QXN5bmMoZWxlbS5pZCk7XG5cdFx0XHRcdFx0XHRcdGxldCAkID0gY2hlZXJpby5sb2FkKGZpeEh0bWwoZG9jKSk7XG5cblx0XHRcdFx0XHRcdFx0YSA9ICQoJ3RpdGxlJykuZXEoMCk7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdGN1cnJlbnRWb2x1bWUgPSB2b2x1bWVfbGlzdFt2b2x1bWVfbGlzdC5sZW5ndGhdID0ge1xuXHRcdFx0XHRcdFx0XHRsZXZlbDogZWxlbS5sZXZlbCxcblx0XHRcdFx0XHRcdFx0dm9sdW1lX2luZGV4OiB2b2x1bWVfaW5kZXgsXG5cdFx0XHRcdFx0XHRcdHZvbHVtZV90aXRsZTogKGEudGV4dCgpIHx8IGVsZW0udGl0bGUpLnJlcGxhY2UoL15cXHMrfFxccyskL2csICcnKSxcblx0XHRcdFx0XHRcdFx0Y2hhcHRlcl9saXN0OiBbXSxcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGRvYyA9IGF3YWl0IGVwdWIuZ2V0Q2hhcHRlckFzeW5jKGVsZW0uaWQpO1xuXHRcdFx0XHRcdFx0JCA9IGNoZWVyaW8ubG9hZChmaXhIdG1sKGRvYykpO1xuXG5cdFx0XHRcdFx0XHRsZXQgY2hhcHRlcl90aXRsZTogc3RyaW5nO1xuXG5cdFx0XHRcdFx0XHRsZXQgYSA9ICQoJ3NlY3Rpb24gaGVhZGVyIGgyJykuZXEoMCk7XG5cblx0XHRcdFx0XHRcdGlmICghYS5sZW5ndGgpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdGEgPSAkKCdoMiwgaDMsIGgxJykuZXEoMCk7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdGlmICghYS5sZW5ndGggJiYgIWVsZW0udGl0bGUpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdGxldCBkb2MgPSBhd2FpdCBlcHViLmdldENoYXB0ZXJSYXdBc3luYyhlbGVtLmlkKTtcblx0XHRcdFx0XHRcdFx0bGV0ICQgPSBjaGVlcmlvLmxvYWQoZml4SHRtbChkb2MpKTtcblxuXHRcdFx0XHRcdFx0XHRhID0gJCgndGl0bGUnKS5lcSgwKTtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0Y2hhcHRlcl90aXRsZSA9IChhLnRleHQoKSB8fCBlbGVtLnRpdGxlKS5yZXBsYWNlKC9eXFxzK3xcXHMrJC9nLCAnJyk7XG5cblx0XHRcdFx0XHRcdGEgPSAkKCdzZWN0aW9uIGFydGljbGUnKS5lcSgwKTtcblxuXHRcdFx0XHRcdFx0aWYgKCFhLmxlbmd0aClcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0YSA9ICQucm9vdCgpO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRhLmh0bWwoKGZ1bmN0aW9uIChvbGQpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdGxldCBodG1sID0gZml4SHRtbChvbGQpO1xuXG5cdFx0XHRcdFx0XHRcdGh0bWwgPSBodG1sLnJlcGxhY2UoLyhcXC9wPikoPz1bXlxcbl0qPzxwKS9pZywgJyQxXFxuJyk7XG5cblx0XHRcdFx0XHRcdFx0cmV0dXJuIGh0bWw7XG5cdFx0XHRcdFx0XHR9KShhLmh0bWwoKSkpO1xuXG5cdFx0XHRcdFx0XHRsZXQgY2hhcHRlcl9hcnRpY2xlID0gYS50ZXh0KCkucmVwbGFjZSgvXltcXHJcXG5dK3xbXFxyXFxuXFxzXSskL2csICcnKTtcblxuXHRcdFx0XHRcdFx0aWYgKCFjdXJyZW50Vm9sdW1lKVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRjdXJyZW50Vm9sdW1lID0gdm9sdW1lX2xpc3Rbdm9sdW1lX2xpc3QubGVuZ3RoXSA9IHtcblx0XHRcdFx0XHRcdFx0XHRsZXZlbDogTWF0aC5tYXgoMCwgZWxlbS5sZXZlbCAtIDEpLFxuXHRcdFx0XHRcdFx0XHRcdHZvbHVtZV9pbmRleDogdm9sdW1lX2luZGV4LFxuXHRcdFx0XHRcdFx0XHRcdHZvbHVtZV90aXRsZTogJ251bGwnLFxuXHRcdFx0XHRcdFx0XHRcdGNoYXB0ZXJfbGlzdDogW10sXG5cdFx0XHRcdFx0XHRcdH07XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdGlmIChjaGFwdGVyX2FydGljbGUuaW5kZXhPZihjaGFwdGVyX3RpdGxlKSA9PSAwKVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRjaGFwdGVyX2FydGljbGUgPSBjaGFwdGVyX2FydGljbGVcblx0XHRcdFx0XHRcdFx0XHQuc2xpY2UoY2hhcHRlcl90aXRsZS5sZW5ndGgpXG5cdFx0XHRcdFx0XHRcdFx0LnJlcGxhY2UoL15bXFxyXFxuXSt8W1xcclxcblxcc10rJC9nLCAnJylcblx0XHRcdFx0XHRcdFx0O1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRjdXJyZW50Vm9sdW1lXG5cdFx0XHRcdFx0XHRcdC5jaGFwdGVyX2xpc3Rcblx0XHRcdFx0XHRcdFx0LnB1c2goe1xuXHRcdFx0XHRcdFx0XHRcdGxldmVsOiBlbGVtLmxldmVsLFxuXHRcdFx0XHRcdFx0XHRcdGNoYXB0ZXJfaW5kZXg6IGNoYXB0ZXJfaW5kZXgsXG5cdFx0XHRcdFx0XHRcdFx0Y2hhcHRlcl90aXRsZSxcblx0XHRcdFx0XHRcdFx0XHRjaGFwdGVyX2FydGljbGUsXG5cdFx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHQ7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9KTtcblxuXHRcdFx0bGV0IG5vdmVsID0ge1xuXHRcdFx0XHRub3ZlbF90aXRsZTogZXB1Yi5tZXRhZGF0YS50aXRsZSxcblx0XHRcdFx0bm92ZWxfYXV0aG9yOiBlcHViLm1ldGFkYXRhLmNyZWF0b3IsXG5cblx0XHRcdFx0bm92ZWxfZGVzYzogZXB1Yi5tZXRhZGF0YS5kZXNjcmlwdGlvbixcblx0XHRcdFx0bm92ZWxfZGF0ZTogZXB1Yi5tZXRhZGF0YS5kYXRlLFxuXHRcdFx0XHRub3ZlbF9wdWJsaXNoZXI6IGVwdWIubWV0YWRhdGEucHVibGlzaGVyLFxuXG5cdFx0XHRcdHZvbHVtZV9saXN0LFxuXG5cdFx0XHRcdHRhZ3M6IGVwdWIubWV0YWRhdGEuc3ViamVjdCxcblxuXHRcdFx0XHRjb250cmlidXRlOiBlcHViLm1ldGFkYXRhLmNvbnRyaWJ1dGUsXG5cdFx0XHR9O1xuXG5cdFx0XHRhd2FpdCBQcm9taXNlLm1hcFNlcmllcyh2b2x1bWVfbGlzdCxhc3luYyBmdW5jdGlvbiAodm9sdW1lKVxuXHRcdFx0e1xuXHRcdFx0XHRsZXQgdmlkID0gdm9sdW1lLnZvbHVtZV9pbmRleC50b1N0cmluZygpLnBhZFN0YXJ0KDQsICcwJykgKyAnMCc7XG5cblx0XHRcdFx0bGV0IGRpcm5hbWUgPSBwYXRoLmpvaW4ocGF0aF9ub3ZlbCxcblx0XHRcdFx0XHRgJHt2aWR9ICR7dHJpbUZpbGVuYW1lKHZvbHVtZS52b2x1bWVfdGl0bGUpfWBcblx0XHRcdFx0XHQpXG5cdFx0XHRcdDtcblxuXHRcdFx0XHRyZXR1cm4gYXdhaXQgUHJvbWlzZS5tYXBTZXJpZXModm9sdW1lLmNoYXB0ZXJfbGlzdCwgYXN5bmMgZnVuY3Rpb24gKGNoYXB0ZXIpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRsZXQgZXh0ID0gJy50eHQnO1xuXG5cdFx0XHRcdFx0Ly8gQHRzLWlnbm9yZVxuXHRcdFx0XHRcdGxldCBuYW1lID0gdHJpbUZpbGVuYW1lKGNoYXB0ZXIuY2hhcHRlcl90aXRsZSk7XG5cblx0XHRcdFx0XHRpZiAoIW9wdGlvbnMubm9GaXJlUHJlZml4KVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdC8vIEB0cy1pZ25vcmVcblx0XHRcdFx0XHRcdGxldCBjaWQgPSBjaGFwdGVyLmNoYXB0ZXJfaW5kZXgudG9TdHJpbmcoKS5wYWRTdGFydCg0LCAnMCcpICsgJzAnO1xuXG5cdFx0XHRcdFx0XHRuYW1lID0gYCR7Y2lkfV8ke25hbWV9YDtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRsZXQgZmlsZSA9IHBhdGguam9pbihkaXJuYW1lLFxuXG5cdFx0XHRcdFx0XHRgJHtuYW1lfSR7ZXh0fWBcblx0XHRcdFx0XHQpO1xuXG5cdFx0XHRcdFx0Ly8gQHRzLWlnbm9yZVxuXHRcdFx0XHRcdGxldCB0ZXh0ID0gY2hhcHRlci5jaGFwdGVyX2FydGljbGU7XG5cblx0XHRcdFx0XHRhd2FpdCBmcy5vdXRwdXRGaWxlKGZpbGUsIHRleHQpO1xuXG5cdFx0XHRcdFx0aWYgKG9wdGlvbnMubG9nKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKGZpbGUpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHJldHVybiBmaWxlO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0pO1xuXG5cdFx0XHR7XG5cdFx0XHRcdGxldCBlcHViTWFrZXIyID0gZmFsc2U7XG5cdFx0XHRcdGxldCBub2RlTm92ZWwgPSBmYWxzZTtcblxuXHRcdFx0XHRlcHViTWFrZXIyID0gKGVwdWIubWV0YWRhdGEuc3ViamVjdCB8fCBbXSkuaW5jbHVkZXMoJ2VwdWItbWFrZXIyJyk7XG5cdFx0XHRcdG5vZGVOb3ZlbCA9IChlcHViLm1ldGFkYXRhLnN1YmplY3QgfHwgW10pLmluY2x1ZGVzKCdub2RlLW5vdmVsJyk7XG5cblx0XHRcdFx0bGV0IG9wdGlvbnMgPSB7fTtcblx0XHRcdFx0b3B0aW9uc1tJREtFWV0gPSB7XG5cdFx0XHRcdFx0J2VwdWItbWFrZXIyJzogZXB1Yk1ha2VyMixcblx0XHRcdFx0XHQnbm9kZS1ub3ZlbCc6IG5vZGVOb3ZlbCxcblx0XHRcdFx0fTtcblxuXHRcdFx0XHRsZXQgbWQgPSBub3ZlbEluZm8uc3RyaW5naWZ5KHtcblx0XHRcdFx0XHRvcHRpb25zLFxuXHRcdFx0XHR9LCBub3ZlbCwge1xuXHRcdFx0XHRcdHRhZ3M6IFtcblx0XHRcdFx0XHRcdElES0VZLFxuXHRcdFx0XHRcdFx0XCJlcHViLWV4dHJhY3RcIixcblx0XHRcdFx0XHRcdFwibm9kZS1ub3ZlbFwiLFxuXHRcdFx0XHRcdF0sXG5cblx0XHRcdFx0XHRvcHRpb25zOiB7XG5cdFx0XHRcdFx0XHR0ZXh0bGF5b3V0OiB7XG5cdFx0XHRcdFx0XHRcdGFsbG93X2xmMjogdHJ1ZSxcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0fSxcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0bGV0IGZpbGUgPSBwYXRoLmpvaW4ocGF0aF9ub3ZlbCwgYFJFQURNRS5tZGApO1xuXHRcdFx0XHRhd2FpdCBmcy5vdXRwdXRGaWxlKGZpbGUsIG1kKTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHBhdGhfbm92ZWw7XG5cdFx0fSlcblx0XHQ7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGVwdWJFeHRyYWN0O1xuIl19