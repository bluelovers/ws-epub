import { ITxtMergeOptions } from '../index';
import { Console } from 'debug-color2';
export declare const console: Console;
export interface ITplData {
    [k: string]: string;
}
export declare function replaceTpl(tpl: string, data: ITplData): string;
export declare function makeDefaultTplData(inputOptions?: Partial<ITxtMergeOptions>, opts?: object): {
    inputOptions: Partial<ITxtMergeOptions>;
    tplBaseData: {
        'tplBannerStart': string;
        'tplVolumeStart': string;
        'tplChapterStart': string;
        'hr01': string;
        'hr02': string;
        'hr11': string;
        'hr12': string;
        'hr13': string;
        'eol': string;
        'eol2': string;
    };
};
