/**
 * Created by user on 2019/7/31.
 */
/// <reference types="node" />
import { ITSResolvable, ITSValueOrArray } from 'ts-type';
import { IEpubIconvOptions } from './buffer';
import Bluebird = require('bluebird');
export interface IEpubIconvGlobOptions extends IEpubIconvOptions {
    cwd?: string;
    output?: string;
    showLog?: boolean;
}
export declare function _toArray(pattern: ITSValueOrArray<string>): string[];
export declare function handleGlob(pattern: ITSResolvable<ITSValueOrArray<string>>, options?: IEpubIconvGlobOptions): Bluebird<{
    output_path: string;
    root: string;
    file: string;
    fullpath: string;
    buffer: Buffer;
}[]>;
