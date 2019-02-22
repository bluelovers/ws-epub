import { EpubMaker, ISlugify } from './index';
import { moment } from './lib/util';
export interface ICover extends IFiles {
    rights?: IRightsConfig;
}
export interface IStylesheet extends IFiles {
    styles?: string;
    replaceOriginal?: boolean;
}
export interface IRightsConfig {
    description?: string;
    license?: string;
}
export interface IFiles {
    url?: string;
    file?: string;
    folder?: string;
    name?: string;
    basename?: string;
    ext?: string;
    mime?: string;
    data?: any;
    is?: string;
    href?: string;
}
export interface ICollection {
    name?: string;
    type?: string;
    position?: number;
}
export interface IEpubConfig {
    uuid?: string;
    templateName?: string;
    filename?: string;
    title?: string;
    title_short?: string;
    titles?: string[];
    slug?: string;
    lang?: string;
    author?: string;
    authorUrl?: string;
    authors?: {
        [index: string]: string;
    };
    authorsJSON?: string;
    publisher?: string;
    rights?: IRightsConfig;
    cover?: ICover;
    cwd?: string;
    identifiers?: string[];
    attributionUrl?: string;
    stylesheet?: IStylesheet;
    sections?: EpubMaker.Section[];
    toc?: EpubMaker.Section[];
    landmarks?: EpubMaker.Section[];
    options?: any;
    additionalFiles?: IFiles[];
    modification?: moment.Moment;
    modificationDate?: string;
    modificationDateYMD?: string;
    publication?: moment.Moment;
    publicationDate?: string;
    publicationDateYMD?: string;
    /**
     * <meta property="belongs-to-collection" id="id-2">黒の魔王WEB</meta>
     * <meta refines="#id-2" property="collection-type">series</meta>
     * <meta refines="#id-2" property="group-position">1</meta>
     */
    collection?: ICollection;
    /**
     * <dc:subject>
     */
    tags?: string[];
    infoPreface?: string;
    infoPrefaceHTML?: string;
    links?: EpubMetaLink[];
    vertical?: boolean | EnumEpubConfigVertical;
}
export declare enum EnumEpubConfigVertical {
    NONE = 0,
    VERTICAL_RL = 1
}
export interface EpubMetaLink {
    href: string;
    rel: string;
    id?: string;
    refines: string;
    'media-type': string;
}
export declare class EpubConfig implements IEpubConfig {
    uuid?: string;
    templateName?: string;
    filename?: string;
    title?: string;
    title_short?: string;
    titles?: string[];
    slug?: string;
    lang?: string;
    author?: string;
    authorUrl?: string;
    authors?: {
        [index: string]: string;
    };
    authorsJSON?: string;
    publisher?: string;
    rights?: IRightsConfig;
    cover?: ICover;
    cwd?: string;
    identifiers?: string[];
    attributionUrl?: string;
    stylesheet?: IStylesheet;
    sections?: EpubMaker.Section[];
    toc?: EpubMaker.Section[];
    landmarks?: EpubMaker.Section[];
    options?: {
        libSlugify?: ISlugify;
        ext?: string;
        generateOptions?: any;
    };
    additionalFiles?: IFiles[];
    modification?: moment.Moment;
    modificationDate?: string;
    modificationDateYMD?: string;
    publication?: moment.Moment;
    publicationDate?: string;
    publicationDateYMD?: string;
    /**
     * <meta property="belongs-to-collection" id="id-2">黒の魔王WEB</meta>
     * <meta refines="#id-2" property="collection-type">series</meta>
     * <meta refines="#id-2" property="group-position">1</meta>
     */
    collection?: ICollection;
    /**
     * <dc:subject>
     */
    tags?: string[];
    infoPreface?: string;
    infoPrefaceHTML?: string;
    links?: EpubMetaLink[];
    /**
     * 輸出成 直排
     */
    vertical?: boolean | EnumEpubConfigVertical;
    constructor(epubConfig?: IEpubConfig, options?: any);
    readonly langMain: string;
    subjects: string[];
    setModification(val: any, ...argv: any[]): this;
    setPublication(val: any, ...argv: any[]): this;
    addAuthor(name: string, url?: string): this;
    addLink(data: EpubMetaLink | string, rel?: string): this;
    /**
     * isbn:xxx
     * calibre:xxx
     * uuid:xxx
     *
     * @param {string} type
     * @param {string} id
     * @returns {this}
     */
    addIdentifier(type: string, id?: string): this;
    setVertical(vertical?: boolean | EnumEpubConfigVertical): this;
    $clone(): any;
    static $create(epubConfig?: IEpubConfig, options?: any): EpubConfig;
    $auto(): this;
    entries(auto?: boolean): IEpubConfig;
    toJSON(auto?: boolean, replacer?: any, space?: string): string;
    toArray(auto?: boolean): any;
}
export declare namespace EpubConfig {
    let dateFormat: string;
    function getDefaultEpubConfig(): {
        toc: any[];
        landmarks: any[];
        sections: any[];
        stylesheet: {};
        additionalFiles: any[];
        options: {};
    };
    let defaultEpubConfig: {
        toc: any[];
        landmarks: any[];
        sections: any[];
        stylesheet: {};
        additionalFiles: any[];
        options: {};
    };
}
declare const _default: EpubConfig;
export default _default;
