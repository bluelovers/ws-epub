import { IForeachArrayDeepReturn, IReturnRow } from 'node-novel-globby';
import EpubMaker from 'epub-maker2';
import Bluebird = require('bluebird');
import { INovelEpubReturnInfo } from './txt2epub3';
import { IInternalProcessEpubOptions, IInternalProcessVolumeOptions, IResolvableBluebird } from './types';
import { handleMarkdown } from './md';
export declare const SymCache: unique symbol;
export declare const enum EnumPrefixIDType {
    VOLUME = "volume",
    CHAPTER = "chapter",
    IMAGE = "image",
    CONTRIBUTE = "contribute"
}
export declare const enum EnumPrefixIDTitle {
    IMAGE = "\u63D2\u5716",
    CONTRIBUTE = "CONTRIBUTE"
}
export interface IEpubRuntimeReturnCacheVolumeRow {
    vol_key: string;
    dirname: string;
    value: IReturnRow;
}
export declare type IEpubRuntimeReturn = IForeachArrayDeepReturn<IReturnRow, any, {
    stat: INovelEpubReturnInfo["stat"];
}, {
    cache_vol: {
        [vol: string]: number;
    };
    cache_volume_row: IEpubRuntimeReturnCacheVolumeRow[];
    cache_top_subs: {
        [k: string]: Omit<IEpubRuntimeReturnCacheVolumeRow, 'value'>[];
    };
    prev_volume_row?: IEpubRuntimeReturnCacheVolumeRow;
    prev_volume_title: string;
    prev_volume_dir: string;
    count_idx: number;
    count_f: number;
    count_d: number;
    cacheTreeSection: Record<string, EpubMaker.Section>;
    prev_volume?: EpubMaker.Section;
    _new_top_level?: EpubMaker.Section;
    _old_top_level?: EpubMaker.Section;
}>;
export declare function _handleVolume(volume: EpubMaker.Section, dirname: string, _data_: IInternalProcessVolumeOptions): Bluebird<void>;
export declare function makePrefixID(count_idx: number, prefix: EnumPrefixIDType): string;
export declare function makeVolumeID(count_idx: number): string;
export declare function makeChapterID(count_idx: number): string;
export interface IAttachMetaData {
    images: Record<string, string>;
}
export declare function getAttachMeta(dirname: string): Promise<IAttachMetaData>;
export declare function getAttachMetaByRow(row: IReturnRow): Promise<IAttachMetaData>;
export declare function _handleVolumeImage(volume: EpubMaker.Section, dirname: string, _data_: IInternalProcessVolumeOptions): Bluebird<string[]>;
export declare function htmlImage(src: string): string;
export declare function _handleVolumeImageEach(ls: Omit<IEpubRuntimeReturnCacheVolumeRow, 'value'>[], _data_: IInternalProcessVolumeOptions): Bluebird<string[][]>;
export declare function _hookAfterVolume(ls: IEpubRuntimeReturn["temp"]["cache_volume_row"], _data_: IInternalProcessVolumeOptions, afterVolumeTasks: ((volume: EpubMaker.Section, dirname: string, _data_: IInternalProcessVolumeOptions, row: IEpubRuntimeReturnCacheVolumeRow) => IResolvableBluebird<unknown>)[]): Bluebird<{
    index: number;
    row: IEpubRuntimeReturnCacheVolumeRow;
    volume: EpubMaker.Section;
    mapData: {
        index: number;
        fn: (volume: EpubMaker.Section, dirname: string, _data_: IInternalProcessVolumeOptions, row: IEpubRuntimeReturnCacheVolumeRow) => unknown;
        ret: unknown;
    }[];
}[]>;
export declare function _hookAfterEpub(epub: EpubMaker, _data_: IInternalProcessEpubOptions, afterEpubTasks: ((epub: EpubMaker, _data_: IInternalProcessEpubOptions) => IResolvableBluebird<unknown>)[]): Bluebird<{
    epub: EpubMaker;
    mapData: {
        index: number;
        fn: (epub: EpubMaker, _data_: IInternalProcessEpubOptions) => unknown;
        ret: unknown;
    }[];
}>;
export declare function addContributeSection(volume: EpubMaker.Section, dirname: string, _data_: IInternalProcessVolumeOptions, row: IEpubRuntimeReturnCacheVolumeRow): Bluebird<boolean>;
export declare function createContributeSection(options: {
    target: EpubMaker.Section | EpubMaker;
    mdReturn: ReturnType<typeof handleMarkdown>;
    processReturn: Partial<IEpubRuntimeReturn>;
}): EpubMaker.Section;
