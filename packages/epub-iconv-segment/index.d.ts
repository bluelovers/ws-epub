/// <reference types="node" />
import { IEpubIconvGlobOptions } from 'epub-iconv/lib/glob';
import { ITSResolvable, ITSValueOrArray } from 'ts-type';
import Bluebird from 'bluebird';
export declare function handleGlobSegment(pattern: ITSResolvable<ITSValueOrArray<string>>, options?: IEpubIconvGlobOptions): Bluebird<{
    output_path: string;
    root: string;
    file: string;
    fullpath: string;
    buffer: Buffer;
}[]>;
export default handleGlobSegment;
