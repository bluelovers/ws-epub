"use strict";
const xml2js = require("xml2js");
const util = require("util");
const NodePath = require("path");
const NodeUrl = require("url");
const events_1 = require("events");
const zipfile_1 = require("./zipfile");
const array_hyper_unique_1 = require("array-hyper-unique");
const crlf_normalize_1 = require("crlf-normalize");
//TODO: Cache parsed data
const SYMBOL_RAW_DATA = Symbol('rawData');
/**
 *  new EPub(fname[, imageroot][, linkroot])
 *  - fname (String): filename for the ebook
 *  - imageroot (String): URL prefix for images
 *  - linkroot (String): URL prefix for links
 *
 *  Creates an Event Emitter type object for parsing epub files
 *
 *      var epub = new EPub("book.epub");
 *      epub.on("end", function () {
 *           console.log(epub.spine);
 *      });
 *      epub.on("error", function (error) { ... });
 *      epub.parse();
 *
 *  Image and link URL format is:
 *
 *      imageroot + img_id + img_zip_path
 *
 *  So an image "logo.jpg" which resides in "OPT/" in the zip archive
 *  and is listed in the manifest with id "logo_img" will have the
 *  following url (providing that imageroot is "/images/"):
 *
 *      /images/logo_img/OPT/logo.jpg
 **/
class EPub extends events_1.EventEmitter {
    constructor(epubfile, imagewebroot, chapterwebroot, ...argv) {
        super();
        this.filename = epubfile;
        this.imageroot = (imagewebroot || this._getStatic().IMAGE_ROOT).trim();
        this.linkroot = (chapterwebroot || this._getStatic().LINK_ROOT).trim();
        if (this.imageroot.substr(-1) != "/") {
            this.imageroot += "/";
        }
        if (this.linkroot.substr(-1) != "/") {
            this.linkroot += "/";
        }
    }
    _getStatic() {
        // @ts-ignore
        return this.__proto__.constructor;
    }
    static create(epubfile, imagewebroot, chapterwebroot, ...argv) {
        let epub = new this(epubfile, imagewebroot, chapterwebroot, ...argv);
        return epub;
    }
    /**
     *  EPub#parse() -> undefined
     *
     *  Starts the parser, needs to be called by the script
     **/
    parse() {
        this.containerFile = null;
        this.mimeFile = null;
        this.rootFile = null;
        this.metadata = {};
        this.manifest = {};
        this.spine = { toc: null, contents: [] };
        this.flow = [];
        this.toc = [];
        this.open();
        return this;
    }
    /**
     *  EPub#open() -> undefined
     *
     *  Opens the epub file with Zip unpacker, retrieves file listing
     *  and runs mime type check
     **/
    open() {
        try {
            // @ts-ignore
            this.zip = new zipfile_1.ZipFile(this.filename);
        }
        catch (E) {
            this.emit("error", new Error(`Invalid/missing file ${this.filename}`));
            return;
        }
        if (!this.zip.names || !this.zip.names.length) {
            this.emit("error", new Error(`No files in archive ${this.filename}`));
            return;
        }
        this.checkMimeType();
    }
    /**
     *  EPub#checkMimeType() -> undefined
     *
     *  Checks if there's a file called "mimetype" and that it's contents
     *  are "application/epub+zip". On success runs root file check.
     **/
    checkMimeType() {
        var i, len;
        for (i = 0, len = this.zip.names.length; i < len; i++) {
            if (this.zip.names[i].toLowerCase() == "mimetype") {
                this.mimeFile = this.zip.names[i];
                break;
            }
        }
        if (!this.mimeFile) {
            this.emit("error", new Error("No mimetype file in archive"));
            return;
        }
        this.zip.readFile(this.mimeFile, (err, data) => {
            if (err) {
                this.emit("error", new Error("Reading archive failed"));
                return;
            }
            if (!EPub.isEpub(data, true)) {
                this.emit("error", new Error("Unsupported mime type"));
                return;
            }
            this.getRootFiles();
        });
    }
    _Elem(element) {
        const SYMBOL_RAW_DATA = this._getStatic().SYMBOL_RAW_DATA;
        if (!element[SYMBOL_RAW_DATA]) {
            element[SYMBOL_RAW_DATA] = Object.assign({}, element);
        }
        if (element['media-type']) {
            element['mediaType'] = element['media-type'];
        }
        return element;
    }
    /**
     *  EPub#getRootFiles() -> undefined
     *
     *  Looks for a "meta-inf/container.xml" file and searches for a
     *  rootfile element with mime type "application/oebps-package+xml".
     *  On success calls the rootfile parser
     **/
    getRootFiles() {
        var i, len;
        for (i = 0, len = this.zip.names.length; i < len; i++) {
            if (this.zip.names[i].toLowerCase() == "meta-inf/container.xml") {
                this.containerFile = this.zip.names[i];
                break;
            }
        }
        if (!this.containerFile) {
            this.emit("error", new Error("No container file in archive"));
            return;
        }
        const xml2jsOptions = this._getStatic().xml2jsOptions;
        this.zip.readFile(this.containerFile, (err, data) => {
            if (err) {
                this.emit("error", new Error("Reading archive failed"));
                return;
            }
            let xml = data.toString("utf-8").toLowerCase().trim(), xmlparser = new xml2js.Parser(xml2jsOptions);
            let parser = xmlparser.on("end", (result) => {
                if (!result.rootfiles || !result.rootfiles.rootfile) {
                    this.emit("error", new Error("No rootfiles found"));
                    console.dir(result);
                    return;
                }
                var rootfile = result.rootfiles.rootfile, filename = false, i, len;
                if (Array.isArray(rootfile)) {
                    for (i = 0, len = rootfile.length; i < len; i++) {
                        if (rootfile[i]["@"]["media-type"] &&
                            rootfile[i]["@"]["media-type"] == "application/oebps-package+xml" &&
                            rootfile[i]["@"]["full-path"]) {
                            filename = rootfile[i]["@"]["full-path"].toLowerCase().trim();
                            break;
                        }
                    }
                }
                else if (rootfile["@"]) {
                    if (rootfile["@"]["media-type"] != "application/oebps-package+xml" || !rootfile["@"]["full-path"]) {
                        this.emit("error", new Error("Rootfile in unknown format"));
                        return;
                    }
                    filename = rootfile["@"]["full-path"].toLowerCase().trim();
                }
                if (!filename) {
                    this.emit("error", new Error("Empty rootfile"));
                    return;
                }
                for (i = 0, len = this.zip.names.length; i < len; i++) {
                    if (this.zip.names[i].toLowerCase() == filename) {
                        this.rootFile = this.zip.names[i];
                        break;
                    }
                }
                if (!this.rootFile) {
                    this.emit("error", new Error("Rootfile not found from archive"));
                    return;
                }
                this.handleRootFile();
            });
            xmlparser.on("error", (err) => {
                this.emit("error", new Error("Parsing container XML failed"));
                return;
            });
            xmlparser.parseString(xml);
        });
    }
    /**
     *  EPub#handleRootFile() -> undefined
     *
     *  Parses the rootfile XML and calls rootfile parser
     **/
    handleRootFile() {
        const xml2jsOptions = this._getStatic().xml2jsOptions;
        this.zip.readFile(this.rootFile, (err, data) => {
            if (err) {
                this.emit("error", new Error("Reading archive failed"));
                return;
            }
            var xml = data.toString("utf-8"), xmlparser = new xml2js.Parser(xml2jsOptions);
            xmlparser.on("end", this.parseRootFile.bind(this));
            xmlparser.on("error", (err) => {
                this.emit("error", new Error("Parsing container XML failed"));
                return;
            });
            xmlparser.parseString(xml);
        });
    }
    /**
     *  EPub#parseRootFile() -> undefined
     *
     *  Parses elements "metadata," "manifest," "spine" and TOC.
     *  Emits "end" if no TOC
     **/
    parseRootFile(rootfile) {
        this.version = rootfile['@'].version || '2.0';
        var i, len, keys, keyparts, key;
        keys = Object.keys(rootfile);
        for (i = 0, len = keys.length; i < len; i++) {
            keyparts = keys[i].split(":");
            key = (keyparts.pop() || "").toLowerCase().trim();
            switch (key) {
                case "metadata":
                    this.parseMetadata(rootfile[keys[i]]);
                    break;
                case "manifest":
                    this.parseManifest(rootfile[keys[i]]);
                    break;
                case "spine":
                    this.parseSpine(rootfile[keys[i]]);
                    break;
                case "guide":
                    //this.parseGuide(rootfile[keys[i]]);
                    break;
            }
        }
        if (this.spine.toc) {
            this.parseTOC();
        }
        else {
            this.emit("end");
        }
    }
    /**
     *  EPub#parseMetadata() -> undefined
     *
     *  Parses "metadata" block (book metadata, title, author etc.)
     **/
    parseMetadata(metadata) {
        let i, j, len, keys, keyparts, key;
        const _self = this;
        this.metadata[SYMBOL_RAW_DATA] = metadata;
        keys = Object.keys(metadata);
        for (i = 0, len = keys.length; i < len; i++) {
            keyparts = keys[i].split(":");
            key = (keyparts.pop() || "").toLowerCase().trim();
            const currentData = metadata[keys[i]];
            switch (key) {
                case "publisher":
                    if (Array.isArray(currentData)) {
                        this.metadata.publisher = String(currentData[0] && currentData[0]["#"] || currentData[0] || "")
                            .trim();
                    }
                    else {
                        this.metadata.publisher = String(currentData["#"] || currentData || "").trim();
                    }
                    break;
                case "language":
                    if (Array.isArray(currentData)) {
                        this.metadata.language = String(currentData[0] && currentData[0]["#"] || currentData[0] || "")
                            .toLowerCase()
                            .trim();
                    }
                    else {
                        this.metadata.language = String(currentData["#"] || currentData || "")
                            .toLowerCase()
                            .trim();
                    }
                    break;
                case "title":
                    if (Array.isArray(currentData)) {
                        this.metadata.title = String(currentData[0] && currentData[0]["#"] || currentData[0] || "")
                            .trim();
                    }
                    else {
                        this.metadata.title = String(currentData["#"] || currentData || "").trim();
                    }
                    break;
                case "subject":
                    this.metadata.subject = this.metadata.subject || [];
                    (Array.isArray(currentData) ? currentData : [currentData])
                        .forEach(function (value) {
                        let tag = (_meta_val(value, '#') || '').trim();
                        if (tag !== '') {
                            _self.metadata.subject.push(tag);
                        }
                    });
                    break;
                case "description":
                    if (Array.isArray(currentData)) {
                        this.metadata.description = String(currentData[0] && currentData[0]["#"] || currentData[0] || "")
                            .trim();
                    }
                    else {
                        this.metadata.description = String(currentData["#"] || currentData || "").trim();
                    }
                    break;
                case "creator":
                    if (Array.isArray(currentData)) {
                        this.metadata.creator = String(currentData[0] && currentData[0]["#"] || currentData[0] || "")
                            .trim();
                        this.metadata.creatorFileAs = String(currentData[0] && currentData[0]['@'] && currentData[0]['@']["opf:file-as"] || this.metadata.creator)
                            .trim();
                    }
                    else {
                        this.metadata.creator = String(currentData["#"] || currentData || "").trim();
                        this.metadata.creatorFileAs = String(currentData['@'] && currentData['@']["opf:file-as"] || this.metadata.creator)
                            .trim();
                    }
                    break;
                case "date":
                    if (Array.isArray(currentData)) {
                        this.metadata.date = String(currentData[0] && currentData[0]["#"] || currentData[0] || "")
                            .trim();
                    }
                    else {
                        this.metadata.date = String(currentData["#"] || currentData || "").trim();
                    }
                    break;
                case "identifier":
                    if (currentData["@"] && currentData["@"]["opf:scheme"] == "ISBN") {
                        this.metadata.ISBN = String(currentData["#"] || "").trim();
                    }
                    else if (currentData["@"] && currentData["@"].id && currentData["@"].id.match(/uuid/i)) {
                        this.metadata.UUID = String(currentData["#"] || "")
                            .replace('urn:uuid:', '')
                            .toUpperCase()
                            .trim();
                    }
                    else if (Array.isArray(currentData)) {
                        for (j = 0; j < currentData.length; j++) {
                            if (currentData[j]["@"]) {
                                if (currentData[j]["@"]["opf:scheme"] == "ISBN") {
                                    this.metadata.ISBN = String(currentData[j]["#"] || "").trim();
                                }
                                else if (currentData[j]["@"].id && currentData[j]["@"].id.match(/uuid/i)) {
                                    this.metadata.UUID = String(currentData[j]["#"] || "")
                                        .replace('urn:uuid:', '')
                                        .toUpperCase()
                                        .trim();
                                }
                            }
                        }
                    }
                    break;
                case 'meta':
                    if (currentData['#'] && currentData['@'].property == 'calibre:author_link_map') {
                        this.metadata['contribute'] = this.metadata['contribute'] || [];
                        this.metadata['author_link_map'] = this.metadata['author_link_map'] || {};
                        let t = JSON.parse(currentData['#']);
                        for (let n in t) {
                            n = n.toString().trim();
                            this.metadata['contribute'].push(n);
                            this.metadata['author_link_map'][n] = (t[n] || '').toString().trim();
                        }
                        this.metadata['contribute'] = array_hyper_unique_1.array_unique(this.metadata['contribute']);
                    }
                    break;
                default:
                    //console.log(key, currentData);
                    break;
            }
        }
        let metas = metadata['meta'] || {};
        Object.keys(metas).forEach((key) => {
            var meta = metas[key];
            if (meta['@'] && meta['@'].name) {
                var name = meta['@'].name;
                this.metadata[name] = meta['@'].content;
                if (name == 'calibre:series') {
                    this.metadata['series'] = this.metadata['series'] || meta['@'].content;
                }
            }
            if (meta['#'] && meta['@'].property) {
                this.metadata[meta['@'].property] = meta['#'];
            }
            if (meta.name && meta.name == "cover") {
                this.metadata[meta.name] = meta.content;
            }
        }, this);
        function _meta_val(row, key = null) {
            if (key !== null) {
                return row[key] || row;
            }
            return row;
        }
    }
    /**
     *  EPub#parseManifest() -> undefined
     *
     *  Parses "manifest" block (all items included, html files, images, styles)
     **/
    parseManifest(manifest) {
        var i, len, path = this.rootFile.split("/"), element, path_str;
        path.pop();
        path_str = path.join("/");
        if (manifest.item) {
            for (i = 0, len = manifest.item.length; i < len; i++) {
                if (manifest.item[i]['@']) {
                    element = manifest.item[i]['@'];
                    element = this._Elem(element);
                    if (element.href && element.href.substr(0, path_str.length) != path_str) {
                        element.href = path.concat([element.href]).join("/");
                    }
                    this.manifest[manifest.item[i]['@'].id] = element;
                }
            }
        }
    }
    /**
     *  EPub#parseSpine() -> undefined
     *
     *  Parses "spine" block (all html elements that are shown to the reader)
     **/
    parseSpine(spine) {
        var i, len, path = this.rootFile.split("/"), element;
        path.pop();
        if (spine['@'] && spine['@'].toc) {
            this.spine.toc = this.manifest[spine['@'].toc] || null;
        }
        if (spine.itemref) {
            if (!Array.isArray(spine.itemref)) {
                spine.itemref = [spine.itemref];
            }
            for (i = 0, len = spine.itemref.length; i < len; i++) {
                if (spine.itemref[i]['@']) {
                    if (element = this.manifest[spine.itemref[i]['@'].idref]) {
                        this.spine.contents.push(element);
                    }
                }
            }
        }
        this.flow = this.spine.contents;
    }
    /**
     *  EPub#parseTOC() -> undefined
     *
     *  Parses ncx file for table of contents (title, html file)
     **/
    parseTOC() {
        var i, len, path = this.spine.toc.href.split("/"), id_list = {}, keys;
        path.pop();
        keys = Object.keys(this.manifest);
        for (i = 0, len = keys.length; i < len; i++) {
            id_list[this.manifest[keys[i]].href] = keys[i];
        }
        const xml2jsOptions = this._getStatic().xml2jsOptions;
        this.zip.readFile(this.spine.toc.href, (err, data) => {
            if (err) {
                this.emit("error", new Error("Reading archive failed"));
                return;
            }
            var xml = data.toString("utf-8"), xmlparser = new xml2js.Parser(xml2jsOptions);
            xmlparser.on("end", (result) => {
                if (result.navMap && result.navMap.navPoint) {
                    this.toc = this.walkNavMap(result.navMap.navPoint, path, id_list);
                }
                this.emit("end");
            });
            xmlparser.on("error", (err) => {
                this.emit("error", new Error("Parsing container XML failed"));
                return;
            });
            xmlparser.parseString(xml);
        });
    }
    /**
     *  EPub#walkNavMap(branch, path, id_list,[, level]) -> Array
     *  - branch (Array | Object): NCX NavPoint object
     *  - path (Array): Base path
     *  - id_list (Object): map of file paths and id values
     *  - level (Number): deepness
     *
     *  Walks the NavMap object through all levels and finds elements
     *  for TOC
     **/
    walkNavMap(branch, path, id_list, level, pe, parentNcx, ncx_idx) {
        ncx_idx = ncx_idx || {
            index: 0,
        };
        level = level || 0;
        this.ncx_depth = Math.max(level + 1, this.ncx_depth || 0);
        // don't go too far
        if (level > 7) {
            return [];
        }
        var output = [];
        if (!Array.isArray(branch)) {
            branch = [branch];
        }
        this.ncx = this.ncx || [];
        for (var i = 0; i < branch.length; i++) {
            let element;
            let currentNcx;
            if (branch[i].navLabel) {
                var title = '';
                if (branch[i].navLabel && typeof branch[i].navLabel.text == 'string') {
                    /*
                    title = branch[i].navLabel && branch[i].navLabel.text || branch[i].navLabel === branch[i].navLabel
                        ? ''
                        : (branch[i].navLabel && branch[i].navLabel.text || branch[i].navLabel || "").trim();
                    */
                    title = (branch[i].navLabel && branch[i].navLabel.text || branch[i].navLabel || "").trim();
                }
                var order = Number(branch[i]["@"] && branch[i]["@"].playOrder || 0);
                if (isNaN(order)) {
                    order = 0;
                }
                var href = '';
                if (branch[i].content && branch[i].content["@"] && typeof branch[i].content["@"].src == 'string') {
                    href = branch[i].content["@"].src.trim();
                }
                element = {
                    level: level,
                    order: order,
                    title: title
                };
                if (href) {
                    href = path.concat([href]).join("/");
                    element.href = href;
                    if (id_list[element.href]) {
                        // link existing object
                        element = this.manifest[id_list[element.href]];
                        element.title = title;
                        element.order = order;
                        element.level = level;
                    }
                    else {
                        // use new one
                        element.href = href;
                        element.id = (branch[i]["@"] && branch[i]["@"].id || "").trim();
                    }
                    if (level == 0) {
                        let idx = this.ncx.length;
                        currentNcx = this.ncx[idx] = {
                            id: element.id,
                            ncx_index: idx,
                            ncx_index2: ncx_idx.index++,
                            level,
                            sub: [],
                        };
                    }
                    else if (parentNcx) {
                        let idx = parentNcx.sub.length;
                        currentNcx = parentNcx.sub[parentNcx.sub.length] = {
                            id: element.id,
                            ncx_index: idx,
                            ncx_index2: ncx_idx.index++,
                            level,
                            sub: [],
                        };
                    }
                    output.push(element);
                }
            }
            //console.log(ncx_idx);
            if (branch[i].navPoint) {
                output = output.concat(this.walkNavMap(branch[i].navPoint, path, id_list, level + 1, element, currentNcx, ncx_idx));
            }
        }
        return output;
    }
    /**
     *  EPub#getChapter(id, callback) -> undefined
     *  - id (String): Manifest id value for a chapter
     *  - callback (Function): callback function
     *
     *  Finds a chapter text for an id. Replaces image and link URL's, removes
     *  <head> etc. elements. Return only chapters with mime type application/xhtml+xml
     **/
    getChapter(chapterId, callback) {
        let self = this;
        this.getChapterRaw(chapterId, (err, str) => {
            if (err) {
                callback(err);
                return;
            }
            let meta = self.manifest[chapterId];
            var i, len, path = this.rootFile.split("/"), keys = Object.keys(this.manifest);
            path.pop();
            let basePath = NodePath.dirname(meta.href);
            let baseHref = meta.href;
            // remove linebreaks (no multi line matches in JS regex!)
            str = str.replace(/\r?\n/g, "\u0000");
            // keep only <body> contents
            // @ts-ignore
            str.replace(/<body[^>]*?>(.*)<\/body[^>]*?>/i, function (o, d) {
                str = d.trim();
            });
            // remove <script> blocks if any
            str = str.replace(/<script[^>]*?>(.*?)<\/script[^>]*?>/ig, function (o, s) {
                return "";
            });
            // remove <style> blocks if any
            str = str.replace(/<style[^>]*?>(.*?)<\/style[^>]*?>/ig, function (o, s) {
                return "";
            });
            // remove onEvent handlers
            str = str.replace(/(\s)(on\w+)(\s*=\s*["']?[^"'\s>]*?["'\s>])/g, function (o, a, b, c) {
                return a + "skip-" + b + c;
            });
            // replace images
            str = str.replace(/(?<=\s|^)(src\s*=\s*)(["']?)([^"'\n]*?)(\2)/g, (o, a, d, b, c) => {
                let img = NodePath.posix.join(basePath, b);
                let element;
                for (i = 0, len = keys.length; i < len; i++) {
                    let _arr = [
                        self.manifest[keys[i]].href,
                        decodeURI(self.manifest[keys[i]].href),
                        encodeURI(self.manifest[keys[i]].href),
                    ];
                    if (_arr.includes(img)) {
                        element = self.manifest[keys[i]];
                        break;
                    }
                }
                if (element) {
                    let s = a + d + NodeUrl.resolve(this.imageroot, img) + c;
                    return s;
                }
                return o;
            });
            /*
            str = str.replace(/(\ssrc\s*=\s*["']?)([^"'\s>]*?)(["'\s>])/g, (function (o, a, b, c)
            {
                var img = path.concat([b]).join("/").trim(),
                    element;

                for (i = 0, len = keys.length; i < len; i++)
                {
                    if (this.manifest[keys[i]].href == img)
                    {
                        element = this.manifest[keys[i]];
                        break;
                    }
                }

                // include only images from manifest
                if (element)
                {
                    return a + this.imageroot + element.id + "/" + img + c;
                }
                else
                {
                    return "";
                }

            }).bind(this));
            */
            // replace links
            str = str.replace(/(\shref\s*=\s*["']?)([^"'\s>]*?)(["'\s>])/g, (o, a, b, c) => {
                var linkparts = b && b.split("#"), link = path.concat([(linkparts.shift() || "")]).join("/").trim(), element;
                for (i = 0, len = keys.length; i < len; i++) {
                    if (this.manifest[keys[i]].href.split("#")[0] == link) {
                        element = this.manifest[keys[i]];
                        break;
                    }
                }
                if (linkparts.length) {
                    link += "#" + linkparts.join("#");
                }
                // include only images from manifest
                if (element) {
                    return a + this.linkroot + element.id + "/" + link + c;
                }
                else {
                    return a + b + c;
                }
            });
            // bring back linebreaks
            str = str.replace(/\u0000/g, "\n").trim();
            callback(null, str);
        });
    }
    /**
     *  EPub#getChapterRaw(id, callback) -> undefined
     *  - id (String): Manifest id value for a chapter
     *  - callback (Function): callback function
     *
     *  Returns the raw chapter text for an id.
     **/
    getChapterRaw(chapterId, callback) {
        if (this.manifest[chapterId]) {
            if (!(this.manifest[chapterId]['media-type'] == "application/xhtml+xml" || this.manifest[chapterId]['media-type'] == "image/svg+xml")) {
                return callback(new Error(`Invalid mime type for chapter "${chapterId}" ${this.manifest[chapterId]['media-type']}`));
            }
            this.zip.readFile(this.manifest[chapterId].href, (function (err, data) {
                if (err) {
                    callback(new Error(`Reading archive failed "${chapterId}", ${this.manifest[chapterId].href}`));
                    return;
                }
                else if (!data) {
                    callback(new Error(`Reading archive failed "${chapterId}", ${this.manifest[chapterId].href}`));
                    return;
                }
                callback(null, crlf_normalize_1.crlf(data.toString("utf-8")));
            }).bind(this));
        }
        else {
            callback(new Error(`File not found "${chapterId}"`));
        }
    }
    /**
     *  EPub#getImage(id, callback) -> undefined
     *  - id (String): Manifest id value for an image
     *  - callback (Function): callback function
     *
     *  Finds an image for an id. Returns the image as Buffer. Callback gets
     *  an error object, image buffer and image content-type.
     *  Return only images with mime type image
     **/
    getImage(id, callback) {
        if (this.manifest[id]) {
            if ((this.manifest[id]['media-type'] || "").toLowerCase().trim().substr(0, 6) != "image/") {
                return callback(new Error("Invalid mime type for image"));
            }
            this.getFile(id, callback);
        }
        else {
            callback(new Error("File not found"));
        }
    }
    /**
     *  EPub#getFile(id, callback) -> undefined
     *  - id (String): Manifest id value for a file
     *  - callback (Function): callback function
     *
     *  Finds a file for an id. Returns the file as Buffer. Callback gets
     *  an error object, file contents buffer and file content-type.
     **/
    getFile(id, callback) {
        if (this.manifest[id]) {
            let self = this;
            this.zip.readFile(this.manifest[id].href, (err, data) => {
                if (err) {
                    callback(new Error(`Reading archive failed ${self.manifest[id].href}`));
                    return;
                }
                callback(null, data, this.manifest[id]['media-type']);
            });
        }
        else {
            callback(new RangeError(`File not found "${id}"`));
        }
    }
    readFile(filename, options, callback_) {
        var callback = arguments[arguments.length - 1];
        if (util.isFunction(options) || !options) {
            this.zip.readFile(filename, callback);
        }
        else if (util.isString(options)) {
            // options is an encoding
            this.zip.readFile(filename, function (err, data) {
                if (err) {
                    callback(new Error(`Reading archive failed ${filename}`));
                    return;
                }
                callback(null, data.toString(options));
            });
        }
        else {
            throw new TypeError('Bad arguments');
        }
    }
}
EPub.SYMBOL_RAW_DATA = SYMBOL_RAW_DATA;
(function (EPub) {
    EPub.xml2jsOptions = Object.assign({}, xml2js.defaults['0.1']);
    EPub.IMAGE_ROOT = '/images/';
    EPub.LINK_ROOT = '/links/';
    //export const SYMBOL_RAW_DATA = Symbol.for('rawData');
    EPub.ELEM_MEDIA_TYPE = 'media-type';
    EPub.ELEM_MEDIA_TYPE2 = 'mediaType';
    function isEpub(data, buf) {
        let txt = (typeof data == 'string' && !buf) ? data : data.toString("utf-8").toLowerCase().trim();
        if (txt === 'application/epub+zip') {
            return data;
        }
        return null;
    }
    EPub.isEpub = isEpub;
})(EPub || (EPub = {}));
module.exports = EPub;
/*
// @ts-ignore
declare module "epub"
{

    import { EventEmitter } from "events";

    interface TocElement
    {
        level: number;
        order: number;
        title: string;
        id: string;
        href?: string;
    }

    class EPub extends EventEmitter
    {
        constructor(epubfile: string, imagewebroot?: string, chapterwebroot?: string);

        metadata: Object;
        manifest: Object;
        spine: Object;
        flow: Array<Object>;
        toc: Array<TocElement>;

        parse(): void;

        getChapter(chapterId: string, callback: (error: Error, text: string) => void): void;

        getChapterRaw(chapterId: string, callback: (error: Error, text: string) => void): void;

        getImage(id: string, callback: (error: Error, data: Buffer, mimeType: string) => void): void;

        getFile(id: string, callback: (error: Error, data: Buffer, mimeType: string) => void): void;
    }

    export = EPub;
}
*/
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXB1Yi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImVwdWIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLGlDQUFrQztBQUNsQyw2QkFBOEI7QUFDOUIsaUNBQWtDO0FBQ2xDLCtCQUFnQztBQUNoQyxtQ0FBc0M7QUFDdEMsdUNBQThDO0FBQzlDLDJEQUFrRDtBQUNsRCxtREFBNkQ7QUFFN0QseUJBQXlCO0FBRXpCLE1BQU0sZUFBZSxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUUxQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0lBd0JJO0FBQ0osTUFBTSxJQUFLLFNBQVEscUJBQVk7SUE2QjlCLFlBQVksUUFBZ0IsRUFBRSxZQUFxQixFQUFFLGNBQXVCLEVBQUUsR0FBRyxJQUFJO1FBRXBGLEtBQUssRUFBRSxDQUFDO1FBRVIsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7UUFFekIsSUFBSSxDQUFDLFNBQVMsR0FBRyxDQUFDLFlBQVksSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUMsVUFBVSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDdkUsSUFBSSxDQUFDLFFBQVEsR0FBRyxDQUFDLGNBQWMsSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUMsU0FBUyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7UUFFdkUsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEdBQUcsRUFDcEM7WUFDQyxJQUFJLENBQUMsU0FBUyxJQUFJLEdBQUcsQ0FBQztTQUN0QjtRQUNELElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxHQUFHLEVBQ25DO1lBQ0MsSUFBSSxDQUFDLFFBQVEsSUFBSSxHQUFHLENBQUM7U0FDckI7SUFDRixDQUFDO0lBdkJTLFVBQVU7UUFFbkIsYUFBYTtRQUNiLE9BQU8sSUFBSSxDQUFDLFNBQVMs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QUFDLENBQUMsV0FBVyxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUM7UUFFakcsSUFBSSxHQUFHLEtBQUssc0JBQXNCLEVBQ2xDO1lBQ0MsT0FBTyxJQUFJLENBQUM7U0FDWjtRQUVELE9BQU8sSUFBSSxDQUFDO0lBQ2IsQ0FBQztJQVZlLFdBQU0sU0FVckIsQ0FBQTtBQUVGLENBQUMsRUEzR00sSUFBSSxLQUFKLElBQUksUUEyR1Y7QUFHRCxpQkFBUyxJQUFJLENBQUM7QUFFZDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0VBdUNFIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHhtbDJqcyA9IHJlcXVpcmUoJ3htbDJqcycpO1xuaW1wb3J0IHV0aWwgPSByZXF1aXJlKCd1dGlsJyk7XG5pbXBvcnQgTm9kZVBhdGggPSByZXF1aXJlKCdwYXRoJyk7XG5pbXBvcnQgTm9kZVVybCA9IHJlcXVpcmUoJ3VybCcpO1xuaW1wb3J0IHsgRXZlbnRFbWl0dGVyIH0gZnJvbSAnZXZlbnRzJztcbmltcG9ydCB7IFppcEZpbGUsIElaaXBGaWxlIH0gZnJvbSAnLi96aXBmaWxlJztcbmltcG9ydCB7IGFycmF5X3VuaXF1ZSB9IGZyb20gJ2FycmF5LWh5cGVyLXVuaXF1ZSc7XG5pbXBvcnQgeyBjcmxmLCBjaGtjcmxmLCBMRiwgQ1JMRiwgQ1IgfSBmcm9tICdjcmxmLW5vcm1hbGl6ZSc7XG5cbi8vVE9ETzogQ2FjaGUgcGFyc2VkIGRhdGFcblxuY29uc3QgU1lNQk9MX1JBV19EQVRBID0gU3ltYm9sKCdyYXdEYXRhJyk7XG5cbi8qKlxuICogIG5ldyBFUHViKGZuYW1lWywgaW1hZ2Vyb290XVssIGxpbmtyb290XSlcbiAqICAtIGZuYW1lIChTdHJpbmcpOiBmaWxlbmFtZSBmb3IgdGhlIGVib29rXG4gKiAgLSBpbWFnZXJvb3QgKFN0cmluZyk6IFVSTCBwcmVmaXggZm9yIGltYWdlc1xuICogIC0gbGlua3Jvb3QgKFN0cmluZyk6IFVSTCBwcmVmaXggZm9yIGxpbmtzXG4gKlxuICogIENyZWF0ZXMgYW4gRXZlbnQgRW1pdHRlciB0eXBlIG9iamVjdCBmb3IgcGFyc2luZyBlcHViIGZpbGVzXG4gKlxuICogICAgICB2YXIgZXB1YiA9IG5ldyBFUHViKFwiYm9vay5lcHViXCIpO1xuICogICAgICBlcHViLm9uKFwiZW5kXCIsIGZ1bmN0aW9uICgpIHtcbiAqICAgICAgICAgICBjb25zb2xlLmxvZyhlcHViLnNwaW5lKTtcbiAqICAgICAgfSk7XG4gKiAgICAgIGVwdWIub24oXCJlcnJvclwiLCBmdW5jdGlvbiAoZXJyb3IpIHsgLi4uIH0pO1xuICogICAgICBlcHViLnBhcnNlKCk7XG4gKlxuICogIEltYWdlIGFuZCBsaW5rIFVSTCBmb3JtYXQgaXM6XG4gKlxuICogICAgICBpbWFnZXJvb3QgKyBpbWdfaWQgKyBpbWdfemlwX3BhdGhcbiAqXG4gKiAgU28gYW4gaW1hZ2UgXCJsb2dvLmpwZ1wiIHdoaWNoIHJlc2lkZXMgaW4gXCJPUFQvXCIgaW4gdGhlIHppcCBhcmNoaXZlXG4gKiAgYW5kIGlzIGxpc3RlZCBpbiB0aGUgbWFuaWZlc3Qgd2l0aCBpZCBcImxvZ29faW1nXCIgd2lsbCBoYXZlIHRoZVxuICogIGZvbGxvd2luZyB1cmwgKHByb3ZpZGluZyB0aGF0IGltYWdlcm9vdCBpcyBcIi9pbWFnZXMvXCIpOlxuICpcbiAqICAgICAgL2ltYWdlcy9sb2dvX2ltZy9PUFQvbG9nby5qcGdcbiAqKi9cbmNsYXNzIEVQdWIgZXh0ZW5kcyBFdmVudEVtaXR0ZXJcbntcblx0bWV0YWRhdGE6IEVQdWIuSU1ldGFkYXRhO1xuXHRtYW5pZmVzdDogRVB1Yi5JTWV0YWRhdGFMaXN0O1xuXHRzcGluZTogRVB1Yi5JU3BpbmU7XG5cdGZsb3c6IEVQdWIuSVNwaW5lQ29udGVudHM7XG5cdHRvYzogRVB1Yi5JU3BpbmVDb250ZW50cztcblxuXHRuY3g6IEVQdWIuSU5jeDtcblx0bmN4X2RlcHRoOiBudW1iZXI7XG5cblx0ZmlsZW5hbWU6IHN0cmluZztcblx0aW1hZ2Vyb290OiBzdHJpbmc7XG5cdGxpbmtyb290OiBzdHJpbmc7XG5cblx0Y29udGFpbmVyRmlsZTogc3RyaW5nO1xuXHRtaW1lRmlsZTogc3RyaW5nO1xuXHRyb290RmlsZTogc3RyaW5nO1xuXG5cdHppcDogSVppcEZpbGU7XG5cblx0dmVyc2lvbjogc3RyaW5nO1xuXG5cdHByb3RlY3RlZCBfZ2V0U3RhdGljKClcblx0e1xuXHRcdC8vIEB0cy1pZ25vcmVcblx0XHRyZXR1cm4gdGhpcy5fX3Byb3RvX18uY29uc3RydWN0b3I7XG5cdH1cblxuXHRjb25zdHJ1Y3RvcihlcHViZmlsZTogc3RyaW5nLCBpbWFnZXdlYnJvb3Q/OiBzdHJpbmcsIGNoYXB0ZXJ3ZWJyb290Pzogc3RyaW5nLCAuLi5hcmd2KVxuXHR7XG5cdFx0c3VwZXIoKTtcblxuXHRcdHRoaXMuZmlsZW5hbWUgPSBlcHViZmlsZTtcblxuXHRcdHRoaXMuaW1hZ2Vyb290ID0gKGltYWdld2Vicm9vdCB8fCB0aGlzLl9nZXRTdGF0aWMoKS5JTUFHRV9ST09UKS50cmltKCk7XG5cdFx0dGhpcy5saW5rcm9vdCA9IChjaGFwdGVyd2Vicm9vdCB8fCB0aGlzLl9nZXRTdGF0aWMoKS5MSU5LX1JPT1QpLnRyaW0oKTtcblxuXHRcdGlmICh0aGlzLmltYWdlcm9vdC5zdWJzdHIoLTEpICE9IFwiL1wiKVxuXHRcdHtcblx0XHRcdHRoaXMuaW1hZ2Vyb290ICs9IFwiL1wiO1xuXHRcdH1cblx0XHRpZiAodGhpcy5saW5rcm9vdC5zdWJzdHIoLTEpICE9IFwiL1wiKVxuXHRcdHtcblx0XHRcdHRoaXMubGlua3Jvb3QgKz0gXCIvXCI7XG5cdFx0fVxuXHR9XG5cblx0c3RhdGljIGNyZWF0ZShlcHViZmlsZTogc3RyaW5nLCBpbWFnZXdlYnJvb3Q/OiBzdHJpbmcsIGNoYXB0ZXJ3ZWJyb290Pzogc3RyaW5nLCAuLi5hcmd2KVxuXHR7XG5cdFx0bGV0IGVwdWIgPSBuZXcgdGhpcyhlcHViZmlsZSwgaW1hZ2V3ZWJyb290LCBjaGFwdGVyd2Vicm9vdCwgLi4uYXJndik7XG5cblx0XHRyZXR1cm4gZXB1Yjtcblx0fVxuXG5cdC8qKlxuXHQgKiAgRVB1YiNwYXJzZSgpIC0+IHVuZGVmaW5lZFxuXHQgKlxuXHQgKiAgU3RhcnRzIHRoZSBwYXJzZXIsIG5lZWRzIHRvIGJlIGNhbGxlZCBieSB0aGUgc2NyaXB0XG5cdCAqKi9cblx0cHVibGljIHBhcnNlKClcblx0e1xuXHRcdHRoaXMuY29udGFpbmVyRmlsZSA9IG51bGw7XG5cdFx0dGhpcy5taW1lRmlsZSA9IG51bGw7XG5cdFx0dGhpcy5yb290RmlsZSA9IG51bGw7XG5cblx0XHR0aGlzLm1ldGFkYXRhID0ge307XG5cdFx0dGhpcy5tYW5pZmVzdCA9IHt9O1xuXHRcdHRoaXMuc3BpbmUgPSB7IHRvYzogbnVsbCwgY29udGVudHM6IFtdIH07XG5cdFx0dGhpcy5mbG93ID0gW107XG5cdFx0dGhpcy50b2MgPSBbXTtcblxuXHRcdHRoaXMub3BlbigpO1xuXG5cdFx0cmV0dXJuIHRoaXM7XG5cdH1cblxuXHQvKipcblx0ICogIEVQdWIjb3BlbigpIC0+IHVuZGVmaW5lZFxuXHQgKlxuXHQgKiAgT3BlbnMgdGhlIGVwdWIgZmlsZSB3aXRoIFppcCB1bnBhY2tlciwgcmV0cmlldmVzIGZpbGUgbGlzdGluZ1xuXHQgKiAgYW5kIHJ1bnMgbWltZSB0eXBlIGNoZWNrXG5cdCAqKi9cblx0b3BlbigpXG5cdHtcblx0XHR0cnlcblx0XHR7XG5cdFx0XHQvLyBAdHMtaWdub3JlXG5cdFx0XHR0aGlzLnppcCA9IG5ldyBaaXBGaWxlKHRoaXMuZmlsZW5hbWUpO1xuXHRcdH1cblx0XHRjYXRjaCAoRSlcblx0XHR7XG5cdFx0XHR0aGlzLmVtaXQoXCJlcnJvclwiLCBuZXcgRXJyb3IoYEludmFsaWQvbWlzc2luZyBmaWxlICR7dGhpcy5maWxlbmFtZX1gKSk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0aWYgKCF0aGlzLnppcC5uYW1lcyB8fCAhdGhpcy56aXAubmFtZXMubGVuZ3RoKVxuXHRcdHtcblx0XHRcdHRoaXMuZW1pdChcImVycm9yXCIsIG5ldyBFcnJvcihgTm8gZmlsZXMgaW4gYXJjaGl2ZSAke3RoaXMuZmlsZW5hbWV9YCkpO1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblx0XHR0aGlzLmNoZWNrTWltZVR5cGUoKTtcblx0fVxuXG5cdC8qKlxuXHQgKiAgRVB1YiNjaGVja01pbWVUeXBlKCkgLT4gdW5kZWZpbmVkXG5cdCAqXG5cdCAqICBDaGVja3MgaWYgdGhlcmUncyBhIGZpbGUgY2FsbGVkIFwibWltZXR5cGVcIiBhbmQgdGhhdCBpdCdzIGNvbnRlbnRzXG5cdCAqICBhcmUgXCJhcHBsaWNhdGlvbi9lcHViK3ppcFwiLiBPbiBzdWNjZXNzIHJ1bnMgcm9vdCBmaWxlIGNoZWNrLlxuXHQgKiovXG5cdGNoZWNrTWltZVR5cGUoKVxuXHR7XG5cdFx0dmFyIGksIGxlbjtcblxuXHRcdGZvciAoaSA9IDAsIGxlbiA9IHRoaXMuemlwLm5hbWVzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKVxuXHRcdHtcblx0XHRcdGlmICh0aGlzLnppcC5uYW1lc1tpXS50b0xvd2VyQ2FzZSgpID09IFwibWltZXR5cGVcIilcblx0XHRcdHtcblx0XHRcdFx0dGhpcy5taW1lRmlsZSA9IHRoaXMuemlwLm5hbWVzW2ldO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdH1cblx0XHR9XG5cdFx0aWYgKCF0aGlzLm1pbWVGaWxlKVxuXHRcdHtcblx0XHRcdHRoaXMuZW1pdChcImVycm9yXCIsIG5ldyBFcnJvcihcIk5vIG1pbWV0eXBlIGZpbGUgaW4gYXJjaGl2ZVwiKSk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdHRoaXMuemlwLnJlYWRGaWxlKHRoaXMubWltZUZpbGUsIChlcnIsIGRhdGEpID0+XG5cdFx0e1xuXHRcdFx0aWYgKGVycilcblx0XHRcdHtcblx0XHRcdFx0dGhpcy5lbWl0KFwiZXJyb3JcIiwgbmV3IEVycm9yKFwiUmVhZGluZyBhcmNoaXZlIGZhaWxlZFwiKSk7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0aWYgKCFFUHViLmlzRXB1YihkYXRhLCB0cnVlKSlcblx0XHRcdHtcblx0XHRcdFx0dGhpcy5lbWl0KFwiZXJyb3JcIiwgbmV3IEVycm9yKFwiVW5zdXBwb3J0ZWQgbWltZSB0eXBlXCIpKTtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLmdldFJvb3RGaWxlcygpO1xuXHRcdH0pO1xuXHR9XG5cblx0cHJvdGVjdGVkIF9FbGVtKGVsZW1lbnQ6IEVQdWIuVG9jRWxlbWVudClcblx0e1xuXHRcdGNvbnN0IFNZTUJPTF9SQVdfREFUQSA9IHRoaXMuX2dldFN0YXRpYygpLlNZTUJPTF9SQVdfREFUQTtcblxuXHRcdGlmICghZWxlbWVudFtTWU1CT0xfUkFXX0RBVEFdKVxuXHRcdHtcblx0XHRcdGVsZW1lbnRbU1lNQk9MX1JBV19EQVRBXSA9IE9iamVjdC5hc3NpZ24oe30sIGVsZW1lbnQpO1xuXHRcdH1cblxuXHRcdGlmIChlbGVtZW50WydtZWRpYS10eXBlJ10pXG5cdFx0e1xuXHRcdFx0ZWxlbWVudFsnbWVkaWFUeXBlJ10gPSBlbGVtZW50WydtZWRpYS10eXBlJ107XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGVsZW1lbnQ7XG5cdH1cblxuXHQvKipcblx0ICogIEVQdWIjZ2V0Um9vdEZpbGVzKCkgLT4gdW5kZWZpbmVkXG5cdCAqXG5cdCAqICBMb29rcyBmb3IgYSBcIm1ldGEtaW5mL2NvbnRhaW5lci54bWxcIiBmaWxlIGFuZCBzZWFyY2hlcyBmb3IgYVxuXHQgKiAgcm9vdGZpbGUgZWxlbWVudCB3aXRoIG1pbWUgdHlwZSBcImFwcGxpY2F0aW9uL29lYnBzLXBhY2thZ2UreG1sXCIuXG5cdCAqICBPbiBzdWNjZXNzIGNhbGxzIHRoZSByb290ZmlsZSBwYXJzZXJcblx0ICoqL1xuXHRnZXRSb290RmlsZXMoKVxuXHR7XG5cdFx0dmFyIGksIGxlbjtcblx0XHRmb3IgKGkgPSAwLCBsZW4gPSB0aGlzLnppcC5uYW1lcy5sZW5ndGg7IGkgPCBsZW47IGkrKylcblx0XHR7XG5cdFx0XHRpZiAodGhpcy56aXAubmFtZXNbaV0udG9Mb3dlckNhc2UoKSA9PSBcIm1ldGEtaW5mL2NvbnRhaW5lci54bWxcIilcblx0XHRcdHtcblx0XHRcdFx0dGhpcy5jb250YWluZXJGaWxlID0gdGhpcy56aXAubmFtZXNbaV07XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRpZiAoIXRoaXMuY29udGFpbmVyRmlsZSlcblx0XHR7XG5cdFx0XHR0aGlzLmVtaXQoXCJlcnJvclwiLCBuZXcgRXJyb3IoXCJObyBjb250YWluZXIgZmlsZSBpbiBhcmNoaXZlXCIpKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRjb25zdCB4bWwyanNPcHRpb25zID0gdGhpcy5fZ2V0U3RhdGljKCkueG1sMmpzT3B0aW9ucztcblxuXHRcdHRoaXMuemlwLnJlYWRGaWxlKHRoaXMuY29udGFpbmVyRmlsZSwgIChlcnIsIGRhdGEpID0+XG5cdFx0e1xuXHRcdFx0aWYgKGVycilcblx0XHRcdHtcblx0XHRcdFx0dGhpcy5lbWl0KFwiZXJyb3JcIiwgbmV3IEVycm9yKFwiUmVhZGluZyBhcmNoaXZlIGZhaWxlZFwiKSk7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblx0XHRcdGxldCB4bWwgPSBkYXRhLnRvU3RyaW5nKFwidXRmLThcIikudG9Mb3dlckNhc2UoKS50cmltKCksXG5cdFx0XHRcdHhtbHBhcnNlciA9IG5ldyB4bWwyanMuUGFyc2VyKHhtbDJqc09wdGlvbnMpO1xuXG5cdFx0XHRsZXQgcGFyc2VyID0geG1scGFyc2VyLm9uKFwiZW5kXCIsIChyZXN1bHQpID0+XG5cdFx0XHR7XG5cblx0XHRcdFx0aWYgKCFyZXN1bHQucm9vdGZpbGVzIHx8ICFyZXN1bHQucm9vdGZpbGVzLnJvb3RmaWxlKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0dGhpcy5lbWl0KFwiZXJyb3JcIiwgbmV3IEVycm9yKFwiTm8gcm9vdGZpbGVzIGZvdW5kXCIpKTtcblx0XHRcdFx0XHRjb25zb2xlLmRpcihyZXN1bHQpO1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHZhciByb290ZmlsZSA9IHJlc3VsdC5yb290ZmlsZXMucm9vdGZpbGUsXG5cdFx0XHRcdFx0ZmlsZW5hbWUgPSBmYWxzZSwgaSwgbGVuO1xuXG5cdFx0XHRcdGlmIChBcnJheS5pc0FycmF5KHJvb3RmaWxlKSlcblx0XHRcdFx0e1xuXG5cdFx0XHRcdFx0Zm9yIChpID0gMCwgbGVuID0gcm9vdGZpbGUubGVuZ3RoOyBpIDwgbGVuOyBpKyspXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0aWYgKHJvb3RmaWxlW2ldW1wiQFwiXVtcIm1lZGlhLXR5cGVcIl0gJiZcblx0XHRcdFx0XHRcdFx0cm9vdGZpbGVbaV1bXCJAXCJdW1wibWVkaWEtdHlwZVwiXSA9PSBcImFwcGxpY2F0aW9uL29lYnBzLXBhY2thZ2UreG1sXCIgJiZcblx0XHRcdFx0XHRcdFx0cm9vdGZpbGVbaV1bXCJAXCJdW1wiZnVsbC1wYXRoXCJdKVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRmaWxlbmFtZSA9IHJvb3RmaWxlW2ldW1wiQFwiXVtcImZ1bGwtcGF0aFwiXS50b0xvd2VyQ2FzZSgpLnRyaW0oKTtcblx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZSBpZiAocm9vdGZpbGVbXCJAXCJdKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0aWYgKHJvb3RmaWxlW1wiQFwiXVtcIm1lZGlhLXR5cGVcIl0gIT0gXCJhcHBsaWNhdGlvbi9vZWJwcy1wYWNrYWdlK3htbFwiIHx8ICFyb290ZmlsZVtcIkBcIl1bXCJmdWxsLXBhdGhcIl0pXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0dGhpcy5lbWl0KFwiZXJyb3JcIiwgbmV3IEVycm9yKFwiUm9vdGZpbGUgaW4gdW5rbm93biBmb3JtYXRcIikpO1xuXHRcdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRmaWxlbmFtZSA9IHJvb3RmaWxlW1wiQFwiXVtcImZ1bGwtcGF0aFwiXS50b0xvd2VyQ2FzZSgpLnRyaW0oKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmICghZmlsZW5hbWUpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHR0aGlzLmVtaXQoXCJlcnJvclwiLCBuZXcgRXJyb3IoXCJFbXB0eSByb290ZmlsZVwiKSk7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Zm9yIChpID0gMCwgbGVuID0gdGhpcy56aXAubmFtZXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRpZiAodGhpcy56aXAubmFtZXNbaV0udG9Mb3dlckNhc2UoKSA9PSAoZmlsZW5hbWUgYXMgYW55IGFzIHN0cmluZykpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0dGhpcy5yb290RmlsZSA9IHRoaXMuemlwLm5hbWVzW2ldO1xuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKCF0aGlzLnJvb3RGaWxlKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0dGhpcy5lbWl0KFwiZXJyb3JcIiwgbmV3IEVycm9yKFwiUm9vdGZpbGUgbm90IGZvdW5kIGZyb20gYXJjaGl2ZVwiKSk7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0dGhpcy5oYW5kbGVSb290RmlsZSgpO1xuXG5cdFx0XHR9KTtcblxuXHRcdFx0eG1scGFyc2VyLm9uKFwiZXJyb3JcIiwgKGVycikgPT5cblx0XHRcdHtcblx0XHRcdFx0dGhpcy5lbWl0KFwiZXJyb3JcIiwgbmV3IEVycm9yKFwiUGFyc2luZyBjb250YWluZXIgWE1MIGZhaWxlZFwiKSk7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH0pO1xuXG5cdFx0XHR4bWxwYXJzZXIucGFyc2VTdHJpbmcoeG1sKTtcblxuXHRcdH0pO1xuXHR9XG5cblx0LyoqXG5cdCAqICBFUHViI2hhbmRsZVJvb3RGaWxlKCkgLT4gdW5kZWZpbmVkXG5cdCAqXG5cdCAqICBQYXJzZXMgdGhlIHJvb3RmaWxlIFhNTCBhbmQgY2FsbHMgcm9vdGZpbGUgcGFyc2VyXG5cdCAqKi9cblx0aGFuZGxlUm9vdEZpbGUoKVxuXHR7XG5cdFx0Y29uc3QgeG1sMmpzT3B0aW9ucyA9IHRoaXMuX2dldFN0YXRpYygpLnhtbDJqc09wdGlvbnM7XG5cblx0XHR0aGlzLnppcC5yZWFkRmlsZSh0aGlzLnJvb3RGaWxlLCAoZXJyLCBkYXRhKSA9PlxuXHRcdHtcblx0XHRcdGlmIChlcnIpXG5cdFx0XHR7XG5cdFx0XHRcdHRoaXMuZW1pdChcImVycm9yXCIsIG5ldyBFcnJvcihcIlJlYWRpbmcgYXJjaGl2ZSBmYWlsZWRcIikpO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cdFx0XHR2YXIgeG1sID0gZGF0YS50b1N0cmluZyhcInV0Zi04XCIpLFxuXHRcdFx0XHR4bWxwYXJzZXIgPSBuZXcgeG1sMmpzLlBhcnNlcih4bWwyanNPcHRpb25zKTtcblxuXHRcdFx0eG1scGFyc2VyLm9uKFwiZW5kXCIsIHRoaXMucGFyc2VSb290RmlsZS5iaW5kKHRoaXMpKTtcblxuXHRcdFx0eG1scGFyc2VyLm9uKFwiZXJyb3JcIiwgKGVycikgPT5cblx0XHRcdHtcblx0XHRcdFx0dGhpcy5lbWl0KFwiZXJyb3JcIiwgbmV3IEVycm9yKFwiUGFyc2luZyBjb250YWluZXIgWE1MIGZhaWxlZFwiKSk7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH0pO1xuXG5cdFx0XHR4bWxwYXJzZXIucGFyc2VTdHJpbmcoeG1sKTtcblxuXHRcdH0pO1xuXHR9XG5cblx0LyoqXG5cdCAqICBFUHViI3BhcnNlUm9vdEZpbGUoKSAtPiB1bmRlZmluZWRcblx0ICpcblx0ICogIFBhcnNlcyBlbGVtZW50cyBcIm1ldGFkYXRhLFwiIFwibWFuaWZlc3QsXCIgXCJzcGluZVwiIGFuZCBUT0MuXG5cdCAqICBFbWl0cyBcImVuZFwiIGlmIG5vIFRPQ1xuXHQgKiovXG5cdHBhcnNlUm9vdEZpbGUocm9vdGZpbGUpXG5cdHtcblxuXHRcdHRoaXMudmVyc2lvbiA9IHJvb3RmaWxlWydAJ10udmVyc2lvbiB8fCAnMi4wJztcblxuXHRcdHZhciBpLCBsZW4sIGtleXMsIGtleXBhcnRzLCBrZXk7XG5cdFx0a2V5cyA9IE9iamVjdC5rZXlzKHJvb3RmaWxlKTtcblx0XHRmb3IgKGkgPSAwLCBsZW4gPSBrZXlzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKVxuXHRcdHtcblx0XHRcdGtleXBhcnRzID0ga2V5c1tpXS5zcGxpdChcIjpcIik7XG5cdFx0XHRrZXkgPSAoa2V5cGFydHMucG9wKCkgfHwgXCJcIikudG9Mb3dlckNhc2UoKS50cmltKCk7XG5cdFx0XHRzd2l0Y2ggKGtleSlcblx0XHRcdHtcblx0XHRcdFx0Y2FzZSBcIm1ldGFkYXRhXCI6XG5cdFx0XHRcdFx0dGhpcy5wYXJzZU1ldGFkYXRhKHJvb3RmaWxlW2tleXNbaV1dKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSBcIm1hbmlmZXN0XCI6XG5cdFx0XHRcdFx0dGhpcy5wYXJzZU1hbmlmZXN0KHJvb3RmaWxlW2tleXNbaV1dKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSBcInNwaW5lXCI6XG5cdFx0XHRcdFx0dGhpcy5wYXJzZVNwaW5lKHJvb3RmaWxlW2tleXNbaV1dKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSBcImd1aWRlXCI6XG5cdFx0XHRcdFx0Ly90aGlzLnBhcnNlR3VpZGUocm9vdGZpbGVba2V5c1tpXV0pO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmICh0aGlzLnNwaW5lLnRvYylcblx0XHR7XG5cdFx0XHR0aGlzLnBhcnNlVE9DKCk7XG5cdFx0fVxuXHRcdGVsc2Vcblx0XHR7XG5cdFx0XHR0aGlzLmVtaXQoXCJlbmRcIik7XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqICBFUHViI3BhcnNlTWV0YWRhdGEoKSAtPiB1bmRlZmluZWRcblx0ICpcblx0ICogIFBhcnNlcyBcIm1ldGFkYXRhXCIgYmxvY2sgKGJvb2sgbWV0YWRhdGEsIHRpdGxlLCBhdXRob3IgZXRjLilcblx0ICoqL1xuXHRwYXJzZU1ldGFkYXRhKG1ldGFkYXRhOiBFUHViLklNZXRhZGF0YSlcblx0e1xuXHRcdGxldCBpLCBqLCBsZW4sIGtleXMsIGtleXBhcnRzLCBrZXk7XG5cdFx0Y29uc3QgX3NlbGYgPSB0aGlzO1xuXG5cdFx0dGhpcy5tZXRhZGF0YVtTWU1CT0xfUkFXX0RBVEFdID0gbWV0YWRhdGE7XG5cblx0XHRrZXlzID0gT2JqZWN0LmtleXMobWV0YWRhdGEpO1xuXHRcdGZvciAoaSA9IDAsIGxlbiA9IGtleXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspXG5cdFx0e1xuXHRcdFx0a2V5cGFydHMgPSBrZXlzW2ldLnNwbGl0KFwiOlwiKTtcblx0XHRcdGtleSA9IChrZXlwYXJ0cy5wb3AoKSB8fCBcIlwiKS50b0xvd2VyQ2FzZSgpLnRyaW0oKTtcblxuXHRcdFx0Y29uc3QgY3VycmVudERhdGEgPSBtZXRhZGF0YVtrZXlzW2ldXTtcblxuXHRcdFx0c3dpdGNoIChrZXkpXG5cdFx0XHR7XG5cdFx0XHRcdGNhc2UgXCJwdWJsaXNoZXJcIjpcblx0XHRcdFx0XHRpZiAoQXJyYXkuaXNBcnJheShjdXJyZW50RGF0YSkpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0dGhpcy5tZXRhZGF0YS5wdWJsaXNoZXIgPSBTdHJpbmcoY3VycmVudERhdGFbMF0gJiYgY3VycmVudERhdGFbMF1bXCIjXCJdIHx8IGN1cnJlbnREYXRhWzBdIHx8IFwiXCIpXG5cdFx0XHRcdFx0XHRcdC50cmltKCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHR0aGlzLm1ldGFkYXRhLnB1Ymxpc2hlciA9IFN0cmluZyhjdXJyZW50RGF0YVtcIiNcIl0gfHwgY3VycmVudERhdGEgfHwgXCJcIikudHJpbSgpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSBcImxhbmd1YWdlXCI6XG5cdFx0XHRcdFx0aWYgKEFycmF5LmlzQXJyYXkoY3VycmVudERhdGEpKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdHRoaXMubWV0YWRhdGEubGFuZ3VhZ2UgPSBTdHJpbmcoY3VycmVudERhdGFbMF0gJiYgY3VycmVudERhdGFbMF1bXCIjXCJdIHx8IGN1cnJlbnREYXRhWzBdIHx8IFwiXCIpXG5cdFx0XHRcdFx0XHRcdC50b0xvd2VyQ2FzZSgpXG5cdFx0XHRcdFx0XHRcdC50cmltKCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHR7XG5cblx0XHRcdFx0XHRcdHRoaXMubWV0YWRhdGEubGFuZ3VhZ2UgPSBTdHJpbmcoY3VycmVudERhdGFbXCIjXCJdIHx8IGN1cnJlbnREYXRhIHx8IFwiXCIpXG5cdFx0XHRcdFx0XHRcdC50b0xvd2VyQ2FzZSgpXG5cdFx0XHRcdFx0XHRcdC50cmltKCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlIFwidGl0bGVcIjpcblx0XHRcdFx0XHRpZiAoQXJyYXkuaXNBcnJheShjdXJyZW50RGF0YSkpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0dGhpcy5tZXRhZGF0YS50aXRsZSA9IFN0cmluZyhjdXJyZW50RGF0YVswXSAmJiBjdXJyZW50RGF0YVswXVtcIiNcIl0gfHwgY3VycmVudERhdGFbMF0gfHwgXCJcIilcblx0XHRcdFx0XHRcdFx0LnRyaW0oKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdHRoaXMubWV0YWRhdGEudGl0bGUgPSBTdHJpbmcoY3VycmVudERhdGFbXCIjXCJdIHx8IGN1cnJlbnREYXRhIHx8IFwiXCIpLnRyaW0oKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgXCJzdWJqZWN0XCI6XG5cblx0XHRcdFx0XHR0aGlzLm1ldGFkYXRhLnN1YmplY3QgPSB0aGlzLm1ldGFkYXRhLnN1YmplY3QgfHwgW107XG5cblx0XHRcdFx0XHQoQXJyYXkuaXNBcnJheShjdXJyZW50RGF0YSkgPyBjdXJyZW50RGF0YSA6IFtjdXJyZW50RGF0YV0pXG5cdFx0XHRcdFx0XHQuZm9yRWFjaChmdW5jdGlvbiAodmFsdWUpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdGxldCB0YWcgPSAoX21ldGFfdmFsKHZhbHVlLCAnIycpIHx8ICcnKS50cmltKCk7XG5cdFx0XHRcdFx0XHRcdGlmICh0YWcgIT09ICcnKVxuXHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0X3NlbGYubWV0YWRhdGEuc3ViamVjdC5wdXNoKHRhZyk7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0O1xuXG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgXCJkZXNjcmlwdGlvblwiOlxuXHRcdFx0XHRcdGlmIChBcnJheS5pc0FycmF5KGN1cnJlbnREYXRhKSlcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHR0aGlzLm1ldGFkYXRhLmRlc2NyaXB0aW9uID0gU3RyaW5nKGN1cnJlbnREYXRhWzBdICYmIGN1cnJlbnREYXRhWzBdW1wiI1wiXSB8fCBjdXJyZW50RGF0YVswXSB8fCBcIlwiKVxuXHRcdFx0XHRcdFx0XHQudHJpbSgpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0dGhpcy5tZXRhZGF0YS5kZXNjcmlwdGlvbiA9IFN0cmluZyhjdXJyZW50RGF0YVtcIiNcIl0gfHwgY3VycmVudERhdGEgfHwgXCJcIikudHJpbSgpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSBcImNyZWF0b3JcIjpcblx0XHRcdFx0XHRpZiAoQXJyYXkuaXNBcnJheShjdXJyZW50RGF0YSkpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0dGhpcy5tZXRhZGF0YS5jcmVhdG9yID0gU3RyaW5nKGN1cnJlbnREYXRhWzBdICYmIGN1cnJlbnREYXRhWzBdW1wiI1wiXSB8fCBjdXJyZW50RGF0YVswXSB8fCBcIlwiKVxuXHRcdFx0XHRcdFx0XHQudHJpbSgpO1xuXHRcdFx0XHRcdFx0dGhpcy5tZXRhZGF0YS5jcmVhdG9yRmlsZUFzID0gU3RyaW5nKGN1cnJlbnREYXRhWzBdICYmIGN1cnJlbnREYXRhWzBdWydAJ10gJiYgY3VycmVudERhdGFbMF1bJ0AnXVtcIm9wZjpmaWxlLWFzXCJdIHx8IHRoaXMubWV0YWRhdGEuY3JlYXRvcilcblx0XHRcdFx0XHRcdFx0LnRyaW0oKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdHRoaXMubWV0YWRhdGEuY3JlYXRvciA9IFN0cmluZyhjdXJyZW50RGF0YVtcIiNcIl0gfHwgY3VycmVudERhdGEgfHwgXCJcIikudHJpbSgpO1xuXHRcdFx0XHRcdFx0dGhpcy5tZXRhZGF0YS5jcmVhdG9yRmlsZUFzID0gU3RyaW5nKGN1cnJlbnREYXRhWydAJ10gJiYgY3VycmVudERhdGFbJ0AnXVtcIm9wZjpmaWxlLWFzXCJdIHx8IHRoaXMubWV0YWRhdGEuY3JlYXRvcilcblx0XHRcdFx0XHRcdFx0LnRyaW0oKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgXCJkYXRlXCI6XG5cdFx0XHRcdFx0aWYgKEFycmF5LmlzQXJyYXkoY3VycmVudERhdGEpKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdHRoaXMubWV0YWRhdGEuZGF0ZSA9IFN0cmluZyhjdXJyZW50RGF0YVswXSAmJiBjdXJyZW50RGF0YVswXVtcIiNcIl0gfHwgY3VycmVudERhdGFbMF0gfHwgXCJcIilcblx0XHRcdFx0XHRcdFx0LnRyaW0oKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdHRoaXMubWV0YWRhdGEuZGF0ZSA9IFN0cmluZyhjdXJyZW50RGF0YVtcIiNcIl0gfHwgY3VycmVudERhdGEgfHwgXCJcIikudHJpbSgpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSBcImlkZW50aWZpZXJcIjpcblx0XHRcdFx0XHRpZiAoY3VycmVudERhdGFbXCJAXCJdICYmIGN1cnJlbnREYXRhW1wiQFwiXVtcIm9wZjpzY2hlbWVcIl0gPT0gXCJJU0JOXCIpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0dGhpcy5tZXRhZGF0YS5JU0JOID0gU3RyaW5nKGN1cnJlbnREYXRhW1wiI1wiXSB8fCBcIlwiKS50cmltKCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVsc2UgaWYgKGN1cnJlbnREYXRhW1wiQFwiXSAmJiBjdXJyZW50RGF0YVtcIkBcIl0uaWQgJiYgY3VycmVudERhdGFbXCJAXCJdLmlkLm1hdGNoKC91dWlkL2kpKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdHRoaXMubWV0YWRhdGEuVVVJRCA9IFN0cmluZyhjdXJyZW50RGF0YVtcIiNcIl0gfHwgXCJcIilcblx0XHRcdFx0XHRcdFx0LnJlcGxhY2UoJ3Vybjp1dWlkOicsICcnKVxuXHRcdFx0XHRcdFx0XHQudG9VcHBlckNhc2UoKVxuXHRcdFx0XHRcdFx0XHQudHJpbSgpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlIGlmIChBcnJheS5pc0FycmF5KGN1cnJlbnREYXRhKSlcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRmb3IgKGogPSAwOyBqIDwgY3VycmVudERhdGEubGVuZ3RoOyBqKyspXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdGlmIChjdXJyZW50RGF0YVtqXVtcIkBcIl0pXG5cdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRpZiAoY3VycmVudERhdGFbal1bXCJAXCJdW1wib3BmOnNjaGVtZVwiXSA9PSBcIklTQk5cIilcblx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHR0aGlzLm1ldGFkYXRhLklTQk4gPSBTdHJpbmcoY3VycmVudERhdGFbal1bXCIjXCJdIHx8IFwiXCIpLnRyaW0oKTtcblx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0ZWxzZSBpZiAoY3VycmVudERhdGFbal1bXCJAXCJdLmlkICYmIGN1cnJlbnREYXRhW2pdW1wiQFwiXS5pZC5tYXRjaCgvdXVpZC9pKSlcblx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHR0aGlzLm1ldGFkYXRhLlVVSUQgPSBTdHJpbmcoY3VycmVudERhdGFbal1bXCIjXCJdIHx8IFwiXCIpXG5cdFx0XHRcdFx0XHRcdFx0XHRcdC5yZXBsYWNlKCd1cm46dXVpZDonLCAnJylcblx0XHRcdFx0XHRcdFx0XHRcdFx0LnRvVXBwZXJDYXNlKClcblx0XHRcdFx0XHRcdFx0XHRcdFx0LnRyaW0oKTtcblx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgJ21ldGEnOlxuXHRcdFx0XHRcdGlmIChjdXJyZW50RGF0YVsnIyddICYmIGN1cnJlbnREYXRhWydAJ10ucHJvcGVydHkgPT0gJ2NhbGlicmU6YXV0aG9yX2xpbmtfbWFwJylcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHR0aGlzLm1ldGFkYXRhWydjb250cmlidXRlJ10gPSB0aGlzLm1ldGFkYXRhWydjb250cmlidXRlJ10gfHwgW107XG5cdFx0XHRcdFx0XHR0aGlzLm1ldGFkYXRhWydhdXRob3JfbGlua19tYXAnXSA9IHRoaXMubWV0YWRhdGFbJ2F1dGhvcl9saW5rX21hcCddIHx8IHt9O1xuXG5cdFx0XHRcdFx0XHRsZXQgdCA9IEpTT04ucGFyc2UoY3VycmVudERhdGFbJyMnXSk7XG5cblx0XHRcdFx0XHRcdGZvciAobGV0IG4gaW4gdClcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0biA9IG4udG9TdHJpbmcoKS50cmltKCk7XG5cblx0XHRcdFx0XHRcdFx0dGhpcy5tZXRhZGF0YVsnY29udHJpYnV0ZSddLnB1c2gobik7XG5cdFx0XHRcdFx0XHRcdHRoaXMubWV0YWRhdGFbJ2F1dGhvcl9saW5rX21hcCddW25dID0gKHRbbl0gfHwgJycpLnRvU3RyaW5nKCkudHJpbSgpO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHR0aGlzLm1ldGFkYXRhWydjb250cmlidXRlJ10gPSBhcnJheV91bmlxdWUodGhpcy5tZXRhZGF0YVsnY29udHJpYnV0ZSddKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0ZGVmYXVsdDpcblx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKGtleSwgY3VycmVudERhdGEpO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGxldCBtZXRhcyA9IG1ldGFkYXRhWydtZXRhJ10gfHwge307XG5cdFx0T2JqZWN0LmtleXMobWV0YXMpLmZvckVhY2goKGtleSkgPT5cblx0XHR7XG5cdFx0XHR2YXIgbWV0YSA9IG1ldGFzW2tleV07XG5cdFx0XHRpZiAobWV0YVsnQCddICYmIG1ldGFbJ0AnXS5uYW1lKVxuXHRcdFx0e1xuXHRcdFx0XHR2YXIgbmFtZSA9IG1ldGFbJ0AnXS5uYW1lO1xuXHRcdFx0XHR0aGlzLm1ldGFkYXRhW25hbWVdID0gbWV0YVsnQCddLmNvbnRlbnQ7XG5cblx0XHRcdFx0aWYgKG5hbWUgPT0gJ2NhbGlicmU6c2VyaWVzJylcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHRoaXMubWV0YWRhdGFbJ3NlcmllcyddID0gdGhpcy5tZXRhZGF0YVsnc2VyaWVzJ10gfHwgbWV0YVsnQCddLmNvbnRlbnQ7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGlmIChtZXRhWycjJ10gJiYgbWV0YVsnQCddLnByb3BlcnR5KVxuXHRcdFx0e1xuXHRcdFx0XHR0aGlzLm1ldGFkYXRhW21ldGFbJ0AnXS5wcm9wZXJ0eV0gPSBtZXRhWycjJ107XG5cdFx0XHR9XG5cblx0XHRcdGlmIChtZXRhLm5hbWUgJiYgbWV0YS5uYW1lID09IFwiY292ZXJcIilcblx0XHRcdHtcblx0XHRcdFx0dGhpcy5tZXRhZGF0YVttZXRhLm5hbWVdID0gbWV0YS5jb250ZW50O1xuXHRcdFx0fVxuXHRcdH0sIHRoaXMpO1xuXG5cdFx0ZnVuY3Rpb24gX21ldGFfdmFsKHJvdywga2V5ID0gbnVsbClcblx0XHR7XG5cdFx0XHRpZiAoa2V5ICE9PSBudWxsKVxuXHRcdFx0e1xuXHRcdFx0XHRyZXR1cm4gcm93W2tleV0gfHwgcm93O1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gcm93O1xuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiAgRVB1YiNwYXJzZU1hbmlmZXN0KCkgLT4gdW5kZWZpbmVkXG5cdCAqXG5cdCAqICBQYXJzZXMgXCJtYW5pZmVzdFwiIGJsb2NrIChhbGwgaXRlbXMgaW5jbHVkZWQsIGh0bWwgZmlsZXMsIGltYWdlcywgc3R5bGVzKVxuXHQgKiovXG5cdHBhcnNlTWFuaWZlc3QobWFuaWZlc3QpXG5cdHtcblx0XHR2YXIgaSwgbGVuLCBwYXRoID0gdGhpcy5yb290RmlsZS5zcGxpdChcIi9cIiksIGVsZW1lbnQsIHBhdGhfc3RyO1xuXHRcdHBhdGgucG9wKCk7XG5cdFx0cGF0aF9zdHIgPSBwYXRoLmpvaW4oXCIvXCIpO1xuXG5cdFx0aWYgKG1hbmlmZXN0Lml0ZW0pXG5cdFx0e1xuXHRcdFx0Zm9yIChpID0gMCwgbGVuID0gbWFuaWZlc3QuaXRlbS5sZW5ndGg7IGkgPCBsZW47IGkrKylcblx0XHRcdHtcblx0XHRcdFx0aWYgKG1hbmlmZXN0Lml0ZW1baV1bJ0AnXSlcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGVsZW1lbnQgPSBtYW5pZmVzdC5pdGVtW2ldWydAJ107XG5cblx0XHRcdFx0XHRlbGVtZW50ID0gdGhpcy5fRWxlbShlbGVtZW50KTtcblxuXHRcdFx0XHRcdGlmIChlbGVtZW50LmhyZWYgJiYgZWxlbWVudC5ocmVmLnN1YnN0cigwLCBwYXRoX3N0ci5sZW5ndGgpICE9IHBhdGhfc3RyKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGVsZW1lbnQuaHJlZiA9IHBhdGguY29uY2F0KFtlbGVtZW50LmhyZWZdKS5qb2luKFwiL1wiKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHR0aGlzLm1hbmlmZXN0W21hbmlmZXN0Lml0ZW1baV1bJ0AnXS5pZF0gPSBlbGVtZW50O1xuXG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogIEVQdWIjcGFyc2VTcGluZSgpIC0+IHVuZGVmaW5lZFxuXHQgKlxuXHQgKiAgUGFyc2VzIFwic3BpbmVcIiBibG9jayAoYWxsIGh0bWwgZWxlbWVudHMgdGhhdCBhcmUgc2hvd24gdG8gdGhlIHJlYWRlcilcblx0ICoqL1xuXHRwYXJzZVNwaW5lKHNwaW5lKVxuXHR7XG5cdFx0dmFyIGksIGxlbiwgcGF0aCA9IHRoaXMucm9vdEZpbGUuc3BsaXQoXCIvXCIpLCBlbGVtZW50O1xuXHRcdHBhdGgucG9wKCk7XG5cblx0XHRpZiAoc3BpbmVbJ0AnXSAmJiBzcGluZVsnQCddLnRvYylcblx0XHR7XG5cdFx0XHR0aGlzLnNwaW5lLnRvYyA9IHRoaXMubWFuaWZlc3Rbc3BpbmVbJ0AnXS50b2NdIHx8IG51bGw7XG5cdFx0fVxuXG5cdFx0aWYgKHNwaW5lLml0ZW1yZWYpXG5cdFx0e1xuXHRcdFx0aWYgKCFBcnJheS5pc0FycmF5KHNwaW5lLml0ZW1yZWYpKVxuXHRcdFx0e1xuXHRcdFx0XHRzcGluZS5pdGVtcmVmID0gW3NwaW5lLml0ZW1yZWZdO1xuXHRcdFx0fVxuXHRcdFx0Zm9yIChpID0gMCwgbGVuID0gc3BpbmUuaXRlbXJlZi5sZW5ndGg7IGkgPCBsZW47IGkrKylcblx0XHRcdHtcblx0XHRcdFx0aWYgKHNwaW5lLml0ZW1yZWZbaV1bJ0AnXSlcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGlmIChlbGVtZW50ID0gdGhpcy5tYW5pZmVzdFtzcGluZS5pdGVtcmVmW2ldWydAJ10uaWRyZWZdKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdHRoaXMuc3BpbmUuY29udGVudHMucHVzaChlbGVtZW50KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdFx0dGhpcy5mbG93ID0gdGhpcy5zcGluZS5jb250ZW50cztcblx0fVxuXG5cdC8qKlxuXHQgKiAgRVB1YiNwYXJzZVRPQygpIC0+IHVuZGVmaW5lZFxuXHQgKlxuXHQgKiAgUGFyc2VzIG5jeCBmaWxlIGZvciB0YWJsZSBvZiBjb250ZW50cyAodGl0bGUsIGh0bWwgZmlsZSlcblx0ICoqL1xuXHRwYXJzZVRPQygpXG5cdHtcblx0XHR2YXIgaSwgbGVuLCBwYXRoID0gdGhpcy5zcGluZS50b2MuaHJlZi5zcGxpdChcIi9cIiksIGlkX2xpc3QgPSB7fSwga2V5cztcblx0XHRwYXRoLnBvcCgpO1xuXG5cdFx0a2V5cyA9IE9iamVjdC5rZXlzKHRoaXMubWFuaWZlc3QpO1xuXHRcdGZvciAoaSA9IDAsIGxlbiA9IGtleXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspXG5cdFx0e1xuXHRcdFx0aWRfbGlzdFt0aGlzLm1hbmlmZXN0W2tleXNbaV1dLmhyZWZdID0ga2V5c1tpXTtcblx0XHR9XG5cblx0XHRjb25zdCB4bWwyanNPcHRpb25zID0gdGhpcy5fZ2V0U3RhdGljKCkueG1sMmpzT3B0aW9ucztcblxuXHRcdHRoaXMuemlwLnJlYWRGaWxlKHRoaXMuc3BpbmUudG9jLmhyZWYsICAoZXJyLCBkYXRhKSA9PlxuXHRcdHtcblx0XHRcdGlmIChlcnIpXG5cdFx0XHR7XG5cdFx0XHRcdHRoaXMuZW1pdChcImVycm9yXCIsIG5ldyBFcnJvcihcIlJlYWRpbmcgYXJjaGl2ZSBmYWlsZWRcIikpO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cdFx0XHR2YXIgeG1sID0gZGF0YS50b1N0cmluZyhcInV0Zi04XCIpLFxuXHRcdFx0XHR4bWxwYXJzZXIgPSBuZXcgeG1sMmpzLlBhcnNlcih4bWwyanNPcHRpb25zKTtcblxuXHRcdFx0eG1scGFyc2VyLm9uKFwiZW5kXCIsIChyZXN1bHQpID0+XG5cdFx0XHR7XG5cdFx0XHRcdGlmIChyZXN1bHQubmF2TWFwICYmIHJlc3VsdC5uYXZNYXAubmF2UG9pbnQpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHR0aGlzLnRvYyA9IHRoaXMud2Fsa05hdk1hcChyZXN1bHQubmF2TWFwLm5hdlBvaW50LCBwYXRoLCBpZF9saXN0KTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHRoaXMuZW1pdChcImVuZFwiKTtcblx0XHRcdH0pO1xuXG5cdFx0XHR4bWxwYXJzZXIub24oXCJlcnJvclwiLCAoZXJyKSA9PlxuXHRcdFx0e1xuXHRcdFx0XHR0aGlzLmVtaXQoXCJlcnJvclwiLCBuZXcgRXJyb3IoXCJQYXJzaW5nIGNvbnRhaW5lciBYTUwgZmFpbGVkXCIpKTtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fSk7XG5cblx0XHRcdHhtbHBhcnNlci5wYXJzZVN0cmluZyh4bWwpO1xuXG5cdFx0fSk7XG5cdH1cblxuXHQvKipcblx0ICogIEVQdWIjd2Fsa05hdk1hcChicmFuY2gsIHBhdGgsIGlkX2xpc3QsWywgbGV2ZWxdKSAtPiBBcnJheVxuXHQgKiAgLSBicmFuY2ggKEFycmF5IHwgT2JqZWN0KTogTkNYIE5hdlBvaW50IG9iamVjdFxuXHQgKiAgLSBwYXRoIChBcnJheSk6IEJhc2UgcGF0aFxuXHQgKiAgLSBpZF9saXN0IChPYmplY3QpOiBtYXAgb2YgZmlsZSBwYXRocyBhbmQgaWQgdmFsdWVzXG5cdCAqICAtIGxldmVsIChOdW1iZXIpOiBkZWVwbmVzc1xuXHQgKlxuXHQgKiAgV2Fsa3MgdGhlIE5hdk1hcCBvYmplY3QgdGhyb3VnaCBhbGwgbGV2ZWxzIGFuZCBmaW5kcyBlbGVtZW50c1xuXHQgKiAgZm9yIFRPQ1xuXHQgKiovXG5cdHdhbGtOYXZNYXAoYnJhbmNoLCBwYXRoLCBpZF9saXN0LCBsZXZlbD86IG51bWJlciwgcGU/OiBFUHViLlRvY0VsZW1lbnQsIHBhcmVudE5jeD86IEVQdWIuSU5jeFRyZWUsIG5jeF9pZHg/KVxuXHR7XG5cdFx0bmN4X2lkeCA9IG5jeF9pZHggfHwge1xuXHRcdFx0aW5kZXg6IDAsXG5cdFx0fTtcblxuXHRcdGxldmVsID0gbGV2ZWwgfHwgMDtcblxuXHRcdHRoaXMubmN4X2RlcHRoID0gTWF0aC5tYXgobGV2ZWwgKyAxLCB0aGlzLm5jeF9kZXB0aCB8fCAwKTtcblxuXHRcdC8vIGRvbid0IGdvIHRvbyBmYXJcblx0XHRpZiAobGV2ZWwgPiA3KVxuXHRcdHtcblx0XHRcdHJldHVybiBbXTtcblx0XHR9XG5cblx0XHR2YXIgb3V0cHV0ID0gW107XG5cblx0XHRpZiAoIUFycmF5LmlzQXJyYXkoYnJhbmNoKSlcblx0XHR7XG5cdFx0XHRicmFuY2ggPSBbYnJhbmNoXTtcblx0XHR9XG5cblx0XHR0aGlzLm5jeCA9IHRoaXMubmN4IHx8IFtdO1xuXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBicmFuY2gubGVuZ3RoOyBpKyspXG5cdFx0e1xuXHRcdFx0bGV0IGVsZW1lbnQ6IEVQdWIuVG9jRWxlbWVudDtcblx0XHRcdGxldCBjdXJyZW50TmN4O1xuXG5cdFx0XHRpZiAoYnJhbmNoW2ldLm5hdkxhYmVsKVxuXHRcdFx0e1xuXHRcdFx0XHR2YXIgdGl0bGUgPSAnJztcblx0XHRcdFx0aWYgKGJyYW5jaFtpXS5uYXZMYWJlbCAmJiB0eXBlb2YgYnJhbmNoW2ldLm5hdkxhYmVsLnRleHQgPT0gJ3N0cmluZycpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHQvKlxuXHRcdFx0XHRcdHRpdGxlID0gYnJhbmNoW2ldLm5hdkxhYmVsICYmIGJyYW5jaFtpXS5uYXZMYWJlbC50ZXh0IHx8IGJyYW5jaFtpXS5uYXZMYWJlbCA9PT0gYnJhbmNoW2ldLm5hdkxhYmVsXG5cdFx0XHRcdFx0XHQ/ICcnXG5cdFx0XHRcdFx0XHQ6IChicmFuY2hbaV0ubmF2TGFiZWwgJiYgYnJhbmNoW2ldLm5hdkxhYmVsLnRleHQgfHwgYnJhbmNoW2ldLm5hdkxhYmVsIHx8IFwiXCIpLnRyaW0oKTtcblx0XHRcdFx0XHQqL1xuXG5cdFx0XHRcdFx0dGl0bGUgPSAoYnJhbmNoW2ldLm5hdkxhYmVsICYmIGJyYW5jaFtpXS5uYXZMYWJlbC50ZXh0IHx8IGJyYW5jaFtpXS5uYXZMYWJlbCB8fCBcIlwiKS50cmltKCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0dmFyIG9yZGVyID0gTnVtYmVyKGJyYW5jaFtpXVtcIkBcIl0gJiYgYnJhbmNoW2ldW1wiQFwiXS5wbGF5T3JkZXIgfHwgMCk7XG5cdFx0XHRcdGlmIChpc05hTihvcmRlcikpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRvcmRlciA9IDA7XG5cdFx0XHRcdH1cblx0XHRcdFx0dmFyIGhyZWYgPSAnJztcblx0XHRcdFx0aWYgKGJyYW5jaFtpXS5jb250ZW50ICYmIGJyYW5jaFtpXS5jb250ZW50W1wiQFwiXSAmJiB0eXBlb2YgYnJhbmNoW2ldLmNvbnRlbnRbXCJAXCJdLnNyYyA9PSAnc3RyaW5nJylcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGhyZWYgPSBicmFuY2hbaV0uY29udGVudFtcIkBcIl0uc3JjLnRyaW0oKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGVsZW1lbnQgPSB7XG5cdFx0XHRcdFx0bGV2ZWw6IGxldmVsLFxuXHRcdFx0XHRcdG9yZGVyOiBvcmRlcixcblx0XHRcdFx0XHR0aXRsZTogdGl0bGVcblx0XHRcdFx0fTtcblxuXHRcdFx0XHRpZiAoaHJlZilcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGhyZWYgPSBwYXRoLmNvbmNhdChbaHJlZl0pLmpvaW4oXCIvXCIpO1xuXHRcdFx0XHRcdGVsZW1lbnQuaHJlZiA9IGhyZWY7XG5cblx0XHRcdFx0XHRpZiAoaWRfbGlzdFtlbGVtZW50LmhyZWZdKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdC8vIGxpbmsgZXhpc3Rpbmcgb2JqZWN0XG5cdFx0XHRcdFx0XHRlbGVtZW50ID0gdGhpcy5tYW5pZmVzdFtpZF9saXN0W2VsZW1lbnQuaHJlZl1dO1xuXG5cdFx0XHRcdFx0XHRlbGVtZW50LnRpdGxlID0gdGl0bGU7XG5cdFx0XHRcdFx0XHRlbGVtZW50Lm9yZGVyID0gb3JkZXI7XG5cdFx0XHRcdFx0XHRlbGVtZW50LmxldmVsID0gbGV2ZWw7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHQvLyB1c2UgbmV3IG9uZVxuXHRcdFx0XHRcdFx0ZWxlbWVudC5ocmVmID0gaHJlZjtcblx0XHRcdFx0XHRcdGVsZW1lbnQuaWQgPSAoYnJhbmNoW2ldW1wiQFwiXSAmJiBicmFuY2hbaV1bXCJAXCJdLmlkIHx8IFwiXCIpLnRyaW0oKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiAobGV2ZWwgPT0gMClcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRsZXQgaWR4ID0gdGhpcy5uY3gubGVuZ3RoO1xuXG5cdFx0XHRcdFx0XHRjdXJyZW50TmN4ID0gdGhpcy5uY3hbaWR4XSA9IHtcblx0XHRcdFx0XHRcdFx0aWQ6IGVsZW1lbnQuaWQsXG5cdFx0XHRcdFx0XHRcdG5jeF9pbmRleDogaWR4LFxuXHRcdFx0XHRcdFx0XHRuY3hfaW5kZXgyOiBuY3hfaWR4LmluZGV4KyssXG5cdFx0XHRcdFx0XHRcdGxldmVsLFxuXHRcdFx0XHRcdFx0XHRzdWI6IFtdLFxuXHRcdFx0XHRcdFx0fTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZSBpZiAocGFyZW50TmN4KVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGxldCBpZHggPSBwYXJlbnROY3guc3ViLmxlbmd0aDtcblxuXHRcdFx0XHRcdFx0Y3VycmVudE5jeCA9IHBhcmVudE5jeC5zdWJbcGFyZW50TmN4LnN1Yi5sZW5ndGhdID0ge1xuXHRcdFx0XHRcdFx0XHRpZDogZWxlbWVudC5pZCxcblx0XHRcdFx0XHRcdFx0bmN4X2luZGV4OiBpZHgsXG5cdFx0XHRcdFx0XHRcdG5jeF9pbmRleDI6IG5jeF9pZHguaW5kZXgrKyxcblx0XHRcdFx0XHRcdFx0bGV2ZWwsXG5cdFx0XHRcdFx0XHRcdHN1YjogW10sXG5cdFx0XHRcdFx0XHR9O1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdG91dHB1dC5wdXNoKGVsZW1lbnQpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdC8vY29uc29sZS5sb2cobmN4X2lkeCk7XG5cblx0XHRcdGlmIChicmFuY2hbaV0ubmF2UG9pbnQpXG5cdFx0XHR7XG5cdFx0XHRcdG91dHB1dCA9IG91dHB1dC5jb25jYXQodGhpcy53YWxrTmF2TWFwKGJyYW5jaFtpXS5uYXZQb2ludCwgcGF0aCwgaWRfbGlzdCwgbGV2ZWwgKyAxLCBlbGVtZW50LCBjdXJyZW50TmN4LCBuY3hfaWR4KSk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiBvdXRwdXQ7XG5cdH1cblxuXHQvKipcblx0ICogIEVQdWIjZ2V0Q2hhcHRlcihpZCwgY2FsbGJhY2spIC0+IHVuZGVmaW5lZFxuXHQgKiAgLSBpZCAoU3RyaW5nKTogTWFuaWZlc3QgaWQgdmFsdWUgZm9yIGEgY2hhcHRlclxuXHQgKiAgLSBjYWxsYmFjayAoRnVuY3Rpb24pOiBjYWxsYmFjayBmdW5jdGlvblxuXHQgKlxuXHQgKiAgRmluZHMgYSBjaGFwdGVyIHRleHQgZm9yIGFuIGlkLiBSZXBsYWNlcyBpbWFnZSBhbmQgbGluayBVUkwncywgcmVtb3Zlc1xuXHQgKiAgPGhlYWQ+IGV0Yy4gZWxlbWVudHMuIFJldHVybiBvbmx5IGNoYXB0ZXJzIHdpdGggbWltZSB0eXBlIGFwcGxpY2F0aW9uL3hodG1sK3htbFxuXHQgKiovXG5cdGdldENoYXB0ZXIoY2hhcHRlcklkOiBzdHJpbmcsIGNhbGxiYWNrOiAoZXJyb3I6IEVycm9yLCB0ZXh0Pzogc3RyaW5nKSA9PiB2b2lkKVxuXHR7XG5cdFx0bGV0IHNlbGYgPSB0aGlzO1xuXG5cdFx0dGhpcy5nZXRDaGFwdGVyUmF3KGNoYXB0ZXJJZCwgKGVyciwgc3RyKSA9PlxuXHRcdHtcblx0XHRcdGlmIChlcnIpXG5cdFx0XHR7XG5cdFx0XHRcdGNhbGxiYWNrKGVycik7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0bGV0IG1ldGEgPSBzZWxmLm1hbmlmZXN0W2NoYXB0ZXJJZF07XG5cblx0XHRcdHZhciBpLCBsZW4sIHBhdGggPSB0aGlzLnJvb3RGaWxlLnNwbGl0KFwiL1wiKSwga2V5cyA9IE9iamVjdC5rZXlzKHRoaXMubWFuaWZlc3QpO1xuXHRcdFx0cGF0aC5wb3AoKTtcblxuXHRcdFx0bGV0IGJhc2VQYXRoID0gTm9kZVBhdGguZGlybmFtZShtZXRhLmhyZWYpO1xuXHRcdFx0bGV0IGJhc2VIcmVmID0gbWV0YS5ocmVmO1xuXG5cdFx0XHQvLyByZW1vdmUgbGluZWJyZWFrcyAobm8gbXVsdGkgbGluZSBtYXRjaGVzIGluIEpTIHJlZ2V4ISlcblx0XHRcdHN0ciA9IHN0ci5yZXBsYWNlKC9cXHI/XFxuL2csIFwiXFx1MDAwMFwiKTtcblxuXHRcdFx0Ly8ga2VlcCBvbmx5IDxib2R5PiBjb250ZW50c1xuXHRcdFx0Ly8gQHRzLWlnbm9yZVxuXHRcdFx0c3RyLnJlcGxhY2UoLzxib2R5W14+XSo/PiguKik8XFwvYm9keVtePl0qPz4vaSwgZnVuY3Rpb24gKG8sIGQpXG5cdFx0XHR7XG5cdFx0XHRcdHN0ciA9IGQudHJpbSgpO1xuXHRcdFx0fSk7XG5cblx0XHRcdC8vIHJlbW92ZSA8c2NyaXB0PiBibG9ja3MgaWYgYW55XG5cdFx0XHRzdHIgPSBzdHIucmVwbGFjZSgvPHNjcmlwdFtePl0qPz4oLio/KTxcXC9zY3JpcHRbXj5dKj8+L2lnLCBmdW5jdGlvbiAobywgcylcblx0XHRcdHtcblx0XHRcdFx0cmV0dXJuIFwiXCI7XG5cdFx0XHR9KTtcblxuXHRcdFx0Ly8gcmVtb3ZlIDxzdHlsZT4gYmxvY2tzIGlmIGFueVxuXHRcdFx0c3RyID0gc3RyLnJlcGxhY2UoLzxzdHlsZVtePl0qPz4oLio/KTxcXC9zdHlsZVtePl0qPz4vaWcsIGZ1bmN0aW9uIChvLCBzKVxuXHRcdFx0e1xuXHRcdFx0XHRyZXR1cm4gXCJcIjtcblx0XHRcdH0pO1xuXG5cdFx0XHQvLyByZW1vdmUgb25FdmVudCBoYW5kbGVyc1xuXHRcdFx0c3RyID0gc3RyLnJlcGxhY2UoLyhcXHMpKG9uXFx3KykoXFxzKj1cXHMqW1wiJ10/W15cIidcXHM+XSo/W1wiJ1xccz5dKS9nLCBmdW5jdGlvbiAobywgYSwgYiwgYylcblx0XHRcdHtcblx0XHRcdFx0cmV0dXJuIGEgKyBcInNraXAtXCIgKyBiICsgYztcblx0XHRcdH0pO1xuXG5cdFx0XHQvLyByZXBsYWNlIGltYWdlc1xuXHRcdFx0c3RyID0gc3RyLnJlcGxhY2UoLyg/PD1cXHN8Xikoc3JjXFxzKj1cXHMqKShbXCInXT8pKFteXCInXFxuXSo/KShcXDIpL2csIChvLCBhLCBkLCBiLCBjKSA9PiB7XG5cblx0XHRcdFx0bGV0IGltZyA9IE5vZGVQYXRoLnBvc2l4LmpvaW4oYmFzZVBhdGgsIGIpO1xuXHRcdFx0XHRsZXQgZWxlbWVudDtcblxuXHRcdFx0XHRmb3IgKGkgPSAwLCBsZW4gPSBrZXlzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0bGV0IF9hcnIgPSBbXG5cdFx0XHRcdFx0XHRzZWxmLm1hbmlmZXN0W2tleXNbaV1dLmhyZWYsXG5cdFx0XHRcdFx0XHRkZWNvZGVVUkkoc2VsZi5tYW5pZmVzdFtrZXlzW2ldXS5ocmVmKSxcblx0XHRcdFx0XHRcdGVuY29kZVVSSShzZWxmLm1hbmlmZXN0W2tleXNbaV1dLmhyZWYpLFxuXHRcdFx0XHRcdF07XG5cblx0XHRcdFx0XHRpZiAoX2Fyci5pbmNsdWRlcyhpbWcpKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGVsZW1lbnQgPSBzZWxmLm1hbmlmZXN0W2tleXNbaV1dO1xuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKGVsZW1lbnQpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRsZXQgcyA9IGEgKyBkICsgTm9kZVVybC5yZXNvbHZlKHRoaXMuaW1hZ2Vyb290LCBpbWcpICsgYztcblxuXHRcdFx0XHRcdHJldHVybiBzXG5cdFx0XHRcdH1cblxuXHRcdFx0XHRyZXR1cm4gbztcblx0XHRcdH0pO1xuXHRcdFx0Lypcblx0XHRcdHN0ciA9IHN0ci5yZXBsYWNlKC8oXFxzc3JjXFxzKj1cXHMqW1wiJ10/KShbXlwiJ1xccz5dKj8pKFtcIidcXHM+XSkvZywgKGZ1bmN0aW9uIChvLCBhLCBiLCBjKVxuXHRcdFx0e1xuXHRcdFx0XHR2YXIgaW1nID0gcGF0aC5jb25jYXQoW2JdKS5qb2luKFwiL1wiKS50cmltKCksXG5cdFx0XHRcdFx0ZWxlbWVudDtcblxuXHRcdFx0XHRmb3IgKGkgPSAwLCBsZW4gPSBrZXlzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0aWYgKHRoaXMubWFuaWZlc3Rba2V5c1tpXV0uaHJlZiA9PSBpbWcpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0ZWxlbWVudCA9IHRoaXMubWFuaWZlc3Rba2V5c1tpXV07XG5cdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBpbmNsdWRlIG9ubHkgaW1hZ2VzIGZyb20gbWFuaWZlc3Rcblx0XHRcdFx0aWYgKGVsZW1lbnQpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRyZXR1cm4gYSArIHRoaXMuaW1hZ2Vyb290ICsgZWxlbWVudC5pZCArIFwiL1wiICsgaW1nICsgYztcblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRyZXR1cm4gXCJcIjtcblx0XHRcdFx0fVxuXG5cdFx0XHR9KS5iaW5kKHRoaXMpKTtcblx0XHRcdCovXG5cblx0XHRcdC8vIHJlcGxhY2UgbGlua3Ncblx0XHRcdHN0ciA9IHN0ci5yZXBsYWNlKC8oXFxzaHJlZlxccyo9XFxzKltcIiddPykoW15cIidcXHM+XSo/KShbXCInXFxzPl0pL2csIChvLCBhLCBiLCBjKSA9PlxuXHRcdFx0e1xuXHRcdFx0XHR2YXIgbGlua3BhcnRzID0gYiAmJiBiLnNwbGl0KFwiI1wiKSxcblx0XHRcdFx0XHRsaW5rID0gcGF0aC5jb25jYXQoWyhsaW5rcGFydHMuc2hpZnQoKSB8fCBcIlwiKV0pLmpvaW4oXCIvXCIpLnRyaW0oKSxcblx0XHRcdFx0XHRlbGVtZW50O1xuXG5cdFx0XHRcdGZvciAoaSA9IDAsIGxlbiA9IGtleXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRpZiAodGhpcy5tYW5pZmVzdFtrZXlzW2ldXS5ocmVmLnNwbGl0KFwiI1wiKVswXSA9PSBsaW5rKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGVsZW1lbnQgPSB0aGlzLm1hbmlmZXN0W2tleXNbaV1dO1xuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0aWYgKGxpbmtwYXJ0cy5sZW5ndGgpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRsaW5rICs9IFwiI1wiICsgbGlua3BhcnRzLmpvaW4oXCIjXCIpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gaW5jbHVkZSBvbmx5IGltYWdlcyBmcm9tIG1hbmlmZXN0XG5cdFx0XHRcdGlmIChlbGVtZW50KVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0cmV0dXJuIGEgKyB0aGlzLmxpbmtyb290ICsgZWxlbWVudC5pZCArIFwiL1wiICsgbGluayArIGM7XG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0cmV0dXJuIGEgKyBiICsgYztcblx0XHRcdFx0fVxuXG5cdFx0XHR9KTtcblxuXHRcdFx0Ly8gYnJpbmcgYmFjayBsaW5lYnJlYWtzXG5cdFx0XHRzdHIgPSBzdHIucmVwbGFjZSgvXFx1MDAwMC9nLCBcIlxcblwiKS50cmltKCk7XG5cblx0XHRcdGNhbGxiYWNrKG51bGwsIHN0cik7XG5cdFx0fSk7XG5cdH1cblxuXHQvKipcblx0ICogIEVQdWIjZ2V0Q2hhcHRlclJhdyhpZCwgY2FsbGJhY2spIC0+IHVuZGVmaW5lZFxuXHQgKiAgLSBpZCAoU3RyaW5nKTogTWFuaWZlc3QgaWQgdmFsdWUgZm9yIGEgY2hhcHRlclxuXHQgKiAgLSBjYWxsYmFjayAoRnVuY3Rpb24pOiBjYWxsYmFjayBmdW5jdGlvblxuXHQgKlxuXHQgKiAgUmV0dXJucyB0aGUgcmF3IGNoYXB0ZXIgdGV4dCBmb3IgYW4gaWQuXG5cdCAqKi9cblx0Z2V0Q2hhcHRlclJhdyhjaGFwdGVySWQ6IHN0cmluZywgY2FsbGJhY2s6IChlcnJvcjogRXJyb3IsIHRleHQ/OiBzdHJpbmcpID0+IHZvaWQpXG5cdHtcblx0XHRpZiAodGhpcy5tYW5pZmVzdFtjaGFwdGVySWRdKVxuXHRcdHtcblx0XHRcdGlmICghKHRoaXMubWFuaWZlc3RbY2hhcHRlcklkXVsnbWVkaWEtdHlwZSddID09IFwiYXBwbGljYXRpb24veGh0bWwreG1sXCIgfHwgdGhpcy5tYW5pZmVzdFtjaGFwdGVySWRdWydtZWRpYS10eXBlJ10gPT0gXCJpbWFnZS9zdmcreG1sXCIpKVxuXHRcdFx0e1xuXHRcdFx0XHRyZXR1cm4gY2FsbGJhY2sobmV3IEVycm9yKGBJbnZhbGlkIG1pbWUgdHlwZSBmb3IgY2hhcHRlciBcIiR7Y2hhcHRlcklkfVwiICR7dGhpcy5tYW5pZmVzdFtjaGFwdGVySWRdWydtZWRpYS10eXBlJ119YCkpO1xuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLnppcC5yZWFkRmlsZSh0aGlzLm1hbmlmZXN0W2NoYXB0ZXJJZF0uaHJlZiwgKGZ1bmN0aW9uICh0aGlzOiBFUHViLCBlcnIsIGRhdGEpXG5cdFx0XHR7XG5cdFx0XHRcdGlmIChlcnIpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRjYWxsYmFjayhuZXcgRXJyb3IoYFJlYWRpbmcgYXJjaGl2ZSBmYWlsZWQgXCIke2NoYXB0ZXJJZH1cIiwgJHt0aGlzLm1hbmlmZXN0W2NoYXB0ZXJJZF0uaHJlZn1gKSk7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGVsc2UgaWYgKCFkYXRhKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0Y2FsbGJhY2sobmV3IEVycm9yKGBSZWFkaW5nIGFyY2hpdmUgZmFpbGVkIFwiJHtjaGFwdGVySWR9XCIsICR7dGhpcy5tYW5pZmVzdFtjaGFwdGVySWRdLmhyZWZ9YCkpO1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGNhbGxiYWNrKG51bGwsIGNybGYoZGF0YS50b1N0cmluZyhcInV0Zi04XCIpKSk7XG5cblx0XHRcdH0pLmJpbmQodGhpcykpO1xuXHRcdH1cblx0XHRlbHNlXG5cdFx0e1xuXHRcdFx0Y2FsbGJhY2sobmV3IEVycm9yKGBGaWxlIG5vdCBmb3VuZCBcIiR7Y2hhcHRlcklkfVwiYCkpO1xuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiAgRVB1YiNnZXRJbWFnZShpZCwgY2FsbGJhY2spIC0+IHVuZGVmaW5lZFxuXHQgKiAgLSBpZCAoU3RyaW5nKTogTWFuaWZlc3QgaWQgdmFsdWUgZm9yIGFuIGltYWdlXG5cdCAqICAtIGNhbGxiYWNrIChGdW5jdGlvbik6IGNhbGxiYWNrIGZ1bmN0aW9uXG5cdCAqXG5cdCAqICBGaW5kcyBhbiBpbWFnZSBmb3IgYW4gaWQuIFJldHVybnMgdGhlIGltYWdlIGFzIEJ1ZmZlci4gQ2FsbGJhY2sgZ2V0c1xuXHQgKiAgYW4gZXJyb3Igb2JqZWN0LCBpbWFnZSBidWZmZXIgYW5kIGltYWdlIGNvbnRlbnQtdHlwZS5cblx0ICogIFJldHVybiBvbmx5IGltYWdlcyB3aXRoIG1pbWUgdHlwZSBpbWFnZVxuXHQgKiovXG5cdGdldEltYWdlKGlkOiBzdHJpbmcsIGNhbGxiYWNrOiAoZXJyb3I6IEVycm9yLCBkYXRhPzogQnVmZmVyLCBtaW1lVHlwZT86IHN0cmluZykgPT4gdm9pZClcblx0e1xuXHRcdGlmICh0aGlzLm1hbmlmZXN0W2lkXSlcblx0XHR7XG5cblx0XHRcdGlmICgodGhpcy5tYW5pZmVzdFtpZF1bJ21lZGlhLXR5cGUnXSB8fCBcIlwiKS50b0xvd2VyQ2FzZSgpLnRyaW0oKS5zdWJzdHIoMCwgNikgIT0gXCJpbWFnZS9cIilcblx0XHRcdHtcblx0XHRcdFx0cmV0dXJuIGNhbGxiYWNrKG5ldyBFcnJvcihcIkludmFsaWQgbWltZSB0eXBlIGZvciBpbWFnZVwiKSk7XG5cdFx0XHR9XG5cblx0XHRcdHRoaXMuZ2V0RmlsZShpZCwgY2FsbGJhY2spO1xuXHRcdH1cblx0XHRlbHNlXG5cdFx0e1xuXHRcdFx0Y2FsbGJhY2sobmV3IEVycm9yKFwiRmlsZSBub3QgZm91bmRcIikpO1xuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiAgRVB1YiNnZXRGaWxlKGlkLCBjYWxsYmFjaykgLT4gdW5kZWZpbmVkXG5cdCAqICAtIGlkIChTdHJpbmcpOiBNYW5pZmVzdCBpZCB2YWx1ZSBmb3IgYSBmaWxlXG5cdCAqICAtIGNhbGxiYWNrIChGdW5jdGlvbik6IGNhbGxiYWNrIGZ1bmN0aW9uXG5cdCAqXG5cdCAqICBGaW5kcyBhIGZpbGUgZm9yIGFuIGlkLiBSZXR1cm5zIHRoZSBmaWxlIGFzIEJ1ZmZlci4gQ2FsbGJhY2sgZ2V0c1xuXHQgKiAgYW4gZXJyb3Igb2JqZWN0LCBmaWxlIGNvbnRlbnRzIGJ1ZmZlciBhbmQgZmlsZSBjb250ZW50LXR5cGUuXG5cdCAqKi9cblx0Z2V0RmlsZShpZDogc3RyaW5nLCBjYWxsYmFjazogKGVycm9yOiBFcnJvciwgZGF0YT86IEJ1ZmZlciwgbWltZVR5cGU/OiBzdHJpbmcpID0+IHZvaWQpXG5cdHtcblx0XHRpZiAodGhpcy5tYW5pZmVzdFtpZF0pXG5cdFx0e1xuXHRcdFx0bGV0IHNlbGYgPSB0aGlzO1xuXG5cdFx0XHR0aGlzLnppcC5yZWFkRmlsZSh0aGlzLm1hbmlmZXN0W2lkXS5ocmVmLCAoZXJyLCBkYXRhKSA9PlxuXHRcdFx0e1xuXHRcdFx0XHRpZiAoZXJyKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0Y2FsbGJhY2sobmV3IEVycm9yKGBSZWFkaW5nIGFyY2hpdmUgZmFpbGVkICR7c2VsZi5tYW5pZmVzdFtpZF0uaHJlZn1gKSk7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Y2FsbGJhY2sobnVsbCwgZGF0YSwgdGhpcy5tYW5pZmVzdFtpZF1bJ21lZGlhLXR5cGUnXSk7XG5cdFx0XHR9KTtcblx0XHR9XG5cdFx0ZWxzZVxuXHRcdHtcblx0XHRcdGNhbGxiYWNrKG5ldyBSYW5nZUVycm9yKGBGaWxlIG5vdCBmb3VuZCBcIiR7aWR9XCJgKSk7XG5cdFx0fVxuXHR9XG5cblx0cmVhZEZpbGUoZmlsZW5hbWUsIG9wdGlvbnMsIGNhbGxiYWNrXylcblx0e1xuXHRcdHZhciBjYWxsYmFjayA9IGFyZ3VtZW50c1thcmd1bWVudHMubGVuZ3RoIC0gMV07XG5cblx0XHRpZiAodXRpbC5pc0Z1bmN0aW9uKG9wdGlvbnMpIHx8ICFvcHRpb25zKVxuXHRcdHtcblx0XHRcdHRoaXMuemlwLnJlYWRGaWxlKGZpbGVuYW1lLCBjYWxsYmFjayk7XG5cdFx0fVxuXHRcdGVsc2UgaWYgKHV0aWwuaXNTdHJpbmcob3B0aW9ucykpXG5cdFx0e1xuXHRcdFx0Ly8gb3B0aW9ucyBpcyBhbiBlbmNvZGluZ1xuXHRcdFx0dGhpcy56aXAucmVhZEZpbGUoZmlsZW5hbWUsIGZ1bmN0aW9uIChlcnIsIGRhdGEpXG5cdFx0XHR7XG5cdFx0XHRcdGlmIChlcnIpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRjYWxsYmFjayhuZXcgRXJyb3IoYFJlYWRpbmcgYXJjaGl2ZSBmYWlsZWQgJHtmaWxlbmFtZX1gKSk7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGNhbGxiYWNrKG51bGwsIGRhdGEudG9TdHJpbmcob3B0aW9ucykpO1xuXHRcdFx0fSk7XG5cdFx0fVxuXHRcdGVsc2Vcblx0XHR7XG5cdFx0XHR0aHJvdyBuZXcgVHlwZUVycm9yKCdCYWQgYXJndW1lbnRzJyk7XG5cdFx0fVxuXHR9XG5cblx0c3RhdGljIFNZTUJPTF9SQVdfREFUQSA9IFNZTUJPTF9SQVdfREFUQTtcbn1cblxubW9kdWxlIEVQdWJcbntcblx0ZXhwb3J0IGNvbnN0IHhtbDJqc09wdGlvbnMgPSBPYmplY3QuYXNzaWduKHt9LCB4bWwyanMuZGVmYXVsdHNbJzAuMSddKSBhcyB4bWwyanMuT3B0aW9ucztcblxuXHRleHBvcnQgY29uc3QgSU1BR0VfUk9PVCA9ICcvaW1hZ2VzLyc7XG5cdGV4cG9ydCBjb25zdCBMSU5LX1JPT1QgPSAnL2xpbmtzLyc7XG5cblx0Ly9leHBvcnQgY29uc3QgU1lNQk9MX1JBV19EQVRBID0gU3ltYm9sLmZvcigncmF3RGF0YScpO1xuXG5cdGV4cG9ydCBjb25zdCBFTEVNX01FRElBX1RZUEUgPSAnbWVkaWEtdHlwZSc7XG5cdGV4cG9ydCBjb25zdCBFTEVNX01FRElBX1RZUEUyID0gJ21lZGlhVHlwZSc7XG5cblx0ZXhwb3J0IGludGVyZmFjZSBUb2NFbGVtZW50XG5cdHtcblx0XHRsZXZlbD86IG51bWJlcjtcblx0XHRvcmRlcj86IG51bWJlcjtcblx0XHR0aXRsZT86IHN0cmluZztcblx0XHRpZD86IHN0cmluZztcblx0XHRocmVmPzogc3RyaW5nO1xuXG5cdFx0J21lZGlhLXR5cGUnPzogc3RyaW5nLFxuXHRcdG1lZGlhVHlwZT86IHN0cmluZyxcblx0XHQnZXB1Yi10eXBlJz86IHN0cmluZyxcblx0XHRsYW5nPzogc3RyaW5nLFxuXG5cdFx0c2VyaWVzPzogc3RyaW5nLFxuXG5cdFx0Y29udHJpYnV0ZT86IHN0cmluZ1tdLFxuXHRcdGF1dGhvcl9saW5rX21hcD86IHtcblx0XHRcdFtrZXk6IHN0cmluZ106IHN0cmluZyxcblx0XHR9XG5cdH1cblxuXHRleHBvcnQgaW50ZXJmYWNlIElTcGluZVxuXHR7XG5cdFx0Y29udGVudHM6IElTcGluZUNvbnRlbnRzLFxuXHRcdHRvYz86IFRvY0VsZW1lbnQsXG5cblx0XHRpdGVtcmVmPzogT2JqZWN0W10sXG5cdH1cblxuXHRleHBvcnQgaW50ZXJmYWNlIElNZXRhZGF0YUxpc3Rcblx0e1xuXHRcdFtrZXk6IHN0cmluZ106IEVQdWIuVG9jRWxlbWVudCxcblx0fVxuXG5cdGV4cG9ydCBpbnRlcmZhY2UgSVNwaW5lQ29udGVudHMgZXh0ZW5kcyBBcnJheTxFUHViLlRvY0VsZW1lbnQ+XG5cdHtcblx0XHRbaW5kZXg6IG51bWJlcl06IEVQdWIuVG9jRWxlbWVudCxcblx0fVxuXG5cdGV4cG9ydCBpbnRlcmZhY2UgSU1ldGFkYXRhXG5cdHtcblx0XHRwdWJsaXNoZXI/OiBzdHJpbmcsXG5cdFx0bGFuZ3VhZ2U/OiBzdHJpbmcsXG5cdFx0dGl0bGU/OiBzdHJpbmcsXG5cdFx0c3ViamVjdD86IHN0cmluZ1tdLFxuXHRcdGRlc2NyaXB0aW9uPzogc3RyaW5nLFxuXG5cdFx0Y3JlYXRvcj86IHN0cmluZyxcblx0XHRjcmVhdG9yRmlsZUFzPzogc3RyaW5nLFxuXG5cdFx0ZGF0ZT86IHN0cmluZyxcblx0XHRJU0JOPzogc3RyaW5nLFxuXHRcdFVVSUQ/OiBzdHJpbmcsXG5cdFx0Y292ZXI/XG5cblx0XHQnZmlsZS1hcyc/OiBzdHJpbmcsXG5cblx0XHQnYmVsb25ncy10by1jb2xsZWN0aW9uJz86IHN0cmluZyxcblx0XHQnY2FsaWJyZTpzZXJpZXMnPzogc3RyaW5nLFxuXHRcdCdjb2xsZWN0aW9uLXR5cGUnPzogc3RyaW5nLFxuXG5cdFx0W2tleTogc3RyaW5nXTogYW55LFxuXG5cdFx0W1NZTUJPTF9SQVdfREFUQV0/OiBJTWV0YWRhdGEsXG5cdH1cblxuXHRleHBvcnQgaW50ZXJmYWNlIElOY3ggZXh0ZW5kcyBBcnJheTxJTmN4VHJlZT5cblx0e1xuXHRcdFtpbmRleDogbnVtYmVyXTogSU5jeFRyZWVcblx0fVxuXG5cdGV4cG9ydCBpbnRlcmZhY2UgSU5jeFRyZWVcblx0e1xuXHRcdGlkOiBzdHJpbmc7XG5cdFx0bmN4X2luZGV4OiBudW1iZXI7XG5cdFx0bmN4X2luZGV4Mj86IG51bWJlcjtcblx0XHRsZXZlbD86IG51bWJlcjtcblx0XHRzdWI6IElOY3hUcmVlW10sXG5cdH1cblxuXHRleHBvcnQgZnVuY3Rpb24gaXNFcHViKGRhdGE6IHN0cmluZywgYnVmPzogYm9vbGVhbik6IHN0cmluZ1xuXHRleHBvcnQgZnVuY3Rpb24gaXNFcHViKGRhdGE6IEJ1ZmZlciwgYnVmPzogYm9vbGVhbik6IEJ1ZmZlclxuXHRleHBvcnQgZnVuY3Rpb24gaXNFcHViKGRhdGEsIGJ1Zj86IGJvb2xlYW4pXG5cdGV4cG9ydCBmdW5jdGlvbiBpc0VwdWIoZGF0YSwgYnVmPzogYm9vbGVhbilcblx0e1xuXHRcdGxldCB0eHQgPSAodHlwZW9mIGRhdGEgPT0gJ3N0cmluZycgJiYgIWJ1ZikgPyBkYXRhIDogZGF0YS50b1N0cmluZyhcInV0Zi04XCIpLnRvTG93ZXJDYXNlKCkudHJpbSgpO1xuXG5cdFx0aWYgKHR4dCA9PT0gJ2FwcGxpY2F0aW9uL2VwdWIremlwJylcblx0XHR7XG5cdFx0XHRyZXR1cm4gZGF0YTtcblx0XHR9XG5cblx0XHRyZXR1cm4gbnVsbDtcblx0fVxuXG59XG5cbi8vIEV4cG9zZSB0byB0aGUgd29ybGRcbmV4cG9ydCA9IEVQdWI7XG5cbi8qXG4vLyBAdHMtaWdub3JlXG5kZWNsYXJlIG1vZHVsZSBcImVwdWJcIlxue1xuXG5cdGltcG9ydCB7IEV2ZW50RW1pdHRlciB9IGZyb20gXCJldmVudHNcIjtcblxuXHRpbnRlcmZhY2UgVG9jRWxlbWVudFxuXHR7XG5cdFx0bGV2ZWw6IG51bWJlcjtcblx0XHRvcmRlcjogbnVtYmVyO1xuXHRcdHRpdGxlOiBzdHJpbmc7XG5cdFx0aWQ6IHN0cmluZztcblx0XHRocmVmPzogc3RyaW5nO1xuXHR9XG5cblx0Y2xhc3MgRVB1YiBleHRlbmRzIEV2ZW50RW1pdHRlclxuXHR7XG5cdFx0Y29uc3RydWN0b3IoZXB1YmZpbGU6IHN0cmluZywgaW1hZ2V3ZWJyb290Pzogc3RyaW5nLCBjaGFwdGVyd2Vicm9vdD86IHN0cmluZyk7XG5cblx0XHRtZXRhZGF0YTogT2JqZWN0O1xuXHRcdG1hbmlmZXN0OiBPYmplY3Q7XG5cdFx0c3BpbmU6IE9iamVjdDtcblx0XHRmbG93OiBBcnJheTxPYmplY3Q+O1xuXHRcdHRvYzogQXJyYXk8VG9jRWxlbWVudD47XG5cblx0XHRwYXJzZSgpOiB2b2lkO1xuXG5cdFx0Z2V0Q2hhcHRlcihjaGFwdGVySWQ6IHN0cmluZywgY2FsbGJhY2s6IChlcnJvcjogRXJyb3IsIHRleHQ6IHN0cmluZykgPT4gdm9pZCk6IHZvaWQ7XG5cblx0XHRnZXRDaGFwdGVyUmF3KGNoYXB0ZXJJZDogc3RyaW5nLCBjYWxsYmFjazogKGVycm9yOiBFcnJvciwgdGV4dDogc3RyaW5nKSA9PiB2b2lkKTogdm9pZDtcblxuXHRcdGdldEltYWdlKGlkOiBzdHJpbmcsIGNhbGxiYWNrOiAoZXJyb3I6IEVycm9yLCBkYXRhOiBCdWZmZXIsIG1pbWVUeXBlOiBzdHJpbmcpID0+IHZvaWQpOiB2b2lkO1xuXG5cdFx0Z2V0RmlsZShpZDogc3RyaW5nLCBjYWxsYmFjazogKGVycm9yOiBFcnJvciwgZGF0YTogQnVmZmVyLCBtaW1lVHlwZTogc3RyaW5nKSA9PiB2b2lkKTogdm9pZDtcblx0fVxuXG5cdGV4cG9ydCA9IEVQdWI7XG59XG4qL1xuIl19