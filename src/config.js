"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
const util_1 = require("./lib/util");
const lib_1 = require("node-novel-info/lib");
const util_2 = require("./lib/util");
const uuid_1 = require("./lib/uuid");
const he_1 = require("he");
var EnumEpubConfigVertical;
(function (EnumEpubConfigVertical) {
    EnumEpubConfigVertical[EnumEpubConfigVertical["NONE"] = 0] = "NONE";
    EnumEpubConfigVertical[EnumEpubConfigVertical["VERTICAL_RL"] = 1] = "VERTICAL_RL";
})(EnumEpubConfigVertical = exports.EnumEpubConfigVertical || (exports.EnumEpubConfigVertical = {}));
class EpubConfig {
    constructor(epubConfig = {}, options = {}) {
        if (epubConfig instanceof EpubConfig) {
            epubConfig = epubConfig.entries(false);
            delete epubConfig.slug;
            delete epubConfig.uuid;
        }
        Object.assign(this, EpubConfig.getDefaultEpubConfig(), lib_1.deepmerge.all([{}, epubConfig, {
                options
            }], lib_1.deepmergeOptions));
    }
    get langMain() {
        return this.lang;
    }
    get subjects() {
        return this.tags;
    }
    set subjects(val) {
        this.tags = val;
    }
    setModification(val, ...argv) {
        let data;
        if (val === true) {
            data = util_1.moment();
        }
        else {
            data = util_1.moment(val, ...argv);
        }
        let self = this;
        self.modification = data.local();
        return this;
    }
    setPublication(val, ...argv) {
        let data;
        if (val === true) {
            data = util_1.moment();
        }
        else {
            data = util_1.moment(val, ...argv);
        }
        let self = this;
        self.publication = data.local();
        return this;
    }
    addAuthor(name, url = null) {
        if (!name) {
            throw new ReferenceError();
        }
        let self = this;
        self.authors = self.authors || {};
        self.authors[name] = url;
        return this;
    }
    addLink(data, rel) {
        rel = (rel || data.rel);
        if (typeof data == 'string') {
            data = {
                href: data.toString(),
                rel,
            };
        }
        let link = Object.assign({
            href: '',
            rel: '',
            id: '',
            refines: '',
            'media-type': '',
        }, data);
        link.href = (link.href || data.href || '').toString();
        link.rel = link.rel || rel || data.rel || 'link-' + util_1.shortid();
        this.links = this.links || [];
        this.links.push(link);
        return this;
    }
    /**
     * isbn:xxx
     * calibre:xxx
     * uuid:xxx
     *
     * @param {string} type
     * @param {string} id
     * @returns {this}
     */
    addIdentifier(type, id) {
        this.identifiers = this.identifiers || [];
        let ids = [];
        if (type && type !== '') {
            ids.push(type.toString());
        }
        if (id && id !== '') {
            ids.push(id.toString());
        }
        if (!ids.length) {
            throw new ReferenceError();
        }
        this.identifiers.push(ids.join(':'));
        return this;
    }
    setVertical(vertical) {
        if (vertical === true) {
            vertical = EnumEpubConfigVertical.VERTICAL_RL;
        }
        this.vertical = vertical || 0;
        return this;
    }
    $clone() {
        // @ts-ignore
        return new (this.__proto__.constructor)(this);
    }
    static $create(epubConfig = {}, options = {}) {
        return new this(epubConfig, options);
    }
    $auto() {
        let self = this;
        self.tags = self.tags || [];
        [
            self.tags,
        ].forEach(a => (a || []).filter(v => v).map(v => v.toString()));
        {
            if (self.authors) {
                self.author = self.author || Object.keys(self.authors)[0];
                self.authorUrl = self.authorUrl || self.authors[self.author];
            }
            if (self.author) {
                let o = {};
                o[self.author] = (self.authorUrl || '').toString();
                self.authors = Object.assign(o, self.authors, o);
            }
            if (self.authors && Object.keys(self.authors).length) {
                for (let name in self.authors) {
                    self.authors[name] = (self.authors[name] || '').toString();
                    self.tags.push(name);
                }
                /**
                 * 防止名稱含有造成 epub 錯誤的狀況
                 */
                let encodeAuthors = Object.entries(self.authors)
                    .reduce((a, b) => {
                    let [key, value] = b.map(v => v && he_1.encode(`${v}`) || v);
                    a[key] = value;
                    return a;
                }, {});
                self.authorsJSON = JSON.stringify(encodeAuthors);
            }
            else {
                self.authors = null;
            }
        }
        if (self.publisher) {
            self.tags.push(self.publisher);
        }
        else {
            self.publisher = 'epub-maker2';
        }
        {
            self.tags.push('epub-maker2');
            if (self.tags) {
                self.tags = util_1.array_unique(self.tags);
            }
        }
        if (self.titles) {
            self.titles = self.titles.filter(v => v && v != self.title && v != self.title_short);
            self.titles = util_1.array_unique(self.titles);
        }
        self.uuid = (self.uuid && typeof self.uuid == 'string') ? self.uuid : uuid_1.createUUID(self);
        self.slug = self.slug
            // @ts-ignore
            || index_1.slugify(self.title)
            || util_1.hashSum(self.title);
        if (!self.modification) {
            self.modification = self.publication.clone();
        }
        if (self.modification) {
            self.modificationDate = self.modification.format('YYYY-MM-DDThh:mm:ss') + 'Z';
            self.modificationDateYMD = self.modification.format('YYYY-MM-DD');
        }
        if (!self.publication) {
            this.setPublication(true);
        }
        if (self.infoPreface) {
            /*
            self.infoPreface = crlf(self.infoPreface).replace(/[ \t\uFEFF\xA0　]+$/gm, '');

            self.infoPrefaceHTML = self.infoPrefaceHTML || self.infoPreface.replace(/\n/g, '<br/>')
            */
            util_2.htmlPreface(self);
        }
        //console.log(self.infoPreface, self.infoPrefaceHTML);
        self.publicationDate = self.publication.format(EpubConfig.dateFormat);
        self.publicationDateYMD = self.publication.format('YYYY-MM-DD');
        if (self.collection || 1) {
            self.collection.name = self.collection.name || self.title;
            self.collection.position = self.collection.position || 1;
            self.collection.type = self.collection.type || 'series';
        }
        this.setVertical(self.vertical);
        return this;
    }
    entries(auto = true) {
        if (auto) {
            this.$auto();
        }
        return Object.entries(this)
            .reduce(function (a, b) {
            a[b[0]] = b[1];
            return a;
        }, {});
    }
    toJSON(auto, replacer = null, space = "\t") {
        if (auto) {
            this.$auto();
        }
        return JSON.stringify(this.entries(), replacer, space);
    }
    toArray(auto) {
        if (auto) {
            this.$auto();
        }
        return Object.entries(this);
    }
}
exports.EpubConfig = EpubConfig;
(function (EpubConfig) {
    EpubConfig.dateFormat = 'YYYY-MM-DDTHH:mm:ss.SSSZ';
    function getDefaultEpubConfig() {
        return {
            toc: [],
            landmarks: [],
            sections: [],
            stylesheet: {},
            additionalFiles: [],
            options: {},
        };
    }
    EpubConfig.getDefaultEpubConfig = getDefaultEpubConfig;
    EpubConfig.defaultEpubConfig = getDefaultEpubConfig();
})(EpubConfig = exports.EpubConfig || (exports.EpubConfig = {}));
//let a = new EpubConfig({lang: 'zh'});
//
//a.addAuthor('菱影代理');
//
//a.setPublication(true);
//
//let b = new EpubConfig(a);
//
//a.lang = 'jp';
//
//console.log(a, b.$auto());
// @ts-ignore
exports.default = EpubConfig;
//# sourceMappingURL=config.js.map