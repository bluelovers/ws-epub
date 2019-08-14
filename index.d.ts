/**
 * Created by user on 2018/2/7/007.
 */
import * as Promise from 'bluebird';
export declare const IDKEY = "epub";
export interface IOptions {
    outputDir?: string;
    cwd?: string;
    log?: boolean;
    noFirePrefix?: boolean;
    /**
     * 用來強制解決某些目錄錯亂 或者 無法處理多層目錄的問題
     */
    noVolume?: boolean;
}
export declare function epubExtract(srcFile: string, options?: IOptions): Promise<string>;
export declare function fixText(txt: string): string;
export default epubExtract;
