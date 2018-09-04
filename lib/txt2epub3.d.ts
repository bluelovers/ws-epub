/**
 * Created by user on 2017/12/16/016.
 */
import EpubMaker from 'epub-maker2';
import Promise = require('bluebird');
import * as moment from 'moment';
import * as novelGlobby from 'node-novel-globby';
import { IMdconfMeta } from 'node-novel-info';
import { Console } from 'debug-color2';
export declare const console: Console;
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
    filenameLocal?: boolean | string[] | string;
    noLog?: boolean;
}
export declare const defaultOptions: Partial<IOptions>;
export declare function getNovelConf(options: IOptions, cache?: {}): Promise<IMdconfMeta>;
export declare function makeOptions(options: IOptions): any;
export declare function create(options: IOptions, cache?: {}): Promise<{
    file: string;
    filename: string;
    epub: EpubMaker;
    outputPath: string;
    basename: string;
    ext: string;
}>;
export declare function makeFilename(options: IOptions, epub: EpubMaker, meta: IMdconfMeta): {
    file: string;
    ext: string;
    filename: string;
    options: IOptions;
    now: moment.Moment;
    basename: string;
    epub: EpubMaker;
    meta: IMdconfMeta;
};
export default create;
