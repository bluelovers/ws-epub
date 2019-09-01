/**
 * Created by user on 2019/7/31.
 */
/// <reference types="node" />
import JSZip = require('jszip');
import Bluebird = require('bluebird');
import { ITSResolvable } from 'ts-type';
import { cn2tw_min, tw2cn_min } from 'cjk-conv/lib/zh/convert/min';
export declare function loadZipBuffer(zipBuffer: ITSResolvable<Buffer>): Bluebird<JSZip>;
export declare type IIconvFn = ((input: string) => ITSResolvable<string>) | typeof cn2tw_min | typeof tw2cn_min;
export interface IEpubIconvOptions {
    iconv?: 'cn' | 'tw';
    iconvFn?: {
        'cn'?: IIconvFn;
        'tw'?: IIconvFn;
    };
}
export declare function handleZipObject(zip: ITSResolvable<JSZip>, options?: IEpubIconvOptions): Bluebird<JSZip>;
export declare function handleZipBuffer(zipBuffer: ITSResolvable<Buffer>, options?: IEpubIconvOptions): Bluebird<Buffer>;
