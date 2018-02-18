"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zip_1 = require("../../epubtpl-lib/zip");
const handlebar_helpers_1 = require("../../epubtpl-lib/handlebar-helpers");
const ajax_1 = require("../../epubtpl-lib/ajax");
const postcss_1 = require("../../epubtpl-lib/postcss");
const path = require("path");
const Promise = require("bluebird");
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
        nav: 'EPUB/nav.html',
        css: 'EPUB/css/main.css',
        content: 'EPUB/content.html',
        autoToc: 'EPUB/auto-toc.html',
        sectionsNavTemplate: 'EPUB/sections-nav-template.html',
        sectionsNCXTemplate: 'EPUB/sections-ncx-template.xml',
        sectionsOPFManifestTemplate: 'EPUB/sections-opf-manifest-template.xml',
        sectionsOPFSpineTemplate: 'EPUB/sections-opf-spine-template.xml',
        coverPage: 'EPUB/CoverPage.html',
        tableOfContents: 'EPUB/TableOfContents.html',
        contents: 'EPUB/contents.html',
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
    async function make(epub, options) {
        //let epubConfig = epub.epubConfig;
        options = Object.assign({}, {
            templates: Builder.templates,
        }, options);
        //console.debug('[building epub]', epub.epubConfig);
        //console.debug('[building epub]', options);
        let zip = new zip_1.JSZip();
        //await addAditionalInfo(zip, epub, options);
        return Promise
            .mapSeries([
            addAditionalInfo,
            //zipLib.addMimetype,
            //zipLib.addContainerInfo,
            addCover,
            addStaticFiles,
            zip_1.default.addFiles,
            addStylesheets,
            addManifestOpf,
            addEpub2Nav,
            addEpub3Nav,
            addContent,
            tableOfContents,
        ], function (fn, index) {
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
    async function addStaticFiles(zip, epub, options) {
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
            .file('TableOfContents.html', handlebar_helpers_1.compileTpl(options.templates.tableOfContents, epub.epubConfig));
        zip
            .folder('EPUB')
            .file('contents.html', handlebar_helpers_1.compileTpl(options.templates.contents, epub.epubConfig));
    }
    Builder.tableOfContents = tableOfContents;
    async function addCover(zip, epub, options) {
        let bool = await zip_1.default.addCover(zip, epub, options);
        if (bool) {
            zip
                .folder('EPUB')
                .file('CoverPage.html', handlebar_helpers_1.compileTpl(options.templates.coverPage, epub.epubConfig));
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
        zip.folder('EPUB').file('nav.html', handlebar_helpers_1.compileTpl(options.templates.nav, epub.epubConfig));
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
        return zip_1.default.addSubSections(zip, section, function (zip, section, epub, options) {
            if (section.needPage) {
                let name = section.name + '.html';
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
        return Promise.mapSeries(epub.epubConfig.sections, function (section) {
            return addSection(zip, section, epub, options);
        });
    }
    Builder.addContent = addContent;
})(Builder = exports.Builder || (exports.Builder = {}));
exports.builder = Builder;
exports.default = exports.builder;
/*
if (typeof window !== 'undefined')
{
    // @ts-ignore
    window.epubMaker = builder;
}
*/
