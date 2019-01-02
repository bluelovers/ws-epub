"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _slugify = require("slugify");
const template_1 = require("./template");
const fs_iconv_1 = require("fs-iconv");
const zip_1 = require("./epubtpl-lib/zip");
const uuid_1 = require("./lib/uuid");
const config_1 = require("./config");
const util_1 = require("./lib/util");
exports.shortid = util_1.shortid;
exports.hashSum = util_1.hashSum;
function slugify(input, ...argv) {
    let fn = EpubMaker.libSlugify ||
        // @ts-ignore
        _slugify;
    return fn(input || '', ...argv).trim();
}
exports.slugify = slugify;
function slugifyWithFallback(input, ...argv) {
    let ret = slugify(input, ...argv);
    return ret || util_1.hashSum(input);
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
        return ret || util_1.hashSum(input);
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
        let data = util_1.moment(modificationDate, ...argv).local();
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
        let cover = zip_1.parseFileSetting(coverUrl, this.epubConfig);
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
        let data = zip_1.parseFileSetting(stylesheetUrl, this.epubConfig);
        this.epubConfig.stylesheet = Object.assign(this.epubConfig.stylesheet, data, {
            replaceOriginal: replaceOriginal,
        });
        return this;
    }
    withSection(section) {
        section.parentEpubMaker = this;
        this.epubConfig.sections.push(section);
        Array.prototype.push.apply(this.epubConfig.toc, section.collectToc());
        Array.prototype.push.apply(this.epubConfig.landmarks, section.collectLandmarks());
        return this;
    }
    withAdditionalFile(fileUrl, folder, filename) {
        let _file = zip_1.parseFileSetting(fileUrl, this.epubConfig);
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
        let data = util_1.moment(new_data);
        this.epubConfig.publication = data;
        this.epubConfig.publicationDate = data.format(EpubMaker.dateFormat);
        this.epubConfig.publicationDateYMD = data.format('YYYY-MM-DD');
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
            this.epubConfig.slug = util_1.shortid();
            filename = this.epubConfig.slug;
        }
        else {
            filename = this.epubConfig.slug;
        }
        return fs_iconv_1.trimFilename(filename) + (noExt ? '' : ext);
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
    build(options) {
        let self = this;
        if (!this.epubConfig.publication) {
            this.setPublicationDate();
        }
        if (!this.epubConfig.uuid) {
            this.withUuid(uuid_1.createUUID(this.epubConfig));
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
        return template_1.templateManagers.exec(this.epubConfig.templateName, this, options);
    }
    /**
     * for node.js
     *
     * @param options
     * @returns {Promise<T>}
     */
    makeEpub(options) {
        let self = this;
        // @ts-ignore
        return this.build(options).then(async function (epubZip) {
            let generateOptions = Object.assign({
                type: 'nodebuffer',
                mimeType: 'application/epub+zip',
                compression: 'DEFLATE',
                compressionOptions: {
                    level: 9
                },
            }, self.epubConfig.options.generateOptions, options);
            console.info('generating epub for: ' + self.epubConfig.title);
            let content = await epubZip.generateAsync(generateOptions);
            return content;
        });
    }
}
exports.EpubMaker = EpubMaker;
(function (EpubMaker) {
    EpubMaker.defaultExt = '.epub';
    EpubMaker.dateFormat = 'YYYY-MM-DDTHH:mm:ss.SSSZ';
    // epubtypes and descriptions, useful for vendors implementing a GUI
    // @ts-ignore
    EpubMaker.epubtypes = require('./epub-types.js');
    // @ts-ignore
    EpubMaker.libSlugify = _slugify;
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
            else if (content.title || content.content || content.renderTitle || content.cover) {
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
        withSubSection(subsection) {
            subsection.parentSection = this;
            this.subSections.push(subsection);
            return this;
        }
        ;
        collectToc() {
            return this.collectSections(this, 'includeInToc');
        }
        ;
        collectLandmarks() {
            return this.collectSections(this, 'includeInLandmarks');
        }
        ;
        collectSections(section, prop) {
            let sections = section[prop] ? [section] : [];
            for (let i = 0; i < section.subSections.length; i++) {
                Array.prototype.push.apply(sections, this.collectSections(section.subSections[i], prop));
            }
            return sections;
        }
    }
    EpubMaker.Section = Section;
})(EpubMaker = exports.EpubMaker || (exports.EpubMaker = {}));
exports.default = EpubMaker;
if (typeof window !== 'undefined') {
    // @ts-ignore
    window.EpubMaker = EpubMaker;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLG9DQUFvQztBQUNwQyx5Q0FBZ0U7QUFDaEUsdUNBQXdDO0FBRXhDLDJDQUFxRDtBQUNyRCxxQ0FBd0M7QUFDeEMscUNBQTRHO0FBRTVHLHFDQUFnRTtBQUV2RCxrQkFGQSxjQUFPLENBRUE7QUFBRSxrQkFGQSxjQUFPLENBRUE7QUFFekIsU0FBZ0IsT0FBTyxDQUFDLEtBQWEsRUFBRSxHQUFHLElBQUk7SUFFN0MsSUFBSSxFQUFFLEdBQUcsU0FBUyxDQUFDLFVBQVU7UUFDNUIsYUFBYTtRQUNiLFFBQW9CLENBQ3BCO0lBRUQsT0FBTyxFQUFFLENBQUMsS0FBSyxJQUFJLEVBQUUsRUFBRSxHQUFHLElBQUksQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO0FBQ3hDLENBQUM7QUFSRCwwQkFRQztBQUVELFNBQWdCLG1CQUFtQixDQUFDLEtBQWEsRUFBRSxHQUFHLElBQUk7SUFFekQsSUFBSSxHQUFHLEdBQUcsT0FBTyxDQUFDLEtBQUssRUFBRSxHQUFHLElBQUksQ0FBQyxDQUFDO0lBRWxDLE9BQU8sR0FBRyxJQUFJLGNBQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUM5QixDQUFDO0FBTEQsa0RBS0M7QUFFRCxNQUFhLFNBQVM7SUFJckIsWUFBWSxPQUFPLEdBQUcsRUFBRSxFQUFFLE1BQW9CO1FBRTdDLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxtQkFBVSxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztJQUNuRCxDQUFDO0lBRUQsTUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFRLEVBQUUsR0FBRyxJQUFJO1FBRTlCLE9BQU8sSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUM7SUFDbkMsQ0FBQztJQUVELFFBQVEsQ0FBQyxJQUFZO1FBRXBCLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxHQUFH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YixDQUFDO1FBQUEsQ0FBQztRQUVGLFVBQVU7WUFFVCxPQUFPLElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxFQUFFLGNBQWMsQ0FBQyxDQUFDO1FBQ25ELENBQUM7UUFBQSxDQUFDO1FBRUYsZ0JBQWdCO1lBRWYsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO1FBQ3pELENBQUM7UUFBQSxDQUFDO1FBRUYsZUFBZSxDQUFDLE9BQWdCLEVBQUUsSUFBWTtZQUU3QyxJQUFJLFFBQVEsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztZQUM5QyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQ25EO2dCQUNDLEtBQUssQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7YUFDekY7WUFDRCxPQUFPLFFBQVEsQ0FBQztRQUNqQixDQUFDO0tBQ0Q7SUEvSFksaUJBQU8sVUErSG5CLENBQUE7QUFDRixDQUFDLEVBakpnQixTQUFTLEdBQVQsaUJBQVMsS0FBVCxpQkFBUyxRQWlKekI7QUFFRCxrQkFBZSxTQUFTLENBQUM7QUFFekIsSUFBSSxPQUFPLE1BQU0sS0FBSyxXQUFXLEVBQ2pDO0lBQ0MsYUFBYTtJQUNiLE1BQU0sQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDO0NBQzdCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgX3NsdWdpZnkgZnJvbSAnc2x1Z2lmeSc7XHJcbmltcG9ydCB7IFRlbXBsYXRlTWFuYWdlcnMsIHRlbXBsYXRlTWFuYWdlcnMgfSBmcm9tICcuL3RlbXBsYXRlJztcclxuaW1wb3J0IHsgdHJpbUZpbGVuYW1lIH0gZnJvbSAnZnMtaWNvbnYnO1xyXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgeyBwYXJzZUZpbGVTZXR0aW5nIH0gZnJvbSAnLi9lcHVidHBsLWxpYi96aXAnO1xyXG5pbXBvcnQgeyBjcmVhdGVVVUlEIH0gZnJvbSAnLi9saWIvdXVpZCc7XHJcbmltcG9ydCB7IEVwdWJDb25maWcsIElFcHViQ29uZmlnLCBJQ292ZXIsIElSaWdodHNDb25maWcsIElGaWxlcywgSVN0eWxlc2hlZXQsIElDb2xsZWN0aW9uIH0gZnJvbSAnLi9jb25maWcnO1xyXG5pbXBvcnQgSlNaaXAgPSByZXF1aXJlKCdqc3ppcCcpO1xyXG5pbXBvcnQgeyBzaG9ydGlkLCBoYXNoU3VtLCBtb21lbnQsIEJQcm9taXNlIH0gZnJvbSAnLi9saWIvdXRpbCc7XHJcblxyXG5leHBvcnQgeyBzaG9ydGlkLCBoYXNoU3VtIH1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBzbHVnaWZ5KGlucHV0OiBzdHJpbmcsIC4uLmFyZ3YpOiBzdHJpbmdcclxue1xyXG5cdGxldCBmbiA9IEVwdWJNYWtlci5saWJTbHVnaWZ5IHx8XHJcblx0XHQvLyBAdHMtaWdub3JlXHJcblx0XHRfc2x1Z2lmeSBhcyBJU2x1Z2lmeVxyXG5cdDtcclxuXHJcblx0cmV0dXJuIGZuKGlucHV0IHx8ICcnLCAuLi5hcmd2KS50cmltKCk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBzbHVnaWZ5V2l0aEZhbGxiYWNrKGlucHV0OiBzdHJpbmcsIC4uLmFyZ3YpOiBzdHJpbmdcclxue1xyXG5cdGxldCByZXQgPSBzbHVnaWZ5KGlucHV0LCAuLi5hcmd2KTtcclxuXHJcblx0cmV0dXJuIHJldCB8fCBoYXNoU3VtKGlucHV0KTtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIEVwdWJNYWtlclxyXG57XHJcblx0cHVibGljIGVwdWJDb25maWc6IEVwdWJDb25maWc7XHJcblxyXG5cdGNvbnN0cnVjdG9yKG9wdGlvbnMgPSB7fSwgY29uZmlnPzogSUVwdWJDb25maWcpXHJcblx0e1xyXG5cdFx0dGhpcy5lcHViQ29uZmlnID0gbmV3IEVwdWJDb25maWcoY29uZmlnLCBvcHRpb25zKTtcclxuXHR9XHJcblxyXG5cdHN0YXRpYyBjcmVhdGUob3B0aW9ucz8sIC4uLmFyZ3YpXHJcblx0e1xyXG5cdFx0cmV0dXJuIG5ldyB0aGlzKG9wdGlvbnMsIC4uLmFyZ3YpO1xyXG5cdH1cclxuXHJcblx0d2l0aFV1aWQodXVpZDogc3RyaW5nKVxyXG5cdHtcclxuXHRcdHRoaXMuZXB1YkNvbmZpZy51dWlkID0gdXVpZDtcclxuXHRcdHJldHVybiB0aGlzO1xyXG5cdH1cclxuXHJcblx0d2l0aFRlbXBsYXRlKHRlbXBsYXRlTmFtZSlcclxuXHR7XHJcblx0XHR0aGlzLmVwdWJDb25maWcudGVtcGxhdGVOYW1lID0gdGVtcGxhdGVOYW1lO1xyXG5cdFx0cmV0dXJuIHRoaXM7XHJcblx0fVxyXG5cclxuXHRzbHVnaWZ5KGlucHV0OiBzdHJpbmcsIC4uLmFyZ3YpOiBzdHJpbmdcclxuXHR7XHJcblx0XHRsZXQgZm4gPSB0aGlzLmVwdWJDb25maWcub3B0aW9ucy5saWJTbHVnaWZ5IHx8IHNsdWdpZnk7XHJcblxyXG5cdFx0cmV0dXJuIGZuKGlucHV0IHx8ICcnLCAuLi5hcmd2KS50cmltKCk7XHJcblx0fVxyXG5cclxuXHRzbHVnaWZ5V2l0aEZhbGxiYWNrKGlucHV0OiBzdHJpbmcsIC4uLmFyZ3YpOiBzdHJpbmdcclxuXHR7XHJcblx0XHRsZXQgcmV0ID0gdGhpcy5zbHVnaWZ5KGlucHV0LCAuLi5hcmd2KTtcclxuXHJcblx0XHRyZXR1cm4gcmV0IHx8IGhhc2hTdW0oaW5wdXQpO1xyXG5cdH1cclxuXHJcblx0d2l0aFRpdGxlKHRpdGxlOiBzdHJpbmcsIHRpdGxlX3Nob3J0Pzogc3RyaW5nKVxyXG5cdHtcclxuXHRcdHRoaXMuZXB1YkNvbmZpZy50aXRsZSA9IHRpdGxlO1xyXG5cdFx0Ly8gQHRzLWlnbm9yZVxyXG5cdFx0dGhpcy5lcHViQ29uZmlnLnNsdWcgPSB0aGlzLnNsdWdpZnlXaXRoRmFsbGJhY2sodGl0bGUgfHwgdGl0bGVfc2hvcnQpO1xyXG5cclxuXHRcdGlmICh0aXRsZV9zaG9ydClcclxuXHRcdHtcclxuXHRcdFx0dGhpcy5lcHViQ29uZmlnLnRpdGxlX3Nob3J0ID0gdGl0bGVfc2hvcnQ7XHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIHRoaXM7XHJcblx0fVxyXG5cclxuXHRhZGRUaXRsZXModGl0bGVzOiBzdHJpbmdbXSlcclxuXHR7XHJcblx0XHR0aGlzLmVwdWJDb25maWcudGl0bGVzID0gdGl0bGVzIHx8IFtdO1xyXG5cclxuXHRcdHJldHVybiB0aGlzO1xyXG5cdH1cclxuXHJcblx0d2l0aExhbmd1YWdlKGxhbmc6IHN0cmluZylcclxuXHR7XHJcblx0XHR0aGlzLmVwdWJDb25maWcubGFuZyA9IGxhbmc7XHJcblx0XHRyZXR1cm4gdGhpcztcclxuXHR9XHJcblxyXG5cdGdldCBsYW5nKClcclxuXHR7XHJcblx0XHRyZXR1cm4gdGhpcy5lcHViQ29uZmlnLmxhbmc7XHJcblx0fVxyXG5cclxuXHR3aXRoQXV0aG9yKGZ1bGxOYW1lOiBzdHJpbmcsIHVybD86IHN0cmluZylcclxuXHR7XHJcblx0XHR0aGlzLmVwdWJDb25maWcuYXV0aG9yID0gZnVsbE5hbWU7XHJcblx0XHR0aGlzLmVwdWJDb25maWcuYXV0aG9yVXJsID0gdXJsO1xyXG5cdFx0cmV0dXJuIHRoaXM7XHJcblx0fVxyXG5cclxuXHRhZGRBdXRob3IoZnVsbE5hbWU6IHN0cmluZywgdXJsPzogc3RyaW5nKTogdGhpc1xyXG5cdGFkZEF1dGhvcihmdWxsTmFtZTogc3RyaW5nW10pOiB0aGlzXHJcblx0YWRkQXV0aG9yKGZ1bGxOYW1lOiB7IFtrZXk6IHN0cmluZ106IHN0cmluZzsgfSk6IHRoaXNcclxuXHRhZGRBdXRob3IoZnVsbE5hbWU6IHN0cmluZ1xyXG5cdFx0fCBzdHJpbmdbXVxyXG5cdFx0fCB7IFtrZXk6IHN0cmluZ106IHN0cmluZzsgfVxyXG5cdFx0LCB1cmw/OiBzdHJpbmdcclxuXHQpOiB0aGlzXHJcblx0e1xyXG5cdFx0bGV0IHNlbGYgPSB0aGlzO1xyXG5cclxuXHRcdGlmIChBcnJheS5pc0FycmF5KGZ1bGxOYW1lKSlcclxuXHRcdHtcclxuXHRcdFx0ZnVsbE5hbWUuZm9yRWFjaChuYW1lID0+IHtcclxuXHRcdFx0XHRuYW1lICYmIHNlbGYuZXB1YkNvbmZpZy5hZGRBdXRob3IobmFtZSk7XHJcblx0XHRcdH0pO1xyXG5cdFx0fVxyXG5cdFx0ZWxzZSBpZiAodHlwZW9mIGZ1bGxOYW1lID09ICdvYmplY3QnKVxyXG5cdFx0e1xyXG5cdFx0XHRmb3IgKGxldCBuYW1lIGluIGZ1bGxOYW1lKVxyXG5cdFx0XHR7XHJcblx0XHRcdFx0bmFtZSAmJiBzZWxmLmVwdWJDb25maWcuYWRkQXV0aG9yKG5hbWUsIGZ1bGxOYW1lW25hbWVdKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0ZWxzZSBpZiAoZnVsbE5hbWUpXHJcblx0XHR7XHJcblx0XHRcdHNlbGYuZXB1YkNvbmZpZy5hZGRBdXRob3IoZnVsbE5hbWUgYXMgc3RyaW5nLCB1cmwpO1xyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiB0aGlzO1xyXG5cdH1cclxuXHJcblx0d2l0aFB1Ymxpc2hlcihwdWJsaXNoZXI6IHN0cmluZylcclxuXHR7XHJcblx0XHR0aGlzLmVwdWJDb25maWcucHVibGlzaGVyID0gcHVibGlzaGVyO1xyXG5cdFx0cmV0dXJuIHRoaXM7XHJcblx0fVxyXG5cclxuXHR3aXRoQ29sbGVjdGlvbihkYXRhOiBJQ29sbGVjdGlvbilcclxuXHR7XHJcblx0XHR0aGlzLmVwdWJDb25maWcuY29sbGVjdGlvbiA9IE9iamVjdC5hc3NpZ24odGhpcy5lcHViQ29uZmlnLmNvbGxlY3Rpb24gfHwge30sIGRhdGEpO1xyXG5cclxuXHRcdC8vY29uc29sZS5sb2codGhpcy5lcHViQ29uZmlnLmNvbGxlY3Rpb24pO1xyXG5cclxuXHRcdHJldHVybiB0aGlzO1xyXG5cdH1cclxuXHJcblx0d2l0aFNlcmllcyhuYW1lOiBzdHJpbmcsIHBvc2l0aW9uID0gMSlcclxuXHR7XHJcblx0XHRpZiAobmFtZSlcclxuXHRcdHtcclxuXHRcdFx0dGhpcy53aXRoQ29sbGVjdGlvbih7XHJcblx0XHRcdFx0bmFtZSxcclxuXHRcdFx0XHRwb3NpdGlvbixcclxuXHRcdFx0XHR0eXBlOiAnc2VyaWVzJyxcclxuXHRcdFx0fSlcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdHdpdGhNb2RpZmljYXRpb25EYXRlKG1vZGlmaWNhdGlvbkRhdGUsIC4uLmFyZ3YpXHJcblx0e1xyXG5cdFx0bGV0IGRhdGEgPSBtb21lbnQobW9kaWZpY2F0aW9uRGF0ZSwgLi4uYXJndikubG9jYWwoKTtcclxuXHJcblx0XHR0aGlzLmVwdWJDb25maWcubW9kaWZpY2F0aW9uID0gZGF0YTtcclxuXHRcdHRoaXMuZXB1YkNvbmZpZy5tb2RpZmljYXRpb25EYXRlID0gZGF0YS5mb3JtYXQoRXB1Yk1ha2VyLmRhdGVGb3JtYXQpO1xyXG5cdFx0dGhpcy5lcHViQ29uZmlnLm1vZGlmaWNhdGlvbkRhdGVZTUQgPSBkYXRhLmZvcm1hdCgnWVlZWS1NTS1ERCcpO1xyXG5cdFx0cmV0dXJuIHRoaXM7XHJcblx0fVxyXG5cclxuXHR3aXRoUmlnaHRzKHJpZ2h0c0NvbmZpZzogSVJpZ2h0c0NvbmZpZylcclxuXHR7XHJcblx0XHR0aGlzLmVwdWJDb25maWcucmlnaHRzID0gcmlnaHRzQ29uZmlnO1xyXG5cdFx0cmV0dXJuIHRoaXM7XHJcblx0fVxyXG5cclxuXHR3aXRoQ292ZXIoY292ZXJVcmw6IHN0cmluZyB8IElDb3ZlciwgcmlnaHRzQ29uZmlnPzogSVJpZ2h0c0NvbmZpZylcclxuXHR7XHJcblx0XHRsZXQgY292ZXIgPSBwYXJzZUZpbGVTZXR0aW5nKGNvdmVyVXJsLCB0aGlzLmVwdWJDb25maWcpIGFzIElDb3ZlcjtcclxuXHJcblx0XHRpZiAoY292ZXIgJiYgcmlnaHRzQ29uZmlnKVxyXG5cdFx0e1xyXG5cdFx0XHRjb3Zlci5yaWdodHMgPSByaWdodHNDb25maWc7XHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKCFjb3ZlcilcclxuXHRcdHtcclxuXHRcdFx0dGhyb3cgbmV3IFJlZmVyZW5jZUVycm9yKCk7XHJcblx0XHR9XHJcblxyXG5cdFx0dGhpcy5lcHViQ29uZmlnLmNvdmVyID0gT2JqZWN0LmFzc2lnbih0aGlzLmVwdWJDb25maWcuY292ZXIgfHwge30sIGNvdmVyKTtcclxuXHJcblx0XHQvL3RoaXMuZXB1YkNvbmZpZy5jb3ZlclVybCA9IGNvdmVyVXJsO1xyXG5cdFx0Ly90aGlzLmVwdWJDb25maWcuY292ZXJSaWdodHMgPSByaWdodHNDb25maWc7XHJcblxyXG5cdFx0cmV0dXJuIHRoaXM7XHJcblx0fVxyXG5cclxuXHR3aXRoQXR0cmlidXRpb25VcmwoYXR0cmlidXRpb25VcmwpXHJcblx0e1xyXG5cdFx0dGhpcy5lcHViQ29uZmlnLmF0dHJpYnV0aW9uVXJsID0gYXR0cmlidXRpb25Vcmw7XHJcblx0XHRyZXR1cm4gdGhpcztcclxuXHR9XHJcblxyXG5cdHdpdGhTdHlsZXNoZWV0VXJsKHN0eWxlc2hlZXRVcmwsIHJlcGxhY2VPcmlnaW5hbD86IGJvb2xlYW4pXHJcblx0e1xyXG5cdFx0bGV0IGRhdGEgPSBwYXJzZUZpbGVTZXR0aW5nKHN0eWxlc2hlZXRVcmwsIHRoaXMuZXB1YkNvbmZpZykgYXMgSVN0eWxlc2hlZXQ7XHJcblxyXG5cdFx0dGhpcy5lcHViQ29uZmlnLnN0eWxlc2hlZXQgPSBPYmplY3QuYXNzaWduKHRoaXMuZXB1YkNvbmZpZy5zdHlsZXNoZWV0LCBkYXRhLCB7XHJcblx0XHRcdHJlcGxhY2VPcmlnaW5hbDogcmVwbGFjZU9yaWdpbmFsLFxyXG5cdFx0fSk7XHJcblxyXG5cdFx0cmV0dXJuIHRoaXM7XHJcblx0fVxyXG5cclxuXHR3aXRoU2VjdGlvbihzZWN0aW9uOiBFcHViTWFrZXIuU2VjdGlvbilcclxuXHR7XHJcblx0XHRzZWN0aW9uLnBhcmVudEVwdWJNYWtlciA9IHRoaXM7XHJcblxyXG5cdFx0dGhpcy5lcHViQ29uZmlnLnNlY3Rpb25zLnB1c2goc2VjdGlvbik7XHJcblx0XHRBcnJheS5wcm90b3R5cGUucHVzaC5hcHBseSh0aGlzLmVwdWJDb25maWcudG9jLCBzZWN0aW9uLmNvbGxlY3RUb2MoKSk7XHJcblx0XHRBcnJheS5wcm90b3R5cGUucHVzaC5hcHBseSh0aGlzLmVwdWJDb25maWcubGFuZG1hcmtzLCBzZWN0aW9uLmNvbGxlY3RMYW5kbWFya3MoKSk7XHJcblx0XHRyZXR1cm4gdGhpcztcclxuXHR9XHJcblxyXG5cdHdpdGhBZGRpdGlvbmFsRmlsZShmaWxlVXJsLCBmb2xkZXIsIGZpbGVuYW1lKVxyXG5cdHtcclxuXHRcdGxldCBfZmlsZSA9IHBhcnNlRmlsZVNldHRpbmcoZmlsZVVybCwgdGhpcy5lcHViQ29uZmlnKSBhcyBJQ292ZXI7XHJcblxyXG5cdFx0X2ZpbGUgPSBPYmplY3QuYXNzaWduKHt9LCBfZmlsZSwge1xyXG5cdFx0XHRmb2xkZXI6IGZvbGRlcixcclxuXHRcdFx0bmFtZTogZmlsZW5hbWVcclxuXHRcdH0pO1xyXG5cclxuXHRcdHRoaXMuZXB1YkNvbmZpZy5hZGRpdGlvbmFsRmlsZXMucHVzaChfZmlsZSk7XHJcblxyXG5cdFx0cmV0dXJuIHRoaXM7XHJcblx0fVxyXG5cclxuXHR3aXRoT3B0aW9uKGtleTogc3RyaW5nLCB2YWx1ZSlcclxuXHR7XHJcblx0XHR0aGlzLmVwdWJDb25maWcub3B0aW9uc1trZXldID0gdmFsdWU7XHJcblx0XHRyZXR1cm4gdGhpcztcclxuXHR9XHJcblxyXG5cdHdpdGhJbmZvUHJlZmFjZShzdHI6IHN0cmluZylcclxuXHR7XHJcblx0XHRpZiAoc3RyKVxyXG5cdFx0e1xyXG5cdFx0XHR0aGlzLmVwdWJDb25maWcuaW5mb1ByZWZhY2UgPSBzdHIudG9TdHJpbmcoKTtcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gdGhpcztcclxuXHR9XHJcblxyXG5cdGFkZElkZW50aWZpZXIodHlwZTogc3RyaW5nLCBpZD86IHN0cmluZylcclxuXHR7XHJcblx0XHR0aGlzLmVwdWJDb25maWcuYWRkSWRlbnRpZmllcih0eXBlLCBpZCk7XHJcblx0XHRyZXR1cm4gdGhpcztcclxuXHR9XHJcblxyXG5cdGFkZExpbmtzKGxpbmtzLCByZWw/OiBzdHJpbmcpXHJcblx0e1xyXG5cdFx0Y29uc3Qgc2VsZiA9IHRoaXM7XHJcblxyXG5cdFx0bGlua3MgPSBBcnJheS5pc0FycmF5KGxpbmtzKSA/IGxpbmtzLnNsaWNlKCkgOiBbbGlua3NdO1xyXG5cclxuXHRcdGxpbmtzLmZvckVhY2goZnVuY3Rpb24gKHVybClcclxuXHRcdHtcclxuXHRcdFx0aWYgKHVybClcclxuXHRcdFx0e1xyXG5cdFx0XHRcdHNlbGYuZXB1YkNvbmZpZy5hZGRMaW5rKHVybCwgcmVsKTtcclxuXHRcdFx0fVxyXG5cdFx0fSk7XHJcblxyXG5cdFx0cmV0dXJuIHRoaXM7XHJcblx0fVxyXG5cclxuXHRhZGRUYWcodGFnKVxyXG5cdHtcclxuXHRcdHRhZyA9IChBcnJheS5pc0FycmF5KHRhZykgPyB0YWcgOiBbdGFnXSkucmVkdWNlKGZ1bmN0aW9uIChhLCBiKVxyXG5cdFx0e1xyXG5cdFx0XHRpZiAoQXJyYXkuaXNBcnJheShiKSlcclxuXHRcdFx0e1xyXG5cdFx0XHRcdHJldHVybiBhLmNvbmNhdChiKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlXHJcblx0XHRcdHtcclxuXHRcdFx0XHRhLnB1c2goYik7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHJldHVybiBhO1xyXG5cdFx0fSwgW10pO1xyXG5cclxuXHRcdHRoaXMuZXB1YkNvbmZpZy50YWdzID0gKHRoaXMuZXB1YkNvbmZpZy50YWdzIHx8IFtdKS5jb25jYXQodGFnKTtcclxuXHRcdHJldHVybiB0aGlzO1xyXG5cdH1cclxuXHJcblx0c2V0UHVibGljYXRpb25EYXRlKG5ld19kYXRhPylcclxuXHR7XHJcblx0XHRsZXQgZGF0YSA9IG1vbWVudChuZXdfZGF0YSk7XHJcblxyXG5cdFx0dGhpcy5lcHViQ29uZmlnLnB1YmxpY2F0aW9uID0gZGF0YTtcclxuXHRcdHRoaXMuZXB1YkNvbmZpZy5wdWJsaWNhdGlvbkRhdGUgPSBkYXRhLmZvcm1hdChFcHViTWFrZXIuZGF0ZUZvcm1hdCk7XHJcblx0XHR0aGlzLmVwdWJDb25maWcucHVibGljYXRpb25EYXRlWU1EID0gZGF0YS5mb3JtYXQoJ1lZWVktTU0tREQnKTtcclxuXHJcblx0XHRyZXR1cm4gdGhpcztcclxuXHR9XHJcblxyXG5cdGdldEZpbGVuYW1lKHVzZVRpdGxlPzogYm9vbGVhbiwgbm9FeHQ/OiBib29sZWFuKTogc3RyaW5nXHJcblx0e1xyXG5cdFx0bGV0IGV4dCA9IHRoaXMuZXB1YkNvbmZpZy5vcHRpb25zLmV4dCB8fCBFcHViTWFrZXIuZGVmYXVsdEV4dDtcclxuXHRcdGxldCBmaWxlbmFtZTtcclxuXHJcblx0XHRpZiAodGhpcy5lcHViQ29uZmlnLmZpbGVuYW1lKVxyXG5cdFx0e1xyXG5cdFx0XHRmaWxlbmFtZSA9IHRoaXMuZXB1YkNvbmZpZy5maWxlbmFtZTtcclxuXHRcdH1cclxuXHRcdGVsc2UgaWYgKHVzZVRpdGxlICYmIHRoaXMuZXB1YkNvbmZpZy50aXRsZV9zaG9ydClcclxuXHRcdHtcclxuXHRcdFx0ZmlsZW5hbWUgPSB0aGlzLmVwdWJDb25maWcudGl0bGVfc2hvcnQ7XHJcblx0XHR9XHJcblx0XHRlbHNlIGlmICh1c2VUaXRsZSAmJiB0aGlzLmVwdWJDb25maWcudGl0bGUpXHJcblx0XHR7XHJcblx0XHRcdGZpbGVuYW1lID0gdGhpcy5lcHViQ29uZmlnLnRpdGxlO1xyXG5cdFx0fVxyXG5cdFx0ZWxzZSBpZiAoIXRoaXMuZXB1YkNvbmZpZy5zbHVnKVxyXG5cdFx0e1xyXG5cdFx0XHQvLyBAdHMtaWdub3JlXHJcblx0XHRcdHRoaXMuZXB1YkNvbmZpZy5zbHVnID0gc2hvcnRpZCgpO1xyXG5cclxuXHRcdFx0ZmlsZW5hbWUgPSB0aGlzLmVwdWJDb25maWcuc2x1ZztcclxuXHRcdH1cclxuXHRcdGVsc2VcclxuXHRcdHtcclxuXHJcblxyXG5cdFx0XHRmaWxlbmFtZSA9IHRoaXMuZXB1YkNvbmZpZy5zbHVnO1xyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiB0cmltRmlsZW5hbWUoZmlsZW5hbWUpICsgKG5vRXh0ID8gJycgOiBleHQpO1xyXG5cdH1cclxuXHJcblx0dmFpbGQoKVxyXG5cdHtcclxuXHRcdGxldCByZXQ6IHN0cmluZ1tdID0gW107XHJcblxyXG5cdFx0aWYgKCF0aGlzLmVwdWJDb25maWcudGl0bGUgfHwgIXRoaXMuZXB1YkNvbmZpZy5zbHVnKVxyXG5cdFx0e1xyXG5cdFx0XHRyZXQucHVzaCgndGl0bGUsIHNsdWcnKTtcclxuXHRcdH1cclxuXHJcblx0XHRpZiAocmV0Lmxlbmd0aClcclxuXHRcdHtcclxuXHRcdFx0cmV0dXJuIHJldDtcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gbnVsbDtcclxuXHR9XHJcblxyXG5cdGJ1aWxkKG9wdGlvbnM/KVxyXG5cdHtcclxuXHRcdGxldCBzZWxmID0gdGhpcztcclxuXHJcblx0XHRpZiAoIXRoaXMuZXB1YkNvbmZpZy5wdWJsaWNhdGlvbilcclxuXHRcdHtcclxuXHRcdFx0dGhpcy5zZXRQdWJsaWNhdGlvbkRhdGUoKTtcclxuXHRcdH1cclxuXHJcblx0XHRpZiAoIXRoaXMuZXB1YkNvbmZpZy51dWlkKVxyXG5cdFx0e1xyXG5cdFx0XHR0aGlzLndpdGhVdWlkKGNyZWF0ZVVVSUQodGhpcy5lcHViQ29uZmlnKSk7XHJcblx0XHR9XHJcblxyXG5cdFx0dGhpcy5lcHViQ29uZmlnLiRhdXRvKCk7XHJcblxyXG5cdFx0bGV0IGNoayA9IHRoaXMudmFpbGQoKTtcclxuXHJcblx0XHRpZiAoY2hrKVxyXG5cdFx0e1xyXG5cdFx0XHR0aHJvdyBjaGs7XHJcblx0XHR9XHJcblxyXG5cdFx0W11cclxuXHRcdFx0LmNvbmNhdCh0aGlzLmVwdWJDb25maWcuc2VjdGlvbnMsIHRoaXMuZXB1YkNvbmZpZy50b2MsIHRoaXMuZXB1YkNvbmZpZy5sYW5kbWFya3MpXHJcblx0XHRcdC5mb3JFYWNoKGZ1bmN0aW9uIChzZWN0aW9uOiBFcHViTWFrZXIuU2VjdGlvbiwgaW5kZXgpXHJcblx0XHRcdHtcclxuXHRcdFx0XHRzZWN0aW9uLl9FcHViTWFrZXJfID0gc2VsZjtcclxuXHRcdFx0fSlcclxuXHRcdDtcclxuXHJcblx0XHRyZXR1cm4gdGVtcGxhdGVNYW5hZ2Vycy5leGVjKHRoaXMuZXB1YkNvbmZpZy50ZW1wbGF0ZU5hbWUsIHRoaXMsIG9wdGlvbnMpO1xyXG5cdH1cclxuXHJcblx0LyoqXHJcblx0ICogZm9yIG5vZGUuanNcclxuXHQgKlxyXG5cdCAqIEBwYXJhbSBvcHRpb25zXHJcblx0ICogQHJldHVybnMge1Byb21pc2U8VD59XHJcblx0ICovXHJcblx0bWFrZUVwdWI8VCA9IEJ1ZmZlciB8IEJsb2I+KG9wdGlvbnM/KTogUHJvbWlzZTxUIHwgYW55IHwgQnVmZmVyIHwgQmxvYj5cclxuXHR7XHJcblx0XHRsZXQgc2VsZiA9IHRoaXM7XHJcblxyXG5cdFx0Ly8gQHRzLWlnbm9yZVxyXG5cdFx0cmV0dXJuIHRoaXMuYnVpbGQob3B0aW9ucykudGhlbihhc3luYyBmdW5jdGlvbiAoZXB1YlppcClcclxuXHRcdHtcclxuXHRcdFx0bGV0IGdlbmVyYXRlT3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe1xyXG5cdFx0XHRcdHR5cGU6ICdub2RlYnVmZmVyJyxcclxuXHRcdFx0XHRtaW1lVHlwZTogJ2FwcGxpY2F0aW9uL2VwdWIremlwJyxcclxuXHRcdFx0XHRjb21wcmVzc2lvbjogJ0RFRkxBVEUnLFxyXG5cdFx0XHRcdGNvbXByZXNzaW9uT3B0aW9uczoge1xyXG5cdFx0XHRcdFx0bGV2ZWw6IDlcclxuXHRcdFx0XHR9LFxyXG5cdFx0XHR9LCBzZWxmLmVwdWJDb25maWcub3B0aW9ucy5nZW5lcmF0ZU9wdGlvbnMsIG9wdGlvbnMpO1xyXG5cclxuXHRcdFx0Y29uc29sZS5pbmZvKCdnZW5lcmF0aW5nIGVwdWIgZm9yOiAnICsgc2VsZi5lcHViQ29uZmlnLnRpdGxlKTtcclxuXHRcdFx0bGV0IGNvbnRlbnQgPSBhd2FpdCBlcHViWmlwLmdlbmVyYXRlQXN5bmMoZ2VuZXJhdGVPcHRpb25zKTtcclxuXHJcblx0XHRcdHJldHVybiBjb250ZW50O1xyXG5cdFx0fSk7XHJcblx0fVxyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIElTZWN0aW9uQ29uZmlnXHJcbntcclxuXHRsYW5nPzogc3RyaW5nO1xyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIElTZWN0aW9uQ29udGVudFxyXG57XHJcblx0dGl0bGU/OiBzdHJpbmc7XHJcblx0Y29udGVudD86IHN0cmluZztcclxuXHJcblx0cmVuZGVyVGl0bGU/OiBib29sZWFuO1xyXG5cclxuXHRjb3Zlcj86IHtcclxuXHRcdG5hbWU/OiBzdHJpbmcsXHJcblx0XHR1cmw/OiBzdHJpbmcsXHJcblx0fVxyXG59XHJcblxyXG5leHBvcnQgaW50ZXJmYWNlIElTbHVnaWZ5XHJcbntcclxuXHQoaW5wdXQ6IHN0cmluZywgLi4uYXJndik6IHN0cmluZ1xyXG59XHJcblxyXG5leHBvcnQgbmFtZXNwYWNlIEVwdWJNYWtlclxyXG57XHJcblx0ZXhwb3J0IGxldCBkZWZhdWx0RXh0ID0gJy5lcHViJztcclxuXHRleHBvcnQgbGV0IGRhdGVGb3JtYXQgPSAnWVlZWS1NTS1ERFRISDptbTpzcy5TU1NaJztcclxuXHJcblx0Ly8gZXB1YnR5cGVzIGFuZCBkZXNjcmlwdGlvbnMsIHVzZWZ1bCBmb3IgdmVuZG9ycyBpbXBsZW1lbnRpbmcgYSBHVUlcclxuXHQvLyBAdHMtaWdub3JlXHJcblx0ZXhwb3J0IGNvbnN0IGVwdWJ0eXBlcyA9IHJlcXVpcmUoJy4vZXB1Yi10eXBlcy5qcycpO1xyXG5cclxuXHQvLyBAdHMtaWdub3JlXHJcblx0ZXhwb3J0IGxldCBsaWJTbHVnaWZ5ID0gX3NsdWdpZnkgYXMgSVNsdWdpZnk7XHJcblxyXG5cdC8qKlxyXG5cdCAqIEBlcHViVHlwZSBPcHRpb25hbC4gQWxsb3dzIHlvdSB0byBhZGQgc3BlY2lmaWMgZXB1YiB0eXBlIGNvbnRlbnQgc3VjaCBhcyBbZXB1Yjp0eXBlPVwidGl0bGVwYWdlXCJdXHJcblx0ICogQGlkIE9wdGlvbmFsLCBidXQgcmVxdWlyZWQgaWYgc2VjdGlvbiBzaG91bGQgYmUgaW5jbHVkZWQgaW4gdG9jIGFuZCAvIG9yIGxhbmRtYXJrc1xyXG5cdCAqIEBjb250ZW50IE9wdGlvbmFsLiBTaG91bGQgbm90IGJlIGVtcHR5IGlmIHRoZXJlIHdpbGwgYmUgbm8gc3Vic2VjdGlvbnMgYWRkZWQgdG8gdGhpcyBzZWN0aW9uLiBGb3JtYXQ6IHsgdGl0bGUsIGNvbnRlbnQsIHJlbmRlclRpdGxlIH1cclxuXHQgKi9cclxuXHRleHBvcnQgY2xhc3MgU2VjdGlvblxyXG5cdHtcclxuXHRcdHB1YmxpYyBfRXB1Yk1ha2VyXzogRXB1Yk1ha2VyO1xyXG5cclxuXHRcdHB1YmxpYyBlcHViVHlwZTtcclxuXHRcdHB1YmxpYyBpZDtcclxuXHRcdHB1YmxpYyBjb250ZW50OiBJU2VjdGlvbkNvbnRlbnQ7XHJcblx0XHRwdWJsaWMgaW5jbHVkZUluVG9jOiBib29sZWFuO1xyXG5cdFx0cHVibGljIGluY2x1ZGVJbkxhbmRtYXJrczogYm9vbGVhbjtcclxuXHRcdHB1YmxpYyBzdWJTZWN0aW9uczogU2VjdGlvbltdID0gW107XHJcblxyXG5cdFx0cHVibGljIHNlY3Rpb25Db25maWc6IElTZWN0aW9uQ29uZmlnID0ge307XHJcblxyXG5cdFx0cHVibGljIHBhcmVudFNlY3Rpb246IFNlY3Rpb247XHJcblx0XHRwdWJsaWMgcGFyZW50RXB1Yk1ha2VyOiBFcHViTWFrZXI7XHJcblxyXG5cdFx0Y29uc3RydWN0b3IoZXB1YlR5cGUsIGlkLCBjb250ZW50LCBpbmNsdWRlSW5Ub2M/OiBib29sZWFuLCBpbmNsdWRlSW5MYW5kbWFya3M/OiBib29sZWFuLCAuLi5hcmd2KVxyXG5cdFx0e1xyXG5cdFx0XHR0aGlzLmVwdWJUeXBlID0gZXB1YlR5cGU7XHJcblx0XHRcdHRoaXMuaWQgPSBpZDtcclxuXHJcblx0XHRcdHRoaXMuaW5jbHVkZUluVG9jID0gaW5jbHVkZUluVG9jO1xyXG5cdFx0XHR0aGlzLmluY2x1ZGVJbkxhbmRtYXJrcyA9IGluY2x1ZGVJbkxhbmRtYXJrcztcclxuXHRcdFx0dGhpcy5zdWJTZWN0aW9ucyA9IFtdO1xyXG5cclxuXHRcdFx0LypcclxuXHRcdFx0dGhpcy5jb250ZW50ID0gY29udGVudDtcclxuXHRcdFx0aWYgKGNvbnRlbnQpXHJcblx0XHRcdHtcclxuXHRcdFx0XHRjb250ZW50LnJlbmRlclRpdGxlID0gY29udGVudC5yZW5kZXJUaXRsZSAhPT0gZmFsc2U7IC8vICd1bmRlZmluZWQnIHNob3VsZCBkZWZhdWx0IHRvIHRydWVcclxuXHRcdFx0fVxyXG5cdFx0XHQqL1xyXG5cclxuXHRcdFx0dGhpcy5zZXRDb250ZW50KGNvbnRlbnQsIHRydWUpO1xyXG5cdFx0fVxyXG5cclxuXHRcdC8qKlxyXG5cdFx0ICpcclxuXHRcdCAqIEBwYXJhbSB7SVNlY3Rpb25Db250ZW50fHN0cmluZ30gY29udGVudFxyXG5cdFx0ICogQHBhcmFtIHtib29sZWFufSBhbGxvd19udWxsXHJcblx0XHQgKiBAcmV0dXJucyB7dGhpc31cclxuXHRcdCAqL1xyXG5cdFx0c2V0Q29udGVudChjb250ZW50OiBJU2VjdGlvbkNvbnRlbnQsIGFsbG93X251bGw/OiBib29sZWFuKVxyXG5cdFx0e1xyXG5cdFx0XHRsZXQgbyA9IHt9IGFzIElTZWN0aW9uQ29udGVudDtcclxuXHJcblx0XHRcdGlmICh0eXBlb2YgY29udGVudCA9PSAnc3RyaW5nJylcclxuXHRcdFx0e1xyXG5cdFx0XHRcdG8uY29udGVudCA9IGNvbnRlbnQ7XHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSBpZiAoY29udGVudC50aXRsZSB8fCBjb250ZW50LmNvbnRlbnQgfHwgY29udGVudC5yZW5kZXJUaXRsZSB8fCBjb250ZW50LmNvdmVyKVxyXG5cdFx0XHR7XHJcblx0XHRcdFx0byA9IGNvbnRlbnQ7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGlmIChPYmplY3Qua2V5cyhvKS5sZW5ndGgpXHJcblx0XHRcdHtcclxuXHRcdFx0XHRpZiAodGhpcy5jb250ZW50KVxyXG5cdFx0XHRcdHtcclxuXHRcdFx0XHRcdHRoaXMuY29udGVudCA9IE9iamVjdC5hc3NpZ24odGhpcy5jb250ZW50LCBvKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0ZWxzZVxyXG5cdFx0XHRcdHtcclxuXHRcdFx0XHRcdHRoaXMuY29udGVudCA9IG87XHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHR0aGlzLmNvbnRlbnQucmVuZGVyVGl0bGUgPSB0aGlzLmNvbnRlbnQucmVuZGVyVGl0bGUgIT09IGZhbHNlO1xyXG5cclxuXHRcdFx0fSBlbHNlIGlmIChjb250ZW50KVxyXG5cdFx0XHR7XHJcblx0XHRcdFx0dGhpcy5jb250ZW50ID0gY29udGVudDtcclxuXHRcdFx0fVxyXG5cdFx0XHRlbHNlIGlmICghYWxsb3dfbnVsbClcclxuXHRcdFx0e1xyXG5cdFx0XHRcdHRocm93IG5ldyBSZWZlcmVuY2VFcnJvcigpO1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRyZXR1cm4gdGhpcztcclxuXHRcdH1cclxuXHJcblx0XHRnZXQgZXB1YlR5cGVHcm91cCgpXHJcblx0XHR7XHJcblx0XHRcdHJldHVybiBlcHVidHlwZXMuZ2V0R3JvdXAodGhpcy5lcHViVHlwZSk7XHJcblx0XHR9XHJcblxyXG5cdFx0Z2V0IGxhbmcoKVxyXG5cdFx0e1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5zZWN0aW9uQ29uZmlnLmxhbmcgfHwgKHRoaXMuX0VwdWJNYWtlcl8gPyB0aGlzLl9FcHViTWFrZXJfLmxhbmcgOiBudWxsKSB8fCBudWxsO1xyXG5cdFx0fVxyXG5cclxuXHRcdGdldCBsYW5nTWFpbigpXHJcblx0XHR7XHJcblx0XHRcdHJldHVybiAodGhpcy5fRXB1Yk1ha2VyXyA/IHRoaXMuX0VwdWJNYWtlcl8ubGFuZyA6IG51bGwpIHx8IG51bGw7XHJcblx0XHR9XHJcblxyXG5cdFx0c3RhdGljIGNyZWF0ZShlcHViVHlwZSwgaWQsIGNvbnRlbnQsIGluY2x1ZGVJblRvYzogYm9vbGVhbiwgaW5jbHVkZUluTGFuZG1hcmtzOiBib29sZWFuLCAuLi5hcmd2KVxyXG5cdFx0e1xyXG5cdFx0XHRyZXR1cm4gbmV3IHRoaXMoZXB1YlR5cGUsIGlkLCBjb250ZW50LCBpbmNsdWRlSW5Ub2MsIGluY2x1ZGVJbkxhbmRtYXJrcywgLi4uYXJndik7XHJcblx0XHR9XHJcblxyXG5cdFx0d2l0aFN1YlNlY3Rpb24oc3Vic2VjdGlvbjogU2VjdGlvbilcclxuXHRcdHtcclxuXHRcdFx0c3Vic2VjdGlvbi5wYXJlbnRTZWN0aW9uID0gdGhpcztcclxuXHJcblx0XHRcdHRoaXMuc3ViU2VjdGlvbnMucHVzaChzdWJzZWN0aW9uKTtcclxuXHRcdFx0cmV0dXJuIHRoaXM7XHJcblx0XHR9O1xyXG5cclxuXHRcdGNvbGxlY3RUb2MoKVxyXG5cdFx0e1xyXG5cdFx0XHRyZXR1cm4gdGhpcy5jb2xsZWN0U2VjdGlvbnModGhpcywgJ2luY2x1ZGVJblRvYycpO1xyXG5cdFx0fTtcclxuXHJcblx0XHRjb2xsZWN0TGFuZG1hcmtzKClcclxuXHRcdHtcclxuXHRcdFx0cmV0dXJuIHRoaXMuY29sbGVjdFNlY3Rpb25zKHRoaXMsICdpbmNsdWRlSW5MYW5kbWFya3MnKTtcclxuXHRcdH07XHJcblxyXG5cdFx0Y29sbGVjdFNlY3Rpb25zKHNlY3Rpb246IFNlY3Rpb24sIHByb3A6IHN0cmluZyk6IFNlY3Rpb25bXVxyXG5cdFx0e1xyXG5cdFx0XHRsZXQgc2VjdGlvbnMgPSBzZWN0aW9uW3Byb3BdID8gW3NlY3Rpb25dIDogW107XHJcblx0XHRcdGZvciAobGV0IGkgPSAwOyBpIDwgc2VjdGlvbi5zdWJTZWN0aW9ucy5sZW5ndGg7IGkrKylcclxuXHRcdFx0e1xyXG5cdFx0XHRcdEFycmF5LnByb3RvdHlwZS5wdXNoLmFwcGx5KHNlY3Rpb25zLCB0aGlzLmNvbGxlY3RTZWN0aW9ucyhzZWN0aW9uLnN1YlNlY3Rpb25zW2ldLCBwcm9wKSk7XHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIHNlY3Rpb25zO1xyXG5cdFx0fVxyXG5cdH1cclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgRXB1Yk1ha2VyO1xyXG5cclxuaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKVxyXG57XHJcblx0Ly8gQHRzLWlnbm9yZVxyXG5cdHdpbmRvdy5FcHViTWFrZXIgPSBFcHViTWFrZXI7XHJcbn1cclxuIl19