import fetch = require('isomorphic-fetch');
import { IFiles } from '../config';
export { fetch };
export declare function fetchFile(file: IFiles, ...argv: any[]): Promise<IFiles>;
export default fetch;
