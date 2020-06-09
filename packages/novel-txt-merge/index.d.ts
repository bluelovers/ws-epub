/**
 * Created by user on 2018/1/28/028.
 */
import { IArrayDeepInterface, IReturnRow } from 'node-novel-globby';
import BluebirdPromise from 'bluebird';
import { IMdconfMeta } from 'node-novel-info';
import { IForeachArrayDeepReturn } from 'node-novel-globby/lib/util';
import { EnumTxtStyle } from './lib/tpl';
import { makeDefaultTplData } from './lib/index';
export declare type ITxtRuntimeReturn = IForeachArrayDeepReturn<IReturnRow, any, {
    toc: string[];
    context: string[];
}, {
    cache_vol: {
        [vol: string]: number;
    };
    prev_volume_title: string;
    count_idx: number;
    count_f: number;
    count_d: number;
}>;
export interface ITxtMergeOptions {
    inputPath: string;
    outputPath: string;
    outputFilename?: string;
    noSave?: boolean;
    /**
     * 檔案開頭
     */
    tplBannerStart?: string;
    /**
     * 章 風格
    */
    tplVolumeStart?: string;
    /**
     * 話 風格
     */
    tplChapterStart?: string;
    /**
     * 分隔線 章 開始
     */
    hr01?: string;
    /**
     * 分隔線 章
     */
    hr02?: string;
    /**
     * 分隔線 話 開始
     */
    hr11?: string;
    /**
     * 分隔線 話 內文
     */
    hr12?: string;
    /**
     * 分隔線 話 結束
     */
    hr13?: string;
    /**
     * 預設風格
     */
    txtStyle?: EnumTxtStyle;
    inputConfigPath?: string;
}
/**
 *
 * @param inputPath 輸入路徑
 * @param outputPath 輸出路徑
 * @param outputFilename 參考用檔案名稱
 * @param noSave 不儲存檔案僅回傳 txt 內容
 */
export declare function txtMerge(inputOptions?: Partial<ITxtMergeOptions>): BluebirdPromise<{
    filename: string;
    fullpath: string;
    data: string;
}>;
export declare function txtMerge(inputPath: string, inputOptions?: Partial<ITxtMergeOptions>): BluebirdPromise<{
    filename: string;
    fullpath: string;
    data: string;
}>;
export declare function txtMerge(inputPath: string, outputPath: string, inputOptions?: Partial<ITxtMergeOptions>): BluebirdPromise<{
    filename: string;
    fullpath: string;
    data: string;
}>;
export declare function txtMerge(inputPath: string, outputPath: string, outputFilename?: string, inputOptions?: Partial<ITxtMergeOptions>): BluebirdPromise<{
    filename: string;
    fullpath: string;
    data: string;
}>;
export declare function txtMerge(inputPath: string, outputPath: string, outputFilename?: string, noSave?: boolean, inputOptions?: Partial<ITxtMergeOptions>): BluebirdPromise<{
    filename: string;
    fullpath: string;
    data: string;
}>;
export declare function getMetaTitles(meta: IMdconfMeta): string[];
/**
 * 回傳處理後的檔案名稱
 */
export declare function makeFilename(meta?: IMdconfMeta, outputFilename?: string, a?: string[], _ls?: IArrayDeepInterface<IReturnRow>, _argv?: {
    TXT_PATH?: string;
    processReturn?: ITxtRuntimeReturn;
    inputOptions?: ReturnType<typeof makeDefaultTplData>["inputOptions"];
    tplBaseData?: ReturnType<typeof makeDefaultTplData>["tplBaseData"];
}): string;
export default txtMerge;
