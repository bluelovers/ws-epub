/**
 * Created by user on 2019/7/10.
 */
/// <reference types="node" />
import JSZip = require('jszip');
import Bluebird = require('bluebird');
import { Console } from 'debug-color2';
export declare const console: Console;
export interface IImages extends Record<string, string> {
}
export interface ICache {
    _attach?: Record<string, {
        images: IImages;
    }>;
}
export interface IFile {
    index: number;
    name: string;
    isDir: boolean;
    title: string;
    innerText: string;
    imgs: IImages;
}
export interface IReturnData {
    zip: JSZip;
    txts: IFile[];
    files: {
        [key: string]: JSZip.JSZipObject;
    };
    cache: ICache;
}
export declare function autoExtract(srcFile: string, setting?: {
    cwd?: string;
}): Bluebird<IReturnData>;
export default autoExtract;
export declare function fixFilename(file: string): string;
export declare function buffer(buf: Buffer, cache?: ICache): Bluebird<IReturnData>;
export declare function files(files: JSZip.JSZipObject[], cache?: ICache): Bluebird<IFile[]>;
export declare function saveAttach(options: IReturnData & {
    cwd: string;
}): Bluebird<void[]>;
export declare function load(file: string, cache?: ICache): Bluebird<IReturnData>;
export declare function padNum(n: string | number): string;
export declare function saveTxt(options: IReturnData & {
    cwd: string;
}): Bluebird<string[]>;
export declare function fixHtml(html: string): string;
