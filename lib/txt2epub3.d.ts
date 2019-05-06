/**
 * Created by user on 2017/12/16/016.
 */
import EpubMaker from 'epub-maker2';
import { IMdconfMeta } from 'node-novel-info';
import { console } from './util';
import { EnumEpubConfigVertical } from 'epub-maker2/src/config';
import Bluebird = require('bluebird');
import moment = require('moment');
import novelGlobby = require('node-novel-globby/g');
export { console };
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
    novelConf?: unknown;
    epubTemplate?: unknown;
    epubLanguage?: string;
    padEndDate?: boolean;
    globbyOptions?: novelGlobby.IOptions;
    useTitle?: boolean;
    filenameLocal?: boolean | string[] | string;
    noLog?: boolean;
    vertical?: boolean | EnumEpubConfigVertical;
}
export declare const defaultOptions: Partial<IOptions>;
export declare function getNovelConf(options: IOptions, cache?: {}): Bluebird<IMdconfMeta>;
export declare function makeOptions(options: IOptions): IOptions;
export interface INovelEpubReturnInfo {
    file: string;
    filename: string;
    epub: EpubMaker;
    outputPath: string;
    basename: string;
    ext: string;
    stat: {
        volume: number;
        chapter: number;
        image: number;
    };
}
export declare function create(options: IOptions, cache?: {}): Bluebird<INovelEpubReturnInfo>;
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
