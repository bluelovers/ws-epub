"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zip_1 = require("../../epubtpl-lib/zip");
const handlebar_helpers_1 = require("../../epubtpl-lib/handlebar-helpers");
const ajax_1 = require("../../epubtpl-lib/ajax");
const postcss_1 = require("../../epubtpl-lib/postcss");
const path = require("path");
const BPromise = require("bluebird");
const shortid = require("shortid");
// @ts-ignore
exports.EPUB_TEMPLATES_PATH = path.join(__dirname);
exports.EPUB_TEMPLATES_TPL = path.join(exports.EPUB_TEMPLATES_PATH, 'tpl');
var Builder;
(function (Builder) {
    Builder.templates = {
        //mimetype: 'mimetype',
        //container: 'META-INF/container.xml',
        opf: 'EPUB/content.opf',
        ncx: 'EPUB/toc.ncx',
        nav: 'EPUB/nav.xhtml',
        css: 'EPUB/css/main.css',
        content: 'EPUB/content.xhtml',
        autoToc: 'EPUB/auto-toc.xhtml',
        sectionsNavTemplate: 'EPUB/sections-nav-template.html',
        sectionsNCXTemplate: 'EPUB/sections-ncx-template.xml',
        sectionsOPFManifestTemplate: 'EPUB/sections-opf-manifest-template.xml',
        sectionsOPFSpineTemplate: 'EPUB/sections-opf-spine-template.xml',
        coverPage: 'EPUB/CoverPage.xhtml',
        tableOfContents: 'EPUB/TableOfContents.xhtml',
        sectionsInfo: 'EPUB/sections-info.html',
        sectionsScript: 'EPUB/sections-script.html',
        contents: 'EPUB/contents.xhtml',
    };
    for (let i in Builder.templates) {
        Builder.templates[i] = `\{\{import \'${path.join(exports.EPUB_TEMPLATES_TPL, Builder.templates[i])}'\}\}`;
    }
    let playOrder = 0;
    Builder.staticFiles = {
        'mimetype': 'mimetype',
        'META-INF/container.xml': 'META-INF/container.xml',
    };
    for (let i in Builder.staticFiles) {
        Builder.staticFiles[i] = path.join(exports.EPUB_TEMPLATES_TPL, Builder.staticFiles[i]);
    }
    function make(epub, options) {
        //let epubConfig = epub.epubConfig;
        options = Object.assign({}, {
            templates: Builder.templates,
        }, options);
        //console.debug('[building epub]', epub.epubConfig);
        //console.debug('[building epub]', options);
        let zip = new zip_1.JSZip();
        //await addAditionalInfo(zip, epub, options);
        handlebar_helpers_1.Handlebars.registerPartial('sectionsInfo', options.templates.sectionsInfo);
        handlebar_helpers_1.Handlebars.registerPartial('sectionsScript', options.templates.sectionsScript);
        return BPromise
            .mapSeries([
            addStaticFiles,
            addAditionalInfo,
            //zipLib.addMimetype,
            //zipLib.addContainerInfo,
            addCover,
            zip_1.default.addFiles,
            addStylesheets,
            addManifestOpf,
            addEpub2Nav,
            addEpub3Nav,
            addContent,
            tableOfContents,
        ], async function (fn, index) {
            if (fn === zip_1.default.addFiles) {
                return fn(zip, epub, options)
                    .then(function (ls) {
                    return ls;
                });
            }
            return fn(zip, epub, options);
        })
            .tap(function () {
            //console.log(epub.epubConfig.cover);
        })
            .then(function () {
            return zip;
        });
    }
    Builder.make = make;
    function addStaticFiles(zip, epub, options) {
        let ls = Object.keys(Builder.staticFiles).reduce(function (a, key) {
            let b = {
                name: key,
                ext: '',
                file: Builder.staticFiles[key],
            };
            a.push(b);
            return a;
        }, []);
        return zip_1.default.addStaticFiles(zip, ls);
    }
    Builder.addStaticFiles = addStaticFiles;
    async function tableOfContents(zip, epub, options) {
        zip
            .folder('EPUB')
            .file('TableOfContents.xhtml', handlebar_helpers_1.compileTpl(options.templates.tableOfContents, epub.epubConfig));
        zip
            .folder('EPUB')
            .file('contents.xhtml', handlebar_helpers_1.compileTpl(options.templates.contents, epub.epubConfig));
    }
    Builder.tableOfContents = tableOfContents;
    async function addCover(zip, epub, options) {
        let bool = await zip_1.default.addCover(zip, epub, options);
        if (bool) {
            zip
                .folder('EPUB')
                .file('CoverPage.xhtml', handlebar_helpers_1.compileTpl(options.templates.coverPage, epub.epubConfig));
        }
        else {
            epub.epubConfig.cover = null;
        }
    }
    Builder.addCover = addCover;
    function addInfoSection(section, titlePrefix, namePrefix) {
        let c = '_';
        if (!section.content) {
            section.content = {};
        }
        if (titlePrefix) {
            titlePrefix = section.content.fullTitle = titlePrefix + ' - ' + section.content.title;
            namePrefix = section.name = namePrefix + c + section.rank;
        }
        else {
            titlePrefix = section.content.fullTitle = section.content.title;
            namePrefix = section.name = section.rank;
        }
        if (section.content.content || section.content.renderTitle || section.epubType == 'auto-toc') {
            section.needPage = true;
        }
        section.playOrder = playOrder++;
        if (!section.id) {
            section.id = (section.epubType || '').toString().replace('/\W/g', '') + shortid();
        }
        for (let i = 0; i < section.subSections.length; i++) {
            section.subSections[i].rank = i.toString().padStart(3, '0');
            addInfoSection(section.subSections[i], titlePrefix, namePrefix);
        }
    }
    Builder.addInfoSection = addInfoSection;
    function addAditionalInfo(zip, epub, options) {
        //Default options
        // @ts-ignore
        epub.epubConfig.options.tocName = epub.epubConfig.options.tocName || 'Menu';
        //Generate name and full title for each section/subsection
        for (let i = 0; i < epub.epubConfig.sections.length; i++) {
            epub.epubConfig.sections[i].rank = i.toString().padStart(3, '0');
            addInfoSection(epub.epubConfig.sections[i]);
        }
    }
    Builder.addAditionalInfo = addAditionalInfo;
    function addManifestOpf(zip, epub, options) {
        handlebar_helpers_1.Handlebars.registerPartial('sectionsOPFManifestTemplate', options.templates.sectionsOPFManifestTemplate);
        handlebar_helpers_1.Handlebars.registerPartial('sectionsOPFSpineTemplate', options.templates.sectionsOPFSpineTemplate);
        zip.folder('EPUB').file('content.opf', handlebar_helpers_1.compileTpl(options.templates.opf, epub.epubConfig));
    }
    Builder.addManifestOpf = addManifestOpf;
    function addEpub2Nav(zip, epub, options) {
        handlebar_helpers_1.Handlebars.registerPartial('sectionsNCXTemplate', options.templates.sectionsNCXTemplate);
        zip.folder('EPUB').file('toc.ncx', handlebar_helpers_1.compileTpl(options.templates.ncx, epub.epubConfig));
    }
    Builder.addEpub2Nav = addEpub2Nav;
    function addEpub3Nav(zip, epub, options) {
        handlebar_helpers_1.Handlebars.registerPartial('sectionsNavTemplate', options.templates.sectionsNavTemplate);
        zip.folder('EPUB').file('nav.xhtml', handlebar_helpers_1.compileTpl(options.templates.nav, epub.epubConfig));
    }
    Builder.addEpub3Nav = addEpub3Nav;
    async function addStylesheets(zip, epub, options) {
        if (epub.epubConfig.stylesheet.url || epub.epubConfig.stylesheet.file) {
            let file = await ajax_1.fetchFile(epub.epubConfig.stylesheet);
            epub.epubConfig.stylesheet.styles += "\n" + file.data.toString();
        }
        return compileAndAddCss();
        async function compileAndAddCss() {
            let styles = {
                original: epub.epubConfig.stylesheet.replaceOriginal ? '' : options.templates.css,
                custom: epub.epubConfig.stylesheet.styles || '',
            };
            let css = await handlebar_helpers_1.compileTpl(`${styles.original}\n${styles.custom}`, styles, true);
            css = await postcss_1.compileCss(css);
            return zip.folder('EPUB')
                .folder('css')
                .file('main.css', css);
        }
    }
    Builder.addStylesheets = addStylesheets;
    function addSection(zip, section, epub, options) {
        return zip_1.default.addSubSections(zip, section, function (zip, section, epubConfig, options) {
            if (section.needPage) {
                let name = section.name + '.xhtml';
                if (section.epubType == 'auto-toc') {
                    return zip
                        .folder('EPUB')
                        .file(name, handlebar_helpers_1.compileTpl(options.templates.autoToc, section));
                }
                else {
                    return zip
                        .folder('EPUB')
                        .file(name, handlebar_helpers_1.compileTpl(options.templates.content, section));
                }
            }
            return false;
        }, epub, options);
    }
    Builder.addSection = addSection;
    function addContent(zip, epub, options) {
        return BPromise.mapSeries(epub.epubConfig.sections, function (section) {
            return addSection(zip, section, epub, options);
        });
    }
    Builder.addContent = addContent;
})(Builder = exports.Builder || (exports.Builder = {}));
// @ts-ignore
exports.builder = Builder;
exports.default = exports.builder;
/*
if (typeof window !== 'undefined')
{
    // @ts-ignore
    window.epubMaker = builder;
}
*/
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLCtDQUFzRDtBQUN0RCwyRUFBNkU7QUFDN0UsaURBQW1EO0FBQ25ELHVEQUF1RDtBQUN2RCw2QkFBNkI7QUFHN0IscUNBQXNDO0FBQ3RDLG1DQUFtQztBQUluQyxhQUFhO0FBQ0EsUUFBQSxtQkFBbUIsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBVyxDQUFDO0FBQ3JELFFBQUEsa0JBQWtCLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQywyQkFBbUIsRUFBRSxLQUFLLENBQVcsQ0FBQztBQWdCbEYsSUFBaUIsT0FBTyxDQThSdkI7QUE5UkQsV0FBaUIsT0FBTztJQUVaLGlCQUFTLEdBQUc7UUFDdEIsdUJBQXVCO1FBQ3ZCLHNDQUFzQztRQUN0QyxHQUFHLEVBQUUsa0JBQWtCO1FBQ3ZCLEdBQUcsRUFBRSxjQUFjO1FBQ25CLEdBQUcsRUFBRSxnQkFBZ0I7UUFDckIsR0FBRyxFQUFFLG1CQUFtQjtRQUN4QixPQUFPLEVBQUUsb0JBQW9CO1FBQzdCLE9BQU8sRUFBRSxxQkFBcUI7UUFDOUIsbUJBQW1CLEVBQUUsaUNBQWlDO1FBQ3RELG1CQUFtQixFQUFFLGdDQUFnQztRQUNyRCwyQkFBMkIsRUFBRSx5Q0FBeUM7UUFDdEUsd0JBQXdCLEVBQUUsc0NBQXNDO1FBRWhFLFNBQVMsRUFBRSxzQkFBc0I7UUFDakMsZUFBZSxFQUFFLDRCQUE0QjtRQUU3QyxZQUFZLEVBQUUseUJBQXlCO1FBQ3ZDLGNBQWMsRUFBRSwyQkFBMkI7UUFFM0MsUUFBUSxFQUFFLHFCQUFxQjtLQUMvQixDQUFDO0lBRUYsS0FBSyxJQUFJLENBQUMsSUFBSSxRQUFBLFNBQVMsRUFDdkI7UUFDQyxRQUFBLFNBQVMsQ0FBQyxDQUFDLENBQUMsR0FBRyxnQkFBZ0IsSUFBSSxDQUFDLElBQUksQ0FBQywwQkFBa0IsRUFBRSxRQUFBLFNBQVMsQ0FBQyxD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QUVEO29CQUNDLE9BQU8sR0FBRzt5QkFDUixNQUFNLENBQUMsTUFBTSxDQUFDO3lCQUNkLElBQUksQ0FBQyxJQUFJLEVBQUUsOEJBQVUsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUMxRDtpQkFDRjthQUNEO1lBRUQsT0FBTyxLQUFLLENBQUM7UUFDZCxDQUFDLEVBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQ25CLENBQUM7SUExQmUsa0JBQVUsYUEwQnpCLENBQUE7SUFFRCxTQUFnQixVQUFVLENBQUMsR0FBRyxFQUFFLElBQWUsRUFBRSxPQUFPO1FBRXZELE9BQU8sUUFBUSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsRUFBRSxVQUFVLE9BQU87WUFFcEUsT0FBTyxVQUFVLENBQUMsR0FBRyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDaEQsQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDO0lBTmUsa0JBQVUsYUFNekIsQ0FBQTtBQUNGLENBQUMsRUE5UmdCLE9BQU8sR0FBUCxlQUFPLEtBQVAsZUFBTyxRQThSdkI7QUFFRCxhQUFhO0FBQ0EsUUFBQSxPQUFPLEdBQUcsT0FBbUIsQ0FBQztBQUMzQyxrQkFBZSxlQUFtQixDQUFDO0FBRW5DOzs7Ozs7RUFNRSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB6aXBMaWIsIHsgSlNaaXAgfSBmcm9tICcuLi8uLi9lcHVidHBsLWxpYi96aXAnO1xuaW1wb3J0IHsgSGFuZGxlYmFycywgY29tcGlsZVRwbCB9IGZyb20gJy4uLy4uL2VwdWJ0cGwtbGliL2hhbmRsZWJhci1oZWxwZXJzJztcbmltcG9ydCB7IGZldGNoRmlsZSB9IGZyb20gJy4uLy4uL2VwdWJ0cGwtbGliL2FqYXgnO1xuaW1wb3J0IHsgY29tcGlsZUNzcyB9IGZyb20gJy4uLy4uL2VwdWJ0cGwtbGliL3Bvc3Rjc3MnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IElCdWlsZGVyLCBJQnVpbGRlckNhbGxiYWNrLCBJRXB1YkNvbmZpZyB9IGZyb20gJy4uLy4uL3Zhcic7XG5pbXBvcnQgeyBFcHViTWFrZXIgfSBmcm9tICcuLi8uLi9pbmRleCc7XG5pbXBvcnQgQlByb21pc2UgPSByZXF1aXJlKCdibHVlYmlyZCcpO1xuaW1wb3J0ICogYXMgc2hvcnRpZCBmcm9tICdzaG9ydGlkJztcblxuaW1wb3J0IGVwdWJUcGxMaWIsIHt9IGZyb20gJy4uLy4uL2VwdWJ0cGwtbGliJztcblxuLy8gQHRzLWlnbm9yZVxuZXhwb3J0IGNvbnN0IEVQVUJfVEVNUExBVEVTX1BBVEggPSBwYXRoLmpvaW4oX19kaXJuYW1lKSBhcyBzdHJpbmc7XG5leHBvcnQgY29uc3QgRVBVQl9URU1QTEFURVNfVFBMID0gcGF0aC5qb2luKEVQVUJfVEVNUExBVEVTX1BBVEgsICd0cGwnKSBhcyBzdHJpbmc7XG5cbmRlY2xhcmUgbW9kdWxlICcuLi8uLi9pbmRleCdcbntcblx0bmFtZXNwYWNlIEVwdWJNYWtlclxuXHR7XG5cdFx0aW50ZXJmYWNlIFNlY3Rpb25cblx0XHR7XG5cdFx0XHRuZWVkUGFnZTogYm9vbGVhbjtcblx0XHRcdG5hbWU6IHN0cmluZztcblxuXHRcdFx0cmFuazogbnVtYmVyIHwgc3RyaW5nO1xuXHRcdH1cblx0fVxufVxuXG5leHBvcnQgbmFtZXNwYWNlIEJ1aWxkZXJcbntcblx0ZXhwb3J0IGxldCB0ZW1wbGF0ZXMgPSB7XG5cdFx0Ly9taW1ldHlwZTogJ21pbWV0eXBlJyxcblx0XHQvL2NvbnRhaW5lcjogJ01FVEEtSU5GL2NvbnRhaW5lci54bWwnLFxuXHRcdG9wZjogJ0VQVUIvY29udGVudC5vcGYnLFxuXHRcdG5jeDogJ0VQVUIvdG9jLm5jeCcsXG5cdFx0bmF2OiAnRVBVQi9uYXYueGh0bWwnLFxuXHRcdGNzczogJ0VQVUIvY3NzL21haW4uY3NzJyxcblx0XHRjb250ZW50OiAnRVBVQi9jb250ZW50LnhodG1sJyxcblx0XHRhdXRvVG9jOiAnRVBVQi9hdXRvLXRvYy54aHRtbCcsXG5cdFx0c2VjdGlvbnNOYXZUZW1wbGF0ZTogJ0VQVUIvc2VjdGlvbnMtbmF2LXRlbXBsYXRlLmh0bWwnLFxuXHRcdHNlY3Rpb25zTkNYVGVtcGxhdGU6ICdFUFVCL3NlY3Rpb25zLW5jeC10ZW1wbGF0ZS54bWwnLFxuXHRcdHNlY3Rpb25zT1BGTWFuaWZlc3RUZW1wbGF0ZTogJ0VQVUIvc2VjdGlvbnMtb3BmLW1hbmlmZXN0LXRlbXBsYXRlLnhtbCcsXG5cdFx0c2VjdGlvbnNPUEZTcGluZVRlbXBsYXRlOiAnRVBVQi9zZWN0aW9ucy1vcGYtc3BpbmUtdGVtcGxhdGUueG1sJyxcblxuXHRcdGNvdmVyUGFnZTogJ0VQVUIvQ292ZXJQYWdlLnhodG1sJyxcblx0XHR0YWJsZU9mQ29udGVudHM6ICdFUFVCL1RhYmxlT2ZDb250ZW50cy54aHRtbCcsXG5cblx0XHRzZWN0aW9uc0luZm86ICdFUFVCL3NlY3Rpb25zLWluZm8uaHRtbCcsXG5cdFx0c2VjdGlvbnNTY3JpcHQ6ICdFUFVCL3NlY3Rpb25zLXNjcmlwdC5odG1sJyxcblxuXHRcdGNvbnRlbnRzOiAnRVBVQi9jb250ZW50cy54aHRtbCcsXG5cdH07XG5cblx0Zm9yIChsZXQgaSBpbiB0ZW1wbGF0ZXMpXG5cdHtcblx0XHR0ZW1wbGF0ZXNbaV0gPSBgXFx7XFx7aW1wb3J0IFxcJyR7cGF0aC5qb2luKEVQVUJfVEVNUExBVEVTX1RQTCwgdGVtcGxhdGVzW2ldKX0nXFx9XFx9YDtcblx0fVxuXG5cdGxldCBwbGF5T3JkZXIgPSAwO1xuXG5cdGV4cG9ydCBsZXQgc3RhdGljRmlsZXMgPSB7XG5cdFx0J21pbWV0eXBlJzogJ21pbWV0eXBlJyxcblx0XHQnTUVUQS1JTkYvY29udGFpbmVyLnhtbCc6ICdNRVRBLUlORi9jb250YWluZXIueG1sJyxcblx0fTtcblxuXHRmb3IgKGxldCBpIGluIHN0YXRpY0ZpbGVzKVxuXHR7XG5cdFx0c3RhdGljRmlsZXNbaV0gPSBwYXRoLmpvaW4oRVBVQl9URU1QTEFURVNfVFBMLCBzdGF0aWNGaWxlc1tpXSk7XG5cdH1cblxuXHRleHBvcnQgZnVuY3Rpb24gbWFrZShlcHViOiBFcHViTWFrZXIsIG9wdGlvbnM/KTogQlByb21pc2U8SlNaaXA+XG5cdHtcblx0XHQvL2xldCBlcHViQ29uZmlnID0gZXB1Yi5lcHViQ29uZmlnO1xuXG5cdFx0b3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe30sIHtcblx0XHRcdHRlbXBsYXRlczogdGVtcGxhdGVzLFxuXHRcdH0sIG9wdGlvbnMpO1xuXG5cdFx0Ly9jb25zb2xlLmRlYnVnKCdbYnVpbGRpbmcgZXB1Yl0nLCBlcHViLmVwdWJDb25maWcpO1xuXHRcdC8vY29uc29sZS5kZWJ1ZygnW2J1aWxkaW5nIGVwdWJdJywgb3B0aW9ucyk7XG5cdFx0bGV0IHppcCA9IG5ldyBKU1ppcCgpO1xuXG5cdFx0Ly9hd2FpdCBhZGRBZGl0aW9uYWxJbmZvKHppcCwgZXB1Yiwgb3B0aW9ucyk7XG5cblx0XHRIYW5kbGViYXJzLnJlZ2lzdGVyUGFydGlhbCgnc2VjdGlvbnNJbmZvJywgb3B0aW9ucy50ZW1wbGF0ZXMuc2VjdGlvbnNJbmZvKTtcblx0XHRIYW5kbGViYXJzLnJlZ2lzdGVyUGFydGlhbCgnc2VjdGlvbnNTY3JpcHQnLCBvcHRpb25zLnRlbXBsYXRlcy5zZWN0aW9uc1NjcmlwdCk7XG5cblx0XHRyZXR1cm4gQlByb21pc2Vcblx0XHRcdC5tYXBTZXJpZXMoW1xuXHRcdFx0XHRhZGRTdGF0aWNGaWxlcyxcblxuXHRcdFx0XHRhZGRBZGl0aW9uYWxJbmZvLFxuXG5cdFx0XHRcdC8vemlwTGliLmFkZE1pbWV0eXBlLFxuXHRcdFx0XHQvL3ppcExpYi5hZGRDb250YWluZXJJbmZvLFxuXHRcdFx0XHRhZGRDb3ZlcixcblxuXHRcdFx0XHR6aXBMaWIuYWRkRmlsZXMsXG5cblx0XHRcdFx0YWRkU3R5bGVzaGVldHMsXG5cdFx0XHRcdGFkZE1hbmlmZXN0T3BmLFxuXHRcdFx0XHRhZGRFcHViMk5hdixcblx0XHRcdFx0YWRkRXB1YjNOYXYsXG5cdFx0XHRcdGFkZENvbnRlbnQsXG5cblx0XHRcdFx0dGFibGVPZkNvbnRlbnRzLFxuXHRcdFx0XSwgYXN5bmMgZnVuY3Rpb24gKGZuLCBpbmRleClcblx0XHRcdHtcblx0XHRcdFx0aWYgKGZuID09PSB6aXBMaWIuYWRkRmlsZXMpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRyZXR1cm4gKGZuIGFzIHR5cGVvZiB6aXBMaWIuYWRkRmlsZXMpKHppcCwgZXB1Yiwgb3B0aW9ucylcblx0XHRcdFx0XHRcdC50aGVuKGZ1bmN0aW9uIChscylcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0cmV0dXJuIGxzO1xuXHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHRcdDtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHJldHVybiBmbih6aXAsIGVwdWIsIG9wdGlvbnMpO1xuXHRcdFx0fSlcblx0XHRcdC50YXAoZnVuY3Rpb24gKClcblx0XHRcdHtcblx0XHRcdFx0Ly9jb25zb2xlLmxvZyhlcHViLmVwdWJDb25maWcuY292ZXIpO1xuXHRcdFx0fSlcblx0XHRcdC50aGVuKGZ1bmN0aW9uICgpXG5cdFx0XHR7XG5cdFx0XHRcdHJldHVybiB6aXA7XG5cdFx0XHR9KVxuXHRcdFx0Ly8uY2F0Y2goZXJyID0+IGNvbnNvbGUubG9nKGVycikpXG5cdFx0XHQ7XG5cdH1cblxuXHRleHBvcnQgZnVuY3Rpb24gYWRkU3RhdGljRmlsZXMoemlwLCBlcHViOiBFcHViTWFrZXIsIG9wdGlvbnMpXG5cdHtcblx0XHRsZXQgbHMgPSBPYmplY3Qua2V5cyhzdGF0aWNGaWxlcykucmVkdWNlKGZ1bmN0aW9uIChhLCBrZXkpXG5cdFx0e1xuXHRcdFx0bGV0IGIgPSB7XG5cdFx0XHRcdG5hbWU6IGtleSxcblx0XHRcdFx0ZXh0OiAnJyxcblx0XHRcdFx0ZmlsZTogc3RhdGljRmlsZXNba2V5XSxcblx0XHRcdH07XG5cblx0XHRcdGEucHVzaChiKTtcblxuXHRcdFx0cmV0dXJuIGE7XG5cdFx0fSwgW10pO1xuXG5cdFx0cmV0dXJuIHppcExpYi5hZGRTdGF0aWNGaWxlcyh6aXAsIGxzKTtcblx0fVxuXG5cdGV4cG9ydCBhc3luYyBmdW5jdGlvbiB0YWJsZU9mQ29udGVudHMoemlwLCBlcHViOiBFcHViTWFrZXIsIG9wdGlvbnMpXG5cdHtcblx0XHR6aXBcblx0XHRcdC5mb2xkZXIoJ0VQVUInKVxuXHRcdFx0LmZpbGUoJ1RhYmxlT2ZDb250ZW50cy54aHRtbCcsIGNvbXBpbGVUcGwob3B0aW9ucy50ZW1wbGF0ZXMudGFibGVPZkNvbnRlbnRzLCBlcHViLmVwdWJDb25maWcpKVxuXHRcdDtcblxuXHRcdHppcFxuXHRcdFx0LmZvbGRlcignRVBVQicpXG5cdFx0XHQuZmlsZSgnY29udGVudHMueGh0bWwnLCBjb21waWxlVHBsKG9wdGlvbnMudGVtcGxhdGVzLmNvbnRlbnRzLCBlcHViLmVwdWJDb25maWcpKVxuXHRcdDtcblx0fVxuXG5cdGV4cG9ydCBhc3luYyBmdW5jdGlvbiBhZGRDb3Zlcih6aXAsIGVwdWI6IEVwdWJNYWtlciwgb3B0aW9ucylcblx0e1xuXHRcdGxldCBib29sID0gYXdhaXQgemlwTGliLmFkZENvdmVyKHppcCwgZXB1Yiwgb3B0aW9ucyk7XG5cblx0XHRpZiAoYm9vbClcblx0XHR7XG5cdFx0XHR6aXBcblx0XHRcdFx0LmZvbGRlcignRVBVQicpXG5cdFx0XHRcdC5maWxlKCdDb3ZlclBhZ2UueGh0bWwnLCBjb21waWxlVHBsKG9wdGlvbnMudGVtcGxhdGVzLmNvdmVyUGFnZSwgZXB1Yi5lcHViQ29uZmlnKSlcblx0XHRcdDtcblx0XHR9XG5cdFx0ZWxzZVxuXHRcdHtcblx0XHRcdGVwdWIuZXB1YkNvbmZpZy5jb3ZlciA9IG51bGw7XG5cdFx0fVxuXHR9XG5cblx0ZXhwb3J0IGZ1bmN0aW9uIGFkZEluZm9TZWN0aW9uKHNlY3Rpb24sIHRpdGxlUHJlZml4PywgbmFtZVByZWZpeD8pXG5cdHtcblx0XHRsZXQgYyA9ICdfJztcblxuXHRcdGlmICghc2VjdGlvbi5jb250ZW50KVxuXHRcdHtcblx0XHRcdHNlY3Rpb24uY29udGVudCA9IHt9O1xuXHRcdH1cblx0XHRpZiAodGl0bGVQcmVmaXgpXG5cdFx0e1xuXHRcdFx0dGl0bGVQcmVmaXggPSBzZWN0aW9uLmNvbnRlbnQuZnVsbFRpdGxlID0gdGl0bGVQcmVmaXggKyAnIC0gJyArIHNlY3Rpb24uY29udGVudC50aXRsZTtcblx0XHRcdG5hbWVQcmVmaXggPSBzZWN0aW9uLm5hbWUgPSBuYW1lUHJlZml4ICsgYyArIHNlY3Rpb24ucmFuaztcblx0XHR9XG5cdFx0ZWxzZVxuXHRcdHtcblx0XHRcdHRpdGxlUHJlZml4ID0gc2VjdGlvbi5jb250ZW50LmZ1bGxUaXRsZSA9IHNlY3Rpb24uY29udGVudC50aXRsZTtcblx0XHRcdG5hbWVQcmVmaXggPSBzZWN0aW9uLm5hbWUgPSBzZWN0aW9uLnJhbms7XG5cdFx0fVxuXHRcdGlmIChzZWN0aW9uLmNvbnRlbnQuY29udGVudCB8fCBzZWN0aW9uLmNvbnRlbnQucmVuZGVyVGl0bGUgfHwgc2VjdGlvbi5lcHViVHlwZSA9PSAnYXV0by10b2MnKVxuXHRcdHtcblx0XHRcdHNlY3Rpb24ubmVlZFBhZ2UgPSB0cnVlO1xuXHRcdH1cblxuXHRcdHNlY3Rpb24ucGxheU9yZGVyID0gcGxheU9yZGVyKys7XG5cblx0XHRpZiAoIXNlY3Rpb24uaWQpXG5cdFx0e1xuXHRcdFx0c2VjdGlvbi5pZCA9IChzZWN0aW9uLmVwdWJUeXBlIHx8ICcnKS50b1N0cmluZygpLnJlcGxhY2UoJy9cXFcvZycsICcnKSArIHNob3J0aWQoKTtcblx0XHR9XG5cblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IHNlY3Rpb24uc3ViU2VjdGlvbnMubGVuZ3RoOyBpKyspXG5cdFx0e1xuXHRcdFx0c2VjdGlvbi5zdWJTZWN0aW9uc1tpXS5yYW5rID0gaS50b1N0cmluZygpLnBhZFN0YXJ0KDMsICcwJyk7XG5cdFx0XHRhZGRJbmZvU2VjdGlvbihzZWN0aW9uLnN1YlNlY3Rpb25zW2ldLCB0aXRsZVByZWZpeCwgbmFtZVByZWZpeCk7XG5cdFx0fVxuXHR9XG5cblx0ZXhwb3J0IGZ1bmN0aW9uIGFkZEFkaXRpb25hbEluZm8oemlwLCBlcHViOiBFcHViTWFrZXIsIG9wdGlvbnMpXG5cdHtcblx0XHQvL0RlZmF1bHQgb3B0aW9uc1xuXHRcdC8vIEB0cy1pZ25vcmVcblx0XHRlcHViLmVwdWJDb25maWcub3B0aW9ucy50b2NOYW1lID0gZXB1Yi5lcHViQ29uZmlnLm9wdGlvbnMudG9jTmFtZSB8fCAnTWVudSc7XG5cdFx0Ly9HZW5lcmF0ZSBuYW1lIGFuZCBmdWxsIHRpdGxlIGZvciBlYWNoIHNlY3Rpb24vc3Vic2VjdGlvblxuXHRcdGZvciAobGV0IGkgPSAwOyBpIDwgZXB1Yi5lcHViQ29uZmlnLnNlY3Rpb25zLmxlbmd0aDsgaSsrKVxuXHRcdHtcblx0XHRcdGVwdWIuZXB1YkNvbmZpZy5zZWN0aW9uc1tpXS5yYW5rID0gaS50b1N0cmluZygpLnBhZFN0YXJ0KDMsICcwJyk7XG5cdFx0XHRhZGRJbmZvU2VjdGlvbihlcHViLmVwdWJDb25maWcuc2VjdGlvbnNbaV0pO1xuXHRcdH1cblx0fVxuXG5cdGV4cG9ydCBmdW5jdGlvbiBhZGRNYW5pZmVzdE9wZih6aXAsIGVwdWI6IEVwdWJNYWtlciwgb3B0aW9ucylcblx0e1xuXHRcdEhhbmRsZWJhcnMucmVnaXN0ZXJQYXJ0aWFsKCdzZWN0aW9uc09QRk1hbmlmZXN0VGVtcGxhdGUnLCBvcHRpb25zLnRlbXBsYXRlcy5zZWN0aW9uc09QRk1hbmlmZXN0VGVtcGxhdGUpO1xuXHRcdEhhbmRsZWJhcnMucmVnaXN0ZXJQYXJ0aWFsKCdzZWN0aW9uc09QRlNwaW5lVGVtcGxhdGUnLCBvcHRpb25zLnRlbXBsYXRlcy5zZWN0aW9uc09QRlNwaW5lVGVtcGxhdGUpO1xuXG5cdFx0emlwLmZvbGRlcignRVBVQicpLmZpbGUoJ2NvbnRlbnQub3BmJywgY29tcGlsZVRwbChvcHRpb25zLnRlbXBsYXRlcy5vcGYsIGVwdWIuZXB1YkNvbmZpZykpO1xuXHR9XG5cblx0ZXhwb3J0IGZ1bmN0aW9uIGFkZEVwdWIyTmF2KHppcCwgZXB1YjogRXB1Yk1ha2VyLCBvcHRpb25zKVxuXHR7XG5cdFx0SGFuZGxlYmFycy5yZWdpc3RlclBhcnRpYWwoJ3NlY3Rpb25zTkNYVGVtcGxhdGUnLCBvcHRpb25zLnRlbXBsYXRlcy5zZWN0aW9uc05DWFRlbXBsYXRlKTtcblx0XHR6aXAuZm9sZGVyKCdFUFVCJykuZmlsZSgndG9jLm5jeCcsIGNvbXBpbGVUcGwob3B0aW9ucy50ZW1wbGF0ZXMubmN4LCBlcHViLmVwdWJDb25maWcpKTtcblx0fVxuXG5cdGV4cG9ydCBmdW5jdGlvbiBhZGRFcHViM05hdih6aXAsIGVwdWI6IEVwdWJNYWtlciwgb3B0aW9ucylcblx0e1xuXHRcdEhhbmRsZWJhcnMucmVnaXN0ZXJQYXJ0aWFsKCdzZWN0aW9uc05hdlRlbXBsYXRlJywgb3B0aW9ucy50ZW1wbGF0ZXMuc2VjdGlvbnNOYXZUZW1wbGF0ZSk7XG5cdFx0emlwLmZvbGRlcignRVBVQicpLmZpbGUoJ25hdi54aHRtbCcsIGNvbXBpbGVUcGwob3B0aW9ucy50ZW1wbGF0ZXMubmF2LCBlcHViLmVwdWJDb25maWcpKTtcblx0fVxuXG5cdGV4cG9ydCBhc3luYyBmdW5jdGlvbiBhZGRTdHlsZXNoZWV0cyh6aXAsIGVwdWI6IEVwdWJNYWtlciwgb3B0aW9ucylcblx0e1xuXHRcdGlmIChlcHViLmVwdWJDb25maWcuc3R5bGVzaGVldC51cmwgfHwgZXB1Yi5lcHViQ29uZmlnLnN0eWxlc2hlZXQuZmlsZSlcblx0XHR7XG5cdFx0XHRsZXQgZmlsZSA9IGF3YWl0IGZldGNoRmlsZShlcHViLmVwdWJDb25maWcuc3R5bGVzaGVldCk7XG5cblx0XHRcdGVwdWIuZXB1YkNvbmZpZy5zdHlsZXNoZWV0LnN0eWxlcyArPSBcIlxcblwiICsgZmlsZS5kYXRhLnRvU3RyaW5nKCk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGNvbXBpbGVBbmRBZGRDc3MoKTtcblxuXHRcdGFzeW5jIGZ1bmN0aW9uIGNvbXBpbGVBbmRBZGRDc3MoKVxuXHRcdHtcblx0XHRcdGxldCBzdHlsZXMgPSB7XG5cdFx0XHRcdG9yaWdpbmFsOiBlcHViLmVwdWJDb25maWcuc3R5bGVzaGVldC5yZXBsYWNlT3JpZ2luYWwgPyAnJyA6IG9wdGlvbnMudGVtcGxhdGVzLmNzcyxcblx0XHRcdFx0Y3VzdG9tOiBlcHViLmVwdWJDb25maWcuc3R5bGVzaGVldC5zdHlsZXMgfHwgJycsXG5cdFx0XHR9O1xuXG5cdFx0XHRsZXQgY3NzID0gYXdhaXQgY29tcGlsZVRwbChgJHtzdHlsZXMub3JpZ2luYWx9XFxuJHtzdHlsZXMuY3VzdG9tfWAsIHN0eWxlcywgdHJ1ZSk7XG5cblx0XHRcdGNzcyA9IGF3YWl0IGNvbXBpbGVDc3MoY3NzKTtcblxuXHRcdFx0cmV0dXJuIHppcC5mb2xkZXIoJ0VQVUInKVxuXHRcdFx0XHQuZm9sZGVyKCdjc3MnKVxuXHRcdFx0XHQuZmlsZSgnbWFpbi5jc3MnLCBjc3MpXG5cdFx0XHRcdDtcblx0XHR9XG5cdH1cblxuXHRleHBvcnQgZnVuY3Rpb24gYWRkU2VjdGlvbih6aXA6IEpTWmlwLCBzZWN0aW9uOiBFcHViTWFrZXIuU2VjdGlvbiwgZXB1YjogRXB1Yk1ha2VyLCBvcHRpb25zKVxuXHR7XG5cdFx0cmV0dXJuIHppcExpYi5hZGRTdWJTZWN0aW9ucyh6aXAsIHNlY3Rpb24sIGZ1bmN0aW9uICh6aXAsIHNlY3Rpb24sIGVwdWJDb25maWcsIG9wdGlvbnMpXG5cdFx0e1xuXHRcdFx0aWYgKHNlY3Rpb24ubmVlZFBhZ2UpXG5cdFx0XHR7XG5cdFx0XHRcdGxldCBuYW1lID0gc2VjdGlvbi5uYW1lICsgJy54aHRtbCc7XG5cblx0XHRcdFx0aWYgKHNlY3Rpb24uZXB1YlR5cGUgPT0gJ2F1dG8tdG9jJylcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHJldHVybiB6aXBcblx0XHRcdFx0XHRcdC5mb2xkZXIoJ0VQVUInKVxuXHRcdFx0XHRcdFx0LmZpbGUobmFtZSwgY29tcGlsZVRwbChvcHRpb25zLnRlbXBsYXRlcy5hdXRvVG9jLCBzZWN0aW9uKSlcblx0XHRcdFx0XHRcdDtcblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRyZXR1cm4gemlwXG5cdFx0XHRcdFx0XHQuZm9sZGVyKCdFUFVCJylcblx0XHRcdFx0XHRcdC5maWxlKG5hbWUsIGNvbXBpbGVUcGwob3B0aW9ucy50ZW1wbGF0ZXMuY29udGVudCwgc2VjdGlvbikpXG5cdFx0XHRcdFx0XHQ7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH0sIGVwdWIsIG9wdGlvbnMpO1xuXHR9XG5cblx0ZXhwb3J0IGZ1bmN0aW9uIGFkZENvbnRlbnQoemlwLCBlcHViOiBFcHViTWFrZXIsIG9wdGlvbnMpXG5cdHtcblx0XHRyZXR1cm4gQlByb21pc2UubWFwU2VyaWVzKGVwdWIuZXB1YkNvbmZpZy5zZWN0aW9ucywgZnVuY3Rpb24gKHNlY3Rpb24pXG5cdFx0e1xuXHRcdFx0cmV0dXJuIGFkZFNlY3Rpb24oemlwLCBzZWN0aW9uLCBlcHViLCBvcHRpb25zKTtcblx0XHR9KTtcblx0fVxufVxuXG4vLyBAdHMtaWdub3JlXG5leHBvcnQgY29uc3QgYnVpbGRlciA9IEJ1aWxkZXIgYXMgSUJ1aWxkZXI7XG5leHBvcnQgZGVmYXVsdCBidWlsZGVyIGFzIElCdWlsZGVyO1xuXG4vKlxuaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKVxue1xuXHQvLyBAdHMtaWdub3JlXG5cdHdpbmRvdy5lcHViTWFrZXIgPSBidWlsZGVyO1xufVxuKi9cbiJdfQ==