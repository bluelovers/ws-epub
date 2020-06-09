/**
 * Created by user on 2018/2/1/001.
 */
/// <reference types="node" />
import * as Promise from 'bluebird';
import * as xml2js from 'xml2js';
import libEPub = require('./epub');
export declare const SYMBOL_RAW_DATA: unique symbol;
export * from './epub';
export declare class EPub extends libEPub {
    static createAsync(epubfile: string, imagewebroot?: string, chapterwebroot?: string, ...argv: any[]): Promise<EPub>;
    protected _p_method_cb<T>(method: any, options?: Promise.FromNodeOptions, ...argv: any[]): Promise<T>;
    getChapterAsync(chapterId: string): Promise<string>;
    getChapterRawAsync(chapterId: string): Promise<string>;
    getFileAsync(id: string): Promise<[Buffer, string]>;
    getImageAsync(id: string): Promise<[Buffer, string]>;
    listImage(): libEPub.TocElement[];
}
export declare module EPub {
    const xml2jsOptions: xml2js.Options;
    /**
     * allow change Promise class
     * @type {PromiseConstructor}
     */
    let libPromise: typeof Promise;
}
export default EPub;
export { SYMBOL_RAW_DATA } from './lib/types';
