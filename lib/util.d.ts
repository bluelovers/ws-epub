/**
 * Created by user on 2018/2/18/018.
 */
/// <reference types="node" />
import { createUUID } from 'epub-maker2/src/lib/uuid';
import { IMdconfMeta } from 'node-novel-info';
import { Console } from 'debug-color2';
export declare const console: Console;
export { createUUID };
export declare function splitTxt(txt: any): string;
/**
 * 讀取不標準的 mdconf
 */
export declare function parseLowCheckLevelMdconf(data: string | Buffer): IMdconfMeta;
export declare function fsLowCheckLevelMdconf(file: string): IMdconfMeta;
export declare function fsLowCheckLevelMdconfAsync(file: string): Promise<IMdconfMeta>;
declare const _default: typeof import("./util");
export default _default;
