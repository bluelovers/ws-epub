/// <reference types="bluebird" />
/// <reference types="node" />
/**
 * Created by user on 2018/2/1/001.
 */
import * as libEPub from './epub';
import * as Promise from 'bluebird';
export declare class EPub extends libEPub {
    static createAsync(epubfile: string, imagewebroot?: string, chapterwebroot?: string, ...argv: any[]): Promise<EPub>;
    protected _p_method_cb<T>(method: any, options?: Promise.FromNodeOptions, ...argv: any[]): Promise<T>;
    getChapterAsync(chapterId: string): Promise<string>;
    getChapterRawAsync(chapterId: string): Promise<string>;
    getFileAsync(id: string): Promise<[Buffer, string]>;
    getImageAsync(id: string): Promise<[Buffer, string]>;
}
export declare module EPub {
    /**
     * allow change Promise class
     * @type {PromiseConstructor}
     */
    let libPromise: typeof Promise;
}
export default EPub;
