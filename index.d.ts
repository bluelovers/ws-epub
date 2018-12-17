/**
 * Created by user on 2018/2/18/018.
 */
import * as Promise from 'bluebird';
import { IOptions, getNovelConf, makeFilename, makeOptions, defaultOptions } from './lib/txt2epub3';
export declare function novelEpub(options: IOptions): Promise<{
    file: string;
    filename: string;
    epub: import("epub-maker2").EpubMaker;
    outputPath: string;
    basename: string;
    ext: string;
    stat: {
        volume: number;
        chapter: number;
    };
}>;
export { IOptions, getNovelConf, makeFilename, makeOptions, defaultOptions };
export default novelEpub;
