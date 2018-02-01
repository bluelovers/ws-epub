/// <reference types="node" />
import { EventEmitter } from 'events';
import { IZipFile } from './zipfile';
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
declare class EPub extends EventEmitter {
    metadata: EPub.IMetadata;
    manifest: Object;
    spine: EPub.ISpine;
    flow: EPub.ISpineContents;
    toc: Array<EPub.TocElement>;
    filename: string;
    imageroot: string;
    linkroot: string;
    containerFile: any;
    mimeFile: any;
    rootFile: any;
    zip: IZipFile;
    version: string;
    constructor(epubfile: string, imagewebroot?: string, chapterwebroot?: string);
    /**
     *  EPub#parse() -> undefined
     *
     *  Starts the parser, needs to be called by the script
     **/
    parse(): void;
    /**
     *  EPub#open() -> undefined
     *
     *  Opens the epub file with Zip unpacker, retrieves file listing
     *  and runs mime type check
     **/
    open(): void;
    /**
     *  EPub#checkMimeType() -> undefined
     *
     *  Checks if there's a file called "mimetype" and that it's contents
     *  are "application/epub+zip". On success runs root file check.
     **/
    checkMimeType(): void;
    /**
     *  EPub#getRootFiles() -> undefined
     *
     *  Looks for a "meta-inf/container.xml" file and searches for a
     *  rootfile element with mime type "application/oebps-package+xml".
     *  On success calls the rootfile parser
     **/
    getRootFiles(): void;
    /**
     *  EPub#handleRootFile() -> undefined
     *
     *  Parses the rootfile XML and calls rootfile parser
     **/
    handleRootFile(): void;
    /**
     *  EPub#parseRootFile() -> undefined
     *
     *  Parses elements "metadata," "manifest," "spine" and TOC.
     *  Emits "end" if no TOC
     **/
    parseRootFile(rootfile: any): void;
    /**
     *  EPub#parseMetadata() -> undefined
     *
     *  Parses "metadata" block (book metadata, title, author etc.)
     **/
    parseMetadata(metadata: EPub.IMetadata): void;
    /**
     *  EPub#parseManifest() -> undefined
     *
     *  Parses "manifest" block (all items included, html files, images, styles)
     **/
    parseManifest(manifest: any): void;
    /**
     *  EPub#parseSpine() -> undefined
     *
     *  Parses "spine" block (all html elements that are shown to the reader)
     **/
    parseSpine(spine: any): void;
    /**
     *  EPub#parseTOC() -> undefined
     *
     *  Parses ncx file for table of contents (title, html file)
     **/
    parseTOC(): void;
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
    walkNavMap(branch: any, path: any, id_list: any, level: any): any[];
    /**
     *  EPub#getChapter(id, callback) -> undefined
     *  - id (String): Manifest id value for a chapter
     *  - callback (Function): callback function
     *
     *  Finds a chapter text for an id. Replaces image and link URL's, removes
     *  <head> etc. elements. Return only chapters with mime type application/xhtml+xml
     **/
    getChapter(chapterId: string, callback: (error: Error, text?: string) => void): void;
    /**
     *  EPub#getChapterRaw(id, callback) -> undefined
     *  - id (String): Manifest id value for a chapter
     *  - callback (Function): callback function
     *
     *  Returns the raw chapter text for an id.
     **/
    getChapterRaw(chapterId: string, callback: (error: Error, text?: string) => void): void;
    /**
     *  EPub#getImage(id, callback) -> undefined
     *  - id (String): Manifest id value for an image
     *  - callback (Function): callback function
     *
     *  Finds an image for an id. Returns the image as Buffer. Callback gets
     *  an error object, image buffer and image content-type.
     *  Return only images with mime type image
     **/
    getImage(id: string, callback: (error: Error, data?: Buffer, mimeType?: string) => void): void;
    /**
     *  EPub#getFile(id, callback) -> undefined
     *  - id (String): Manifest id value for a file
     *  - callback (Function): callback function
     *
     *  Finds a file for an id. Returns the file as Buffer. Callback gets
     *  an error object, file contents buffer and file content-type.
     **/
    getFile(id: string, callback: (error: Error, data?: Buffer, mimeType?: string) => void): void;
    readFile(filename: any, options: any, callback_: any): void;
}
declare module EPub {
    interface TocElement {
        level: number;
        order: number;
        title: string;
        id: string;
        href?: string;
    }
    interface ISpine {
        contents: ISpineContents;
        toc?: TocElement;
        itemref?: Object[];
    }
    interface ISpineContents {
        [index: number]: Object;
    }
    interface IMetadata {
        publisher?: string;
        language?: string;
        title?: string;
        subject?: string[];
        description?: string;
        creator?: string;
        creatorFileAs?: string;
        date?: string;
        ISBN?: string;
        UUID?: string;
        cover?: any;
        'file-as'?: string;
        'belongs-to-collection'?: string;
        'calibre:series'?: string;
        'collection-type'?: string;
        [key: string]: any;
    }
}
export = EPub;
declare module "epub" {
    interface TocElement {
        level: number;
        order: number;
        title: string;
        id: string;
        href?: string;
    }
    class EPub extends EventEmitter {
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
