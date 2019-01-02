"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zip_1 = require("../../epubtpl-lib/zip");
const handlebar_helpers_1 = require("../../epubtpl-lib/handlebar-helpers");
const ajax_1 = require("../../epubtpl-lib/ajax");
const postcss_1 = require("../../epubtpl-lib/postcss");
const path = require("path");
const util_1 = require("../../lib/util");
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
        return util_1.BPromise
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
            section.id = (section.epubType || '').toString().replace('/\W/g', '') + util_1.shortid();
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
        return util_1.BPromise.mapSeries(epub.epubConfig.sections, function (section) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLCtDQUFzRDtBQUN0RCwyRUFBNkU7QUFDN0UsaURBQW1EO0FBQ25ELHVEQUF1RDtBQUN2RCw2QkFBNkI7QUFHN0IseUNBQW1EO0FBSXRDLFFBQUEsbUJBQW1CLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQVcsQ0FBQztBQUNyRCxRQUFBLGtCQUFrQixHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsMkJBQW1CLEVBQUUsS0FBSyxDQUFXLENBQUM7QUFnQmxGLElBQWlCLE9BQU8sQ0E4UnZCO0FBOVJELFdBQWlCLE9BQU87SUFFWixpQkFBUyxHQUFHO1FBQ3RCLHVCQUF1QjtRQUN2QixzQ0FBc0M7UUFDdEMsR0FBRyxFQUFFLGtCQUFrQjtRQUN2QixHQUFHLEVBQUUsY0FBYztRQUNuQixHQUFHLEVBQUUsZ0JBQWdCO1FBQ3JCLEdBQUcsRUFBRSxtQkFBbUI7UUFDeEIsT0FBTyxFQUFFLG9CQUFvQjtRQUM3QixPQUFPLEVBQUUscUJBQXFCO1FBQzlCLG1CQUFtQixFQUFFLGlDQUFpQztRQUN0RCxtQkFBbUIsRUFBRSxnQ0FBZ0M7UUFDckQsMkJBQTJCLEVBQUUseUNBQXlDO1FBQ3RFLHdCQUF3QixFQUFFLHNDQUFzQztRQUVoRSxTQUFTLEVBQUUsc0JBQXNCO1FBQ2pDLGVBQWUsRUFBRSw0QkFBNEI7UUFFN0MsWUFBWSxFQUFFLHlCQUF5QjtRQUN2QyxjQUFjLEVBQUUsMkJBQTJCO1FBRTNDLFFBQVEsRUFBRSxxQkFBcUI7S0FDL0IsQ0FBQztJQUVGLEtBQUssSUFBSSxDQUFDLElBQUksUUFBQSxTQUFTLEVBQ3ZCO1FBQ0MsUUFBQSxTQUFTLENBQUMsQ0FBQyxDQUFDLEdBQUcsZ0JBQWdCLElBQUksQ0FBQyxJQUFJLENBQUMsMEJBQWtCLEVBQUUsUUFBQSxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDO0tBQ2xGO0lBRUQsSUFBSSxTQUFTLEdBQUcsQ0FBQyxDQUFDO0lBRVAsbUJBQVcsR0FBRztRQUN4QixVQUFVLEVBQUUsVUFBVTtRQUN0Qix3QkFBd0IsRUFBRSx3QkFBd0I7S0FDbEQsQ0FBQztJQUVGLEtBQUssSUFBSSxDQUFDLElBQUksUUFBQSxXQUFXLEVBQ3pCO1FBQ0MsUUFBQSxXQUFXLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQywwQkFBa0IsRUFBRSxRQUFBLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQy9EO0lBRUQsU0FBZ0IsSUFBSSxDQUFDLElBQWUsRUFBRSxPQUFRO1FBRTdDLG1DQUFtQztRQUVuQyxPQUFPLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUU7WUFDM0IsU0FBUyxFQUFFLFFBQUEsU0FBUztTQUNwQixFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBRVosb0RBQW9EO1FBQ3BELDRDQUE0QztRQUM1QyxJQUFJLEdBQUcsR0FBRyxJQUFJLFdBQUssRUFBRSxDQUFDO1FBRXRCLDZDQUE2QztRQUU3Qyw4QkFBVSxDQUFDLGVBQWUsQ0FBQyxjQUFjLEVBQUUsT0FBTyxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUMzRSw4QkFBVSxDQUFDLGVBQWUsQ0FBQyxnQkFBZ0IsRUFBRSxPQUFPLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBRS9FLE9BQU8sZUFBUTthQUNiLFNBQVMsQ0FBQztZQUNWLGNBQWM7WUFFZCxnQkFBZ0I7WUFFaEIscUJBQXFCO1lBQ3JCLDBCQUEwQjtZQUMxQixRQUFRO1lBRVIsYUFBTSxDQUFDLFFBQVE7WUFFZixjQUFjO1lBQ2QsY0FBYztZQUNkLFdBQVc7WUFDWCxXQUFXO1lBQ1gsVUFBVTtZQUVWLGVBQWU7U0FDZixFQUFFLEtBQUssV0FBVyxFQUFFLEVBQUUsS0FBSztZQUUzQixJQUFJLEVBQUUsS0FBSyxhQUFNLENBQUMsUUFBUSxFQUMxQjtnQkFDQyxPQUFRLEVBQTZCLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxPQUFPLENBQUM7cUJBQ3ZELElBQUksQ0FBQyxVQUFVLEVBQUU7b0JBRWpCLE9BQU8sRUFBRSxDQUFDO2dCQUNYLENBQUMsQ0FBQyxDQUNEO2FBQ0Y7WUFFRCxPQUFPLEVBQUUsQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQy9CLENBQUMsQ0FBQzthQUNELEdBQUcsQ0FBQztZQUVKLHFDQUFxQztRQUN0QyxDQUFDLENBQUM7YUFDRCxJQUFJLENBQUM7WUFFTCxPQUFPLEdBQUcsQ0FBQztRQUNaLENBQUMsQ0FBQyxDQUVEO0lBQ0gsQ0FBQztJQTVEZSxZQUFJLE9BNERuQixDQUFBO0lBRUQsU0FBZ0IsY0FBYyxDQUFDLEdBQUcsRUFBRSxJQUFlLEVBQUUsT0FBTztRQUUzRCxJQUFJLEVBQUUsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLFFBQUEsV0FBVyxDQUFDLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxFQUFFLEdBQUc7WUFFeEQsSUFBSSxDQUFDLEdBQUc7Z0JBQ1AsSUFBSSxFQUFFLEdBQUc7Z0JBQ1QsR0FBRyxFQUFFLEVBQUU7Z0JBQ1AsSUFBSSxFQUFFLFFBQUEsV0FBVyxDQUFDLEdBQUcsQ0FBQzthQUN0QixDQUFDO1lBRUYsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUVWLE9BQU8sQ0FBQyxDQUFDO1FBQ1YsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBRVAsT0FBTyxhQUFNLENBQUMsY0FBYyxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUN2QyxDQUFDO0lBaEJlLHNCQUFjLGlCQWdCN0IsQ0FBQTtJQUVNLEtBQUssVUFBVSxlQUFlLENBQUMsR0FBRyxFQUFFLElBQWUsRUFBRSxPQUFPO1FBRWxFLEdBQUc7YUFDRCxNQUFNLENBQUMsTUFBTSxDQUFDO2FBQ2QsSUFBSSxDQUFDLHVCQUF1QixFQUFFLDhCQUFVLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxlQUFlLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQzlGO1FBRUQsR0FBRzthQUNELE1BQU0sQ0FBQyxNQUFNLENBQUM7YUFDZCxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsOEJBQVUsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FDaEY7SUFDRixDQUFDO0lBWHFCLHVCQUFlLGtCQVdwQyxDQUFBO0lBRU0sS0FBSyxVQUFVLFFBQVEsQ0FBQyxHQUFHLEVBQUUsSUFBZSxFQUFFLE9BQU87UUFFM0QsSUFBSSxJQUFJLEdBQUcsTUFBTSxhQUFNLENBQUMsUUFBUSxDQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFFckQsSUFBSSxJQUFJLEVBQ1I7WUFDQyxHQUFHO2lCQUNELE1BQU0sQ0FBQyxNQUFNLENBQUM7aUJBQ2QsSUFBSSxDQUFDLGlCQUFpQixFQUFFLDhCQUFVLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQ2xGO1NBQ0Q7YUFFRDtZQUNDLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztTQUM3QjtJQUNGLENBQUM7SUFmcUIsZ0JBQVEsV0FlN0IsQ0FBQTtJQUVELFNBQWdCLGNBQWMsQ0FBQyxPQUFPLEVBQUUsV0FBWSxFQUFFLFVBQVc7UUFFaEUsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDO1FBRVosSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQ3BCO1lBQ0MsT0FBTyxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7U0FDckI7UUFDRCxJQUFJLFdBQVcsRUFDZjtZQUNDLFdBQVcsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsR0FBRyxXQUFXLEdBQUcsS0FBSyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDO1lBQ3RGLFVBQVUsR0FBRyxPQUFPLENBQUMsSUFBSSxHQUFHLFVBQVUsR0FBRyxDQUFDLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQztTQUMxRDthQUVEO1lBQ0MsV0FBVyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDO1lBQ2hFLFVBQVUsR0FBRyxPQUFPLENBQUMsSUFBSSxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUM7U0FDekM7UUFDRCxJQUFJLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTyxJQUFJLE9BQU8sQ0FBQyxPQUFPLENBQUMsV0FBVyxJQUFJLE9BQU8sQ0FBQyxRQUFRLElBQUksVUFBVSxFQUM1RjtZQUNDLE9BQU8sQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO1NBQ3hCO1FBRUQsT0FBTyxDQUFDLFNBQVMsR0FBRyxTQUFTLEVBQUUsQ0FBQztRQUVoQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsRUFDZjtZQUNDLE9BQU8sQ0FBQyxFQUFFLEdBQUcsQ0FBQyxPQUFPLENBQUMsUUFBUSxJQUFJLEVBQUUsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLEdBQUcsY0FBTyxFQUFFLENBQUM7U0FDbEY7UUFFRCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQ25EO1lBQ0MsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDNUQsY0FBYyxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLEVBQUUsV0FBVyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1NBQ2hFO0lBQ0YsQ0FBQztJQW5DZSxzQkFBYyxpQkFtQzdCLENBQUE7SUFFRCxTQUFnQixnQkFBZ0IsQ0FBQyxHQUFHLEVBQUUsSUFBZSxFQUFFLE9BQU87UUFFN0QsaUJBQWlCO1FBQ2pCLGFBQWE7UUFDYixJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsT0FBTyxJQUFJLE1BQU0sQ0FBQztRQUM1RSwwREFBMEQ7UUFDMUQsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFDeEQ7WUFDQyxJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7WUFDakUsY0FBYyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDNUM7SUFDRixDQUFDO0lBWGUsd0JBQWdCLG1CQVcvQixDQUFBO0lBRUQsU0FBZ0IsY0FBYyxDQUFDLEdBQUcsRUFBRSxJQUFlLEVBQUUsT0FBTztRQUUzRCw4QkFBVSxDQUFDLGVBQWUsQ0FBQyw2QkFBNkIsRUFBRSxPQUFPLENBQUMsU0FBUyxDQUFDLDJCQUEyQixDQUFDLENBQUM7UUFDekcsOEJBQVUsQ0FBQyxlQUFlLENBQUMsMEJBQTBCLEVBQUUsT0FBTyxDQUFDLFNBQVMsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO1FBRW5HLEdBQUcsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSw4QkFBVSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO0lBQzVGLENBQUM7SUFOZSxzQkFBYyxpQkFNN0IsQ0FBQTtJQUVELFNBQWdCLFdBQVcsQ0FBQyxHQUFHLEVBQUUsSUFBZSxFQUFFLE9BQU87UUFFeEQsOEJBQVUsQ0FBQyxlQUFlLENBQUMscUJBQXFCLEVBQUUsT0FBTyxDQUFDLFNBQVMsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1FBQ3pGLEdBQUcsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSw4QkFBVSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO0lBQ3hGLENBQUM7SUFKZSxtQkFBVyxjQUkxQixDQUFBO0lBRUQsU0FBZ0IsV0FBVyxDQUFDLEdBQUcsRUFBRSxJQUFlLEVBQUUsT0FBTztRQUV4RCw4QkFBVSxDQUFDLGVBQWUsQ0FBQyxxQkFBcUIsRUFBRSxPQUFPLENBQUMsU0FBUyxDQUFDLG1CQUFtQixDQUFDLENBQUM7UUFDekYsR0FBRyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLDhCQUFVLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7SUFDMUYsQ0FBQztJQUplLG1CQUFXLGNBSTFCLENBQUE7SUFFTSxLQUFLLFVBQVUsY0FBYyxDQUFDLEdBQUcsRUFBRSxJQUFlLEVBQUUsT0FBTztRQUVqRSxJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLEdBQUcsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQ3JFO1lBQ0MsSUFBSSxJQUFJLEdBQUcsTUFBTSxnQkFBUyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUM7WUFFdkQsSUFBSSxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsTUFBTSxJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO1NBQ2pFO1FBRUQsT0FBTyxnQkFBZ0IsRUFBRSxDQUFDO1FBRTFCLEtBQUssVUFBVSxnQkFBZ0I7WUFFOUIsSUFBSSxNQUFNLEdBQUc7Z0JBQ1osUUFBUSxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEdBQUc7Z0JBQ2pGLE1BQU0sRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxNQUFNLElBQUksRUFBRTthQUMvQyxDQUFDO1lBRUYsSUFBSSxHQUFHLEdBQUcsTUFBTSw4QkFBVSxDQUFDLEdBQUcsTUFBTSxDQUFDLFFBQVEsS0FBSyxNQUFNLENBQUMsTUFBTSxFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBRWpGLEdBQUcsR0FBRyxNQUFNLG9CQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7WUFFNUIsT0FBTyxHQUFHLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQztpQkFDdkIsTUFBTSxDQUFDLEtBQUssQ0FBQztpQkFDYixJQUFJLENBQUMsVUFBVSxFQUFFLEdBQUcsQ0FBQyxDQUNyQjtRQUNILENBQUM7SUFDRixDQUFDO0lBM0JxQixzQkFBYyxpQkEyQm5DLENBQUE7SUFFRCxTQUFnQixVQUFVLENBQUMsR0FBVSxFQUFFLE9BQTBCLEVBQUUsSUFBZSxFQUFFLE9BQU87UUFFMUYsT0FBTyxhQUFNLENBQUMsY0FBYyxDQUFDLEdBQUcsRUFBRSxPQUFPLEVBQUUsVUFBVSxHQUFHLEVBQUUsT0FBTyxFQUFFLFVBQVUsRUFBRSxPQUFPO1lBRXJGLElBQUksT0FBTyxDQUFDLFFBQVEsRUFDcEI7Z0JBQ0MsSUFBSSxJQUFJLEdBQUcsT0FBTyxDQUFDLElBQUksR0FBRyxRQUFRLENBQUM7Z0JBRW5DLElBQUksT0FBTyxDQUFDLFFBQVEsSUFBSSxVQUFVLEVBQ2xDO29CQUNDLE9BQU8sR0FBRzt5QkFDUixNQUFNLENBQUMsTUFBTSxDQUFDO3lCQUNkLElBQUksQ0FBQyxJQUFJLEVBQUUsOEJBQVUsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUMxRDtpQkFDRjtxQkFFRDtvQkFDQyxPQUFPLEdBQUc7eUJBQ1IsTUFBTSxDQUFDLE1BQU0sQ0FBQzt5QkFDZCxJQUFJLENBQUMsSUFBSSxFQUFFLDhCQUFVLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FDMUQ7aUJBQ0Y7YUFDRDtZQUVELE9BQU8sS0FBSyxDQUFDO1FBQ2QsQ0FBQyxFQUFFLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztJQUNuQixDQUFDO0lBMUJlLGtCQUFVLGFBMEJ6QixDQUFBO0lBRUQsU0FBZ0IsVUFBVSxDQUFDLEdBQUcsRUFBRSxJQUFlLEVBQUUsT0FBTztRQUV2RCxPQUFPLGVBQVEsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxRQUFRLEVBQUUsVUFBVSxPQUFPO1lBRXBFLE9BQU8sVUFBVSxDQUFDLEdBQUcsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQ2hELENBQUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQztJQU5lLGtCQUFVLGFBTXpCLENBQUE7QUFDRixDQUFDLEVBOVJnQixPQUFPLEdBQVAsZUFBTyxLQUFQLGVBQU8sUUE4UnZCO0FBRUQsYUFBYTtBQUNBLFFBQUEsT0FBTyxHQUFHLE9BQW1CLENBQUM7QUFDM0Msa0JBQWUsZUFBbUIsQ0FBQztBQUVuQzs7Ozs7O0VBTUUiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgemlwTGliLCB7IEpTWmlwIH0gZnJvbSAnLi4vLi4vZXB1YnRwbC1saWIvemlwJztcbmltcG9ydCB7IEhhbmRsZWJhcnMsIGNvbXBpbGVUcGwgfSBmcm9tICcuLi8uLi9lcHVidHBsLWxpYi9oYW5kbGViYXItaGVscGVycyc7XG5pbXBvcnQgeyBmZXRjaEZpbGUgfSBmcm9tICcuLi8uLi9lcHVidHBsLWxpYi9hamF4JztcbmltcG9ydCB7IGNvbXBpbGVDc3MgfSBmcm9tICcuLi8uLi9lcHVidHBsLWxpYi9wb3N0Y3NzJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBJQnVpbGRlciwgSUJ1aWxkZXJDYWxsYmFjaywgSUVwdWJDb25maWcgfSBmcm9tICcuLi8uLi92YXInO1xuaW1wb3J0IHsgRXB1Yk1ha2VyIH0gZnJvbSAnLi4vLi4vaW5kZXgnO1xuaW1wb3J0IHsgc2hvcnRpZCwgQlByb21pc2UgfSBmcm9tICcuLi8uLi9saWIvdXRpbCc7XG5cbmltcG9ydCBlcHViVHBsTGliLCB7fSBmcm9tICcuLi8uLi9lcHVidHBsLWxpYic7XG5cbmV4cG9ydCBjb25zdCBFUFVCX1RFTVBMQVRFU19QQVRIID0gcGF0aC5qb2luKF9fZGlybmFtZSkgYXMgc3RyaW5nO1xuZXhwb3J0IGNvbnN0IEVQVUJfVEVNUExBVEVTX1RQTCA9IHBhdGguam9pbihFUFVCX1RFTVBMQVRFU19QQVRILCAndHBsJykgYXMgc3RyaW5nO1xuXG5kZWNsYXJlIG1vZHVsZSAnLi4vLi4vaW5kZXgnXG57XG5cdG5hbWVzcGFjZSBFcHViTWFrZXJcblx0e1xuXHRcdGludGVyZmFjZSBTZWN0aW9uXG5cdFx0e1xuXHRcdFx0bmVlZFBhZ2U6IGJvb2xlYW47XG5cdFx0XHRuYW1lOiBzdHJpbmc7XG5cblx0XHRcdHJhbms6IG51bWJlciB8IHN0cmluZztcblx0XHR9XG5cdH1cbn1cblxuZXhwb3J0IG5hbWVzcGFjZSBCdWlsZGVyXG57XG5cdGV4cG9ydCBsZXQgdGVtcGxhdGVzID0ge1xuXHRcdC8vbWltZXR5cGU6ICdtaW1ldHlwZScsXG5cdFx0Ly9jb250YWluZXI6ICdNRVRBLUlORi9jb250YWluZXIueG1sJyxcblx0XHRvcGY6ICdFUFVCL2NvbnRlbnQub3BmJyxcblx0XHRuY3g6ICdFUFVCL3RvYy5uY3gnLFxuXHRcdG5hdjogJ0VQVUIvbmF2LnhodG1sJyxcblx0XHRjc3M6ICdFUFVCL2Nzcy9tYWluLmNzcycsXG5cdFx0Y29udGVudDogJ0VQVUIvY29udGVudC54aHRtbCcsXG5cdFx0YXV0b1RvYzogJ0VQVUIvYXV0by10b2MueGh0bWwnLFxuXHRcdHNlY3Rpb25zTmF2VGVtcGxhdGU6ICdFUFVCL3NlY3Rpb25zLW5hdi10ZW1wbGF0ZS5odG1sJyxcblx0XHRzZWN0aW9uc05DWFRlbXBsYXRlOiAnRVBVQi9zZWN0aW9ucy1uY3gtdGVtcGxhdGUueG1sJyxcblx0XHRzZWN0aW9uc09QRk1hbmlmZXN0VGVtcGxhdGU6ICdFUFVCL3NlY3Rpb25zLW9wZi1tYW5pZmVzdC10ZW1wbGF0ZS54bWwnLFxuXHRcdHNlY3Rpb25zT1BGU3BpbmVUZW1wbGF0ZTogJ0VQVUIvc2VjdGlvbnMtb3BmLXNwaW5lLXRlbXBsYXRlLnhtbCcsXG5cblx0XHRjb3ZlclBhZ2U6ICdFUFVCL0NvdmVyUGFnZS54aHRtbCcsXG5cdFx0dGFibGVPZkNvbnRlbnRzOiAnRVBVQi9UYWJsZU9mQ29udGVudHMueGh0bWwnLFxuXG5cdFx0c2VjdGlvbnNJbmZvOiAnRVBVQi9zZWN0aW9ucy1pbmZvLmh0bWwnLFxuXHRcdHNlY3Rpb25zU2NyaXB0OiAnRVBVQi9zZWN0aW9ucy1zY3JpcHQuaHRtbCcsXG5cblx0XHRjb250ZW50czogJ0VQVUIvY29udGVudHMueGh0bWwnLFxuXHR9O1xuXG5cdGZvciAobGV0IGkgaW4gdGVtcGxhdGVzKVxuXHR7XG5cdFx0dGVtcGxhdGVzW2ldID0gYFxce1xce2ltcG9ydCBcXCcke3BhdGguam9pbihFUFVCX1RFTVBMQVRFU19UUEwsIHRlbXBsYXRlc1tpXSl9J1xcfVxcfWA7XG5cdH1cblxuXHRsZXQgcGxheU9yZGVyID0gMDtcblxuXHRleHBvcnQgbGV0IHN0YXRpY0ZpbGVzID0ge1xuXHRcdCdtaW1ldHlwZSc6ICdtaW1ldHlwZScsXG5cdFx0J01FVEEtSU5GL2NvbnRhaW5lci54bWwnOiAnTUVUQS1JTkYvY29udGFpbmVyLnhtbCcsXG5cdH07XG5cblx0Zm9yIChsZXQgaSBpbiBzdGF0aWNGaWxlcylcblx0e1xuXHRcdHN0YXRpY0ZpbGVzW2ldID0gcGF0aC5qb2luKEVQVUJfVEVNUExBVEVTX1RQTCwgc3RhdGljRmlsZXNbaV0pO1xuXHR9XG5cblx0ZXhwb3J0IGZ1bmN0aW9uIG1ha2UoZXB1YjogRXB1Yk1ha2VyLCBvcHRpb25zPyk6IEJQcm9taXNlPEpTWmlwPlxuXHR7XG5cdFx0Ly9sZXQgZXB1YkNvbmZpZyA9IGVwdWIuZXB1YkNvbmZpZztcblxuXHRcdG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHt9LCB7XG5cdFx0XHR0ZW1wbGF0ZXM6IHRlbXBsYXRlcyxcblx0XHR9LCBvcHRpb25zKTtcblxuXHRcdC8vY29uc29sZS5kZWJ1ZygnW2J1aWxkaW5nIGVwdWJdJywgZXB1Yi5lcHViQ29uZmlnKTtcblx0XHQvL2NvbnNvbGUuZGVidWcoJ1tidWlsZGluZyBlcHViXScsIG9wdGlvbnMpO1xuXHRcdGxldCB6aXAgPSBuZXcgSlNaaXAoKTtcblxuXHRcdC8vYXdhaXQgYWRkQWRpdGlvbmFsSW5mbyh6aXAsIGVwdWIsIG9wdGlvbnMpO1xuXG5cdFx0SGFuZGxlYmFycy5yZWdpc3RlclBhcnRpYWwoJ3NlY3Rpb25zSW5mbycsIG9wdGlvbnMudGVtcGxhdGVzLnNlY3Rpb25zSW5mbyk7XG5cdFx0SGFuZGxlYmFycy5yZWdpc3RlclBhcnRpYWwoJ3NlY3Rpb25zU2NyaXB0Jywgb3B0aW9ucy50ZW1wbGF0ZXMuc2VjdGlvbnNTY3JpcHQpO1xuXG5cdFx0cmV0dXJuIEJQcm9taXNlXG5cdFx0XHQubWFwU2VyaWVzKFtcblx0XHRcdFx0YWRkU3RhdGljRmlsZXMsXG5cblx0XHRcdFx0YWRkQWRpdGlvbmFsSW5mbyxcblxuXHRcdFx0XHQvL3ppcExpYi5hZGRNaW1ldHlwZSxcblx0XHRcdFx0Ly96aXBMaWIuYWRkQ29udGFpbmVySW5mbyxcblx0XHRcdFx0YWRkQ292ZXIsXG5cblx0XHRcdFx0emlwTGliLmFkZEZpbGVzLFxuXG5cdFx0XHRcdGFkZFN0eWxlc2hlZXRzLFxuXHRcdFx0XHRhZGRNYW5pZmVzdE9wZixcblx0XHRcdFx0YWRkRXB1YjJOYXYsXG5cdFx0XHRcdGFkZEVwdWIzTmF2LFxuXHRcdFx0XHRhZGRDb250ZW50LFxuXG5cdFx0XHRcdHRhYmxlT2ZDb250ZW50cyxcblx0XHRcdF0sIGFzeW5jIGZ1bmN0aW9uIChmbiwgaW5kZXgpXG5cdFx0XHR7XG5cdFx0XHRcdGlmIChmbiA9PT0gemlwTGliLmFkZEZpbGVzKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0cmV0dXJuIChmbiBhcyB0eXBlb2YgemlwTGliLmFkZEZpbGVzKSh6aXAsIGVwdWIsIG9wdGlvbnMpXG5cdFx0XHRcdFx0XHQudGhlbihmdW5jdGlvbiAobHMpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdHJldHVybiBscztcblx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0XHQ7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRyZXR1cm4gZm4oemlwLCBlcHViLCBvcHRpb25zKTtcblx0XHRcdH0pXG5cdFx0XHQudGFwKGZ1bmN0aW9uICgpXG5cdFx0XHR7XG5cdFx0XHRcdC8vY29uc29sZS5sb2coZXB1Yi5lcHViQ29uZmlnLmNvdmVyKTtcblx0XHRcdH0pXG5cdFx0XHQudGhlbihmdW5jdGlvbiAoKVxuXHRcdFx0e1xuXHRcdFx0XHRyZXR1cm4gemlwO1xuXHRcdFx0fSlcblx0XHRcdC8vLmNhdGNoKGVyciA9PiBjb25zb2xlLmxvZyhlcnIpKVxuXHRcdFx0O1xuXHR9XG5cblx0ZXhwb3J0IGZ1bmN0aW9uIGFkZFN0YXRpY0ZpbGVzKHppcCwgZXB1YjogRXB1Yk1ha2VyLCBvcHRpb25zKVxuXHR7XG5cdFx0bGV0IGxzID0gT2JqZWN0LmtleXMoc3RhdGljRmlsZXMpLnJlZHVjZShmdW5jdGlvbiAoYSwga2V5KVxuXHRcdHtcblx0XHRcdGxldCBiID0ge1xuXHRcdFx0XHRuYW1lOiBrZXksXG5cdFx0XHRcdGV4dDogJycsXG5cdFx0XHRcdGZpbGU6IHN0YXRpY0ZpbGVzW2tleV0sXG5cdFx0XHR9O1xuXG5cdFx0XHRhLnB1c2goYik7XG5cblx0XHRcdHJldHVybiBhO1xuXHRcdH0sIFtdKTtcblxuXHRcdHJldHVybiB6aXBMaWIuYWRkU3RhdGljRmlsZXMoemlwLCBscyk7XG5cdH1cblxuXHRleHBvcnQgYXN5bmMgZnVuY3Rpb24gdGFibGVPZkNvbnRlbnRzKHppcCwgZXB1YjogRXB1Yk1ha2VyLCBvcHRpb25zKVxuXHR7XG5cdFx0emlwXG5cdFx0XHQuZm9sZGVyKCdFUFVCJylcblx0XHRcdC5maWxlKCdUYWJsZU9mQ29udGVudHMueGh0bWwnLCBjb21waWxlVHBsKG9wdGlvbnMudGVtcGxhdGVzLnRhYmxlT2ZDb250ZW50cywgZXB1Yi5lcHViQ29uZmlnKSlcblx0XHQ7XG5cblx0XHR6aXBcblx0XHRcdC5mb2xkZXIoJ0VQVUInKVxuXHRcdFx0LmZpbGUoJ2NvbnRlbnRzLnhodG1sJywgY29tcGlsZVRwbChvcHRpb25zLnRlbXBsYXRlcy5jb250ZW50cywgZXB1Yi5lcHViQ29uZmlnKSlcblx0XHQ7XG5cdH1cblxuXHRleHBvcnQgYXN5bmMgZnVuY3Rpb24gYWRkQ292ZXIoemlwLCBlcHViOiBFcHViTWFrZXIsIG9wdGlvbnMpXG5cdHtcblx0XHRsZXQgYm9vbCA9IGF3YWl0IHppcExpYi5hZGRDb3Zlcih6aXAsIGVwdWIsIG9wdGlvbnMpO1xuXG5cdFx0aWYgKGJvb2wpXG5cdFx0e1xuXHRcdFx0emlwXG5cdFx0XHRcdC5mb2xkZXIoJ0VQVUInKVxuXHRcdFx0XHQuZmlsZSgnQ292ZXJQYWdlLnhodG1sJywgY29tcGlsZVRwbChvcHRpb25zLnRlbXBsYXRlcy5jb3ZlclBhZ2UsIGVwdWIuZXB1YkNvbmZpZykpXG5cdFx0XHQ7XG5cdFx0fVxuXHRcdGVsc2Vcblx0XHR7XG5cdFx0XHRlcHViLmVwdWJDb25maWcuY292ZXIgPSBudWxsO1xuXHRcdH1cblx0fVxuXG5cdGV4cG9ydCBmdW5jdGlvbiBhZGRJbmZvU2VjdGlvbihzZWN0aW9uLCB0aXRsZVByZWZpeD8sIG5hbWVQcmVmaXg/KVxuXHR7XG5cdFx0bGV0IGMgPSAnXyc7XG5cblx0XHRpZiAoIXNlY3Rpb24uY29udGVudClcblx0XHR7XG5cdFx0XHRzZWN0aW9uLmNvbnRlbnQgPSB7fTtcblx0XHR9XG5cdFx0aWYgKHRpdGxlUHJlZml4KVxuXHRcdHtcblx0XHRcdHRpdGxlUHJlZml4ID0gc2VjdGlvbi5jb250ZW50LmZ1bGxUaXRsZSA9IHRpdGxlUHJlZml4ICsgJyAtICcgKyBzZWN0aW9uLmNvbnRlbnQudGl0bGU7XG5cdFx0XHRuYW1lUHJlZml4ID0gc2VjdGlvbi5uYW1lID0gbmFtZVByZWZpeCArIGMgKyBzZWN0aW9uLnJhbms7XG5cdFx0fVxuXHRcdGVsc2Vcblx0XHR7XG5cdFx0XHR0aXRsZVByZWZpeCA9IHNlY3Rpb24uY29udGVudC5mdWxsVGl0bGUgPSBzZWN0aW9uLmNvbnRlbnQudGl0bGU7XG5cdFx0XHRuYW1lUHJlZml4ID0gc2VjdGlvbi5uYW1lID0gc2VjdGlvbi5yYW5rO1xuXHRcdH1cblx0XHRpZiAoc2VjdGlvbi5jb250ZW50LmNvbnRlbnQgfHwgc2VjdGlvbi5jb250ZW50LnJlbmRlclRpdGxlIHx8IHNlY3Rpb24uZXB1YlR5cGUgPT0gJ2F1dG8tdG9jJylcblx0XHR7XG5cdFx0XHRzZWN0aW9uLm5lZWRQYWdlID0gdHJ1ZTtcblx0XHR9XG5cblx0XHRzZWN0aW9uLnBsYXlPcmRlciA9IHBsYXlPcmRlcisrO1xuXG5cdFx0aWYgKCFzZWN0aW9uLmlkKVxuXHRcdHtcblx0XHRcdHNlY3Rpb24uaWQgPSAoc2VjdGlvbi5lcHViVHlwZSB8fCAnJykudG9TdHJpbmcoKS5yZXBsYWNlKCcvXFxXL2cnLCAnJykgKyBzaG9ydGlkKCk7XG5cdFx0fVxuXG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBzZWN0aW9uLnN1YlNlY3Rpb25zLmxlbmd0aDsgaSsrKVxuXHRcdHtcblx0XHRcdHNlY3Rpb24uc3ViU2VjdGlvbnNbaV0ucmFuayA9IGkudG9TdHJpbmcoKS5wYWRTdGFydCgzLCAnMCcpO1xuXHRcdFx0YWRkSW5mb1NlY3Rpb24oc2VjdGlvbi5zdWJTZWN0aW9uc1tpXSwgdGl0bGVQcmVmaXgsIG5hbWVQcmVmaXgpO1xuXHRcdH1cblx0fVxuXG5cdGV4cG9ydCBmdW5jdGlvbiBhZGRBZGl0aW9uYWxJbmZvKHppcCwgZXB1YjogRXB1Yk1ha2VyLCBvcHRpb25zKVxuXHR7XG5cdFx0Ly9EZWZhdWx0IG9wdGlvbnNcblx0XHQvLyBAdHMtaWdub3JlXG5cdFx0ZXB1Yi5lcHViQ29uZmlnLm9wdGlvbnMudG9jTmFtZSA9IGVwdWIuZXB1YkNvbmZpZy5vcHRpb25zLnRvY05hbWUgfHwgJ01lbnUnO1xuXHRcdC8vR2VuZXJhdGUgbmFtZSBhbmQgZnVsbCB0aXRsZSBmb3IgZWFjaCBzZWN0aW9uL3N1YnNlY3Rpb25cblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IGVwdWIuZXB1YkNvbmZpZy5zZWN0aW9ucy5sZW5ndGg7IGkrKylcblx0XHR7XG5cdFx0XHRlcHViLmVwdWJDb25maWcuc2VjdGlvbnNbaV0ucmFuayA9IGkudG9TdHJpbmcoKS5wYWRTdGFydCgzLCAnMCcpO1xuXHRcdFx0YWRkSW5mb1NlY3Rpb24oZXB1Yi5lcHViQ29uZmlnLnNlY3Rpb25zW2ldKTtcblx0XHR9XG5cdH1cblxuXHRleHBvcnQgZnVuY3Rpb24gYWRkTWFuaWZlc3RPcGYoemlwLCBlcHViOiBFcHViTWFrZXIsIG9wdGlvbnMpXG5cdHtcblx0XHRIYW5kbGViYXJzLnJlZ2lzdGVyUGFydGlhbCgnc2VjdGlvbnNPUEZNYW5pZmVzdFRlbXBsYXRlJywgb3B0aW9ucy50ZW1wbGF0ZXMuc2VjdGlvbnNPUEZNYW5pZmVzdFRlbXBsYXRlKTtcblx0XHRIYW5kbGViYXJzLnJlZ2lzdGVyUGFydGlhbCgnc2VjdGlvbnNPUEZTcGluZVRlbXBsYXRlJywgb3B0aW9ucy50ZW1wbGF0ZXMuc2VjdGlvbnNPUEZTcGluZVRlbXBsYXRlKTtcblxuXHRcdHppcC5mb2xkZXIoJ0VQVUInKS5maWxlKCdjb250ZW50Lm9wZicsIGNvbXBpbGVUcGwob3B0aW9ucy50ZW1wbGF0ZXMub3BmLCBlcHViLmVwdWJDb25maWcpKTtcblx0fVxuXG5cdGV4cG9ydCBmdW5jdGlvbiBhZGRFcHViMk5hdih6aXAsIGVwdWI6IEVwdWJNYWtlciwgb3B0aW9ucylcblx0e1xuXHRcdEhhbmRsZWJhcnMucmVnaXN0ZXJQYXJ0aWFsKCdzZWN0aW9uc05DWFRlbXBsYXRlJywgb3B0aW9ucy50ZW1wbGF0ZXMuc2VjdGlvbnNOQ1hUZW1wbGF0ZSk7XG5cdFx0emlwLmZvbGRlcignRVBVQicpLmZpbGUoJ3RvYy5uY3gnLCBjb21waWxlVHBsKG9wdGlvbnMudGVtcGxhdGVzLm5jeCwgZXB1Yi5lcHViQ29uZmlnKSk7XG5cdH1cblxuXHRleHBvcnQgZnVuY3Rpb24gYWRkRXB1YjNOYXYoemlwLCBlcHViOiBFcHViTWFrZXIsIG9wdGlvbnMpXG5cdHtcblx0XHRIYW5kbGViYXJzLnJlZ2lzdGVyUGFydGlhbCgnc2VjdGlvbnNOYXZUZW1wbGF0ZScsIG9wdGlvbnMudGVtcGxhdGVzLnNlY3Rpb25zTmF2VGVtcGxhdGUpO1xuXHRcdHppcC5mb2xkZXIoJ0VQVUInKS5maWxlKCduYXYueGh0bWwnLCBjb21waWxlVHBsKG9wdGlvbnMudGVtcGxhdGVzLm5hdiwgZXB1Yi5lcHViQ29uZmlnKSk7XG5cdH1cblxuXHRleHBvcnQgYXN5bmMgZnVuY3Rpb24gYWRkU3R5bGVzaGVldHMoemlwLCBlcHViOiBFcHViTWFrZXIsIG9wdGlvbnMpXG5cdHtcblx0XHRpZiAoZXB1Yi5lcHViQ29uZmlnLnN0eWxlc2hlZXQudXJsIHx8IGVwdWIuZXB1YkNvbmZpZy5zdHlsZXNoZWV0LmZpbGUpXG5cdFx0e1xuXHRcdFx0bGV0IGZpbGUgPSBhd2FpdCBmZXRjaEZpbGUoZXB1Yi5lcHViQ29uZmlnLnN0eWxlc2hlZXQpO1xuXG5cdFx0XHRlcHViLmVwdWJDb25maWcuc3R5bGVzaGVldC5zdHlsZXMgKz0gXCJcXG5cIiArIGZpbGUuZGF0YS50b1N0cmluZygpO1xuXHRcdH1cblxuXHRcdHJldHVybiBjb21waWxlQW5kQWRkQ3NzKCk7XG5cblx0XHRhc3luYyBmdW5jdGlvbiBjb21waWxlQW5kQWRkQ3NzKClcblx0XHR7XG5cdFx0XHRsZXQgc3R5bGVzID0ge1xuXHRcdFx0XHRvcmlnaW5hbDogZXB1Yi5lcHViQ29uZmlnLnN0eWxlc2hlZXQucmVwbGFjZU9yaWdpbmFsID8gJycgOiBvcHRpb25zLnRlbXBsYXRlcy5jc3MsXG5cdFx0XHRcdGN1c3RvbTogZXB1Yi5lcHViQ29uZmlnLnN0eWxlc2hlZXQuc3R5bGVzIHx8ICcnLFxuXHRcdFx0fTtcblxuXHRcdFx0bGV0IGNzcyA9IGF3YWl0IGNvbXBpbGVUcGwoYCR7c3R5bGVzLm9yaWdpbmFsfVxcbiR7c3R5bGVzLmN1c3RvbX1gLCBzdHlsZXMsIHRydWUpO1xuXG5cdFx0XHRjc3MgPSBhd2FpdCBjb21waWxlQ3NzKGNzcyk7XG5cblx0XHRcdHJldHVybiB6aXAuZm9sZGVyKCdFUFVCJylcblx0XHRcdFx0LmZvbGRlcignY3NzJylcblx0XHRcdFx0LmZpbGUoJ21haW4uY3NzJywgY3NzKVxuXHRcdFx0XHQ7XG5cdFx0fVxuXHR9XG5cblx0ZXhwb3J0IGZ1bmN0aW9uIGFkZFNlY3Rpb24oemlwOiBKU1ppcCwgc2VjdGlvbjogRXB1Yk1ha2VyLlNlY3Rpb24sIGVwdWI6IEVwdWJNYWtlciwgb3B0aW9ucylcblx0e1xuXHRcdHJldHVybiB6aXBMaWIuYWRkU3ViU2VjdGlvbnMoemlwLCBzZWN0aW9uLCBmdW5jdGlvbiAoemlwLCBzZWN0aW9uLCBlcHViQ29uZmlnLCBvcHRpb25zKVxuXHRcdHtcblx0XHRcdGlmIChzZWN0aW9uLm5lZWRQYWdlKVxuXHRcdFx0e1xuXHRcdFx0XHRsZXQgbmFtZSA9IHNlY3Rpb24ubmFtZSArICcueGh0bWwnO1xuXG5cdFx0XHRcdGlmIChzZWN0aW9uLmVwdWJUeXBlID09ICdhdXRvLXRvYycpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRyZXR1cm4gemlwXG5cdFx0XHRcdFx0XHQuZm9sZGVyKCdFUFVCJylcblx0XHRcdFx0XHRcdC5maWxlKG5hbWUsIGNvbXBpbGVUcGwob3B0aW9ucy50ZW1wbGF0ZXMuYXV0b1RvYywgc2VjdGlvbikpXG5cdFx0XHRcdFx0XHQ7XG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0cmV0dXJuIHppcFxuXHRcdFx0XHRcdFx0LmZvbGRlcignRVBVQicpXG5cdFx0XHRcdFx0XHQuZmlsZShuYW1lLCBjb21waWxlVHBsKG9wdGlvbnMudGVtcGxhdGVzLmNvbnRlbnQsIHNlY3Rpb24pKVxuXHRcdFx0XHRcdFx0O1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9LCBlcHViLCBvcHRpb25zKTtcblx0fVxuXG5cdGV4cG9ydCBmdW5jdGlvbiBhZGRDb250ZW50KHppcCwgZXB1YjogRXB1Yk1ha2VyLCBvcHRpb25zKVxuXHR7XG5cdFx0cmV0dXJuIEJQcm9taXNlLm1hcFNlcmllcyhlcHViLmVwdWJDb25maWcuc2VjdGlvbnMsIGZ1bmN0aW9uIChzZWN0aW9uKVxuXHRcdHtcblx0XHRcdHJldHVybiBhZGRTZWN0aW9uKHppcCwgc2VjdGlvbiwgZXB1Yiwgb3B0aW9ucyk7XG5cdFx0fSk7XG5cdH1cbn1cblxuLy8gQHRzLWlnbm9yZVxuZXhwb3J0IGNvbnN0IGJ1aWxkZXIgPSBCdWlsZGVyIGFzIElCdWlsZGVyO1xuZXhwb3J0IGRlZmF1bHQgYnVpbGRlciBhcyBJQnVpbGRlcjtcblxuLypcbmlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJylcbntcblx0Ly8gQHRzLWlnbm9yZVxuXHR3aW5kb3cuZXB1Yk1ha2VyID0gYnVpbGRlcjtcbn1cbiovXG4iXX0=