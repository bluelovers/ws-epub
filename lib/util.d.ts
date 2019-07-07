/**
 * Created by user on 2018/2/18/018.
 */
/// <reference types="node" />
import { createUUID } from 'epub-maker2/src/lib/uuid';
import { IMdconfMeta } from 'node-novel-info';
import { Console } from 'debug-color2';
import { IAttachMetaData } from './epub';
export declare const console: Console;
export { createUUID };
export declare function novelImage(src: string): string;
export declare function splitTxt(txt: any, plusData?: {
    attach?: IAttachMetaData;
}): string;
/**
 * 讀取不標準的 mdconf
 */
export declare function parseLowCheckLevelMdconf(data: string | Buffer): IMdconfMeta;
export declare function fsLowCheckLevelMdconf(file: string): IMdconfMeta;
export declare function fsLowCheckLevelMdconfAsync(file: string): Promise<IMdconfMeta>;
