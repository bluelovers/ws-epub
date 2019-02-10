"use strict";
const xml2js = require("xml2js");
const util = require("util");
const NodePath = require("path");
const NodeUrl = require("url");
const events_1 = require("events");
const zipfile_1 = require("./zipfile");
const array_hyper_unique_1 = require("array-hyper-unique");
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
        this.zip.readFile(this.mimeFile, (function (err, data) {
            if (err) {
                this.emit("error", new Error("Reading archive failed"));
                return;
            }
            if (!EPub.isEpub(data, true)) {
                this.emit("error", new Error("Unsupported mime type"));
                return;
            }
            this.getRootFiles();
        }).bind(this));
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
        this.zip.readFile(this.containerFile, (function (err, data) {
            if (err) {
                this.emit("error", new Error("Reading archive failed"));
                return;
            }
            var xml = data.toString("utf-8").toLowerCase().trim(), xmlparser = new xml2js.Parser(xml2jsOptions);
            xmlparser.on("end", (function (result) {
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
            }).bind(this));
            xmlparser.on("error", (function (err) {
                this.emit("error", new Error("Parsing container XML failed"));
                return;
            }).bind(this));
            xmlparser.parseString(xml);
        }).bind(this));
    }
    /**
     *  EPub#handleRootFile() -> undefined
     *
     *  Parses the rootfile XML and calls rootfile parser
     **/
    handleRootFile() {
        const xml2jsOptions = this._getStatic().xml2jsOptions;
        this.zip.readFile(this.rootFile, (function (err, data) {
            if (err) {
                this.emit("error", new Error("Reading archive failed"));
                return;
            }
            var xml = data.toString("utf-8"), xmlparser = new xml2js.Parser(xml2jsOptions);
            xmlparser.on("end", this.parseRootFile.bind(this));
            xmlparser.on("error", (function (err) {
                this.emit("error", new Error("Parsing container XML failed"));
                return;
            }).bind(this));
            xmlparser.parseString(xml);
        }).bind(this));
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
        Object.keys(metas).forEach(function (key) {
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
        this.zip.readFile(this.spine.toc.href, (function (err, data) {
            if (err) {
                this.emit("error", new Error("Reading archive failed"));
                return;
            }
            var xml = data.toString("utf-8"), xmlparser = new xml2js.Parser(xml2jsOptions);
            xmlparser.on("end", (function (result) {
                if (result.navMap && result.navMap.navPoint) {
                    this.toc = this.walkNavMap(result.navMap.navPoint, path, id_list);
                }
                this.emit("end");
            }).bind(this));
            xmlparser.on("error", (function (err) {
                this.emit("error", new Error("Parsing container XML failed"));
                return;
            }).bind(this));
            xmlparser.parseString(xml);
        }).bind(this));
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
        this.getChapterRaw(chapterId, (function (err, str) {
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
            str = str.replace(/(\shref\s*=\s*["']?)([^"'\s>]*?)(["'\s>])/g, (function (o, a, b, c) {
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
            }).bind(this));
            // bring back linebreaks
            str = str.replace(/\u0000/g, "\n").trim();
            callback(null, str);
        }).bind(this));
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
                    callback(new Error(`Reading archive failed "${chapterId}"`));
                    return;
                }
                var str = data.toString("utf-8");
                callback(null, str);
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
            this.zip.readFile(this.manifest[id].href, (function (err, data) {
                if (err) {
                    callback(new Error(`Reading archive failed ${self.manifest[id].href}`));
                    return;
                }
                callback(null, data, this.manifest[id]['media-type']);
            }).bind(this));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXB1Yi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImVwdWIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLGlDQUFrQztBQUNsQyw2QkFBOEI7QUFDOUIsaUNBQWtDO0FBQ2xDLCtCQUFnQztBQUNoQyxtQ0FBc0M7QUFDdEMsdUNBQThDO0FBQzlDLDJEQUFrRDtBQUVsRCx5QkFBeUI7QUFFekIsTUFBTSxlQUFlLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBRTFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUF3Qkk7QUFDSixNQUFNLElBQUssU0FBUSxxQkFBWTtJQTZCOUIsWUFBWSxRQUFnQixFQUFFLFlBQXFCLEVBQUUsY0FBdUIsRUFBRSxHQUFHLElBQUk7UUFFcEYsS0FBSyxFQUFFLENBQUM7UUFFUixJQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQztRQUV6QixJQUFJLENBQUMsU0FBUyxHQUFHLENBQUMsWUFBWSxJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUN2RSxJQUFJLENBQUMsUUFBUSxHQUFHLENBQUMsY0FBYyxJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUV2RSxJQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksR0FBRyxFQUNwQztZQUNDLElBQUksQ0FBQyxTQUFTLElBQUksR0FBRyxDQUFDO1NBQ3RCO1FBQ0QsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEdBQUcsRUFDbkM7WUFDQyxJQUFJLENBQUMsUUFBUSxJQUFJLEdBQUcsQ0FBQztTQUNyQjtJQUNGLENBQUM7SUF2QlMsVUFBVTtRQUVuQixhQUFhO1FBQ2IsT0FBTyxJQUFJLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FB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QUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUVqRyxJQUFJLEdBQUcsS0FBSyxzQkFBc0IsRUFDbEM7WUFDQyxPQUFPLElBQUksQ0FBQztTQUNaO1FBRUQsT0FBTyxJQUFJLENBQUM7SUFDYixDQUFDO0lBVmUsV0FBTSxTQVVyQixDQUFBO0FBRUYsQ0FBQyxFQTNHTSxJQUFJLEtBQUosSUFBSSxRQTJHVjtBQUdELGlCQUFTLElBQUksQ0FBQztBQUVkOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7RUF1Q0UiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeG1sMmpzID0gcmVxdWlyZSgneG1sMmpzJyk7XG5pbXBvcnQgdXRpbCA9IHJlcXVpcmUoJ3V0aWwnKTtcbmltcG9ydCBOb2RlUGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcbmltcG9ydCBOb2RlVXJsID0gcmVxdWlyZSgndXJsJyk7XG5pbXBvcnQgeyBFdmVudEVtaXR0ZXIgfSBmcm9tICdldmVudHMnO1xuaW1wb3J0IHsgWmlwRmlsZSwgSVppcEZpbGUgfSBmcm9tICcuL3ppcGZpbGUnO1xuaW1wb3J0IHsgYXJyYXlfdW5pcXVlIH0gZnJvbSAnYXJyYXktaHlwZXItdW5pcXVlJztcblxuLy9UT0RPOiBDYWNoZSBwYXJzZWQgZGF0YVxuXG5jb25zdCBTWU1CT0xfUkFXX0RBVEEgPSBTeW1ib2woJ3Jhd0RhdGEnKTtcblxuLyoqXG4gKiAgbmV3IEVQdWIoZm5hbWVbLCBpbWFnZXJvb3RdWywgbGlua3Jvb3RdKVxuICogIC0gZm5hbWUgKFN0cmluZyk6IGZpbGVuYW1lIGZvciB0aGUgZWJvb2tcbiAqICAtIGltYWdlcm9vdCAoU3RyaW5nKTogVVJMIHByZWZpeCBmb3IgaW1hZ2VzXG4gKiAgLSBsaW5rcm9vdCAoU3RyaW5nKTogVVJMIHByZWZpeCBmb3IgbGlua3NcbiAqXG4gKiAgQ3JlYXRlcyBhbiBFdmVudCBFbWl0dGVyIHR5cGUgb2JqZWN0IGZvciBwYXJzaW5nIGVwdWIgZmlsZXNcbiAqXG4gKiAgICAgIHZhciBlcHViID0gbmV3IEVQdWIoXCJib29rLmVwdWJcIik7XG4gKiAgICAgIGVwdWIub24oXCJlbmRcIiwgZnVuY3Rpb24gKCkge1xuICogICAgICAgICAgIGNvbnNvbGUubG9nKGVwdWIuc3BpbmUpO1xuICogICAgICB9KTtcbiAqICAgICAgZXB1Yi5vbihcImVycm9yXCIsIGZ1bmN0aW9uIChlcnJvcikgeyAuLi4gfSk7XG4gKiAgICAgIGVwdWIucGFyc2UoKTtcbiAqXG4gKiAgSW1hZ2UgYW5kIGxpbmsgVVJMIGZvcm1hdCBpczpcbiAqXG4gKiAgICAgIGltYWdlcm9vdCArIGltZ19pZCArIGltZ196aXBfcGF0aFxuICpcbiAqICBTbyBhbiBpbWFnZSBcImxvZ28uanBnXCIgd2hpY2ggcmVzaWRlcyBpbiBcIk9QVC9cIiBpbiB0aGUgemlwIGFyY2hpdmVcbiAqICBhbmQgaXMgbGlzdGVkIGluIHRoZSBtYW5pZmVzdCB3aXRoIGlkIFwibG9nb19pbWdcIiB3aWxsIGhhdmUgdGhlXG4gKiAgZm9sbG93aW5nIHVybCAocHJvdmlkaW5nIHRoYXQgaW1hZ2Vyb290IGlzIFwiL2ltYWdlcy9cIik6XG4gKlxuICogICAgICAvaW1hZ2VzL2xvZ29faW1nL09QVC9sb2dvLmpwZ1xuICoqL1xuY2xhc3MgRVB1YiBleHRlbmRzIEV2ZW50RW1pdHRlclxue1xuXHRtZXRhZGF0YTogRVB1Yi5JTWV0YWRhdGE7XG5cdG1hbmlmZXN0OiBFUHViLklNZXRhZGF0YUxpc3Q7XG5cdHNwaW5lOiBFUHViLklTcGluZTtcblx0ZmxvdzogRVB1Yi5JU3BpbmVDb250ZW50cztcblx0dG9jOiBFUHViLklTcGluZUNvbnRlbnRzO1xuXG5cdG5jeDogRVB1Yi5JTmN4O1xuXHRuY3hfZGVwdGg6IG51bWJlcjtcblxuXHRmaWxlbmFtZTogc3RyaW5nO1xuXHRpbWFnZXJvb3Q6IHN0cmluZztcblx0bGlua3Jvb3Q6IHN0cmluZztcblxuXHRjb250YWluZXJGaWxlOiBzdHJpbmc7XG5cdG1pbWVGaWxlOiBzdHJpbmc7XG5cdHJvb3RGaWxlOiBzdHJpbmc7XG5cblx0emlwOiBJWmlwRmlsZTtcblxuXHR2ZXJzaW9uOiBzdHJpbmc7XG5cblx0cHJvdGVjdGVkIF9nZXRTdGF0aWMoKVxuXHR7XG5cdFx0Ly8gQHRzLWlnbm9yZVxuXHRcdHJldHVybiB0aGlzLl9fcHJvdG9fXy5jb25zdHJ1Y3Rvcjtcblx0fVxuXG5cdGNvbnN0cnVjdG9yKGVwdWJmaWxlOiBzdHJpbmcsIGltYWdld2Vicm9vdD86IHN0cmluZywgY2hhcHRlcndlYnJvb3Q/OiBzdHJpbmcsIC4uLmFyZ3YpXG5cdHtcblx0XHRzdXBlcigpO1xuXG5cdFx0dGhpcy5maWxlbmFtZSA9IGVwdWJmaWxlO1xuXG5cdFx0dGhpcy5pbWFnZXJvb3QgPSAoaW1hZ2V3ZWJyb290IHx8IHRoaXMuX2dldFN0YXRpYygpLklNQUdFX1JPT1QpLnRyaW0oKTtcblx0XHR0aGlzLmxpbmtyb290ID0gKGNoYXB0ZXJ3ZWJyb290IHx8IHRoaXMuX2dldFN0YXRpYygpLkxJTktfUk9PVCkudHJpbSgpO1xuXG5cdFx0aWYgKHRoaXMuaW1hZ2Vyb290LnN1YnN0cigtMSkgIT0gXCIvXCIpXG5cdFx0e1xuXHRcdFx0dGhpcy5pbWFnZXJvb3QgKz0gXCIvXCI7XG5cdFx0fVxuXHRcdGlmICh0aGlzLmxpbmtyb290LnN1YnN0cigtMSkgIT0gXCIvXCIpXG5cdFx0e1xuXHRcdFx0dGhpcy5saW5rcm9vdCArPSBcIi9cIjtcblx0XHR9XG5cdH1cblxuXHRzdGF0aWMgY3JlYXRlKGVwdWJmaWxlOiBzdHJpbmcsIGltYWdld2Vicm9vdD86IHN0cmluZywgY2hhcHRlcndlYnJvb3Q/OiBzdHJpbmcsIC4uLmFyZ3YpXG5cdHtcblx0XHRsZXQgZXB1YiA9IG5ldyB0aGlzKGVwdWJmaWxlLCBpbWFnZXdlYnJvb3QsIGNoYXB0ZXJ3ZWJyb290LCAuLi5hcmd2KTtcblxuXHRcdHJldHVybiBlcHViO1xuXHR9XG5cblx0LyoqXG5cdCAqICBFUHViI3BhcnNlKCkgLT4gdW5kZWZpbmVkXG5cdCAqXG5cdCAqICBTdGFydHMgdGhlIHBhcnNlciwgbmVlZHMgdG8gYmUgY2FsbGVkIGJ5IHRoZSBzY3JpcHRcblx0ICoqL1xuXHRwdWJsaWMgcGFyc2UoKVxuXHR7XG5cdFx0dGhpcy5jb250YWluZXJGaWxlID0gbnVsbDtcblx0XHR0aGlzLm1pbWVGaWxlID0gbnVsbDtcblx0XHR0aGlzLnJvb3RGaWxlID0gbnVsbDtcblxuXHRcdHRoaXMubWV0YWRhdGEgPSB7fTtcblx0XHR0aGlzLm1hbmlmZXN0ID0ge307XG5cdFx0dGhpcy5zcGluZSA9IHsgdG9jOiBudWxsLCBjb250ZW50czogW10gfTtcblx0XHR0aGlzLmZsb3cgPSBbXTtcblx0XHR0aGlzLnRvYyA9IFtdO1xuXG5cdFx0dGhpcy5vcGVuKCk7XG5cblx0XHRyZXR1cm4gdGhpcztcblx0fVxuXG5cdC8qKlxuXHQgKiAgRVB1YiNvcGVuKCkgLT4gdW5kZWZpbmVkXG5cdCAqXG5cdCAqICBPcGVucyB0aGUgZXB1YiBmaWxlIHdpdGggWmlwIHVucGFja2VyLCByZXRyaWV2ZXMgZmlsZSBsaXN0aW5nXG5cdCAqICBhbmQgcnVucyBtaW1lIHR5cGUgY2hlY2tcblx0ICoqL1xuXHRvcGVuKClcblx0e1xuXHRcdHRyeVxuXHRcdHtcblx0XHRcdC8vIEB0cy1pZ25vcmVcblx0XHRcdHRoaXMuemlwID0gbmV3IFppcEZpbGUodGhpcy5maWxlbmFtZSk7XG5cdFx0fVxuXHRcdGNhdGNoIChFKVxuXHRcdHtcblx0XHRcdHRoaXMuZW1pdChcImVycm9yXCIsIG5ldyBFcnJvcihgSW52YWxpZC9taXNzaW5nIGZpbGUgJHt0aGlzLmZpbGVuYW1lfWApKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRpZiAoIXRoaXMuemlwLm5hbWVzIHx8ICF0aGlzLnppcC5uYW1lcy5sZW5ndGgpXG5cdFx0e1xuXHRcdFx0dGhpcy5lbWl0KFwiZXJyb3JcIiwgbmV3IEVycm9yKGBObyBmaWxlcyBpbiBhcmNoaXZlICR7dGhpcy5maWxlbmFtZX1gKSk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdHRoaXMuY2hlY2tNaW1lVHlwZSgpO1xuXHR9XG5cblx0LyoqXG5cdCAqICBFUHViI2NoZWNrTWltZVR5cGUoKSAtPiB1bmRlZmluZWRcblx0ICpcblx0ICogIENoZWNrcyBpZiB0aGVyZSdzIGEgZmlsZSBjYWxsZWQgXCJtaW1ldHlwZVwiIGFuZCB0aGF0IGl0J3MgY29udGVudHNcblx0ICogIGFyZSBcImFwcGxpY2F0aW9uL2VwdWIremlwXCIuIE9uIHN1Y2Nlc3MgcnVucyByb290IGZpbGUgY2hlY2suXG5cdCAqKi9cblx0Y2hlY2tNaW1lVHlwZSgpXG5cdHtcblx0XHR2YXIgaSwgbGVuO1xuXG5cdFx0Zm9yIChpID0gMCwgbGVuID0gdGhpcy56aXAubmFtZXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspXG5cdFx0e1xuXHRcdFx0aWYgKHRoaXMuemlwLm5hbWVzW2ldLnRvTG93ZXJDYXNlKCkgPT0gXCJtaW1ldHlwZVwiKVxuXHRcdFx0e1xuXHRcdFx0XHR0aGlzLm1pbWVGaWxlID0gdGhpcy56aXAubmFtZXNbaV07XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRpZiAoIXRoaXMubWltZUZpbGUpXG5cdFx0e1xuXHRcdFx0dGhpcy5lbWl0KFwiZXJyb3JcIiwgbmV3IEVycm9yKFwiTm8gbWltZXR5cGUgZmlsZSBpbiBhcmNoaXZlXCIpKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0dGhpcy56aXAucmVhZEZpbGUodGhpcy5taW1lRmlsZSwgKGZ1bmN0aW9uIChlcnIsIGRhdGEpXG5cdFx0e1xuXHRcdFx0aWYgKGVycilcblx0XHRcdHtcblx0XHRcdFx0dGhpcy5lbWl0KFwiZXJyb3JcIiwgbmV3IEVycm9yKFwiUmVhZGluZyBhcmNoaXZlIGZhaWxlZFwiKSk7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblxuXHRcdFx0aWYgKCFFUHViLmlzRXB1YihkYXRhLCB0cnVlKSlcblx0XHRcdHtcblx0XHRcdFx0dGhpcy5lbWl0KFwiZXJyb3JcIiwgbmV3IEVycm9yKFwiVW5zdXBwb3J0ZWQgbWltZSB0eXBlXCIpKTtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLmdldFJvb3RGaWxlcygpO1xuXHRcdH0pLmJpbmQodGhpcykpO1xuXHR9XG5cblx0cHJvdGVjdGVkIF9FbGVtKGVsZW1lbnQ6IEVQdWIuVG9jRWxlbWVudClcblx0e1xuXHRcdGNvbnN0IFNZTUJPTF9SQVdfREFUQSA9IHRoaXMuX2dldFN0YXRpYygpLlNZTUJPTF9SQVdfREFUQTtcblxuXHRcdGlmICghZWxlbWVudFtTWU1CT0xfUkFXX0RBVEFdKVxuXHRcdHtcblx0XHRcdGVsZW1lbnRbU1lNQk9MX1JBV19EQVRBXSA9IE9iamVjdC5hc3NpZ24oe30sIGVsZW1lbnQpO1xuXHRcdH1cblxuXHRcdGlmIChlbGVtZW50WydtZWRpYS10eXBlJ10pXG5cdFx0e1xuXHRcdFx0ZWxlbWVudFsnbWVkaWFUeXBlJ10gPSBlbGVtZW50WydtZWRpYS10eXBlJ107XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGVsZW1lbnQ7XG5cdH1cblxuXHQvKipcblx0ICogIEVQdWIjZ2V0Um9vdEZpbGVzKCkgLT4gdW5kZWZpbmVkXG5cdCAqXG5cdCAqICBMb29rcyBmb3IgYSBcIm1ldGEtaW5mL2NvbnRhaW5lci54bWxcIiBmaWxlIGFuZCBzZWFyY2hlcyBmb3IgYVxuXHQgKiAgcm9vdGZpbGUgZWxlbWVudCB3aXRoIG1pbWUgdHlwZSBcImFwcGxpY2F0aW9uL29lYnBzLXBhY2thZ2UreG1sXCIuXG5cdCAqICBPbiBzdWNjZXNzIGNhbGxzIHRoZSByb290ZmlsZSBwYXJzZXJcblx0ICoqL1xuXHRnZXRSb290RmlsZXMoKVxuXHR7XG5cdFx0dmFyIGksIGxlbjtcblx0XHRmb3IgKGkgPSAwLCBsZW4gPSB0aGlzLnppcC5uYW1lcy5sZW5ndGg7IGkgPCBsZW47IGkrKylcblx0XHR7XG5cdFx0XHRpZiAodGhpcy56aXAubmFtZXNbaV0udG9Mb3dlckNhc2UoKSA9PSBcIm1ldGEtaW5mL2NvbnRhaW5lci54bWxcIilcblx0XHRcdHtcblx0XHRcdFx0dGhpcy5jb250YWluZXJGaWxlID0gdGhpcy56aXAubmFtZXNbaV07XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRpZiAoIXRoaXMuY29udGFpbmVyRmlsZSlcblx0XHR7XG5cdFx0XHR0aGlzLmVtaXQoXCJlcnJvclwiLCBuZXcgRXJyb3IoXCJObyBjb250YWluZXIgZmlsZSBpbiBhcmNoaXZlXCIpKTtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHRjb25zdCB4bWwyanNPcHRpb25zID0gdGhpcy5fZ2V0U3RhdGljKCkueG1sMmpzT3B0aW9ucztcblxuXHRcdHRoaXMuemlwLnJlYWRGaWxlKHRoaXMuY29udGFpbmVyRmlsZSwgKGZ1bmN0aW9uIChlcnIsIGRhdGEpXG5cdFx0e1xuXHRcdFx0aWYgKGVycilcblx0XHRcdHtcblx0XHRcdFx0dGhpcy5lbWl0KFwiZXJyb3JcIiwgbmV3IEVycm9yKFwiUmVhZGluZyBhcmNoaXZlIGZhaWxlZFwiKSk7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblx0XHRcdHZhciB4bWwgPSBkYXRhLnRvU3RyaW5nKFwidXRmLThcIikudG9Mb3dlckNhc2UoKS50cmltKCksXG5cdFx0XHRcdHhtbHBhcnNlciA9IG5ldyB4bWwyanMuUGFyc2VyKHhtbDJqc09wdGlvbnMpO1xuXG5cdFx0XHR4bWxwYXJzZXIub24oXCJlbmRcIiwgKGZ1bmN0aW9uIChyZXN1bHQpXG5cdFx0XHR7XG5cblx0XHRcdFx0aWYgKCFyZXN1bHQucm9vdGZpbGVzIHx8ICFyZXN1bHQucm9vdGZpbGVzLnJvb3RmaWxlKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0dGhpcy5lbWl0KFwiZXJyb3JcIiwgbmV3IEVycm9yKFwiTm8gcm9vdGZpbGVzIGZvdW5kXCIpKTtcblx0XHRcdFx0XHRjb25zb2xlLmRpcihyZXN1bHQpO1xuXHRcdFx0XHRcdHJldHVybjtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHZhciByb290ZmlsZSA9IHJlc3VsdC5yb290ZmlsZXMucm9vdGZpbGUsXG5cdFx0XHRcdFx0ZmlsZW5hbWUgPSBmYWxzZSwgaSwgbGVuO1xuXG5cdFx0XHRcdGlmIChBcnJheS5pc0FycmF5KHJvb3RmaWxlKSlcblx0XHRcdFx0e1xuXG5cdFx0XHRcdFx0Zm9yIChpID0gMCwgbGVuID0gcm9vdGZpbGUubGVuZ3RoOyBpIDwgbGVuOyBpKyspXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0aWYgKHJvb3RmaWxlW2ldW1wiQFwiXVtcIm1lZGlhLXR5cGVcIl0gJiZcblx0XHRcdFx0XHRcdFx0cm9vdGZpbGVbaV1bXCJAXCJdW1wibWVkaWEtdHlwZVwiXSA9PSBcImFwcGxpY2F0aW9uL29lYnBzLXBhY2thZ2UreG1sXCIgJiZcblx0XHRcdFx0XHRcdFx0cm9vdGZpbGVbaV1bXCJAXCJdW1wiZnVsbC1wYXRoXCJdKVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRmaWxlbmFtZSA9IHJvb3RmaWxlW2ldW1wiQFwiXVtcImZ1bGwtcGF0aFwiXS50b0xvd2VyQ2FzZSgpLnRyaW0oKTtcblx0XHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZSBpZiAocm9vdGZpbGVbXCJAXCJdKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0aWYgKHJvb3RmaWxlW1wiQFwiXVtcIm1lZGlhLXR5cGVcIl0gIT0gXCJhcHBsaWNhdGlvbi9vZWJwcy1wYWNrYWdlK3htbFwiIHx8ICFyb290ZmlsZVtcIkBcIl1bXCJmdWxsLXBhdGhcIl0pXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0dGhpcy5lbWl0KFwiZXJyb3JcIiwgbmV3IEVycm9yKFwiUm9vdGZpbGUgaW4gdW5rbm93biBmb3JtYXRcIikpO1xuXHRcdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRmaWxlbmFtZSA9IHJvb3RmaWxlW1wiQFwiXVtcImZ1bGwtcGF0aFwiXS50b0xvd2VyQ2FzZSgpLnRyaW0oKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmICghZmlsZW5hbWUpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHR0aGlzLmVtaXQoXCJlcnJvclwiLCBuZXcgRXJyb3IoXCJFbXB0eSByb290ZmlsZVwiKSk7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Zm9yIChpID0gMCwgbGVuID0gdGhpcy56aXAubmFtZXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRpZiAodGhpcy56aXAubmFtZXNbaV0udG9Mb3dlckNhc2UoKSA9PSBmaWxlbmFtZSlcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHR0aGlzLnJvb3RGaWxlID0gdGhpcy56aXAubmFtZXNbaV07XG5cdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAoIXRoaXMucm9vdEZpbGUpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHR0aGlzLmVtaXQoXCJlcnJvclwiLCBuZXcgRXJyb3IoXCJSb290ZmlsZSBub3QgZm91bmQgZnJvbSBhcmNoaXZlXCIpKTtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR0aGlzLmhhbmRsZVJvb3RGaWxlKCk7XG5cblx0XHRcdH0pLmJpbmQodGhpcykpO1xuXG5cdFx0XHR4bWxwYXJzZXIub24oXCJlcnJvclwiLCAoZnVuY3Rpb24gKGVycilcblx0XHRcdHtcblx0XHRcdFx0dGhpcy5lbWl0KFwiZXJyb3JcIiwgbmV3IEVycm9yKFwiUGFyc2luZyBjb250YWluZXIgWE1MIGZhaWxlZFwiKSk7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH0pLmJpbmQodGhpcykpO1xuXG5cdFx0XHR4bWxwYXJzZXIucGFyc2VTdHJpbmcoeG1sKTtcblxuXHRcdH0pLmJpbmQodGhpcykpO1xuXHR9XG5cblx0LyoqXG5cdCAqICBFUHViI2hhbmRsZVJvb3RGaWxlKCkgLT4gdW5kZWZpbmVkXG5cdCAqXG5cdCAqICBQYXJzZXMgdGhlIHJvb3RmaWxlIFhNTCBhbmQgY2FsbHMgcm9vdGZpbGUgcGFyc2VyXG5cdCAqKi9cblx0aGFuZGxlUm9vdEZpbGUoKVxuXHR7XG5cdFx0Y29uc3QgeG1sMmpzT3B0aW9ucyA9IHRoaXMuX2dldFN0YXRpYygpLnhtbDJqc09wdGlvbnM7XG5cblx0XHR0aGlzLnppcC5yZWFkRmlsZSh0aGlzLnJvb3RGaWxlLCAoZnVuY3Rpb24gKGVyciwgZGF0YSlcblx0XHR7XG5cdFx0XHRpZiAoZXJyKVxuXHRcdFx0e1xuXHRcdFx0XHR0aGlzLmVtaXQoXCJlcnJvclwiLCBuZXcgRXJyb3IoXCJSZWFkaW5nIGFyY2hpdmUgZmFpbGVkXCIpKTtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fVxuXHRcdFx0dmFyIHhtbCA9IGRhdGEudG9TdHJpbmcoXCJ1dGYtOFwiKSxcblx0XHRcdFx0eG1scGFyc2VyID0gbmV3IHhtbDJqcy5QYXJzZXIoeG1sMmpzT3B0aW9ucyk7XG5cblx0XHRcdHhtbHBhcnNlci5vbihcImVuZFwiLCB0aGlzLnBhcnNlUm9vdEZpbGUuYmluZCh0aGlzKSk7XG5cblx0XHRcdHhtbHBhcnNlci5vbihcImVycm9yXCIsIChmdW5jdGlvbiAoZXJyKVxuXHRcdFx0e1xuXHRcdFx0XHR0aGlzLmVtaXQoXCJlcnJvclwiLCBuZXcgRXJyb3IoXCJQYXJzaW5nIGNvbnRhaW5lciBYTUwgZmFpbGVkXCIpKTtcblx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0fSkuYmluZCh0aGlzKSk7XG5cblx0XHRcdHhtbHBhcnNlci5wYXJzZVN0cmluZyh4bWwpO1xuXG5cdFx0fSkuYmluZCh0aGlzKSk7XG5cdH1cblxuXHQvKipcblx0ICogIEVQdWIjcGFyc2VSb290RmlsZSgpIC0+IHVuZGVmaW5lZFxuXHQgKlxuXHQgKiAgUGFyc2VzIGVsZW1lbnRzIFwibWV0YWRhdGEsXCIgXCJtYW5pZmVzdCxcIiBcInNwaW5lXCIgYW5kIFRPQy5cblx0ICogIEVtaXRzIFwiZW5kXCIgaWYgbm8gVE9DXG5cdCAqKi9cblx0cGFyc2VSb290RmlsZShyb290ZmlsZSlcblx0e1xuXG5cdFx0dGhpcy52ZXJzaW9uID0gcm9vdGZpbGVbJ0AnXS52ZXJzaW9uIHx8ICcyLjAnO1xuXG5cdFx0dmFyIGksIGxlbiwga2V5cywga2V5cGFydHMsIGtleTtcblx0XHRrZXlzID0gT2JqZWN0LmtleXMocm9vdGZpbGUpO1xuXHRcdGZvciAoaSA9IDAsIGxlbiA9IGtleXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspXG5cdFx0e1xuXHRcdFx0a2V5cGFydHMgPSBrZXlzW2ldLnNwbGl0KFwiOlwiKTtcblx0XHRcdGtleSA9IChrZXlwYXJ0cy5wb3AoKSB8fCBcIlwiKS50b0xvd2VyQ2FzZSgpLnRyaW0oKTtcblx0XHRcdHN3aXRjaCAoa2V5KVxuXHRcdFx0e1xuXHRcdFx0XHRjYXNlIFwibWV0YWRhdGFcIjpcblx0XHRcdFx0XHR0aGlzLnBhcnNlTWV0YWRhdGEocm9vdGZpbGVba2V5c1tpXV0pO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlIFwibWFuaWZlc3RcIjpcblx0XHRcdFx0XHR0aGlzLnBhcnNlTWFuaWZlc3Qocm9vdGZpbGVba2V5c1tpXV0pO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlIFwic3BpbmVcIjpcblx0XHRcdFx0XHR0aGlzLnBhcnNlU3BpbmUocm9vdGZpbGVba2V5c1tpXV0pO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlIFwiZ3VpZGVcIjpcblx0XHRcdFx0XHQvL3RoaXMucGFyc2VHdWlkZShyb290ZmlsZVtrZXlzW2ldXSk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWYgKHRoaXMuc3BpbmUudG9jKVxuXHRcdHtcblx0XHRcdHRoaXMucGFyc2VUT0MoKTtcblx0XHR9XG5cdFx0ZWxzZVxuXHRcdHtcblx0XHRcdHRoaXMuZW1pdChcImVuZFwiKTtcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogIEVQdWIjcGFyc2VNZXRhZGF0YSgpIC0+IHVuZGVmaW5lZFxuXHQgKlxuXHQgKiAgUGFyc2VzIFwibWV0YWRhdGFcIiBibG9jayAoYm9vayBtZXRhZGF0YSwgdGl0bGUsIGF1dGhvciBldGMuKVxuXHQgKiovXG5cdHBhcnNlTWV0YWRhdGEobWV0YWRhdGE6IEVQdWIuSU1ldGFkYXRhKVxuXHR7XG5cdFx0bGV0IGksIGosIGxlbiwga2V5cywga2V5cGFydHMsIGtleTtcblx0XHRjb25zdCBfc2VsZiA9IHRoaXM7XG5cblx0XHR0aGlzLm1ldGFkYXRhW1NZTUJPTF9SQVdfREFUQV0gPSBtZXRhZGF0YTtcblxuXHRcdGtleXMgPSBPYmplY3Qua2V5cyhtZXRhZGF0YSk7XG5cdFx0Zm9yIChpID0gMCwgbGVuID0ga2V5cy5sZW5ndGg7IGkgPCBsZW47IGkrKylcblx0XHR7XG5cdFx0XHRrZXlwYXJ0cyA9IGtleXNbaV0uc3BsaXQoXCI6XCIpO1xuXHRcdFx0a2V5ID0gKGtleXBhcnRzLnBvcCgpIHx8IFwiXCIpLnRvTG93ZXJDYXNlKCkudHJpbSgpO1xuXG5cdFx0XHRjb25zdCBjdXJyZW50RGF0YSA9IG1ldGFkYXRhW2tleXNbaV1dO1xuXG5cdFx0XHRzd2l0Y2ggKGtleSlcblx0XHRcdHtcblx0XHRcdFx0Y2FzZSBcInB1Ymxpc2hlclwiOlxuXHRcdFx0XHRcdGlmIChBcnJheS5pc0FycmF5KGN1cnJlbnREYXRhKSlcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHR0aGlzLm1ldGFkYXRhLnB1Ymxpc2hlciA9IFN0cmluZyhjdXJyZW50RGF0YVswXSAmJiBjdXJyZW50RGF0YVswXVtcIiNcIl0gfHwgY3VycmVudERhdGFbMF0gfHwgXCJcIilcblx0XHRcdFx0XHRcdFx0LnRyaW0oKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdHRoaXMubWV0YWRhdGEucHVibGlzaGVyID0gU3RyaW5nKGN1cnJlbnREYXRhW1wiI1wiXSB8fCBjdXJyZW50RGF0YSB8fCBcIlwiKS50cmltKCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlIFwibGFuZ3VhZ2VcIjpcblx0XHRcdFx0XHRpZiAoQXJyYXkuaXNBcnJheShjdXJyZW50RGF0YSkpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0dGhpcy5tZXRhZGF0YS5sYW5ndWFnZSA9IFN0cmluZyhjdXJyZW50RGF0YVswXSAmJiBjdXJyZW50RGF0YVswXVtcIiNcIl0gfHwgY3VycmVudERhdGFbMF0gfHwgXCJcIilcblx0XHRcdFx0XHRcdFx0LnRvTG93ZXJDYXNlKClcblx0XHRcdFx0XHRcdFx0LnRyaW0oKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdHtcblxuXHRcdFx0XHRcdFx0dGhpcy5tZXRhZGF0YS5sYW5ndWFnZSA9IFN0cmluZyhjdXJyZW50RGF0YVtcIiNcIl0gfHwgY3VycmVudERhdGEgfHwgXCJcIilcblx0XHRcdFx0XHRcdFx0LnRvTG93ZXJDYXNlKClcblx0XHRcdFx0XHRcdFx0LnRyaW0oKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgXCJ0aXRsZVwiOlxuXHRcdFx0XHRcdGlmIChBcnJheS5pc0FycmF5KGN1cnJlbnREYXRhKSlcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHR0aGlzLm1ldGFkYXRhLnRpdGxlID0gU3RyaW5nKGN1cnJlbnREYXRhWzBdICYmIGN1cnJlbnREYXRhWzBdW1wiI1wiXSB8fCBjdXJyZW50RGF0YVswXSB8fCBcIlwiKVxuXHRcdFx0XHRcdFx0XHQudHJpbSgpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0dGhpcy5tZXRhZGF0YS50aXRsZSA9IFN0cmluZyhjdXJyZW50RGF0YVtcIiNcIl0gfHwgY3VycmVudERhdGEgfHwgXCJcIikudHJpbSgpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSBcInN1YmplY3RcIjpcblxuXHRcdFx0XHRcdHRoaXMubWV0YWRhdGEuc3ViamVjdCA9IHRoaXMubWV0YWRhdGEuc3ViamVjdCB8fCBbXTtcblxuXHRcdFx0XHRcdChBcnJheS5pc0FycmF5KGN1cnJlbnREYXRhKSA/IGN1cnJlbnREYXRhIDogW2N1cnJlbnREYXRhXSlcblx0XHRcdFx0XHRcdC5mb3JFYWNoKGZ1bmN0aW9uICh2YWx1ZSlcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0bGV0IHRhZyA9IChfbWV0YV92YWwodmFsdWUsICcjJykgfHwgJycpLnRyaW0oKTtcblx0XHRcdFx0XHRcdFx0aWYgKHRhZyAhPT0gJycpXG5cdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRfc2VsZi5tZXRhZGF0YS5zdWJqZWN0LnB1c2godGFnKTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fSlcblx0XHRcdFx0XHQ7XG5cblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSBcImRlc2NyaXB0aW9uXCI6XG5cdFx0XHRcdFx0aWYgKEFycmF5LmlzQXJyYXkoY3VycmVudERhdGEpKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdHRoaXMubWV0YWRhdGEuZGVzY3JpcHRpb24gPSBTdHJpbmcoY3VycmVudERhdGFbMF0gJiYgY3VycmVudERhdGFbMF1bXCIjXCJdIHx8IGN1cnJlbnREYXRhWzBdIHx8IFwiXCIpXG5cdFx0XHRcdFx0XHRcdC50cmltKCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHR0aGlzLm1ldGFkYXRhLmRlc2NyaXB0aW9uID0gU3RyaW5nKGN1cnJlbnREYXRhW1wiI1wiXSB8fCBjdXJyZW50RGF0YSB8fCBcIlwiKS50cmltKCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlIFwiY3JlYXRvclwiOlxuXHRcdFx0XHRcdGlmIChBcnJheS5pc0FycmF5KGN1cnJlbnREYXRhKSlcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHR0aGlzLm1ldGFkYXRhLmNyZWF0b3IgPSBTdHJpbmcoY3VycmVudERhdGFbMF0gJiYgY3VycmVudERhdGFbMF1bXCIjXCJdIHx8IGN1cnJlbnREYXRhWzBdIHx8IFwiXCIpXG5cdFx0XHRcdFx0XHRcdC50cmltKCk7XG5cdFx0XHRcdFx0XHR0aGlzLm1ldGFkYXRhLmNyZWF0b3JGaWxlQXMgPSBTdHJpbmcoY3VycmVudERhdGFbMF0gJiYgY3VycmVudERhdGFbMF1bJ0AnXSAmJiBjdXJyZW50RGF0YVswXVsnQCddW1wib3BmOmZpbGUtYXNcIl0gfHwgdGhpcy5tZXRhZGF0YS5jcmVhdG9yKVxuXHRcdFx0XHRcdFx0XHQudHJpbSgpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0dGhpcy5tZXRhZGF0YS5jcmVhdG9yID0gU3RyaW5nKGN1cnJlbnREYXRhW1wiI1wiXSB8fCBjdXJyZW50RGF0YSB8fCBcIlwiKS50cmltKCk7XG5cdFx0XHRcdFx0XHR0aGlzLm1ldGFkYXRhLmNyZWF0b3JGaWxlQXMgPSBTdHJpbmcoY3VycmVudERhdGFbJ0AnXSAmJiBjdXJyZW50RGF0YVsnQCddW1wib3BmOmZpbGUtYXNcIl0gfHwgdGhpcy5tZXRhZGF0YS5jcmVhdG9yKVxuXHRcdFx0XHRcdFx0XHQudHJpbSgpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSBcImRhdGVcIjpcblx0XHRcdFx0XHRpZiAoQXJyYXkuaXNBcnJheShjdXJyZW50RGF0YSkpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0dGhpcy5tZXRhZGF0YS5kYXRlID0gU3RyaW5nKGN1cnJlbnREYXRhWzBdICYmIGN1cnJlbnREYXRhWzBdW1wiI1wiXSB8fCBjdXJyZW50RGF0YVswXSB8fCBcIlwiKVxuXHRcdFx0XHRcdFx0XHQudHJpbSgpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0dGhpcy5tZXRhZGF0YS5kYXRlID0gU3RyaW5nKGN1cnJlbnREYXRhW1wiI1wiXSB8fCBjdXJyZW50RGF0YSB8fCBcIlwiKS50cmltKCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlIFwiaWRlbnRpZmllclwiOlxuXHRcdFx0XHRcdGlmIChjdXJyZW50RGF0YVtcIkBcIl0gJiYgY3VycmVudERhdGFbXCJAXCJdW1wib3BmOnNjaGVtZVwiXSA9PSBcIklTQk5cIilcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHR0aGlzLm1ldGFkYXRhLklTQk4gPSBTdHJpbmcoY3VycmVudERhdGFbXCIjXCJdIHx8IFwiXCIpLnRyaW0oKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZSBpZiAoY3VycmVudERhdGFbXCJAXCJdICYmIGN1cnJlbnREYXRhW1wiQFwiXS5pZCAmJiBjdXJyZW50RGF0YVtcIkBcIl0uaWQubWF0Y2goL3V1aWQvaSkpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0dGhpcy5tZXRhZGF0YS5VVUlEID0gU3RyaW5nKGN1cnJlbnREYXRhW1wiI1wiXSB8fCBcIlwiKVxuXHRcdFx0XHRcdFx0XHQucmVwbGFjZSgndXJuOnV1aWQ6JywgJycpXG5cdFx0XHRcdFx0XHRcdC50b1VwcGVyQ2FzZSgpXG5cdFx0XHRcdFx0XHRcdC50cmltKCk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoY3VycmVudERhdGEpKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGZvciAoaiA9IDA7IGogPCBjdXJyZW50RGF0YS5sZW5ndGg7IGorKylcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0aWYgKGN1cnJlbnREYXRhW2pdW1wiQFwiXSlcblx0XHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRcdGlmIChjdXJyZW50RGF0YVtqXVtcIkBcIl1bXCJvcGY6c2NoZW1lXCJdID09IFwiSVNCTlwiKVxuXHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdHRoaXMubWV0YWRhdGEuSVNCTiA9IFN0cmluZyhjdXJyZW50RGF0YVtqXVtcIiNcIl0gfHwgXCJcIikudHJpbSgpO1xuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0XHRlbHNlIGlmIChjdXJyZW50RGF0YVtqXVtcIkBcIl0uaWQgJiYgY3VycmVudERhdGFbal1bXCJAXCJdLmlkLm1hdGNoKC91dWlkL2kpKVxuXHRcdFx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0XHRcdHRoaXMubWV0YWRhdGEuVVVJRCA9IFN0cmluZyhjdXJyZW50RGF0YVtqXVtcIiNcIl0gfHwgXCJcIilcblx0XHRcdFx0XHRcdFx0XHRcdFx0LnJlcGxhY2UoJ3Vybjp1dWlkOicsICcnKVxuXHRcdFx0XHRcdFx0XHRcdFx0XHQudG9VcHBlckNhc2UoKVxuXHRcdFx0XHRcdFx0XHRcdFx0XHQudHJpbSgpO1xuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSAnbWV0YSc6XG5cdFx0XHRcdFx0aWYgKGN1cnJlbnREYXRhWycjJ10gJiYgY3VycmVudERhdGFbJ0AnXS5wcm9wZXJ0eSA9PSAnY2FsaWJyZTphdXRob3JfbGlua19tYXAnKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdHRoaXMubWV0YWRhdGFbJ2NvbnRyaWJ1dGUnXSA9IHRoaXMubWV0YWRhdGFbJ2NvbnRyaWJ1dGUnXSB8fCBbXTtcblx0XHRcdFx0XHRcdHRoaXMubWV0YWRhdGFbJ2F1dGhvcl9saW5rX21hcCddID0gdGhpcy5tZXRhZGF0YVsnYXV0aG9yX2xpbmtfbWFwJ10gfHwge307XG5cblx0XHRcdFx0XHRcdGxldCB0ID0gSlNPTi5wYXJzZShjdXJyZW50RGF0YVsnIyddKTtcblxuXHRcdFx0XHRcdFx0Zm9yIChsZXQgbiBpbiB0KVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHRuID0gbi50b1N0cmluZygpLnRyaW0oKTtcblxuXHRcdFx0XHRcdFx0XHR0aGlzLm1ldGFkYXRhWydjb250cmlidXRlJ10ucHVzaChuKTtcblx0XHRcdFx0XHRcdFx0dGhpcy5tZXRhZGF0YVsnYXV0aG9yX2xpbmtfbWFwJ11bbl0gPSAodFtuXSB8fCAnJykudG9TdHJpbmcoKS50cmltKCk7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdHRoaXMubWV0YWRhdGFbJ2NvbnRyaWJ1dGUnXSA9IGFycmF5X3VuaXF1ZSh0aGlzLm1ldGFkYXRhWydjb250cmlidXRlJ10pO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHRcdC8vY29uc29sZS5sb2coa2V5LCBjdXJyZW50RGF0YSk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0bGV0IG1ldGFzID0gbWV0YWRhdGFbJ21ldGEnXSB8fCB7fTtcblx0XHRPYmplY3Qua2V5cyhtZXRhcykuZm9yRWFjaChmdW5jdGlvbiAoa2V5KVxuXHRcdHtcblx0XHRcdHZhciBtZXRhID0gbWV0YXNba2V5XTtcblx0XHRcdGlmIChtZXRhWydAJ10gJiYgbWV0YVsnQCddLm5hbWUpXG5cdFx0XHR7XG5cdFx0XHRcdHZhciBuYW1lID0gbWV0YVsnQCddLm5hbWU7XG5cdFx0XHRcdHRoaXMubWV0YWRhdGFbbmFtZV0gPSBtZXRhWydAJ10uY29udGVudDtcblxuXHRcdFx0XHRpZiAobmFtZSA9PSAnY2FsaWJyZTpzZXJpZXMnKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0dGhpcy5tZXRhZGF0YVsnc2VyaWVzJ10gPSB0aGlzLm1ldGFkYXRhWydzZXJpZXMnXSB8fCBtZXRhWydAJ10uY29udGVudDtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0aWYgKG1ldGFbJyMnXSAmJiBtZXRhWydAJ10ucHJvcGVydHkpXG5cdFx0XHR7XG5cdFx0XHRcdHRoaXMubWV0YWRhdGFbbWV0YVsnQCddLnByb3BlcnR5XSA9IG1ldGFbJyMnXTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKG1ldGEubmFtZSAmJiBtZXRhLm5hbWUgPT0gXCJjb3ZlclwiKVxuXHRcdFx0e1xuXHRcdFx0XHR0aGlzLm1ldGFkYXRhW21ldGEubmFtZV0gPSBtZXRhLmNvbnRlbnQ7XG5cdFx0XHR9XG5cdFx0fSwgdGhpcyk7XG5cblx0XHRmdW5jdGlvbiBfbWV0YV92YWwocm93LCBrZXkgPSBudWxsKVxuXHRcdHtcblx0XHRcdGlmIChrZXkgIT09IG51bGwpXG5cdFx0XHR7XG5cdFx0XHRcdHJldHVybiByb3dba2V5XSB8fCByb3c7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiByb3c7XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqICBFUHViI3BhcnNlTWFuaWZlc3QoKSAtPiB1bmRlZmluZWRcblx0ICpcblx0ICogIFBhcnNlcyBcIm1hbmlmZXN0XCIgYmxvY2sgKGFsbCBpdGVtcyBpbmNsdWRlZCwgaHRtbCBmaWxlcywgaW1hZ2VzLCBzdHlsZXMpXG5cdCAqKi9cblx0cGFyc2VNYW5pZmVzdChtYW5pZmVzdClcblx0e1xuXHRcdHZhciBpLCBsZW4sIHBhdGggPSB0aGlzLnJvb3RGaWxlLnNwbGl0KFwiL1wiKSwgZWxlbWVudCwgcGF0aF9zdHI7XG5cdFx0cGF0aC5wb3AoKTtcblx0XHRwYXRoX3N0ciA9IHBhdGguam9pbihcIi9cIik7XG5cblx0XHRpZiAobWFuaWZlc3QuaXRlbSlcblx0XHR7XG5cdFx0XHRmb3IgKGkgPSAwLCBsZW4gPSBtYW5pZmVzdC5pdGVtLmxlbmd0aDsgaSA8IGxlbjsgaSsrKVxuXHRcdFx0e1xuXHRcdFx0XHRpZiAobWFuaWZlc3QuaXRlbVtpXVsnQCddKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0ZWxlbWVudCA9IG1hbmlmZXN0Lml0ZW1baV1bJ0AnXTtcblxuXHRcdFx0XHRcdGVsZW1lbnQgPSB0aGlzLl9FbGVtKGVsZW1lbnQpO1xuXG5cdFx0XHRcdFx0aWYgKGVsZW1lbnQuaHJlZiAmJiBlbGVtZW50LmhyZWYuc3Vic3RyKDAsIHBhdGhfc3RyLmxlbmd0aCkgIT0gcGF0aF9zdHIpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0ZWxlbWVudC5ocmVmID0gcGF0aC5jb25jYXQoW2VsZW1lbnQuaHJlZl0pLmpvaW4oXCIvXCIpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHRoaXMubWFuaWZlc3RbbWFuaWZlc3QuaXRlbVtpXVsnQCddLmlkXSA9IGVsZW1lbnQ7XG5cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQgKiAgRVB1YiNwYXJzZVNwaW5lKCkgLT4gdW5kZWZpbmVkXG5cdCAqXG5cdCAqICBQYXJzZXMgXCJzcGluZVwiIGJsb2NrIChhbGwgaHRtbCBlbGVtZW50cyB0aGF0IGFyZSBzaG93biB0byB0aGUgcmVhZGVyKVxuXHQgKiovXG5cdHBhcnNlU3BpbmUoc3BpbmUpXG5cdHtcblx0XHR2YXIgaSwgbGVuLCBwYXRoID0gdGhpcy5yb290RmlsZS5zcGxpdChcIi9cIiksIGVsZW1lbnQ7XG5cdFx0cGF0aC5wb3AoKTtcblxuXHRcdGlmIChzcGluZVsnQCddICYmIHNwaW5lWydAJ10udG9jKVxuXHRcdHtcblx0XHRcdHRoaXMuc3BpbmUudG9jID0gdGhpcy5tYW5pZmVzdFtzcGluZVsnQCddLnRvY10gfHwgbnVsbDtcblx0XHR9XG5cblx0XHRpZiAoc3BpbmUuaXRlbXJlZilcblx0XHR7XG5cdFx0XHRpZiAoIUFycmF5LmlzQXJyYXkoc3BpbmUuaXRlbXJlZikpXG5cdFx0XHR7XG5cdFx0XHRcdHNwaW5lLml0ZW1yZWYgPSBbc3BpbmUuaXRlbXJlZl07XG5cdFx0XHR9XG5cdFx0XHRmb3IgKGkgPSAwLCBsZW4gPSBzcGluZS5pdGVtcmVmLmxlbmd0aDsgaSA8IGxlbjsgaSsrKVxuXHRcdFx0e1xuXHRcdFx0XHRpZiAoc3BpbmUuaXRlbXJlZltpXVsnQCddKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0aWYgKGVsZW1lbnQgPSB0aGlzLm1hbmlmZXN0W3NwaW5lLml0ZW1yZWZbaV1bJ0AnXS5pZHJlZl0pXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0dGhpcy5zcGluZS5jb250ZW50cy5wdXNoKGVsZW1lbnQpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0XHR0aGlzLmZsb3cgPSB0aGlzLnNwaW5lLmNvbnRlbnRzO1xuXHR9XG5cblx0LyoqXG5cdCAqICBFUHViI3BhcnNlVE9DKCkgLT4gdW5kZWZpbmVkXG5cdCAqXG5cdCAqICBQYXJzZXMgbmN4IGZpbGUgZm9yIHRhYmxlIG9mIGNvbnRlbnRzICh0aXRsZSwgaHRtbCBmaWxlKVxuXHQgKiovXG5cdHBhcnNlVE9DKClcblx0e1xuXHRcdHZhciBpLCBsZW4sIHBhdGggPSB0aGlzLnNwaW5lLnRvYy5ocmVmLnNwbGl0KFwiL1wiKSwgaWRfbGlzdCA9IHt9LCBrZXlzO1xuXHRcdHBhdGgucG9wKCk7XG5cblx0XHRrZXlzID0gT2JqZWN0LmtleXModGhpcy5tYW5pZmVzdCk7XG5cdFx0Zm9yIChpID0gMCwgbGVuID0ga2V5cy5sZW5ndGg7IGkgPCBsZW47IGkrKylcblx0XHR7XG5cdFx0XHRpZF9saXN0W3RoaXMubWFuaWZlc3Rba2V5c1tpXV0uaHJlZl0gPSBrZXlzW2ldO1xuXHRcdH1cblxuXHRcdGNvbnN0IHhtbDJqc09wdGlvbnMgPSB0aGlzLl9nZXRTdGF0aWMoKS54bWwyanNPcHRpb25zO1xuXG5cdFx0dGhpcy56aXAucmVhZEZpbGUodGhpcy5zcGluZS50b2MuaHJlZiwgKGZ1bmN0aW9uIChlcnIsIGRhdGEpXG5cdFx0e1xuXHRcdFx0aWYgKGVycilcblx0XHRcdHtcblx0XHRcdFx0dGhpcy5lbWl0KFwiZXJyb3JcIiwgbmV3IEVycm9yKFwiUmVhZGluZyBhcmNoaXZlIGZhaWxlZFwiKSk7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblx0XHRcdHZhciB4bWwgPSBkYXRhLnRvU3RyaW5nKFwidXRmLThcIiksXG5cdFx0XHRcdHhtbHBhcnNlciA9IG5ldyB4bWwyanMuUGFyc2VyKHhtbDJqc09wdGlvbnMpO1xuXG5cdFx0XHR4bWxwYXJzZXIub24oXCJlbmRcIiwgKGZ1bmN0aW9uIChyZXN1bHQpXG5cdFx0XHR7XG5cdFx0XHRcdGlmIChyZXN1bHQubmF2TWFwICYmIHJlc3VsdC5uYXZNYXAubmF2UG9pbnQpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHR0aGlzLnRvYyA9IHRoaXMud2Fsa05hdk1hcChyZXN1bHQubmF2TWFwLm5hdlBvaW50LCBwYXRoLCBpZF9saXN0KTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHRoaXMuZW1pdChcImVuZFwiKTtcblx0XHRcdH0pLmJpbmQodGhpcykpO1xuXG5cdFx0XHR4bWxwYXJzZXIub24oXCJlcnJvclwiLCAoZnVuY3Rpb24gKGVycilcblx0XHRcdHtcblx0XHRcdFx0dGhpcy5lbWl0KFwiZXJyb3JcIiwgbmV3IEVycm9yKFwiUGFyc2luZyBjb250YWluZXIgWE1MIGZhaWxlZFwiKSk7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH0pLmJpbmQodGhpcykpO1xuXG5cdFx0XHR4bWxwYXJzZXIucGFyc2VTdHJpbmcoeG1sKTtcblxuXHRcdH0pLmJpbmQodGhpcykpO1xuXHR9XG5cblx0LyoqXG5cdCAqICBFUHViI3dhbGtOYXZNYXAoYnJhbmNoLCBwYXRoLCBpZF9saXN0LFssIGxldmVsXSkgLT4gQXJyYXlcblx0ICogIC0gYnJhbmNoIChBcnJheSB8IE9iamVjdCk6IE5DWCBOYXZQb2ludCBvYmplY3Rcblx0ICogIC0gcGF0aCAoQXJyYXkpOiBCYXNlIHBhdGhcblx0ICogIC0gaWRfbGlzdCAoT2JqZWN0KTogbWFwIG9mIGZpbGUgcGF0aHMgYW5kIGlkIHZhbHVlc1xuXHQgKiAgLSBsZXZlbCAoTnVtYmVyKTogZGVlcG5lc3Ncblx0ICpcblx0ICogIFdhbGtzIHRoZSBOYXZNYXAgb2JqZWN0IHRocm91Z2ggYWxsIGxldmVscyBhbmQgZmluZHMgZWxlbWVudHNcblx0ICogIGZvciBUT0Ncblx0ICoqL1xuXHR3YWxrTmF2TWFwKGJyYW5jaCwgcGF0aCwgaWRfbGlzdCwgbGV2ZWw6IG51bWJlciwgcGU/OiBFUHViLlRvY0VsZW1lbnQsIHBhcmVudE5jeD86IEVQdWIuSU5jeFRyZWUsIG5jeF9pZHg/KVxuXHR7XG5cdFx0bmN4X2lkeCA9IG5jeF9pZHggfHwge1xuXHRcdFx0aW5kZXg6IDAsXG5cdFx0fTtcblxuXHRcdGxldmVsID0gbGV2ZWwgfHwgMDtcblxuXHRcdHRoaXMubmN4X2RlcHRoID0gTWF0aC5tYXgobGV2ZWwgKyAxLCB0aGlzLm5jeF9kZXB0aCB8fCAwKTtcblxuXHRcdC8vIGRvbid0IGdvIHRvbyBmYXJcblx0XHRpZiAobGV2ZWwgPiA3KVxuXHRcdHtcblx0XHRcdHJldHVybiBbXTtcblx0XHR9XG5cblx0XHR2YXIgb3V0cHV0ID0gW107XG5cblx0XHRpZiAoIUFycmF5LmlzQXJyYXkoYnJhbmNoKSlcblx0XHR7XG5cdFx0XHRicmFuY2ggPSBbYnJhbmNoXTtcblx0XHR9XG5cblx0XHR0aGlzLm5jeCA9IHRoaXMubmN4IHx8IFtdO1xuXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBicmFuY2gubGVuZ3RoOyBpKyspXG5cdFx0e1xuXHRcdFx0bGV0IGVsZW1lbnQ6IEVQdWIuVG9jRWxlbWVudDtcblx0XHRcdGxldCBjdXJyZW50TmN4O1xuXG5cdFx0XHRpZiAoYnJhbmNoW2ldLm5hdkxhYmVsKVxuXHRcdFx0e1xuXHRcdFx0XHR2YXIgdGl0bGUgPSAnJztcblx0XHRcdFx0aWYgKGJyYW5jaFtpXS5uYXZMYWJlbCAmJiB0eXBlb2YgYnJhbmNoW2ldLm5hdkxhYmVsLnRleHQgPT0gJ3N0cmluZycpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHQvKlxuXHRcdFx0XHRcdHRpdGxlID0gYnJhbmNoW2ldLm5hdkxhYmVsICYmIGJyYW5jaFtpXS5uYXZMYWJlbC50ZXh0IHx8IGJyYW5jaFtpXS5uYXZMYWJlbCA9PT0gYnJhbmNoW2ldLm5hdkxhYmVsXG5cdFx0XHRcdFx0XHQ/ICcnXG5cdFx0XHRcdFx0XHQ6IChicmFuY2hbaV0ubmF2TGFiZWwgJiYgYnJhbmNoW2ldLm5hdkxhYmVsLnRleHQgfHwgYnJhbmNoW2ldLm5hdkxhYmVsIHx8IFwiXCIpLnRyaW0oKTtcblx0XHRcdFx0XHQqL1xuXG5cdFx0XHRcdFx0dGl0bGUgPSAoYnJhbmNoW2ldLm5hdkxhYmVsICYmIGJyYW5jaFtpXS5uYXZMYWJlbC50ZXh0IHx8IGJyYW5jaFtpXS5uYXZMYWJlbCB8fCBcIlwiKS50cmltKCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0dmFyIG9yZGVyID0gTnVtYmVyKGJyYW5jaFtpXVtcIkBcIl0gJiYgYnJhbmNoW2ldW1wiQFwiXS5wbGF5T3JkZXIgfHwgMCk7XG5cdFx0XHRcdGlmIChpc05hTihvcmRlcikpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRvcmRlciA9IDA7XG5cdFx0XHRcdH1cblx0XHRcdFx0dmFyIGhyZWYgPSAnJztcblx0XHRcdFx0aWYgKGJyYW5jaFtpXS5jb250ZW50ICYmIGJyYW5jaFtpXS5jb250ZW50W1wiQFwiXSAmJiB0eXBlb2YgYnJhbmNoW2ldLmNvbnRlbnRbXCJAXCJdLnNyYyA9PSAnc3RyaW5nJylcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGhyZWYgPSBicmFuY2hbaV0uY29udGVudFtcIkBcIl0uc3JjLnRyaW0oKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdGVsZW1lbnQgPSB7XG5cdFx0XHRcdFx0bGV2ZWw6IGxldmVsLFxuXHRcdFx0XHRcdG9yZGVyOiBvcmRlcixcblx0XHRcdFx0XHR0aXRsZTogdGl0bGVcblx0XHRcdFx0fTtcblxuXHRcdFx0XHRpZiAoaHJlZilcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGhyZWYgPSBwYXRoLmNvbmNhdChbaHJlZl0pLmpvaW4oXCIvXCIpO1xuXHRcdFx0XHRcdGVsZW1lbnQuaHJlZiA9IGhyZWY7XG5cblx0XHRcdFx0XHRpZiAoaWRfbGlzdFtlbGVtZW50LmhyZWZdKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdC8vIGxpbmsgZXhpc3Rpbmcgb2JqZWN0XG5cdFx0XHRcdFx0XHRlbGVtZW50ID0gdGhpcy5tYW5pZmVzdFtpZF9saXN0W2VsZW1lbnQuaHJlZl1dO1xuXG5cdFx0XHRcdFx0XHRlbGVtZW50LnRpdGxlID0gdGl0bGU7XG5cdFx0XHRcdFx0XHRlbGVtZW50Lm9yZGVyID0gb3JkZXI7XG5cdFx0XHRcdFx0XHRlbGVtZW50LmxldmVsID0gbGV2ZWw7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHQvLyB1c2UgbmV3IG9uZVxuXHRcdFx0XHRcdFx0ZWxlbWVudC5ocmVmID0gaHJlZjtcblx0XHRcdFx0XHRcdGVsZW1lbnQuaWQgPSAoYnJhbmNoW2ldW1wiQFwiXSAmJiBicmFuY2hbaV1bXCJAXCJdLmlkIHx8IFwiXCIpLnRyaW0oKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiAobGV2ZWwgPT0gMClcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRsZXQgaWR4ID0gdGhpcy5uY3gubGVuZ3RoO1xuXG5cdFx0XHRcdFx0XHRjdXJyZW50TmN4ID0gdGhpcy5uY3hbaWR4XSA9IHtcblx0XHRcdFx0XHRcdFx0aWQ6IGVsZW1lbnQuaWQsXG5cdFx0XHRcdFx0XHRcdG5jeF9pbmRleDogaWR4LFxuXHRcdFx0XHRcdFx0XHRuY3hfaW5kZXgyOiBuY3hfaWR4LmluZGV4KyssXG5cdFx0XHRcdFx0XHRcdGxldmVsLFxuXHRcdFx0XHRcdFx0XHRzdWI6IFtdLFxuXHRcdFx0XHRcdFx0fTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZSBpZiAocGFyZW50TmN4KVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGxldCBpZHggPSBwYXJlbnROY3guc3ViLmxlbmd0aDtcblxuXHRcdFx0XHRcdFx0Y3VycmVudE5jeCA9IHBhcmVudE5jeC5zdWJbcGFyZW50TmN4LnN1Yi5sZW5ndGhdID0ge1xuXHRcdFx0XHRcdFx0XHRpZDogZWxlbWVudC5pZCxcblx0XHRcdFx0XHRcdFx0bmN4X2luZGV4OiBpZHgsXG5cdFx0XHRcdFx0XHRcdG5jeF9pbmRleDI6IG5jeF9pZHguaW5kZXgrKyxcblx0XHRcdFx0XHRcdFx0bGV2ZWwsXG5cdFx0XHRcdFx0XHRcdHN1YjogW10sXG5cdFx0XHRcdFx0XHR9O1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdG91dHB1dC5wdXNoKGVsZW1lbnQpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdC8vY29uc29sZS5sb2cobmN4X2lkeCk7XG5cblx0XHRcdGlmIChicmFuY2hbaV0ubmF2UG9pbnQpXG5cdFx0XHR7XG5cdFx0XHRcdG91dHB1dCA9IG91dHB1dC5jb25jYXQodGhpcy53YWxrTmF2TWFwKGJyYW5jaFtpXS5uYXZQb2ludCwgcGF0aCwgaWRfbGlzdCwgbGV2ZWwgKyAxLCBlbGVtZW50LCBjdXJyZW50TmN4LCBuY3hfaWR4KSk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiBvdXRwdXQ7XG5cdH1cblxuXHQvKipcblx0ICogIEVQdWIjZ2V0Q2hhcHRlcihpZCwgY2FsbGJhY2spIC0+IHVuZGVmaW5lZFxuXHQgKiAgLSBpZCAoU3RyaW5nKTogTWFuaWZlc3QgaWQgdmFsdWUgZm9yIGEgY2hhcHRlclxuXHQgKiAgLSBjYWxsYmFjayAoRnVuY3Rpb24pOiBjYWxsYmFjayBmdW5jdGlvblxuXHQgKlxuXHQgKiAgRmluZHMgYSBjaGFwdGVyIHRleHQgZm9yIGFuIGlkLiBSZXBsYWNlcyBpbWFnZSBhbmQgbGluayBVUkwncywgcmVtb3Zlc1xuXHQgKiAgPGhlYWQ+IGV0Yy4gZWxlbWVudHMuIFJldHVybiBvbmx5IGNoYXB0ZXJzIHdpdGggbWltZSB0eXBlIGFwcGxpY2F0aW9uL3hodG1sK3htbFxuXHQgKiovXG5cdGdldENoYXB0ZXIoY2hhcHRlcklkOiBzdHJpbmcsIGNhbGxiYWNrOiAoZXJyb3I6IEVycm9yLCB0ZXh0Pzogc3RyaW5nKSA9PiB2b2lkKVxuXHR7XG5cdFx0bGV0IHNlbGYgPSB0aGlzO1xuXG5cdFx0dGhpcy5nZXRDaGFwdGVyUmF3KGNoYXB0ZXJJZCwgKGZ1bmN0aW9uIChlcnIsIHN0cilcblx0XHR7XG5cdFx0XHRpZiAoZXJyKVxuXHRcdFx0e1xuXHRcdFx0XHRjYWxsYmFjayhlcnIpO1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9XG5cblx0XHRcdGxldCBtZXRhID0gc2VsZi5tYW5pZmVzdFtjaGFwdGVySWRdO1xuXG5cdFx0XHR2YXIgaSwgbGVuLCBwYXRoID0gdGhpcy5yb290RmlsZS5zcGxpdChcIi9cIiksIGtleXMgPSBPYmplY3Qua2V5cyh0aGlzLm1hbmlmZXN0KTtcblx0XHRcdHBhdGgucG9wKCk7XG5cblx0XHRcdGxldCBiYXNlUGF0aCA9IE5vZGVQYXRoLmRpcm5hbWUobWV0YS5ocmVmKTtcblx0XHRcdGxldCBiYXNlSHJlZiA9IG1ldGEuaHJlZjtcblxuXHRcdFx0Ly8gcmVtb3ZlIGxpbmVicmVha3MgKG5vIG11bHRpIGxpbmUgbWF0Y2hlcyBpbiBKUyByZWdleCEpXG5cdFx0XHRzdHIgPSBzdHIucmVwbGFjZSgvXFxyP1xcbi9nLCBcIlxcdTAwMDBcIik7XG5cblx0XHRcdC8vIGtlZXAgb25seSA8Ym9keT4gY29udGVudHNcblx0XHRcdHN0ci5yZXBsYWNlKC88Ym9keVtePl0qPz4oLiopPFxcL2JvZHlbXj5dKj8+L2ksIGZ1bmN0aW9uIChvLCBkKVxuXHRcdFx0e1xuXHRcdFx0XHRzdHIgPSBkLnRyaW0oKTtcblx0XHRcdH0pO1xuXG5cdFx0XHQvLyByZW1vdmUgPHNjcmlwdD4gYmxvY2tzIGlmIGFueVxuXHRcdFx0c3RyID0gc3RyLnJlcGxhY2UoLzxzY3JpcHRbXj5dKj8+KC4qPyk8XFwvc2NyaXB0W14+XSo/Pi9pZywgZnVuY3Rpb24gKG8sIHMpXG5cdFx0XHR7XG5cdFx0XHRcdHJldHVybiBcIlwiO1xuXHRcdFx0fSk7XG5cblx0XHRcdC8vIHJlbW92ZSA8c3R5bGU+IGJsb2NrcyBpZiBhbnlcblx0XHRcdHN0ciA9IHN0ci5yZXBsYWNlKC88c3R5bGVbXj5dKj8+KC4qPyk8XFwvc3R5bGVbXj5dKj8+L2lnLCBmdW5jdGlvbiAobywgcylcblx0XHRcdHtcblx0XHRcdFx0cmV0dXJuIFwiXCI7XG5cdFx0XHR9KTtcblxuXHRcdFx0Ly8gcmVtb3ZlIG9uRXZlbnQgaGFuZGxlcnNcblx0XHRcdHN0ciA9IHN0ci5yZXBsYWNlKC8oXFxzKShvblxcdyspKFxccyo9XFxzKltcIiddP1teXCInXFxzPl0qP1tcIidcXHM+XSkvZywgZnVuY3Rpb24gKG8sIGEsIGIsIGMpXG5cdFx0XHR7XG5cdFx0XHRcdHJldHVybiBhICsgXCJza2lwLVwiICsgYiArIGM7XG5cdFx0XHR9KTtcblxuXHRcdFx0Ly8gcmVwbGFjZSBpbWFnZXNcblx0XHRcdHN0ciA9IHN0ci5yZXBsYWNlKC8oPzw9XFxzfF4pKHNyY1xccyo9XFxzKikoW1wiJ10/KShbXlwiJ1xcbl0qPykoXFwyKS9nLCAobywgYSwgZCwgYiwgYykgPT4ge1xuXG5cdFx0XHRcdGxldCBpbWcgPSBOb2RlUGF0aC5wb3NpeC5qb2luKGJhc2VQYXRoLCBiKTtcblx0XHRcdFx0bGV0IGVsZW1lbnQ7XG5cblx0XHRcdFx0Zm9yIChpID0gMCwgbGVuID0ga2V5cy5sZW5ndGg7IGkgPCBsZW47IGkrKylcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGxldCBfYXJyID0gW1xuXHRcdFx0XHRcdFx0c2VsZi5tYW5pZmVzdFtrZXlzW2ldXS5ocmVmLFxuXHRcdFx0XHRcdFx0ZGVjb2RlVVJJKHNlbGYubWFuaWZlc3Rba2V5c1tpXV0uaHJlZiksXG5cdFx0XHRcdFx0XHRlbmNvZGVVUkkoc2VsZi5tYW5pZmVzdFtrZXlzW2ldXS5ocmVmKSxcblx0XHRcdFx0XHRdO1xuXG5cdFx0XHRcdFx0aWYgKF9hcnIuaW5jbHVkZXMoaW1nKSlcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRlbGVtZW50ID0gc2VsZi5tYW5pZmVzdFtrZXlzW2ldXTtcblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHRcdGlmIChlbGVtZW50KVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0bGV0IHMgPSBhICsgZCArIE5vZGVVcmwucmVzb2x2ZSh0aGlzLmltYWdlcm9vdCwgaW1nKSArIGM7XG5cblx0XHRcdFx0XHRyZXR1cm4gc1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0cmV0dXJuIG87XG5cdFx0XHR9KTtcblx0XHRcdC8qXG5cdFx0XHRzdHIgPSBzdHIucmVwbGFjZSgvKFxcc3NyY1xccyo9XFxzKltcIiddPykoW15cIidcXHM+XSo/KShbXCInXFxzPl0pL2csIChmdW5jdGlvbiAobywgYSwgYiwgYylcblx0XHRcdHtcblx0XHRcdFx0dmFyIGltZyA9IHBhdGguY29uY2F0KFtiXSkuam9pbihcIi9cIikudHJpbSgpLFxuXHRcdFx0XHRcdGVsZW1lbnQ7XG5cblx0XHRcdFx0Zm9yIChpID0gMCwgbGVuID0ga2V5cy5sZW5ndGg7IGkgPCBsZW47IGkrKylcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGlmICh0aGlzLm1hbmlmZXN0W2tleXNbaV1dLmhyZWYgPT0gaW1nKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGVsZW1lbnQgPSB0aGlzLm1hbmlmZXN0W2tleXNbaV1dO1xuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gaW5jbHVkZSBvbmx5IGltYWdlcyBmcm9tIG1hbmlmZXN0XG5cdFx0XHRcdGlmIChlbGVtZW50KVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0cmV0dXJuIGEgKyB0aGlzLmltYWdlcm9vdCArIGVsZW1lbnQuaWQgKyBcIi9cIiArIGltZyArIGM7XG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0cmV0dXJuIFwiXCI7XG5cdFx0XHRcdH1cblxuXHRcdFx0fSkuYmluZCh0aGlzKSk7XG5cdFx0XHQqL1xuXG5cdFx0XHQvLyByZXBsYWNlIGxpbmtzXG5cdFx0XHRzdHIgPSBzdHIucmVwbGFjZSgvKFxcc2hyZWZcXHMqPVxccypbXCInXT8pKFteXCInXFxzPl0qPykoW1wiJ1xccz5dKS9nLCAoZnVuY3Rpb24gKG8sIGEsIGIsIGMpXG5cdFx0XHR7XG5cdFx0XHRcdHZhciBsaW5rcGFydHMgPSBiICYmIGIuc3BsaXQoXCIjXCIpLFxuXHRcdFx0XHRcdGxpbmsgPSBwYXRoLmNvbmNhdChbKGxpbmtwYXJ0cy5zaGlmdCgpIHx8IFwiXCIpXSkuam9pbihcIi9cIikudHJpbSgpLFxuXHRcdFx0XHRcdGVsZW1lbnQ7XG5cblx0XHRcdFx0Zm9yIChpID0gMCwgbGVuID0ga2V5cy5sZW5ndGg7IGkgPCBsZW47IGkrKylcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGlmICh0aGlzLm1hbmlmZXN0W2tleXNbaV1dLmhyZWYuc3BsaXQoXCIjXCIpWzBdID09IGxpbmspXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0ZWxlbWVudCA9IHRoaXMubWFuaWZlc3Rba2V5c1tpXV07XG5cdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAobGlua3BhcnRzLmxlbmd0aClcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGxpbmsgKz0gXCIjXCIgKyBsaW5rcGFydHMuam9pbihcIiNcIik7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyBpbmNsdWRlIG9ubHkgaW1hZ2VzIGZyb20gbWFuaWZlc3Rcblx0XHRcdFx0aWYgKGVsZW1lbnQpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRyZXR1cm4gYSArIHRoaXMubGlua3Jvb3QgKyBlbGVtZW50LmlkICsgXCIvXCIgKyBsaW5rICsgYztcblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRyZXR1cm4gYSArIGIgKyBjO1xuXHRcdFx0XHR9XG5cblx0XHRcdH0pLmJpbmQodGhpcykpO1xuXG5cdFx0XHQvLyBicmluZyBiYWNrIGxpbmVicmVha3Ncblx0XHRcdHN0ciA9IHN0ci5yZXBsYWNlKC9cXHUwMDAwL2csIFwiXFxuXCIpLnRyaW0oKTtcblxuXHRcdFx0Y2FsbGJhY2sobnVsbCwgc3RyKTtcblx0XHR9KS5iaW5kKHRoaXMpKTtcblx0fVxuXG5cdC8qKlxuXHQgKiAgRVB1YiNnZXRDaGFwdGVyUmF3KGlkLCBjYWxsYmFjaykgLT4gdW5kZWZpbmVkXG5cdCAqICAtIGlkIChTdHJpbmcpOiBNYW5pZmVzdCBpZCB2YWx1ZSBmb3IgYSBjaGFwdGVyXG5cdCAqICAtIGNhbGxiYWNrIChGdW5jdGlvbik6IGNhbGxiYWNrIGZ1bmN0aW9uXG5cdCAqXG5cdCAqICBSZXR1cm5zIHRoZSByYXcgY2hhcHRlciB0ZXh0IGZvciBhbiBpZC5cblx0ICoqL1xuXHRnZXRDaGFwdGVyUmF3KGNoYXB0ZXJJZDogc3RyaW5nLCBjYWxsYmFjazogKGVycm9yOiBFcnJvciwgdGV4dD86IHN0cmluZykgPT4gdm9pZClcblx0e1xuXHRcdGlmICh0aGlzLm1hbmlmZXN0W2NoYXB0ZXJJZF0pXG5cdFx0e1xuXG5cdFx0XHRpZiAoISh0aGlzLm1hbmlmZXN0W2NoYXB0ZXJJZF1bJ21lZGlhLXR5cGUnXSA9PSBcImFwcGxpY2F0aW9uL3hodG1sK3htbFwiIHx8IHRoaXMubWFuaWZlc3RbY2hhcHRlcklkXVsnbWVkaWEtdHlwZSddID09IFwiaW1hZ2Uvc3ZnK3htbFwiKSlcblx0XHRcdHtcblx0XHRcdFx0cmV0dXJuIGNhbGxiYWNrKG5ldyBFcnJvcihgSW52YWxpZCBtaW1lIHR5cGUgZm9yIGNoYXB0ZXIgXCIke2NoYXB0ZXJJZH1cIiAke3RoaXMubWFuaWZlc3RbY2hhcHRlcklkXVsnbWVkaWEtdHlwZSddfWApKTtcblx0XHRcdH1cblxuXHRcdFx0dGhpcy56aXAucmVhZEZpbGUodGhpcy5tYW5pZmVzdFtjaGFwdGVySWRdLmhyZWYsIChmdW5jdGlvbiAoZXJyLCBkYXRhKVxuXHRcdFx0e1xuXHRcdFx0XHRpZiAoZXJyKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0Y2FsbGJhY2sobmV3IEVycm9yKGBSZWFkaW5nIGFyY2hpdmUgZmFpbGVkIFwiJHtjaGFwdGVySWR9XCJgKSk7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0dmFyIHN0ciA9IGRhdGEudG9TdHJpbmcoXCJ1dGYtOFwiKTtcblxuXHRcdFx0XHRjYWxsYmFjayhudWxsLCBzdHIpO1xuXG5cdFx0XHR9KS5iaW5kKHRoaXMpKTtcblx0XHR9XG5cdFx0ZWxzZVxuXHRcdHtcblx0XHRcdGNhbGxiYWNrKG5ldyBFcnJvcihgRmlsZSBub3QgZm91bmQgXCIke2NoYXB0ZXJJZH1cImApKTtcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogIEVQdWIjZ2V0SW1hZ2UoaWQsIGNhbGxiYWNrKSAtPiB1bmRlZmluZWRcblx0ICogIC0gaWQgKFN0cmluZyk6IE1hbmlmZXN0IGlkIHZhbHVlIGZvciBhbiBpbWFnZVxuXHQgKiAgLSBjYWxsYmFjayAoRnVuY3Rpb24pOiBjYWxsYmFjayBmdW5jdGlvblxuXHQgKlxuXHQgKiAgRmluZHMgYW4gaW1hZ2UgZm9yIGFuIGlkLiBSZXR1cm5zIHRoZSBpbWFnZSBhcyBCdWZmZXIuIENhbGxiYWNrIGdldHNcblx0ICogIGFuIGVycm9yIG9iamVjdCwgaW1hZ2UgYnVmZmVyIGFuZCBpbWFnZSBjb250ZW50LXR5cGUuXG5cdCAqICBSZXR1cm4gb25seSBpbWFnZXMgd2l0aCBtaW1lIHR5cGUgaW1hZ2Vcblx0ICoqL1xuXHRnZXRJbWFnZShpZDogc3RyaW5nLCBjYWxsYmFjazogKGVycm9yOiBFcnJvciwgZGF0YT86IEJ1ZmZlciwgbWltZVR5cGU/OiBzdHJpbmcpID0+IHZvaWQpXG5cdHtcblx0XHRpZiAodGhpcy5tYW5pZmVzdFtpZF0pXG5cdFx0e1xuXG5cdFx0XHRpZiAoKHRoaXMubWFuaWZlc3RbaWRdWydtZWRpYS10eXBlJ10gfHwgXCJcIikudG9Mb3dlckNhc2UoKS50cmltKCkuc3Vic3RyKDAsIDYpICE9IFwiaW1hZ2UvXCIpXG5cdFx0XHR7XG5cdFx0XHRcdHJldHVybiBjYWxsYmFjayhuZXcgRXJyb3IoXCJJbnZhbGlkIG1pbWUgdHlwZSBmb3IgaW1hZ2VcIikpO1xuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLmdldEZpbGUoaWQsIGNhbGxiYWNrKTtcblx0XHR9XG5cdFx0ZWxzZVxuXHRcdHtcblx0XHRcdGNhbGxiYWNrKG5ldyBFcnJvcihcIkZpbGUgbm90IGZvdW5kXCIpKTtcblx0XHR9XG5cdH1cblxuXHQvKipcblx0ICogIEVQdWIjZ2V0RmlsZShpZCwgY2FsbGJhY2spIC0+IHVuZGVmaW5lZFxuXHQgKiAgLSBpZCAoU3RyaW5nKTogTWFuaWZlc3QgaWQgdmFsdWUgZm9yIGEgZmlsZVxuXHQgKiAgLSBjYWxsYmFjayAoRnVuY3Rpb24pOiBjYWxsYmFjayBmdW5jdGlvblxuXHQgKlxuXHQgKiAgRmluZHMgYSBmaWxlIGZvciBhbiBpZC4gUmV0dXJucyB0aGUgZmlsZSBhcyBCdWZmZXIuIENhbGxiYWNrIGdldHNcblx0ICogIGFuIGVycm9yIG9iamVjdCwgZmlsZSBjb250ZW50cyBidWZmZXIgYW5kIGZpbGUgY29udGVudC10eXBlLlxuXHQgKiovXG5cdGdldEZpbGUoaWQ6IHN0cmluZywgY2FsbGJhY2s6IChlcnJvcjogRXJyb3IsIGRhdGE/OiBCdWZmZXIsIG1pbWVUeXBlPzogc3RyaW5nKSA9PiB2b2lkKVxuXHR7XG5cdFx0aWYgKHRoaXMubWFuaWZlc3RbaWRdKVxuXHRcdHtcblx0XHRcdGxldCBzZWxmID0gdGhpcztcblxuXHRcdFx0dGhpcy56aXAucmVhZEZpbGUodGhpcy5tYW5pZmVzdFtpZF0uaHJlZiwgKGZ1bmN0aW9uIChlcnIsIGRhdGEpXG5cdFx0XHR7XG5cdFx0XHRcdGlmIChlcnIpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRjYWxsYmFjayhuZXcgRXJyb3IoYFJlYWRpbmcgYXJjaGl2ZSBmYWlsZWQgJHtzZWxmLm1hbmlmZXN0W2lkXS5ocmVmfWApKTtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRjYWxsYmFjayhudWxsLCBkYXRhLCB0aGlzLm1hbmlmZXN0W2lkXVsnbWVkaWEtdHlwZSddKTtcblx0XHRcdH0pLmJpbmQodGhpcykpO1xuXHRcdH1cblx0XHRlbHNlXG5cdFx0e1xuXHRcdFx0Y2FsbGJhY2sobmV3IFJhbmdlRXJyb3IoYEZpbGUgbm90IGZvdW5kIFwiJHtpZH1cImApKTtcblx0XHR9XG5cdH1cblxuXHRyZWFkRmlsZShmaWxlbmFtZSwgb3B0aW9ucywgY2FsbGJhY2tfKVxuXHR7XG5cdFx0dmFyIGNhbGxiYWNrID0gYXJndW1lbnRzW2FyZ3VtZW50cy5sZW5ndGggLSAxXTtcblxuXHRcdGlmICh1dGlsLmlzRnVuY3Rpb24ob3B0aW9ucykgfHwgIW9wdGlvbnMpXG5cdFx0e1xuXHRcdFx0dGhpcy56aXAucmVhZEZpbGUoZmlsZW5hbWUsIGNhbGxiYWNrKTtcblx0XHR9XG5cdFx0ZWxzZSBpZiAodXRpbC5pc1N0cmluZyhvcHRpb25zKSlcblx0XHR7XG5cdFx0XHQvLyBvcHRpb25zIGlzIGFuIGVuY29kaW5nXG5cdFx0XHR0aGlzLnppcC5yZWFkRmlsZShmaWxlbmFtZSwgZnVuY3Rpb24gKGVyciwgZGF0YSlcblx0XHRcdHtcblx0XHRcdFx0aWYgKGVycilcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGNhbGxiYWNrKG5ldyBFcnJvcihgUmVhZGluZyBhcmNoaXZlIGZhaWxlZCAke2ZpbGVuYW1lfWApKTtcblx0XHRcdFx0XHRyZXR1cm47XG5cdFx0XHRcdH1cblx0XHRcdFx0Y2FsbGJhY2sobnVsbCwgZGF0YS50b1N0cmluZyhvcHRpb25zKSk7XG5cdFx0XHR9KTtcblx0XHR9XG5cdFx0ZWxzZVxuXHRcdHtcblx0XHRcdHRocm93IG5ldyBUeXBlRXJyb3IoJ0JhZCBhcmd1bWVudHMnKTtcblx0XHR9XG5cdH1cblxuXHRzdGF0aWMgU1lNQk9MX1JBV19EQVRBID0gU1lNQk9MX1JBV19EQVRBO1xufVxuXG5tb2R1bGUgRVB1Ylxue1xuXHRleHBvcnQgY29uc3QgeG1sMmpzT3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe30sIHhtbDJqcy5kZWZhdWx0c1snMC4xJ10pIGFzIHhtbDJqcy5PcHRpb25zO1xuXG5cdGV4cG9ydCBjb25zdCBJTUFHRV9ST09UID0gJy9pbWFnZXMvJztcblx0ZXhwb3J0IGNvbnN0IExJTktfUk9PVCA9ICcvbGlua3MvJztcblxuXHQvL2V4cG9ydCBjb25zdCBTWU1CT0xfUkFXX0RBVEEgPSBTeW1ib2wuZm9yKCdyYXdEYXRhJyk7XG5cblx0ZXhwb3J0IGNvbnN0IEVMRU1fTUVESUFfVFlQRSA9ICdtZWRpYS10eXBlJztcblx0ZXhwb3J0IGNvbnN0IEVMRU1fTUVESUFfVFlQRTIgPSAnbWVkaWFUeXBlJztcblxuXHRleHBvcnQgaW50ZXJmYWNlIFRvY0VsZW1lbnRcblx0e1xuXHRcdGxldmVsPzogbnVtYmVyO1xuXHRcdG9yZGVyPzogbnVtYmVyO1xuXHRcdHRpdGxlPzogc3RyaW5nO1xuXHRcdGlkPzogc3RyaW5nO1xuXHRcdGhyZWY/OiBzdHJpbmc7XG5cblx0XHQnbWVkaWEtdHlwZSc/OiBzdHJpbmcsXG5cdFx0bWVkaWFUeXBlPzogc3RyaW5nLFxuXHRcdCdlcHViLXR5cGUnPzogc3RyaW5nLFxuXHRcdGxhbmc/OiBzdHJpbmcsXG5cblx0XHRzZXJpZXM/OiBzdHJpbmcsXG5cblx0XHRjb250cmlidXRlPzogc3RyaW5nW10sXG5cdFx0YXV0aG9yX2xpbmtfbWFwPzoge1xuXHRcdFx0W2tleTogc3RyaW5nXTogc3RyaW5nLFxuXHRcdH1cblx0fVxuXG5cdGV4cG9ydCBpbnRlcmZhY2UgSVNwaW5lXG5cdHtcblx0XHRjb250ZW50czogSVNwaW5lQ29udGVudHMsXG5cdFx0dG9jPzogVG9jRWxlbWVudCxcblxuXHRcdGl0ZW1yZWY/OiBPYmplY3RbXSxcblx0fVxuXG5cdGV4cG9ydCBpbnRlcmZhY2UgSU1ldGFkYXRhTGlzdFxuXHR7XG5cdFx0W2tleTogc3RyaW5nXTogRVB1Yi5Ub2NFbGVtZW50LFxuXHR9XG5cblx0ZXhwb3J0IGludGVyZmFjZSBJU3BpbmVDb250ZW50cyBleHRlbmRzIEFycmF5PEVQdWIuVG9jRWxlbWVudD5cblx0e1xuXHRcdFtpbmRleDogbnVtYmVyXTogRVB1Yi5Ub2NFbGVtZW50LFxuXHR9XG5cblx0ZXhwb3J0IGludGVyZmFjZSBJTWV0YWRhdGFcblx0e1xuXHRcdHB1Ymxpc2hlcj86IHN0cmluZyxcblx0XHRsYW5ndWFnZT86IHN0cmluZyxcblx0XHR0aXRsZT86IHN0cmluZyxcblx0XHRzdWJqZWN0Pzogc3RyaW5nW10sXG5cdFx0ZGVzY3JpcHRpb24/OiBzdHJpbmcsXG5cblx0XHRjcmVhdG9yPzogc3RyaW5nLFxuXHRcdGNyZWF0b3JGaWxlQXM/OiBzdHJpbmcsXG5cblx0XHRkYXRlPzogc3RyaW5nLFxuXHRcdElTQk4/OiBzdHJpbmcsXG5cdFx0VVVJRD86IHN0cmluZyxcblx0XHRjb3Zlcj9cblxuXHRcdCdmaWxlLWFzJz86IHN0cmluZyxcblxuXHRcdCdiZWxvbmdzLXRvLWNvbGxlY3Rpb24nPzogc3RyaW5nLFxuXHRcdCdjYWxpYnJlOnNlcmllcyc/OiBzdHJpbmcsXG5cdFx0J2NvbGxlY3Rpb24tdHlwZSc/OiBzdHJpbmcsXG5cblx0XHRba2V5OiBzdHJpbmddOiBhbnksXG5cblx0XHRbU1lNQk9MX1JBV19EQVRBXT86IElNZXRhZGF0YSxcblx0fVxuXG5cdGV4cG9ydCBpbnRlcmZhY2UgSU5jeCBleHRlbmRzIEFycmF5PElOY3hUcmVlPlxuXHR7XG5cdFx0W2luZGV4OiBudW1iZXJdOiBJTmN4VHJlZVxuXHR9XG5cblx0ZXhwb3J0IGludGVyZmFjZSBJTmN4VHJlZVxuXHR7XG5cdFx0aWQ6IHN0cmluZztcblx0XHRuY3hfaW5kZXg6IG51bWJlcjtcblx0XHRuY3hfaW5kZXgyPzogbnVtYmVyO1xuXHRcdGxldmVsPzogbnVtYmVyO1xuXHRcdHN1YjogSU5jeFRyZWVbXSxcblx0fVxuXG5cdGV4cG9ydCBmdW5jdGlvbiBpc0VwdWIoZGF0YTogc3RyaW5nLCBidWY/OiBib29sZWFuKTogc3RyaW5nXG5cdGV4cG9ydCBmdW5jdGlvbiBpc0VwdWIoZGF0YTogQnVmZmVyLCBidWY/OiBib29sZWFuKTogQnVmZmVyXG5cdGV4cG9ydCBmdW5jdGlvbiBpc0VwdWIoZGF0YSwgYnVmPzogYm9vbGVhbilcblx0ZXhwb3J0IGZ1bmN0aW9uIGlzRXB1YihkYXRhLCBidWY/OiBib29sZWFuKVxuXHR7XG5cdFx0bGV0IHR4dCA9ICh0eXBlb2YgZGF0YSA9PSAnc3RyaW5nJyAmJiAhYnVmKSA/IGRhdGEgOiBkYXRhLnRvU3RyaW5nKFwidXRmLThcIikudG9Mb3dlckNhc2UoKS50cmltKCk7XG5cblx0XHRpZiAodHh0ID09PSAnYXBwbGljYXRpb24vZXB1Yit6aXAnKVxuXHRcdHtcblx0XHRcdHJldHVybiBkYXRhO1xuXHRcdH1cblxuXHRcdHJldHVybiBudWxsO1xuXHR9XG5cbn1cblxuLy8gRXhwb3NlIHRvIHRoZSB3b3JsZFxuZXhwb3J0ID0gRVB1YjtcblxuLypcbi8vIEB0cy1pZ25vcmVcbmRlY2xhcmUgbW9kdWxlIFwiZXB1YlwiXG57XG5cblx0aW1wb3J0IHsgRXZlbnRFbWl0dGVyIH0gZnJvbSBcImV2ZW50c1wiO1xuXG5cdGludGVyZmFjZSBUb2NFbGVtZW50XG5cdHtcblx0XHRsZXZlbDogbnVtYmVyO1xuXHRcdG9yZGVyOiBudW1iZXI7XG5cdFx0dGl0bGU6IHN0cmluZztcblx0XHRpZDogc3RyaW5nO1xuXHRcdGhyZWY/OiBzdHJpbmc7XG5cdH1cblxuXHRjbGFzcyBFUHViIGV4dGVuZHMgRXZlbnRFbWl0dGVyXG5cdHtcblx0XHRjb25zdHJ1Y3RvcihlcHViZmlsZTogc3RyaW5nLCBpbWFnZXdlYnJvb3Q/OiBzdHJpbmcsIGNoYXB0ZXJ3ZWJyb290Pzogc3RyaW5nKTtcblxuXHRcdG1ldGFkYXRhOiBPYmplY3Q7XG5cdFx0bWFuaWZlc3Q6IE9iamVjdDtcblx0XHRzcGluZTogT2JqZWN0O1xuXHRcdGZsb3c6IEFycmF5PE9iamVjdD47XG5cdFx0dG9jOiBBcnJheTxUb2NFbGVtZW50PjtcblxuXHRcdHBhcnNlKCk6IHZvaWQ7XG5cblx0XHRnZXRDaGFwdGVyKGNoYXB0ZXJJZDogc3RyaW5nLCBjYWxsYmFjazogKGVycm9yOiBFcnJvciwgdGV4dDogc3RyaW5nKSA9PiB2b2lkKTogdm9pZDtcblxuXHRcdGdldENoYXB0ZXJSYXcoY2hhcHRlcklkOiBzdHJpbmcsIGNhbGxiYWNrOiAoZXJyb3I6IEVycm9yLCB0ZXh0OiBzdHJpbmcpID0+IHZvaWQpOiB2b2lkO1xuXG5cdFx0Z2V0SW1hZ2UoaWQ6IHN0cmluZywgY2FsbGJhY2s6IChlcnJvcjogRXJyb3IsIGRhdGE6IEJ1ZmZlciwgbWltZVR5cGU6IHN0cmluZykgPT4gdm9pZCk6IHZvaWQ7XG5cblx0XHRnZXRGaWxlKGlkOiBzdHJpbmcsIGNhbGxiYWNrOiAoZXJyb3I6IEVycm9yLCBkYXRhOiBCdWZmZXIsIG1pbWVUeXBlOiBzdHJpbmcpID0+IHZvaWQpOiB2b2lkO1xuXHR9XG5cblx0ZXhwb3J0ID0gRVB1Yjtcbn1cbiovXG4iXX0=