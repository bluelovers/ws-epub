/**
 * Created by user on 2018/9/24/024.
 */
import { console } from 'debug-color2';
import { IEpubConfig } from '../config';
import { array_unique } from 'array-hyper-unique';
import shortid = require('shortid');
import hashSum = require('hash-sum');
import moment = require('moment');
import BPromise = require('bluebird');
export { hashSum, shortid };
export { array_unique };
export { moment };
export { console };
export { BPromise };
export declare function htmlPreface<T extends Pick<IEpubConfig, 'infoPreface' | 'infoPrefaceHTML'>>(conf: T): T & Pick<IEpubConfig, 'infoPreface' | 'infoPrefaceHTML'>;
