/**
 * Created by user on 2018/2/18/018.
 */
import * as Promise from 'bluebird';
import { IOptions } from './lib/txt2epub3';
export declare function novelEpub(options: IOptions): Promise<{
    file: string;
    filename: string;
    epub: import("epub-maker2/src").EpubMaker;
    outputPath: string;
    basename: string;
    ext: string;
}>;
export default novelEpub;
