"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _slugify = require("slugify");
const moment = require("moment");
const template_1 = require("./template");
const shortid = require("shortid");
exports.shortid = shortid;
const hashSum = require("hash-sum");
exports.hashSum = hashSum;
const fs_iconv_1 = require("fs-iconv");
const zip_1 = require("./epubtpl-lib/zip");
const uuid_1 = require("./lib/uuid");
const config_1 = require("./config");
function slugify(input, ...argv) {
    let fn = EpubMaker.libSlugify ||
        // @ts-ignore
        _slugify;
    return fn(input || '', ...argv).trim();
}
exports.slugify = slugify;
function slugifyWithFallback(input, ...argv) {
    let ret = slugify(input, ...argv);
    return ret || hashSum(input);
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
        return ret || hashSum(input);
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
        let data = moment(modificationDate, ...argv).local();
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
        let data = moment(new_data);
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
            this.epubConfig.slug = shortid();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLG9DQUFvQztBQUNwQyxpQ0FBaUM7QUFDakMseUNBQWdFO0FBQ2hFLG1DQUFtQztBQVMxQiwwQkFBTztBQVJoQixvQ0FBb0M7QUFRbEIsMEJBQU87QUFQekIsdUNBQXdDO0FBRXhDLDJDQUFxRDtBQUNyRCxxQ0FBd0M7QUFDeEMscUNBQTRHO0FBSzVHLFNBQWdCLE9BQU8sQ0FBQyxLQUFhLEVBQUUsR0FBRyxJQUFJO0lBRTdDLElBQUksRUFBRSxHQUFHLFNBQVMsQ0FBQyxVQUFVO1FBQzVCLGFBQWE7UUFDYixRQUFvQixDQUNwQjtJQUVELE9BQU8sRUFBRSxDQUFDLEtBQUssSUFBSSxFQUFFLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztBQUN4QyxDQUFDO0FBUkQsMEJBUUM7QUFFRCxTQUFnQixtQkFBbUIsQ0FBQyxLQUFhLEVBQUUsR0FBRyxJQUFJO0lBRXpELElBQUksR0FBRyxHQUFHLE9BQU8sQ0FBQyxLQUFLLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQztJQUVsQyxPQUFPLEdBQUcsSUFBSSxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDOUIsQ0FBQztBQUxELGtEQUtDO0FBRUQsTUFBYSxTQUFTO0lBSXJCLFlBQVksT0FBTyxHQUFHLEVBQUUsRUFBRSxNQUFvQjtRQUU3QyxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksbUJBQVUsQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDbkQsQ0FBQztJQUVELE1BQU0sQ0FBQyxNQUFNLENBQUMsT0FBUSxFQUFFLEdBQUcsSUFBSTtRQUU5QixPQUFPLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRSxHQUFHLElBQUksQ0FBQyxDQUFDO0lBQ25DLENBQUM7SUFFRCxRQUFRLENBQUMsSUFBWTtRQUVwQixJQUFJLENBQUMsVUFBVSxDQUFDLElB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QUM7UUFBQSxDQUFDO1FBRUYsVUFBVTtZQUVULE9BQU8sSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLEVBQUUsY0FBYyxDQUFDLENBQUM7UUFDbkQsQ0FBQztRQUFBLENBQUM7UUFFRixnQkFBZ0I7WUFFZixPQUFPLElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxFQUFFLG9CQUFvQixDQUFDLENBQUM7UUFDekQsQ0FBQztRQUFBLENBQUM7UUFFRixlQUFlLENBQUMsT0FBZ0IsRUFBRSxJQUFZO1lBRTdDLElBQUksUUFBUSxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO1lBQzlDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxPQUFPLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFDbkQ7Z0JBQ0MsS0FBSyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQzthQUN6RjtZQUNELE9BQU8sUUFBUSxDQUFDO1FBQ2pCLENBQUM7S0FDRDtJQS9IWSxpQkFBTyxVQStIbkIsQ0FBQTtBQUNGLENBQUMsRUFqSmdCLFNBQVMsR0FBVCxpQkFBUyxLQUFULGlCQUFTLFFBaUp6QjtBQUVELGtCQUFlLFNBQVMsQ0FBQztBQUV6QixJQUFJLE9BQU8sTUFBTSxLQUFLLFdBQVcsRUFDakM7SUFDQyxhQUFhO0lBQ2IsTUFBTSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUM7Q0FDN0IiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBfc2x1Z2lmeSBmcm9tICdzbHVnaWZ5JztcclxuaW1wb3J0ICogYXMgbW9tZW50IGZyb20gJ21vbWVudCc7XHJcbmltcG9ydCB7IFRlbXBsYXRlTWFuYWdlcnMsIHRlbXBsYXRlTWFuYWdlcnMgfSBmcm9tICcuL3RlbXBsYXRlJztcclxuaW1wb3J0ICogYXMgc2hvcnRpZCBmcm9tICdzaG9ydGlkJztcclxuaW1wb3J0ICogYXMgaGFzaFN1bSBmcm9tICdoYXNoLXN1bSc7XHJcbmltcG9ydCB7IHRyaW1GaWxlbmFtZSB9IGZyb20gJ2ZzLWljb252JztcclxuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcclxuaW1wb3J0IHsgcGFyc2VGaWxlU2V0dGluZyB9IGZyb20gJy4vZXB1YnRwbC1saWIvemlwJztcclxuaW1wb3J0IHsgY3JlYXRlVVVJRCB9IGZyb20gJy4vbGliL3V1aWQnO1xyXG5pbXBvcnQgeyBFcHViQ29uZmlnLCBJRXB1YkNvbmZpZywgSUNvdmVyLCBJUmlnaHRzQ29uZmlnLCBJRmlsZXMsIElTdHlsZXNoZWV0LCBJQ29sbGVjdGlvbiB9IGZyb20gJy4vY29uZmlnJztcclxuaW1wb3J0IEpTWmlwID0gcmVxdWlyZSgnanN6aXAnKTtcclxuXHJcbmV4cG9ydCB7IHNob3J0aWQsIGhhc2hTdW0gfVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHNsdWdpZnkoaW5wdXQ6IHN0cmluZywgLi4uYXJndik6IHN0cmluZ1xyXG57XHJcblx0bGV0IGZuID0gRXB1Yk1ha2VyLmxpYlNsdWdpZnkgfHxcclxuXHRcdC8vIEB0cy1pZ25vcmVcclxuXHRcdF9zbHVnaWZ5IGFzIElTbHVnaWZ5XHJcblx0O1xyXG5cclxuXHRyZXR1cm4gZm4oaW5wdXQgfHwgJycsIC4uLmFyZ3YpLnRyaW0oKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHNsdWdpZnlXaXRoRmFsbGJhY2soaW5wdXQ6IHN0cmluZywgLi4uYXJndik6IHN0cmluZ1xyXG57XHJcblx0bGV0IHJldCA9IHNsdWdpZnkoaW5wdXQsIC4uLmFyZ3YpO1xyXG5cclxuXHRyZXR1cm4gcmV0IHx8IGhhc2hTdW0oaW5wdXQpO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgRXB1Yk1ha2VyXHJcbntcclxuXHRwdWJsaWMgZXB1YkNvbmZpZzogRXB1YkNvbmZpZztcclxuXHJcblx0Y29uc3RydWN0b3Iob3B0aW9ucyA9IHt9LCBjb25maWc/OiBJRXB1YkNvbmZpZylcclxuXHR7XHJcblx0XHR0aGlzLmVwdWJDb25maWcgPSBuZXcgRXB1YkNvbmZpZyhjb25maWcsIG9wdGlvbnMpO1xyXG5cdH1cclxuXHJcblx0c3RhdGljIGNyZWF0ZShvcHRpb25zPywgLi4uYXJndilcclxuXHR7XHJcblx0XHRyZXR1cm4gbmV3IHRoaXMob3B0aW9ucywgLi4uYXJndik7XHJcblx0fVxyXG5cclxuXHR3aXRoVXVpZCh1dWlkOiBzdHJpbmcpXHJcblx0e1xyXG5cdFx0dGhpcy5lcHViQ29uZmlnLnV1aWQgPSB1dWlkO1xyXG5cdFx0cmV0dXJuIHRoaXM7XHJcblx0fVxyXG5cclxuXHR3aXRoVGVtcGxhdGUodGVtcGxhdGVOYW1lKVxyXG5cdHtcclxuXHRcdHRoaXMuZXB1YkNvbmZpZy50ZW1wbGF0ZU5hbWUgPSB0ZW1wbGF0ZU5hbWU7XHJcblx0XHRyZXR1cm4gdGhpcztcclxuXHR9XHJcblxyXG5cdHNsdWdpZnkoaW5wdXQ6IHN0cmluZywgLi4uYXJndik6IHN0cmluZ1xyXG5cdHtcclxuXHRcdGxldCBmbiA9IHRoaXMuZXB1YkNvbmZpZy5vcHRpb25zLmxpYlNsdWdpZnkgfHwgc2x1Z2lmeTtcclxuXHJcblx0XHRyZXR1cm4gZm4oaW5wdXQgfHwgJycsIC4uLmFyZ3YpLnRyaW0oKTtcclxuXHR9XHJcblxyXG5cdHNsdWdpZnlXaXRoRmFsbGJhY2soaW5wdXQ6IHN0cmluZywgLi4uYXJndik6IHN0cmluZ1xyXG5cdHtcclxuXHRcdGxldCByZXQgPSB0aGlzLnNsdWdpZnkoaW5wdXQsIC4uLmFyZ3YpO1xyXG5cclxuXHRcdHJldHVybiByZXQgfHwgaGFzaFN1bShpbnB1dCk7XHJcblx0fVxyXG5cclxuXHR3aXRoVGl0bGUodGl0bGU6IHN0cmluZywgdGl0bGVfc2hvcnQ/OiBzdHJpbmcpXHJcblx0e1xyXG5cdFx0dGhpcy5lcHViQ29uZmlnLnRpdGxlID0gdGl0bGU7XHJcblx0XHQvLyBAdHMtaWdub3JlXHJcblx0XHR0aGlzLmVwdWJDb25maWcuc2x1ZyA9IHRoaXMuc2x1Z2lmeVdpdGhGYWxsYmFjayh0aXRsZSB8fCB0aXRsZV9zaG9ydCk7XHJcblxyXG5cdFx0aWYgKHRpdGxlX3Nob3J0KVxyXG5cdFx0e1xyXG5cdFx0XHR0aGlzLmVwdWJDb25maWcudGl0bGVfc2hvcnQgPSB0aXRsZV9zaG9ydDtcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gdGhpcztcclxuXHR9XHJcblxyXG5cdGFkZFRpdGxlcyh0aXRsZXM6IHN0cmluZ1tdKVxyXG5cdHtcclxuXHRcdHRoaXMuZXB1YkNvbmZpZy50aXRsZXMgPSB0aXRsZXMgfHwgW107XHJcblxyXG5cdFx0cmV0dXJuIHRoaXM7XHJcblx0fVxyXG5cclxuXHR3aXRoTGFuZ3VhZ2UobGFuZzogc3RyaW5nKVxyXG5cdHtcclxuXHRcdHRoaXMuZXB1YkNvbmZpZy5sYW5nID0gbGFuZztcclxuXHRcdHJldHVybiB0aGlzO1xyXG5cdH1cclxuXHJcblx0Z2V0IGxhbmcoKVxyXG5cdHtcclxuXHRcdHJldHVybiB0aGlzLmVwdWJDb25maWcubGFuZztcclxuXHR9XHJcblxyXG5cdHdpdGhBdXRob3IoZnVsbE5hbWU6IHN0cmluZywgdXJsPzogc3RyaW5nKVxyXG5cdHtcclxuXHRcdHRoaXMuZXB1YkNvbmZpZy5hdXRob3IgPSBmdWxsTmFtZTtcclxuXHRcdHRoaXMuZXB1YkNvbmZpZy5hdXRob3JVcmwgPSB1cmw7XHJcblx0XHRyZXR1cm4gdGhpcztcclxuXHR9XHJcblxyXG5cdGFkZEF1dGhvcihmdWxsTmFtZTogc3RyaW5nLCB1cmw/OiBzdHJpbmcpXHJcblx0YWRkQXV0aG9yKGZ1bGxOYW1lOiBzdHJpbmdbXSlcclxuXHRhZGRBdXRob3IoZnVsbE5hbWU6IHsgW2tleTogc3RyaW5nXTogc3RyaW5nOyB9KVxyXG5cdGFkZEF1dGhvcihmdWxsTmFtZTogc3RyaW5nXHJcblx0XHR8IHN0cmluZ1tdXHJcblx0XHR8IHsgW2tleTogc3RyaW5nXTogc3RyaW5nOyB9XHJcblx0XHQsIHVybD86IHN0cmluZ1xyXG5cdClcclxuXHR7XHJcblx0XHRsZXQgc2VsZiA9IHRoaXM7XHJcblxyXG5cdFx0aWYgKEFycmF5LmlzQXJyYXkoZnVsbE5hbWUpKVxyXG5cdFx0e1xyXG5cdFx0XHRmdWxsTmFtZS5mb3JFYWNoKG5hbWUgPT4ge1xyXG5cdFx0XHRcdG5hbWUgJiYgc2VsZi5lcHViQ29uZmlnLmFkZEF1dGhvcihuYW1lKTtcclxuXHRcdFx0fSk7XHJcblx0XHR9XHJcblx0XHRlbHNlIGlmICh0eXBlb2YgZnVsbE5hbWUgPT0gJ29iamVjdCcpXHJcblx0XHR7XHJcblx0XHRcdGZvciAobGV0IG5hbWUgaW4gZnVsbE5hbWUpXHJcblx0XHRcdHtcclxuXHRcdFx0XHRuYW1lICYmIHNlbGYuZXB1YkNvbmZpZy5hZGRBdXRob3IobmFtZSwgZnVsbE5hbWVbbmFtZV0pO1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHRlbHNlIGlmIChmdWxsTmFtZSlcclxuXHRcdHtcclxuXHRcdFx0c2VsZi5lcHViQ29uZmlnLmFkZEF1dGhvcihmdWxsTmFtZSBhcyBzdHJpbmcsIHVybCk7XHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIHRoaXM7XHJcblx0fVxyXG5cclxuXHR3aXRoUHVibGlzaGVyKHB1Ymxpc2hlcjogc3RyaW5nKVxyXG5cdHtcclxuXHRcdHRoaXMuZXB1YkNvbmZpZy5wdWJsaXNoZXIgPSBwdWJsaXNoZXI7XHJcblx0XHRyZXR1cm4gdGhpcztcclxuXHR9XHJcblxyXG5cdHdpdGhDb2xsZWN0aW9uKGRhdGE6IElDb2xsZWN0aW9uKVxyXG5cdHtcclxuXHRcdHRoaXMuZXB1YkNvbmZpZy5jb2xsZWN0aW9uID0gT2JqZWN0LmFzc2lnbih0aGlzLmVwdWJDb25maWcuY29sbGVjdGlvbiB8fCB7fSwgZGF0YSk7XHJcblxyXG5cdFx0Ly9jb25zb2xlLmxvZyh0aGlzLmVwdWJDb25maWcuY29sbGVjdGlvbik7XHJcblxyXG5cdFx0cmV0dXJuIHRoaXM7XHJcblx0fVxyXG5cclxuXHR3aXRoU2VyaWVzKG5hbWU6IHN0cmluZywgcG9zaXRpb24gPSAxKVxyXG5cdHtcclxuXHRcdGlmIChuYW1lKVxyXG5cdFx0e1xyXG5cdFx0XHR0aGlzLndpdGhDb2xsZWN0aW9uKHtcclxuXHRcdFx0XHRuYW1lLFxyXG5cdFx0XHRcdHBvc2l0aW9uLFxyXG5cdFx0XHRcdHR5cGU6ICdzZXJpZXMnLFxyXG5cdFx0XHR9KVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0d2l0aE1vZGlmaWNhdGlvbkRhdGUobW9kaWZpY2F0aW9uRGF0ZSwgLi4uYXJndilcclxuXHR7XHJcblx0XHRsZXQgZGF0YSA9IG1vbWVudChtb2RpZmljYXRpb25EYXRlLCAuLi5hcmd2KS5sb2NhbCgpO1xyXG5cclxuXHRcdHRoaXMuZXB1YkNvbmZpZy5tb2RpZmljYXRpb24gPSBkYXRhO1xyXG5cdFx0dGhpcy5lcHViQ29uZmlnLm1vZGlmaWNhdGlvbkRhdGUgPSBkYXRhLmZvcm1hdChFcHViTWFrZXIuZGF0ZUZvcm1hdCk7XHJcblx0XHR0aGlzLmVwdWJDb25maWcubW9kaWZpY2F0aW9uRGF0ZVlNRCA9IGRhdGEuZm9ybWF0KCdZWVlZLU1NLUREJyk7XHJcblx0XHRyZXR1cm4gdGhpcztcclxuXHR9XHJcblxyXG5cdHdpdGhSaWdodHMocmlnaHRzQ29uZmlnOiBJUmlnaHRzQ29uZmlnKVxyXG5cdHtcclxuXHRcdHRoaXMuZXB1YkNvbmZpZy5yaWdodHMgPSByaWdodHNDb25maWc7XHJcblx0XHRyZXR1cm4gdGhpcztcclxuXHR9XHJcblxyXG5cdHdpdGhDb3Zlcihjb3ZlclVybDogc3RyaW5nIHwgSUNvdmVyLCByaWdodHNDb25maWc/OiBJUmlnaHRzQ29uZmlnKVxyXG5cdHtcclxuXHRcdGxldCBjb3ZlciA9IHBhcnNlRmlsZVNldHRpbmcoY292ZXJVcmwsIHRoaXMuZXB1YkNvbmZpZykgYXMgSUNvdmVyO1xyXG5cclxuXHRcdGlmIChjb3ZlciAmJiByaWdodHNDb25maWcpXHJcblx0XHR7XHJcblx0XHRcdGNvdmVyLnJpZ2h0cyA9IHJpZ2h0c0NvbmZpZztcclxuXHRcdH1cclxuXHJcblx0XHRpZiAoIWNvdmVyKVxyXG5cdFx0e1xyXG5cdFx0XHR0aHJvdyBuZXcgUmVmZXJlbmNlRXJyb3IoKTtcclxuXHRcdH1cclxuXHJcblx0XHR0aGlzLmVwdWJDb25maWcuY292ZXIgPSBPYmplY3QuYXNzaWduKHRoaXMuZXB1YkNvbmZpZy5jb3ZlciB8fCB7fSwgY292ZXIpO1xyXG5cclxuXHRcdC8vdGhpcy5lcHViQ29uZmlnLmNvdmVyVXJsID0gY292ZXJVcmw7XHJcblx0XHQvL3RoaXMuZXB1YkNvbmZpZy5jb3ZlclJpZ2h0cyA9IHJpZ2h0c0NvbmZpZztcclxuXHJcblx0XHRyZXR1cm4gdGhpcztcclxuXHR9XHJcblxyXG5cdHdpdGhBdHRyaWJ1dGlvblVybChhdHRyaWJ1dGlvblVybClcclxuXHR7XHJcblx0XHR0aGlzLmVwdWJDb25maWcuYXR0cmlidXRpb25VcmwgPSBhdHRyaWJ1dGlvblVybDtcclxuXHRcdHJldHVybiB0aGlzO1xyXG5cdH1cclxuXHJcblx0d2l0aFN0eWxlc2hlZXRVcmwoc3R5bGVzaGVldFVybCwgcmVwbGFjZU9yaWdpbmFsPzogYm9vbGVhbilcclxuXHR7XHJcblx0XHRsZXQgZGF0YSA9IHBhcnNlRmlsZVNldHRpbmcoc3R5bGVzaGVldFVybCwgdGhpcy5lcHViQ29uZmlnKSBhcyBJU3R5bGVzaGVldDtcclxuXHJcblx0XHR0aGlzLmVwdWJDb25maWcuc3R5bGVzaGVldCA9IE9iamVjdC5hc3NpZ24odGhpcy5lcHViQ29uZmlnLnN0eWxlc2hlZXQsIGRhdGEsIHtcclxuXHRcdFx0cmVwbGFjZU9yaWdpbmFsOiByZXBsYWNlT3JpZ2luYWwsXHJcblx0XHR9KTtcclxuXHJcblx0XHRyZXR1cm4gdGhpcztcclxuXHR9XHJcblxyXG5cdHdpdGhTZWN0aW9uKHNlY3Rpb246IEVwdWJNYWtlci5TZWN0aW9uKVxyXG5cdHtcclxuXHRcdHNlY3Rpb24ucGFyZW50RXB1Yk1ha2VyID0gdGhpcztcclxuXHJcblx0XHR0aGlzLmVwdWJDb25maWcuc2VjdGlvbnMucHVzaChzZWN0aW9uKTtcclxuXHRcdEFycmF5LnByb3RvdHlwZS5wdXNoLmFwcGx5KHRoaXMuZXB1YkNvbmZpZy50b2MsIHNlY3Rpb24uY29sbGVjdFRvYygpKTtcclxuXHRcdEFycmF5LnByb3RvdHlwZS5wdXNoLmFwcGx5KHRoaXMuZXB1YkNvbmZpZy5sYW5kbWFya3MsIHNlY3Rpb24uY29sbGVjdExhbmRtYXJrcygpKTtcclxuXHRcdHJldHVybiB0aGlzO1xyXG5cdH1cclxuXHJcblx0d2l0aEFkZGl0aW9uYWxGaWxlKGZpbGVVcmwsIGZvbGRlciwgZmlsZW5hbWUpXHJcblx0e1xyXG5cdFx0bGV0IF9maWxlID0gcGFyc2VGaWxlU2V0dGluZyhmaWxlVXJsLCB0aGlzLmVwdWJDb25maWcpIGFzIElDb3ZlcjtcclxuXHJcblx0XHRfZmlsZSA9IE9iamVjdC5hc3NpZ24oe30sIF9maWxlLCB7XHJcblx0XHRcdGZvbGRlcjogZm9sZGVyLFxyXG5cdFx0XHRuYW1lOiBmaWxlbmFtZVxyXG5cdFx0fSk7XHJcblxyXG5cdFx0dGhpcy5lcHViQ29uZmlnLmFkZGl0aW9uYWxGaWxlcy5wdXNoKF9maWxlKTtcclxuXHJcblx0XHRyZXR1cm4gdGhpcztcclxuXHR9XHJcblxyXG5cdHdpdGhPcHRpb24oa2V5OiBzdHJpbmcsIHZhbHVlKVxyXG5cdHtcclxuXHRcdHRoaXMuZXB1YkNvbmZpZy5vcHRpb25zW2tleV0gPSB2YWx1ZTtcclxuXHRcdHJldHVybiB0aGlzO1xyXG5cdH1cclxuXHJcblx0d2l0aEluZm9QcmVmYWNlKHN0cjogc3RyaW5nKVxyXG5cdHtcclxuXHRcdGlmIChzdHIpXHJcblx0XHR7XHJcblx0XHRcdHRoaXMuZXB1YkNvbmZpZy5pbmZvUHJlZmFjZSA9IHN0ci50b1N0cmluZygpO1xyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiB0aGlzO1xyXG5cdH1cclxuXHJcblx0YWRkSWRlbnRpZmllcih0eXBlOiBzdHJpbmcsIGlkPzogc3RyaW5nKVxyXG5cdHtcclxuXHRcdHRoaXMuZXB1YkNvbmZpZy5hZGRJZGVudGlmaWVyKHR5cGUsIGlkKTtcclxuXHRcdHJldHVybiB0aGlzO1xyXG5cdH1cclxuXHJcblx0YWRkTGlua3MobGlua3MsIHJlbD86IHN0cmluZylcclxuXHR7XHJcblx0XHRjb25zdCBzZWxmID0gdGhpcztcclxuXHJcblx0XHRsaW5rcyA9IEFycmF5LmlzQXJyYXkobGlua3MpID8gbGlua3Muc2xpY2UoKSA6IFtsaW5rc107XHJcblxyXG5cdFx0bGlua3MuZm9yRWFjaChmdW5jdGlvbiAodXJsKVxyXG5cdFx0e1xyXG5cdFx0XHRpZiAodXJsKVxyXG5cdFx0XHR7XHJcblx0XHRcdFx0c2VsZi5lcHViQ29uZmlnLmFkZExpbmsodXJsLCByZWwpO1xyXG5cdFx0XHR9XHJcblx0XHR9KTtcclxuXHJcblx0XHRyZXR1cm4gdGhpcztcclxuXHR9XHJcblxyXG5cdGFkZFRhZyh0YWcpXHJcblx0e1xyXG5cdFx0dGFnID0gKEFycmF5LmlzQXJyYXkodGFnKSA/IHRhZyA6IFt0YWddKS5yZWR1Y2UoZnVuY3Rpb24gKGEsIGIpXHJcblx0XHR7XHJcblx0XHRcdGlmIChBcnJheS5pc0FycmF5KGIpKVxyXG5cdFx0XHR7XHJcblx0XHRcdFx0cmV0dXJuIGEuY29uY2F0KGIpO1xyXG5cdFx0XHR9XHJcblx0XHRcdGVsc2VcclxuXHRcdFx0e1xyXG5cdFx0XHRcdGEucHVzaChiKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0cmV0dXJuIGE7XHJcblx0XHR9LCBbXSk7XHJcblxyXG5cdFx0dGhpcy5lcHViQ29uZmlnLnRhZ3MgPSAodGhpcy5lcHViQ29uZmlnLnRhZ3MgfHwgW10pLmNvbmNhdCh0YWcpO1xyXG5cdFx0cmV0dXJuIHRoaXM7XHJcblx0fVxyXG5cclxuXHRzZXRQdWJsaWNhdGlvbkRhdGUobmV3X2RhdGE/KVxyXG5cdHtcclxuXHRcdGxldCBkYXRhID0gbW9tZW50KG5ld19kYXRhKTtcclxuXHJcblx0XHR0aGlzLmVwdWJDb25maWcucHVibGljYXRpb24gPSBkYXRhO1xyXG5cdFx0dGhpcy5lcHViQ29uZmlnLnB1YmxpY2F0aW9uRGF0ZSA9IGRhdGEuZm9ybWF0KEVwdWJNYWtlci5kYXRlRm9ybWF0KTtcclxuXHRcdHRoaXMuZXB1YkNvbmZpZy5wdWJsaWNhdGlvbkRhdGVZTUQgPSBkYXRhLmZvcm1hdCgnWVlZWS1NTS1ERCcpO1xyXG5cclxuXHRcdHJldHVybiB0aGlzO1xyXG5cdH1cclxuXHJcblx0Z2V0RmlsZW5hbWUodXNlVGl0bGU/OiBib29sZWFuLCBub0V4dD86IGJvb2xlYW4pOiBzdHJpbmdcclxuXHR7XHJcblx0XHRsZXQgZXh0ID0gdGhpcy5lcHViQ29uZmlnLm9wdGlvbnMuZXh0IHx8IEVwdWJNYWtlci5kZWZhdWx0RXh0O1xyXG5cdFx0bGV0IGZpbGVuYW1lO1xyXG5cclxuXHRcdGlmICh0aGlzLmVwdWJDb25maWcuZmlsZW5hbWUpXHJcblx0XHR7XHJcblx0XHRcdGZpbGVuYW1lID0gdGhpcy5lcHViQ29uZmlnLmZpbGVuYW1lO1xyXG5cdFx0fVxyXG5cdFx0ZWxzZSBpZiAodXNlVGl0bGUgJiYgdGhpcy5lcHViQ29uZmlnLnRpdGxlX3Nob3J0KVxyXG5cdFx0e1xyXG5cdFx0XHRmaWxlbmFtZSA9IHRoaXMuZXB1YkNvbmZpZy50aXRsZV9zaG9ydDtcclxuXHRcdH1cclxuXHRcdGVsc2UgaWYgKHVzZVRpdGxlICYmIHRoaXMuZXB1YkNvbmZpZy50aXRsZSlcclxuXHRcdHtcclxuXHRcdFx0ZmlsZW5hbWUgPSB0aGlzLmVwdWJDb25maWcudGl0bGU7XHJcblx0XHR9XHJcblx0XHRlbHNlIGlmICghdGhpcy5lcHViQ29uZmlnLnNsdWcpXHJcblx0XHR7XHJcblx0XHRcdC8vIEB0cy1pZ25vcmVcclxuXHRcdFx0dGhpcy5lcHViQ29uZmlnLnNsdWcgPSBzaG9ydGlkKCk7XHJcblxyXG5cdFx0XHRmaWxlbmFtZSA9IHRoaXMuZXB1YkNvbmZpZy5zbHVnO1xyXG5cdFx0fVxyXG5cdFx0ZWxzZVxyXG5cdFx0e1xyXG5cclxuXHJcblx0XHRcdGZpbGVuYW1lID0gdGhpcy5lcHViQ29uZmlnLnNsdWc7XHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIHRyaW1GaWxlbmFtZShmaWxlbmFtZSkgKyAobm9FeHQgPyAnJyA6IGV4dCk7XHJcblx0fVxyXG5cclxuXHR2YWlsZCgpXHJcblx0e1xyXG5cdFx0bGV0IHJldCA9IFtdO1xyXG5cclxuXHRcdGlmICghdGhpcy5lcHViQ29uZmlnLnRpdGxlIHx8ICF0aGlzLmVwdWJDb25maWcuc2x1ZylcclxuXHRcdHtcclxuXHRcdFx0cmV0LnB1c2goJ3RpdGxlLCBzbHVnJyk7XHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKHJldC5sZW5ndGgpXHJcblx0XHR7XHJcblx0XHRcdHJldHVybiByZXQ7XHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIG51bGw7XHJcblx0fVxyXG5cclxuXHRidWlsZChvcHRpb25zPylcclxuXHR7XHJcblx0XHRsZXQgc2VsZiA9IHRoaXM7XHJcblxyXG5cdFx0aWYgKCF0aGlzLmVwdWJDb25maWcucHVibGljYXRpb24pXHJcblx0XHR7XHJcblx0XHRcdHRoaXMuc2V0UHVibGljYXRpb25EYXRlKCk7XHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKCF0aGlzLmVwdWJDb25maWcudXVpZClcclxuXHRcdHtcclxuXHRcdFx0dGhpcy53aXRoVXVpZChjcmVhdGVVVUlEKHRoaXMuZXB1YkNvbmZpZykpO1xyXG5cdFx0fVxyXG5cclxuXHRcdHRoaXMuZXB1YkNvbmZpZy4kYXV0bygpO1xyXG5cclxuXHRcdGxldCBjaGsgPSB0aGlzLnZhaWxkKCk7XHJcblxyXG5cdFx0aWYgKGNoaylcclxuXHRcdHtcclxuXHRcdFx0dGhyb3cgY2hrO1xyXG5cdFx0fVxyXG5cclxuXHRcdFtdXHJcblx0XHRcdC5jb25jYXQodGhpcy5lcHViQ29uZmlnLnNlY3Rpb25zLCB0aGlzLmVwdWJDb25maWcudG9jLCB0aGlzLmVwdWJDb25maWcubGFuZG1hcmtzKVxyXG5cdFx0XHQuZm9yRWFjaChmdW5jdGlvbiAoc2VjdGlvbjogRXB1Yk1ha2VyLlNlY3Rpb24sIGluZGV4KVxyXG5cdFx0XHR7XHJcblx0XHRcdFx0c2VjdGlvbi5fRXB1Yk1ha2VyXyA9IHNlbGY7XHJcblx0XHRcdH0pXHJcblx0XHQ7XHJcblxyXG5cdFx0cmV0dXJuIHRlbXBsYXRlTWFuYWdlcnMuZXhlYyh0aGlzLmVwdWJDb25maWcudGVtcGxhdGVOYW1lLCB0aGlzLCBvcHRpb25zKTtcclxuXHR9XHJcblxyXG5cdC8qKlxyXG5cdCAqIGZvciBub2RlLmpzXHJcblx0ICpcclxuXHQgKiBAcGFyYW0gb3B0aW9uc1xyXG5cdCAqIEByZXR1cm5zIHtQcm9taXNlPFQ+fVxyXG5cdCAqL1xyXG5cdG1ha2VFcHViPFQgPSBCdWZmZXIgfCBCbG9iPihvcHRpb25zPyk6IFByb21pc2U8VCB8IGFueSB8IEJ1ZmZlciB8IEJsb2I+XHJcblx0e1xyXG5cdFx0bGV0IHNlbGYgPSB0aGlzO1xyXG5cclxuXHRcdHJldHVybiB0aGlzLmJ1aWxkKG9wdGlvbnMpLnRoZW4oYXN5bmMgZnVuY3Rpb24gKGVwdWJaaXApXHJcblx0XHR7XHJcblx0XHRcdGxldCBnZW5lcmF0ZU9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHtcclxuXHRcdFx0XHR0eXBlOiAnbm9kZWJ1ZmZlcicsXHJcblx0XHRcdFx0bWltZVR5cGU6ICdhcHBsaWNhdGlvbi9lcHViK3ppcCcsXHJcblx0XHRcdFx0Y29tcHJlc3Npb246ICdERUZMQVRFJyxcclxuXHRcdFx0XHRjb21wcmVzc2lvbk9wdGlvbnM6IHtcclxuXHRcdFx0XHRcdGxldmVsOiA5XHJcblx0XHRcdFx0fSxcclxuXHRcdFx0fSwgc2VsZi5lcHViQ29uZmlnLm9wdGlvbnMuZ2VuZXJhdGVPcHRpb25zLCBvcHRpb25zKTtcclxuXHJcblx0XHRcdGNvbnNvbGUuaW5mbygnZ2VuZXJhdGluZyBlcHViIGZvcjogJyArIHNlbGYuZXB1YkNvbmZpZy50aXRsZSk7XHJcblx0XHRcdGxldCBjb250ZW50ID0gYXdhaXQgZXB1YlppcC5nZW5lcmF0ZUFzeW5jKGdlbmVyYXRlT3B0aW9ucyk7XHJcblxyXG5cdFx0XHRyZXR1cm4gY29udGVudDtcclxuXHRcdH0pO1xyXG5cdH1cclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJU2VjdGlvbkNvbmZpZ1xyXG57XHJcblx0bGFuZz86IHN0cmluZztcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJU2VjdGlvbkNvbnRlbnRcclxue1xyXG5cdHRpdGxlPzogc3RyaW5nO1xyXG5cdGNvbnRlbnQ/OiBzdHJpbmc7XHJcblxyXG5cdHJlbmRlclRpdGxlPzogYm9vbGVhbjtcclxuXHJcblx0Y292ZXI/OiB7XHJcblx0XHRuYW1lPzogc3RyaW5nLFxyXG5cdFx0dXJsPzogc3RyaW5nLFxyXG5cdH1cclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJU2x1Z2lmeVxyXG57XHJcblx0KGlucHV0OiBzdHJpbmcsIC4uLmFyZ3YpOiBzdHJpbmdcclxufVxyXG5cclxuZXhwb3J0IG5hbWVzcGFjZSBFcHViTWFrZXJcclxue1xyXG5cdGV4cG9ydCBsZXQgZGVmYXVsdEV4dCA9ICcuZXB1Yic7XHJcblx0ZXhwb3J0IGxldCBkYXRlRm9ybWF0ID0gJ1lZWVktTU0tRERUSEg6bW06c3MuU1NTWic7XHJcblxyXG5cdC8vIGVwdWJ0eXBlcyBhbmQgZGVzY3JpcHRpb25zLCB1c2VmdWwgZm9yIHZlbmRvcnMgaW1wbGVtZW50aW5nIGEgR1VJXHJcblx0Ly8gQHRzLWlnbm9yZVxyXG5cdGV4cG9ydCBjb25zdCBlcHVidHlwZXMgPSByZXF1aXJlKCcuL2VwdWItdHlwZXMuanMnKTtcclxuXHJcblx0Ly8gQHRzLWlnbm9yZVxyXG5cdGV4cG9ydCBsZXQgbGliU2x1Z2lmeSA9IF9zbHVnaWZ5IGFzIElTbHVnaWZ5O1xyXG5cclxuXHQvKipcclxuXHQgKiBAZXB1YlR5cGUgT3B0aW9uYWwuIEFsbG93cyB5b3UgdG8gYWRkIHNwZWNpZmljIGVwdWIgdHlwZSBjb250ZW50IHN1Y2ggYXMgW2VwdWI6dHlwZT1cInRpdGxlcGFnZVwiXVxyXG5cdCAqIEBpZCBPcHRpb25hbCwgYnV0IHJlcXVpcmVkIGlmIHNlY3Rpb24gc2hvdWxkIGJlIGluY2x1ZGVkIGluIHRvYyBhbmQgLyBvciBsYW5kbWFya3NcclxuXHQgKiBAY29udGVudCBPcHRpb25hbC4gU2hvdWxkIG5vdCBiZSBlbXB0eSBpZiB0aGVyZSB3aWxsIGJlIG5vIHN1YnNlY3Rpb25zIGFkZGVkIHRvIHRoaXMgc2VjdGlvbi4gRm9ybWF0OiB7IHRpdGxlLCBjb250ZW50LCByZW5kZXJUaXRsZSB9XHJcblx0ICovXHJcblx0ZXhwb3J0IGNsYXNzIFNlY3Rpb25cclxuXHR7XHJcblx0XHRwdWJsaWMgX0VwdWJNYWtlcl86IEVwdWJNYWtlcjtcclxuXHJcblx0XHRwdWJsaWMgZXB1YlR5cGU7XHJcblx0XHRwdWJsaWMgaWQ7XHJcblx0XHRwdWJsaWMgY29udGVudDogSVNlY3Rpb25Db250ZW50O1xyXG5cdFx0cHVibGljIGluY2x1ZGVJblRvYzogYm9vbGVhbjtcclxuXHRcdHB1YmxpYyBpbmNsdWRlSW5MYW5kbWFya3M6IGJvb2xlYW47XHJcblx0XHRwdWJsaWMgc3ViU2VjdGlvbnM6IFNlY3Rpb25bXSA9IFtdO1xyXG5cclxuXHRcdHB1YmxpYyBzZWN0aW9uQ29uZmlnOiBJU2VjdGlvbkNvbmZpZyA9IHt9O1xyXG5cclxuXHRcdHB1YmxpYyBwYXJlbnRTZWN0aW9uOiBTZWN0aW9uO1xyXG5cdFx0cHVibGljIHBhcmVudEVwdWJNYWtlcjogRXB1Yk1ha2VyO1xyXG5cclxuXHRcdGNvbnN0cnVjdG9yKGVwdWJUeXBlLCBpZCwgY29udGVudCwgaW5jbHVkZUluVG9jPzogYm9vbGVhbiwgaW5jbHVkZUluTGFuZG1hcmtzPzogYm9vbGVhbiwgLi4uYXJndilcclxuXHRcdHtcclxuXHRcdFx0dGhpcy5lcHViVHlwZSA9IGVwdWJUeXBlO1xyXG5cdFx0XHR0aGlzLmlkID0gaWQ7XHJcblxyXG5cdFx0XHR0aGlzLmluY2x1ZGVJblRvYyA9IGluY2x1ZGVJblRvYztcclxuXHRcdFx0dGhpcy5pbmNsdWRlSW5MYW5kbWFya3MgPSBpbmNsdWRlSW5MYW5kbWFya3M7XHJcblx0XHRcdHRoaXMuc3ViU2VjdGlvbnMgPSBbXTtcclxuXHJcblx0XHRcdC8qXHJcblx0XHRcdHRoaXMuY29udGVudCA9IGNvbnRlbnQ7XHJcblx0XHRcdGlmIChjb250ZW50KVxyXG5cdFx0XHR7XHJcblx0XHRcdFx0Y29udGVudC5yZW5kZXJUaXRsZSA9IGNvbnRlbnQucmVuZGVyVGl0bGUgIT09IGZhbHNlOyAvLyAndW5kZWZpbmVkJyBzaG91bGQgZGVmYXVsdCB0byB0cnVlXHJcblx0XHRcdH1cclxuXHRcdFx0Ki9cclxuXHJcblx0XHRcdHRoaXMuc2V0Q29udGVudChjb250ZW50LCB0cnVlKTtcclxuXHRcdH1cclxuXHJcblx0XHQvKipcclxuXHRcdCAqXHJcblx0XHQgKiBAcGFyYW0ge0lTZWN0aW9uQ29udGVudHxzdHJpbmd9IGNvbnRlbnRcclxuXHRcdCAqIEBwYXJhbSB7Ym9vbGVhbn0gYWxsb3dfbnVsbFxyXG5cdFx0ICogQHJldHVybnMge3RoaXN9XHJcblx0XHQgKi9cclxuXHRcdHNldENvbnRlbnQoY29udGVudDogSVNlY3Rpb25Db250ZW50LCBhbGxvd19udWxsPzogYm9vbGVhbilcclxuXHRcdHtcclxuXHRcdFx0bGV0IG8gPSB7fSBhcyBJU2VjdGlvbkNvbnRlbnQ7XHJcblxyXG5cdFx0XHRpZiAodHlwZW9mIGNvbnRlbnQgPT0gJ3N0cmluZycpXHJcblx0XHRcdHtcclxuXHRcdFx0XHRvLmNvbnRlbnQgPSBjb250ZW50O1xyXG5cdFx0XHR9XHJcblx0XHRcdGVsc2UgaWYgKGNvbnRlbnQudGl0bGUgfHwgY29udGVudC5jb250ZW50IHx8IGNvbnRlbnQucmVuZGVyVGl0bGUgfHwgY29udGVudC5jb3ZlcilcclxuXHRcdFx0e1xyXG5cdFx0XHRcdG8gPSBjb250ZW50O1xyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRpZiAoT2JqZWN0LmtleXMobykubGVuZ3RoKVxyXG5cdFx0XHR7XHJcblx0XHRcdFx0aWYgKHRoaXMuY29udGVudClcclxuXHRcdFx0XHR7XHJcblx0XHRcdFx0XHR0aGlzLmNvbnRlbnQgPSBPYmplY3QuYXNzaWduKHRoaXMuY29udGVudCwgbyk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGVsc2VcclxuXHRcdFx0XHR7XHJcblx0XHRcdFx0XHR0aGlzLmNvbnRlbnQgPSBvO1xyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0dGhpcy5jb250ZW50LnJlbmRlclRpdGxlID0gdGhpcy5jb250ZW50LnJlbmRlclRpdGxlICE9PSBmYWxzZTtcclxuXHJcblx0XHRcdH0gZWxzZSBpZiAoY29udGVudClcclxuXHRcdFx0e1xyXG5cdFx0XHRcdHRoaXMuY29udGVudCA9IGNvbnRlbnQ7XHJcblx0XHRcdH1cclxuXHRcdFx0ZWxzZSBpZiAoIWFsbG93X251bGwpXHJcblx0XHRcdHtcclxuXHRcdFx0XHR0aHJvdyBuZXcgUmVmZXJlbmNlRXJyb3IoKTtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0cmV0dXJuIHRoaXM7XHJcblx0XHR9XHJcblxyXG5cdFx0Z2V0IGVwdWJUeXBlR3JvdXAoKVxyXG5cdFx0e1xyXG5cdFx0XHRyZXR1cm4gZXB1YnR5cGVzLmdldEdyb3VwKHRoaXMuZXB1YlR5cGUpO1xyXG5cdFx0fVxyXG5cclxuXHRcdGdldCBsYW5nKClcclxuXHRcdHtcclxuXHRcdFx0cmV0dXJuIHRoaXMuc2VjdGlvbkNvbmZpZy5sYW5nIHx8ICh0aGlzLl9FcHViTWFrZXJfID8gdGhpcy5fRXB1Yk1ha2VyXy5sYW5nIDogbnVsbCkgfHwgbnVsbDtcclxuXHRcdH1cclxuXHJcblx0XHRnZXQgbGFuZ01haW4oKVxyXG5cdFx0e1xyXG5cdFx0XHRyZXR1cm4gKHRoaXMuX0VwdWJNYWtlcl8gPyB0aGlzLl9FcHViTWFrZXJfLmxhbmcgOiBudWxsKSB8fCBudWxsO1xyXG5cdFx0fVxyXG5cclxuXHRcdHN0YXRpYyBjcmVhdGUoZXB1YlR5cGUsIGlkLCBjb250ZW50LCBpbmNsdWRlSW5Ub2M6IGJvb2xlYW4sIGluY2x1ZGVJbkxhbmRtYXJrczogYm9vbGVhbiwgLi4uYXJndilcclxuXHRcdHtcclxuXHRcdFx0cmV0dXJuIG5ldyB0aGlzKGVwdWJUeXBlLCBpZCwgY29udGVudCwgaW5jbHVkZUluVG9jLCBpbmNsdWRlSW5MYW5kbWFya3MsIC4uLmFyZ3YpO1xyXG5cdFx0fVxyXG5cclxuXHRcdHdpdGhTdWJTZWN0aW9uKHN1YnNlY3Rpb246IFNlY3Rpb24pXHJcblx0XHR7XHJcblx0XHRcdHN1YnNlY3Rpb24ucGFyZW50U2VjdGlvbiA9IHRoaXM7XHJcblxyXG5cdFx0XHR0aGlzLnN1YlNlY3Rpb25zLnB1c2goc3Vic2VjdGlvbik7XHJcblx0XHRcdHJldHVybiB0aGlzO1xyXG5cdFx0fTtcclxuXHJcblx0XHRjb2xsZWN0VG9jKClcclxuXHRcdHtcclxuXHRcdFx0cmV0dXJuIHRoaXMuY29sbGVjdFNlY3Rpb25zKHRoaXMsICdpbmNsdWRlSW5Ub2MnKTtcclxuXHRcdH07XHJcblxyXG5cdFx0Y29sbGVjdExhbmRtYXJrcygpXHJcblx0XHR7XHJcblx0XHRcdHJldHVybiB0aGlzLmNvbGxlY3RTZWN0aW9ucyh0aGlzLCAnaW5jbHVkZUluTGFuZG1hcmtzJyk7XHJcblx0XHR9O1xyXG5cclxuXHRcdGNvbGxlY3RTZWN0aW9ucyhzZWN0aW9uOiBTZWN0aW9uLCBwcm9wOiBzdHJpbmcpOiBTZWN0aW9uW11cclxuXHRcdHtcclxuXHRcdFx0bGV0IHNlY3Rpb25zID0gc2VjdGlvbltwcm9wXSA/IFtzZWN0aW9uXSA6IFtdO1xyXG5cdFx0XHRmb3IgKGxldCBpID0gMDsgaSA8IHNlY3Rpb24uc3ViU2VjdGlvbnMubGVuZ3RoOyBpKyspXHJcblx0XHRcdHtcclxuXHRcdFx0XHRBcnJheS5wcm90b3R5cGUucHVzaC5hcHBseShzZWN0aW9ucywgdGhpcy5jb2xsZWN0U2VjdGlvbnMoc2VjdGlvbi5zdWJTZWN0aW9uc1tpXSwgcHJvcCkpO1xyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiBzZWN0aW9ucztcclxuXHRcdH1cclxuXHR9XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IEVwdWJNYWtlcjtcclxuXHJcbmlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJylcclxue1xyXG5cdC8vIEB0cy1pZ25vcmVcclxuXHR3aW5kb3cuRXB1Yk1ha2VyID0gRXB1Yk1ha2VyO1xyXG59XHJcbiJdfQ==