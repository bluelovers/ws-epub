/**
 * Created by user on 2018/2/18/018.
 */
import Bluebird from 'bluebird';
import { IOptions, getNovelConf, makeFilename, makeOptions, defaultOptions, INovelEpubReturnInfo } from './lib/txt2epub3';
export declare function novelEpub(options: IOptions): Bluebird<INovelEpubReturnInfo>;
export { IOptions, getNovelConf, makeFilename, makeOptions, defaultOptions };
export default novelEpub;
