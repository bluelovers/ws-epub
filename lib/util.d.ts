/**
 * Created by user on 2018/2/18/018.
 */
/// <reference types="node" />
import { createUUID } from 'epub-maker2/src/lib/uuid';
export { createUUID };
/**
 * 讀取不標準的 mdconf
 */
export declare function parseLowCheckLevelMdconf(data: string | Buffer): import("node-novel-info").IMdconfMeta;
export declare function fsLowCheckLevelMdconf(file: string): import("node-novel-info").IMdconfMeta;
export declare function fsLowCheckLevelMdconfAsync(file: string): Promise<import("node-novel-info").IMdconfMeta>;
