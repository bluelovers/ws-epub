/**
 * Created by user on 2018/2/18/018.
 */

import Bluebird from 'bluebird';
import {
	create,
	IOptions,
	getNovelConf,
	makeFilename,
	makeOptions,
	defaultOptions,
	INovelEpubReturnInfo,
} from './lib/txt2epub3';

export function novelEpub(options: IOptions)
{
	return create(options);
}

export { IOptions, getNovelConf, makeFilename, makeOptions, defaultOptions }

export default novelEpub;
