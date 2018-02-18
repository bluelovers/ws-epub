/// <reference types="jszip" />
/**
 * Created by user on 2017/12/12/012.
 */
import * as JSZip from 'jszip';
import { IFiles, IEpubConfig } from '../config';
import { EpubMaker } from '../index';
export { JSZip };
export declare function parseFileSetting(coverUrl: any, epubConfig: IEpubConfig): IFiles;
export declare function addStaticFiles(zip: any, staticFiles: IFiles[]): Promise<any>;
export declare function addFiles(zip: JSZip, epub: EpubMaker, options: any): Promise<any>;
export declare function addCover(zip: JSZip, epub: EpubMaker, options: any): Promise<string | false>;
export declare function addSubSections(zip: JSZip, section: EpubMaker.Section, cb: any, epub: EpubMaker, options?: any): Promise<any>;
import * as self from './zip';
export default self;
