/**
 * Created by user on 2018/2/18/018.
 */

import * as Promise from 'bluebird';
import { create, IOptions, getNovelConf, makeFilename, makeOptions, defaultOptions } from './lib/txt2epub3';

export function novelEpub(options: IOptions)
{
	return create(options);
}

export { IOptions, getNovelConf, makeFilename, makeOptions, defaultOptions }

export default novelEpub;
//export default exports;
