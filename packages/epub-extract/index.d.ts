/**
 * Created by user on 2018/2/7/007.
 */
/// <reference types="cheerio" />
import Promise from 'bluebird';
import { fixText } from '@node-novel/epub-util/lib/extract/text';
export declare const IDKEY = "epub";
export interface IOptions {
    outputDir?: string;
    cwd?: string;
    /**
     * print log message
     */
    log?: boolean;
    noFirePrefix?: boolean;
    /**
     * 用來強制解決某些目錄錯亂 或者 無法處理多層目錄的問題
     */
    noVolume?: boolean;
}
export declare function epubExtract(srcFile: string, options?: IOptions): Promise<string>;
export declare function getCheerio(doc: string): CheerioStatic;
export { fixText };
export default epubExtract;
