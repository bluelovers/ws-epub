/// <reference types="bluebird" />
/// <reference types="node" />
import { EpubConfig, IEpubConfig, ICover, IRightsConfig, ICollection, EnumEpubConfigVertical } from './config';
import JSZip = require('jszip');
import { shortid, hashSum, BPromise } from './lib/util';
export { shortid, hashSum };
export declare function slugify(input: string, ...argv: any[]): string;
export declare function slugifyWithFallback(input: string, ...argv: any[]): string;
export declare class EpubMaker {
    epubConfig: EpubConfig;
    constructor(options?: {}, config?: IEpubConfig);
    static create(options?: any, ...argv: any[]): EpubMaker;
    withUuid(uuid: string): this;
    withTemplate(templateName: any): this;
    slugify(input: string, ...argv: any[]): string;
    slugifyWithFallback(input: string, ...argv: any[]): string;
    withTitle(title: string, title_short?: string): this;
    addTitles(titles: string[]): this;
    withLanguage(lang: string): this;
    readonly lang: string;
    withAuthor(fullName: string, url?: string): this;
    addAuthor(fullName: string, url?: string): this;
    addAuthor(fullName: string[]): this;
    addAuthor(fullName: {
        [key: string]: string;
    }): this;
    withPublisher(publisher: string): this;
    withCollection(data: ICollection): this;
    withSeries(name: string, position?: number): void;
    withModificationDate(modificationDate: any, ...argv: any[]): this;
    withRights(rightsConfig: IRightsConfig): this;
    withCover(coverUrl: string | ICover, rightsConfig?: IRightsConfig): this;
    withAttributionUrl(attributionUrl: any): this;
    withStylesheetUrl(stylesheetUrl: any, replaceOriginal?: boolean): this;
    /**
     * 用來檢查 Section 是否已經加入
     */
    hasSection(section: EpubMaker.Section): boolean;
    withSection(section: EpubMaker.Section): this;
    withAdditionalFile(fileUrl: any, folder: any, filename: any): this;
    withOption(key: string, value: any): this;
    withInfoPreface(str: string): this;
    addIdentifier(type: string, id?: string): this;
    addLinks(links: any, rel?: string): this;
    addTag(tag: any): this;
    setPublicationDate(new_data?: any): this;
    setVertical(vertical?: boolean | EnumEpubConfigVertical): this;
    getFilename(useTitle?: boolean, noExt?: boolean): string;
    vaild(): string[];
    build(options?: any): BPromise<JSZip>;
    /**
     * for node.js
     *
     * @param options
     * @returns {Promise<T>}
     */
    makeEpub<T = Buffer | Blob>(options?: any): Promise<T | any | Buffer | Blob>;
}
export interface ISectionConfig {
    lang?: string;
}
export interface ISectionContent {
    title?: string;
    content?: string;
    renderTitle?: boolean;
    cover?: {
        name?: string;
        url?: string;
    };
}
export interface ISlugify {
    (input: string, ...argv: any[]): string;
}
export declare namespace EpubMaker {
    let defaultExt: string;
    let dateFormat: string;
    const epubtypes: any;
    let libSlugify: ISlugify;
    /**
     * @epubType Optional. Allows you to add specific epub type content such as [epub:type="titlepage"]
     * @id Optional, but required if section should be included in toc and / or landmarks
     * @content Optional. Should not be empty if there will be no subsections added to this section. Format: { title, content, renderTitle }
     */
    class Section {
        _EpubMaker_: EpubMaker;
        epubType: any;
        id: any;
        content: ISectionContent;
        includeInToc: boolean;
        includeInLandmarks: boolean;
        subSections: Section[];
        sectionConfig: ISectionConfig;
        parentSection: Section;
        parentEpubMaker: EpubMaker;
        constructor(epubType: any, id: any, content: any, includeInToc?: boolean, includeInLandmarks?: boolean, ...argv: any[]);
        /**
         *
         * @param {ISectionContent|string} content
         * @param {boolean} allow_null
         * @returns {this}
         */
        setContent(content: ISectionContent, allow_null?: boolean): this;
        readonly epubTypeGroup: any;
        readonly lang: string;
        readonly langMain: string;
        static create(epubType: any, id: any, content: any, includeInToc: boolean, includeInLandmarks: boolean, ...argv: any[]): Section;
        /**
         * 用來檢查 Section 是否已經加入
         */
        hasSubSection(subsection: Section): boolean;
        withSubSection(subsection: Section): this;
        collectToc(): Section[];
        collectLandmarks(): Section[];
        collectSections(section: Section, prop: string): Section[];
    }
}
export default EpubMaker;
