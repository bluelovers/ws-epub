/**
 * Created by user on 2018/2/18/018.
 */
import * as Promise from 'bluebird';
import { IOptions, getNovelConf, makeFilename, makeOptions, defaultOptions } from './lib/txt2epub3';
export declare function novelEpub(options: IOptions): Promise<import("./lib/txt2epub3").INovelEpubReturnInfo>;
export { IOptions, getNovelConf, makeFilename, makeOptions, defaultOptions };
export default novelEpub;
