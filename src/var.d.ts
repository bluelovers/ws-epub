/// <reference types="jszip" />
/**
 * Created by user on 2017/12/12/012.
 */
import { JSZip } from './epubtpl-lib/zip';
import { IEpubConfig } from './config';
import { EpubMaker } from './index';
export { IEpubConfig };
export interface IBuilder {
    make(epub: EpubMaker, options?: any): Promise<JSZip>;
}
export interface IBuilderCallback<T, U> extends Function {
    (zip: T, epubConfig: IEpubConfig, options?: any, ...argv: any[]): Promise<U>;
}
import * as self from './var';
export default self;
