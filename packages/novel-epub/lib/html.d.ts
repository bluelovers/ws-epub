/**
 * Created by user on 2019/7/9.
 */
import { IInternalProcessContextOptions } from './types';
export declare function novelImage(src: string, options?: {
    failback?: string;
    attr?: string;
}): string;
export declare function splitTxt(txt: any, plusData?: IInternalProcessContextOptions): string;
export default splitTxt;
