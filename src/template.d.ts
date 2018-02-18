import * as Promise from 'bluebird';
import { IBuilder } from './var';
import { EpubMaker } from './index';
export declare const defaultPath: string;
export declare const defaultList: self.IList;
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
    list: self.IList;
    paths: string[];
    constructor(options?: IOptions);
    value(): self.IList;
    /**
     *
     * @param {string} key
     * @param {any | string | IBuilder} value
     * @returns {this}
     */
    add<T = any | string | IBuilder>(key: string, value: T): this;
    has<T = any | string | IBuilder>(name: string): T;
    _get(t: any): Promise<IBuilder>;
    get(name: string): Promise<IBuilder>;
    exec(name: string, epub: EpubMaker, options?: any): Promise<any>;
    search(name: string): string;
}
export declare const templateManagers: self.TemplateManagers;
import * as self from './template';
export default self;
