"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const epub_1 = __importDefault(require("./lib/epub"));
module.exports = epub_1.default;
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
//# sourceMappingURL=epub.js.map