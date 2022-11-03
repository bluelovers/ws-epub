"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.builder = exports.EPUB_TEMPLATES_TPL = exports.EPUB_TEMPLATES_PATH = void 0;
const tslib_1 = require("tslib");
const zip_1 = tslib_1.__importStar(require("../../epubtpl-lib/zip"));
const handlebar_helpers_1 = require("../../epubtpl-lib/handlebar-helpers");
const ajax_1 = require("../../epubtpl-lib/ajax");
const upath2_1 = tslib_1.__importDefault(require("upath2"));
const epubtpl_lib_1 = tslib_1.__importDefault(require("../../epubtpl-lib"));
// @ts-ignore
exports.EPUB_TEMPLATES_PATH = upath2_1.default.join(__dirname);
exports.EPUB_TEMPLATES_TPL = upath2_1.default.join(exports.EPUB_TEMPLATES_PATH, 'tpl');
let templates = {
    mimetype: 'mimetype',
    container: 'META-INF/container.xml',
    opf: 'EPUB/wasteland.opf',
    ncx: 'EPUB/wasteland.ncx',
    nav: 'EPUB/wasteland-nav.xhtml',
    css: 'EPUB/wasteland.css',
    content: 'EPUB/wasteland-content.xhtml',
    sectionsTemplate: 'EPUB/sections-template.xhtml',
};
for (let i in templates) {
    templates[i] = `\{\{import \'${upath2_1.default.join(exports.EPUB_TEMPLATES_TPL, templates[i])}'\}\}`;
}
let Builder = function () {
    this.make = function (epubConfig, options) {
        console.debug('building epub', epubConfig);
        let zip = new zip_1.JSZip();
        return Promise
            .all([
            zip_1.default.addMimetype(zip, epubConfig, options),
            zip_1.default.addContainerInfo(zip, epubConfig, options),
            addManifestOpf(zip, epubConfig, options),
            zip_1.default.addCover(zip, epubConfig, options),
            addEpub2Nav(zip, epubConfig, options),
            addEpub3Nav(zip, epubConfig, options),
            addStylesheets(zip, epubConfig, options),
            addContent(zip, epubConfig, options)
        ])
            .then(function () {
            return zip;
        });
    };
    function addManifestOpf(zip, epubConfig, options) {
        zip.folder('EPUB').file(epubConfig.slug + '.opf', (0, handlebar_helpers_1.compileTpl)(templates.opf, epubConfig));
    }
    function addEpub2Nav(zip, epubConfig, options) {
        zip.folder('EPUB').file(epubConfig.slug + '.ncx', (0, handlebar_helpers_1.compileTpl)(templates.ncx, epubConfig));
    }
    function addEpub3Nav(zip, epubConfig, options) {
        zip.folder('EPUB').file(epubConfig.slug + '-nav.xhtml', (0, handlebar_helpers_1.compileTpl)(templates.nav, epubConfig));
    }
    async function addStylesheets(zip, epubConfig, options) {
        if (epubConfig.stylesheet.url) {
            return (0, ajax_1.ajax)(epubConfig.stylesheet.url).then(function (result) {
                epubConfig.styles = result.data;
                return compileAndAddCss();
            });
        }
        return compileAndAddCss();
        async function compileAndAddCss() {
            let styles = {
                original: epubConfig.stylesheet.replaceOriginal ? '' : options.templates.css,
                custom: epubConfig.styles || '',
            };
            let css = await (0, handlebar_helpers_1.compileTpl)(`${styles.original}\n${styles.custom}`, styles, true);
            css = await epubtpl_lib_1.default.compileCss(css);
            await zip.folder('EPUB')
                .folder('css')
                .file('main.css', css);
            return true;
        }
    }
    function addContent(zip, epubConfig, options) {
        handlebar_helpers_1.Handlebars.registerPartial('sectionTemplate', templates.sectionsTemplate);
        zip.folder('EPUB').file(epubConfig.slug + '-content.xhtml', (0, handlebar_helpers_1.compileTpl)(templates.content, epubConfig));
    }
};
exports.builder = new Builder();
exports.default = exports.builder;
if (typeof window !== 'undefined') {
    // @ts-ignore
    window.epubMaker = exports.builder;
}
//# sourceMappingURL=index.js.map