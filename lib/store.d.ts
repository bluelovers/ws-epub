/// <reference types="node" />
import * as path from 'path';
import { IAttachMetaData } from './epub';
import { IInternalProcessOptions } from './types';
export interface IEpubStoreValue {
    uuid: string;
    vid: string;
    basePath: string;
    ext: string;
    basename: string;
    value: string;
    isFile: boolean;
    oldExt: string;
    input: string;
}
export interface IEpubStoreOptions {
    vid: string;
    basePath?: string;
    name?: string;
    ext?: string;
    chkExt?(ext: string): boolean;
    failbackExt?: string;
    failbackName?: string;
    cwd: string;
    cwdRoot: string;
}
export declare class EpubStore {
    protected $cache: Map<string, IEpubStoreValue>;
    protected $names: Set<string>;
    protected $exists: WeakSet<IEpubStoreValue>;
    _name(_data: ReturnType<typeof parsePath>, options: IEpubStoreOptions): IEpubStoreValue;
    get(input: string, options: IEpubStoreOptions): IEpubStoreValue;
    add(data: IEpubStoreValue): void;
    exists(data: IEpubStoreValue): boolean;
}
export declare function defaultChkExt(ext: string): boolean;
export declare function isBadName(input: string): boolean;
export declare function isHashedLike(input: string, maxCount?: number): boolean;
export declare function isEncodeURI(input: string, maxCount?: number): boolean;
/**
 *
 * @example console.dir(parsePath(__filename))
 * @example console.dir(parsePath('https://xs.dmzj.com/img/1406/79/a7e62ec50db1db823c61a2127aec9827.jpg'))
 */
export declare function parsePath(input: string, options: IEpubStoreOptions): {
    isFile: true;
    input: string;
    ext: string;
    name: string;
    data: path.ParsedPath;
} | {
    isFile: false;
    input: string;
    ext: string;
    name: string;
    data: import("lazy-url").IURLObject;
};
export interface IHandleAttachFileOptions extends IEpubStoreOptions, IInternalProcessOptions {
}
export declare function handleAttachFile(input: string, plusData?: IHandleAttachFileOptions): {
    ok: false;
    returnPath: string;
    input: string;
    value: string;
    basePath: string;
    isFile: false;
    data: IEpubStoreValue;
} | {
    ok: true;
    returnPath: string;
    input: string;
    value: string;
    basePath: string;
    isFile: boolean;
    data: IEpubStoreValue;
};
export declare function getAttachID(id: string, attach: IAttachMetaData): {
    id: string;
    input: string;
};
