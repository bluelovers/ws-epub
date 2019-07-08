import { IForeachArrayDeepReturn, IReturnRow } from 'node-novel-globby';
import EpubMaker from 'epub-maker2';
import Bluebird = require('bluebird');
import { INovelEpubReturnInfo, IOptions } from './txt2epub3';
import { EpubStore } from './store';
export declare const SymCache: unique symbol;
export declare const enum EnumPrefixIDType {
    VOLUME = "volume",
    CHAPTER = "chapter",
    IMAGE = "image"
}
export declare const enum EnumPrefixIDTitle {
    IMAGE = "\u63D2\u5716"
}
export declare type IEpubRuntimeReturn = IForeachArrayDeepReturn<IReturnRow, any, {
    stat: INovelEpubReturnInfo["stat"];
}, {
    cache_vol: {
        [vol: string]: number;
    };
    cache_volume_row: {
        vol_key: string;
        dirname: string;
        value?: IReturnRow;
    }[];
    cache_top_subs: {
        [k: string]: {
            vol_key: string;
            dirname: string;
        }[];
    };
    prev_volume_row?: {
        vol_key: string;
        dirname: string;
        value: IReturnRow;
    };
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
export declare function _handleVolume(volume: EpubMaker.Section, dirname: string, _data_: {
    processReturn: Partial<IEpubRuntimeReturn>;
    epub: EpubMaker;
}): Bluebird<void>;
export declare function makePrefixID(count_idx: number, prefix: EnumPrefixIDType): string;
export declare function makeVolumeID(count_idx: number): string;
export declare function makeChapterID(count_idx: number): string;
export interface IAttachMetaData {
    images: Record<string, string>;
}
export declare function getAttachMeta(dirname: string): Promise<IAttachMetaData>;
export declare function getAttachMetaByRow(row: IReturnRow): Promise<IAttachMetaData>;
export declare function _handleVolumeImage(volume: EpubMaker.Section, dirname: string, _data_: {
    processReturn: Partial<IEpubRuntimeReturn>;
    epub: EpubMaker;
    epubOptions: IOptions;
    store: EpubStore;
}): Bluebird<string[]>;
export declare function htmlImage(src: string): string;
export declare function _handleVolumeImageEach(ls: IEpubRuntimeReturn["temp"]["cache_volume_row"], _data_: {
    processReturn: Partial<IEpubRuntimeReturn>;
    epub: EpubMaker;
    epubOptions: IOptions;
    store: EpubStore;
}): Bluebird<string[][]>;
