import EpubMaker from 'epub-maker2';
import * as Promise from 'bluebird';
import * as novelGlobby from 'node-novel-globby';
import { IMdconfMeta } from 'node-novel-info';
export interface IOptions {
    /**
     * 小說 txt 的主資料夾路徑
     * @type {string}
     */
    inputPath: string;
    outputPath: string;
    /**
     * 小說名稱ID
     */
    novelID?: string;
    filename?: string;
    novelConf?: any;
    epubTemplate?: any;
    epubLanguage?: string;
    padEndDate?: boolean;
    globbyOptions?: novelGlobby.IOptions;
    useTitle?: boolean;
}
export declare const defaultOptions: Partial<IOptions>;
export declare function getNovelConf(options: IOptions, cache?: {}): Promise<IMdconfMeta>;
export declare function create(options: IOptions, cache?: {}): Promise<{
    file: string;
    filename: string;
    epub: EpubMaker;
}>;
export default create;
