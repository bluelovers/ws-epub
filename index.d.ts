/// <reference types="bluebird" />
import * as Promise from 'bluebird';
export declare const IDKEY = "epub";
export interface IOptions {
    outputDir?: string;
    cwd?: string;
    log?: boolean;
    noFirePrefix?: boolean;
}
export declare function epubExtract(srcFile: string, options?: IOptions): Promise<string>;
export default epubExtract;
