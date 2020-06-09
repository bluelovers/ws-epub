/// <reference types="bluebird" />
/// <reference types="jszip" />
import { JSZip } from '../../epubtpl-lib/zip';
import { IBuilder } from '../../var';
import { EpubMaker } from '../../index';
import { BPromise } from '../../lib/util';
export declare const EPUB_TEMPLATES_PATH: string;
export declare const EPUB_TEMPLATES_TPL: string;
declare module '../../index' {
    namespace EpubMaker {
        interface Section {
            needPage: boolean;
            name: string;
            rank: number | string;
        }
    }
}
export declare namespace Builder {
    let templates: {
        opf: string;
        ncx: string;
        nav: string;
        css: string;
        content: string;
        autoToc: string;
        sectionsNavTemplate: string;
        sectionsNCXTemplate: string;
        sectionsOPFManifestTemplate: string;
        sectionsOPFSpineTemplate: string;
        coverPage: string;
        tableOfContents: string;
        sectionsInfo: string;
        sectionsScript: string;
        contents: string;
    };
    let staticFiles: {
        mimetype: string;
        'META-INF/container.xml': string;
    };
    function make(epub: EpubMaker, options?: any): BPromise<JSZip>;
    function addStaticFiles(zip: any, epub: EpubMaker, options: any): BPromise<import("@node-novel/fetch-file-or-url").IFiles[]>;
    function tableOfContents(zip: any, epub: EpubMaker, options: any): Promise<void>;
    function addCover(zip: any, epub: EpubMaker, options: any): Promise<void>;
    function addInfoSection(section: any, titlePrefix?: any, namePrefix?: any): void;
    function addAditionalInfo(zip: any, epub: EpubMaker, options: any): void;
    function addManifestOpf(zip: any, epub: EpubMaker, options: any): void;
    function addEpub2Nav(zip: any, epub: EpubMaker, options: any): void;
    function addEpub3Nav(zip: any, epub: EpubMaker, options: any): void;
    function addStylesheets(zip: any, epub: EpubMaker, options: any): Promise<any>;
    function addSection(zip: JSZip, section: EpubMaker.Section, epub: EpubMaker, options: any): any;
    function addContent(zip: any, epub: EpubMaker, options: any): BPromise<any[]>;
}
export declare const builder: IBuilder;
declare const _default: IBuilder;
export default _default;
