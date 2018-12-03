/**
 * Created by user on 2018/9/24/024.
 */
import { console } from 'debug-color2';
import { IEpubConfig } from '../config';
export declare function htmlPreface<T extends Pick<IEpubConfig, 'infoPreface' | 'infoPrefaceHTML'>>(conf: T): T & Pick<IEpubConfig, 'infoPreface' | 'infoPrefaceHTML'>;
export { console };
export default console;
