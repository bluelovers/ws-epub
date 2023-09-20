"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EpubMaker = exports.slugifyWithFallback = exports.slugify = exports.hashSum = exports.shortid = exports.EnumSectionCollectType = exports.EnumEpubTypeName = exports.EnumEpubType = void 0;
const tslib_1 = require("tslib");
const slugify_1 = tslib_1.__importDefault(require("slugify"));
const template_1 = require("./template");
const fs_iconv_1 = require("fs-iconv");
const zip_1 = require("./epubtpl-lib/zip");
const uuid_1 = require("./lib/uuid");
const config_1 = require("./config");
const util_1 = require("./lib/util");
Object.defineProperty(exports, "hashSum", { enumerable: true, get: function () { return util_1.hashSum; } });
Object.defineProperty(exports, "shortid", { enumerable: true, get: function () { return util_1.shortid; } });
const epub_types_1 = require("./epub-types");
Object.defineProperty(exports, "EnumEpubType", { enumerable: true, get: function () { return epub_types_1.EnumEpubType; } });
Object.defineProperty(exports, "EnumEpubTypeName", { enumerable: true, get: function () { return epub_types_1.EnumEpubTypeName; } });
const var_1 = require("./var");
Object.defineProperty(exports, "EnumSectionCollectType", { enumerable: true, get: function () { return var_1.EnumSectionCollectType; } });
const libEpubtypes = tslib_1.__importStar(require("./epub-types"));
const jszip_fixed_date_1 = tslib_1.__importDefault(require("jszip-fixed-date"));
const const_1 = require("@node-novel/epub-util/lib/const");
function slugify(input, ...argv) {
    let fn = EpubMaker.libSlugify ||
        // @ts-ignore
        slugify_1.default;
    return fn(input || '', ...argv).trim();
}
exports.slugify = slugify;
function slugifyWithFallback(input, ...argv) {
    let ret = slugify(input, ...argv);
    return ret || (0, util_1.hashSum)(input);
}
exports.slugifyWithFallback = slugifyWithFallback;
class EpubMaker {
    constructor(options = {}, config) {
        this.epubConfig = new config_1.EpubConfig(config, options);
    }
    static create(options, ...argv) {
        return new this(options, ...argv);
    }
    withUuid(uuid) {
        this.epubConfig.uuid = uuid;
        return this;
    }
    withTemplate(templateName) {
        this.epubConfig.templateName = templateName;
        return this;
    }
    slugify(input, ...argv) {
        let fn = this.epubConfig.options.libSlugify || slugify;
        return fn(input || '', ...argv).trim();
    }
    slugifyWithFallback(input, ...argv) {
        let ret = this.slugify(input, ...argv);
        return ret || (0, util_1.hashSum)(input);
    }
    withTitle(title, title_short) {
        this.epubConfig.title = title;
        // @ts-ignore
        this.epubConfig.slug = this.slugifyWithFallback(title || title_short);
        if (title_short) {
            this.epubConfig.title_short = title_short;
        }
        return this;
    }
    addTitles(titles) {
        this.epubConfig.titles = titles || [];
        return this;
    }
    withLanguage(lang) {
        this.epubConfig.lang = lang;
        return this;
    }
    get lang() {
        return this.epubConfig.lang;
    }
    withAuthor(fullName, url) {
        this.epubConfig.author = fullName;
        this.epubConfig.authorUrl = url;
        return this;
    }
    addAuthor(fullName, url) {
        let self = this;
        if (Array.isArray(fullName)) {
            fullName.forEach(name => {
                name && self.epubConfig.addAuthor(name);
            });
        }
        else if (typeof fullName == 'object') {
            for (let name in fullName) {
                name && self.epubConfig.addAuthor(name, fullName[name]);
            }
        }
        else if (fullName) {
            self.epubConfig.addAuthor(fullName, url);
        }
        return this;
    }
    withPublisher(publisher) {
        this.epubConfig.publisher = publisher;
        return this;
    }
    withCollection(data) {
        this.epubConfig.collection = Object.assign(this.epubConfig.collection || {}, data);
        //console.log(this.epubConfig.collection);
        return this;
    }
    withSeries(name, position = 1) {
        if (name) {
            this.withCollection({
                name,
                position,
                type: 'series',
            });
        }
    }
    withModificationDate(modificationDate, ...argv) {
        let data = (0, util_1.moment)(modificationDate, ...argv).local();
        this.epubConfig.modification = data;
        this.epubConfig.modificationDate = data.format(EpubMaker.dateFormat);
        this.epubConfig.modificationDateYMD = data.format('YYYY-MM-DD');
        return this;
    }
    withRights(rightsConfig) {
        this.epubConfig.rights = rightsConfig;
        return this;
    }
    withCover(coverUrl, rightsConfig) {
        let cover = (0, zip_1.parseFileSetting)(coverUrl, this.epubConfig);
        if (cover && rightsConfig) {
            cover.rights = rightsConfig;
        }
        if (!cover) {
            throw new ReferenceError();
        }
        this.epubConfig.cover = Object.assign(this.epubConfig.cover || {}, cover);
        //this.epubConfig.coverUrl = coverUrl;
        //this.epubConfig.coverRights = rightsConfig;
        return this;
    }
    withAttributionUrl(attributionUrl) {
        this.epubConfig.attributionUrl = attributionUrl;
        return this;
    }
    withStylesheetUrl(stylesheetUrl, replaceOriginal) {
        let data = (0, zip_1.parseFileSetting)(stylesheetUrl, this.epubConfig);
        this.epubConfig.stylesheet = Object.assign(this.epubConfig.stylesheet, data, {
            replaceOriginal: replaceOriginal,
        });
        return this;
    }
    /**
     * 用來檢查 Section 是否已經加入
     */
    hasSection(section) {
        return this.epubConfig.sections.includes(section);
    }
    withSection(section) {
        section.parentEpubMaker = this;
        this.epubConfig.sections.push(section);
        Array.prototype.push.apply(this.epubConfig.toc, section.collectToc());
        Array.prototype.push.apply(this.epubConfig.landmarks, section.collectLandmarks());
        return this;
    }
    withAdditionalFile(fileUrl, folder, filename) {
        let _file = (0, zip_1.parseFileSetting)(fileUrl, this.epubConfig);
        _file = Object.assign({}, _file, {
            folder: folder,
            name: filename
        });
        this.epubConfig.additionalFiles.push(_file);
        return this;
    }
    withOption(key, value) {
        this.epubConfig.options[key] = value;
        return this;
    }
    withInfoPreface(str) {
        if (str) {
            this.epubConfig.infoPreface = str.toString();
        }
        return this;
    }
    addIdentifier(type, id) {
        this.epubConfig.addIdentifier(type, id);
        return this;
    }
    addLinks(links, rel) {
        const self = this;
        links = Array.isArray(links) ? links.slice() : [links];
        links.forEach(function (url) {
            if (url) {
                self.epubConfig.addLink(url, rel);
            }
        });
        return this;
    }
    addTag(tag) {
        tag = (Array.isArray(tag) ? tag : [tag]).reduce(function (a, b) {
            if (Array.isArray(b)) {
                return a.concat(b);
            }
            else {
                a.push(b);
            }
            return a;
        }, []);
        this.epubConfig.tags = (this.epubConfig.tags || []).concat(tag);
        return this;
    }
    setPublicationDate(new_data) {
        let data = (0, util_1.moment)(new_data);
        this.epubConfig.publication = data;
        this.epubConfig.publicationDate = data.format(EpubMaker.dateFormat);
        this.epubConfig.publicationDateYMD = data.format('YYYY-MM-DD');
        return this;
    }
    setVertical(vertical) {
        this.epubConfig.vertical = vertical;
        return this;
    }
    getFilename(useTitle, noExt) {
        let ext = this.epubConfig.options.ext || EpubMaker.defaultExt;
        let filename;
        if (this.epubConfig.filename) {
            filename = this.epubConfig.filename;
        }
        else if (useTitle && this.epubConfig.title_short) {
            filename = this.epubConfig.title_short;
        }
        else if (useTitle && this.epubConfig.title) {
            filename = this.epubConfig.title;
        }
        else if (!this.epubConfig.slug) {
            // @ts-ignore
            this.epubConfig.slug = (0, util_1.shortid)();
            filename = this.epubConfig.slug;
        }
        else {
            filename = this.epubConfig.slug;
        }
        return (0, fs_iconv_1.trimFilename)(filename) + (noExt ? '' : ext);
    }
    vaild() {
        let ret = [];
        if (!this.epubConfig.title || !this.epubConfig.slug) {
            ret.push('title, slug');
        }
        if (ret.length) {
            return ret;
        }
        return null;
    }
    withContextDate(epubContextDate) {
        this.epubConfig.epubContextDate = (0, util_1.moment)(epubContextDate).local();
        return this;
    }
    build(options) {
        let self = this;
        if (!this.epubConfig.publication) {
            this.setPublicationDate();
        }
        if (!this.epubConfig.uuid) {
            this.withUuid((0, uuid_1.createUUID)(this.epubConfig));
        }
        this.epubConfig.$auto();
        let chk = this.vaild();
        if (chk) {
            throw chk;
        }
        []
            .concat(this.epubConfig.sections, this.epubConfig.toc, this.epubConfig.landmarks)
            .forEach(function (section, index) {
            section._EpubMaker_ = self;
        });
        return template_1.templateManagers
            .exec(this.epubConfig.templateName, this, options)
            .tap((epubZip) => {
            if (this.epubConfig.epubContextDate) {
                let date = this.epubConfig.epubContextDate.toDate();
                return (0, jszip_fixed_date_1.default)(epubZip, date);
            }
        });
    }
    /**
     * for node.js
     *
     * @param options
     * @returns {Bluebird<T>}
     */
    makeEpub(options) {
        let self = this;
        // @ts-ignore
        return this.build(options).then(async function (epubZip) {
            let generateOptions = Object.assign((0, const_1.createJSZipGeneratorOptions)(), self.epubConfig.options.generateOptions, options);
            console.info('generating epub for: ' + self.epubConfig.title);
            return epubZip.generateAsync(generateOptions);
        });
    }
}
exports.EpubMaker = EpubMaker;
(function (EpubMaker) {
    EpubMaker.defaultExt = '.epub';
    EpubMaker.dateFormat = 'YYYY-MM-DDTHH:mm:ss.SSSZ';
    // epubtypes and descriptions, useful for vendors implementing a GUI
    // @ts-ignore
    EpubMaker.epubtypes = libEpubtypes;
    // @ts-ignore
    EpubMaker.libSlugify = slugify_1.default;
    /**
     * @epubType Optional. Allows you to add specific epub type content such as [epub:type="titlepage"]
     * @id Optional, but required if section should be included in toc and / or landmarks
     * @content Optional. Should not be empty if there will be no subsections added to this section. Format: { title, content, renderTitle }
     */
    class Section {
        constructor(epubType, id, content, includeInToc, includeInLandmarks, ...argv) {
            this.subSections = [];
            this.sectionConfig = {};
            this.epubType = epubType;
            this.id = id;
            this.includeInToc = includeInToc;
            this.includeInLandmarks = includeInLandmarks;
            this.subSections = [];
            /*
            this.content = content;
            if (content)
            {
                content.renderTitle = content.renderTitle !== false; // 'undefined' should default to true
            }
            */
            this.setContent(content, true);
        }
        /**
         *
         * @param {ISectionContent|string} content
         * @param {boolean} allow_null
         * @returns {this}
         */
        setContent(content, allow_null) {
            let o = {};
            if (typeof content == 'string') {
                o.content = content;
            }
            else if (content && (content.title || content.content || content.renderTitle || content.cover)) {
                o = content;
            }
            if (Object.keys(o).length) {
                if (this.content) {
                    this.content = Object.assign(this.content, o);
                }
                else {
                    this.content = o;
                }
                this.content.renderTitle = this.content.renderTitle !== false;
            }
            else if (content) {
                this.content = content;
            }
            else if (!allow_null) {
                throw new ReferenceError();
            }
            return this;
        }
        get epubTypeGroup() {
            return EpubMaker.epubtypes.getGroup(this.epubType);
        }
        get lang() {
            return this.sectionConfig.lang || (this._EpubMaker_ ? this._EpubMaker_.lang : null) || null;
        }
        get langMain() {
            return (this._EpubMaker_ ? this._EpubMaker_.lang : null) || null;
        }
        static create(epubType, id, content, includeInToc, includeInLandmarks, ...argv) {
            return new this(epubType, id, content, includeInToc, includeInLandmarks, ...argv);
        }
        /**
         * 用來檢查 Section 是否已經加入
         */
        hasSubSection(subsection) {
            return this.subSections.includes(subsection);
        }
        withSubSection(subsection) {
            subsection.parentSection = this;
            this.subSections.push(subsection);
            return this;
        }
        ;
        collectToc() {
            return this.collectSections(this, "includeInToc" /* EnumSectionCollectType.INCLUDE_IN_TOC */);
        }
        collectLandmarks() {
            return this.collectSections(this, "includeInLandmarks" /* EnumSectionCollectType.INCLUDE_IN_LANDMARKS */);
        }
        collectSections(section, prop) {
            let sections = section[prop] ? [section] : [];
            for (let i = 0; i < section.subSections.length; i++) {
                Array.prototype.push.apply(sections, this.collectSections(section.subSections[i], prop));
            }
            return sections;
        }
    }
    EpubMaker.Section = Section;
})(EpubMaker || (exports.EpubMaker = EpubMaker = {}));
exports.default = EpubMaker;
if (typeof window !== 'undefined') {
    // @ts-ignore
    window.EpubMaker = EpubMaker;
}
//# sourceMappingURL=index.js.map