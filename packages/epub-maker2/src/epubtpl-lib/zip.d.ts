/**
 * Created by user on 2017/12/12/012.
 */
/// <reference types="bluebird" />
import JSZip from 'jszip';
import { IFiles, EpubConfig, IEpubConfig } from '../config';
import { EpubMaker } from '../index';
import { BPromise } from '../lib/util';
export { JSZip };
export declare function parseFileSetting(coverUrl: any, epubConfig: IEpubConfig): IFiles;
export declare function addStaticFiles(zip: any, staticFiles: IFiles[]): BPromise<IFiles[]>;
export declare function addFiles(zip: JSZip, epub: EpubMaker, options: any): BPromise<IFiles[]>;
export declare function addCover(zip: JSZip, epub: EpubMaker, options: any): Promise<any>;
export interface IAddSubSectionsCallback {
    (zip: JSZip, section: EpubMaker.Section, epubConfig: EpubConfig, options?: any): any;
}
export declare function addSubSections(zip: JSZip, section: EpubMaker.Section, cb: IAddSubSectionsCallback, epub: EpubMaker, options?: any): any;
declare const _default: typeof import("./zip");
export default _default;
