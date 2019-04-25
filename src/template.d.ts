/**
 * Created by user on 2017/12/12/012.
 */
/// <reference types="bluebird" />
import { BPromise } from './lib/util';
import { IBuilder } from './var';
import { EpubMaker } from './index';
import JSZip = require('jszip');
export declare const defaultPath: string;
export declare const defaultList: IList;
export interface IOptions {
    list?: IList;
}
export interface IList {
    'idpf-wasteland': string;
    'lightnovel': string;
    [index: string]: any;
}
export declare class TemplateManagers {
    basePath: string;
    list: IList;
    paths: string[];
    constructor(options?: IOptions);
    value(): IList;
    /**
     *
     * @param {string} key
     * @param {any | string | IBuilder} value
     * @returns {this}
     */
    add<T = any | string | IBuilder>(key: string, value: T): this;
    has<T = any | string | IBuilder>(name: string): T;
    _get(t: any): BPromise<IBuilder>;
    get(name: string): BPromise<IBuilder>;
    exec(name: string, epub: EpubMaker, options?: any): BPromise<JSZip>;
    search(name: string): string;
}
export declare const templateManagers: TemplateManagers;
declare const _default: typeof import("./template");
export default _default;
