/**
 * Created by user on 2019/7/31.
 */
/// <reference types="node" />
import JSZip = require('jszip');
import Bluebird = require('bluebird');
import { ITSResolvable } from 'ts-type';
export declare function loadZipBuffer(zipBuffer: ITSResolvable<Buffer>): Bluebird<JSZip>;
export interface IEpubIconvOptions {
    iconv?: 'cn' | 'tw';
}
export declare function handleZipObject(zip: ITSResolvable<JSZip>, options?: IEpubIconvOptions): Bluebird<JSZip>;
export declare function handleZipBuffer(zipBuffer: ITSResolvable<Buffer>, options?: IEpubIconvOptions): Bluebird<Buffer>;
