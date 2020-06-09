/**
 * Created by user on 2018/2/18/018.
 */
/// <reference types="node" />
import { createUUID } from 'epub-maker2/src/lib/uuid';
import { IMdconfMeta } from 'node-novel-info';
export { createUUID };
/**
 * 讀取不標準的 mdconf
 */
export declare function parseLowCheckLevelMdconf(data: string | Buffer): IMdconfMeta;
export declare function fsLowCheckLevelMdconf(file: string): IMdconfMeta;
export declare function fsLowCheckLevelMdconfAsync(file: string): Promise<IMdconfMeta>;
export declare function pathAtParent(cwd: string, cwdRoot: string): boolean;
export declare function pathDirNormalize(dir: string): string;
