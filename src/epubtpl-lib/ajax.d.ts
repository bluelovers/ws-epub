import fetch = require('isomorphic-fetch');
import { IFiles } from '../config';
export { fetch };
/**
 * 處理附加檔案 本地檔案 > url
 */
export declare function fetchFile(file: IFiles, ...argv: any[]): Promise<IFiles>;
export default fetch;
