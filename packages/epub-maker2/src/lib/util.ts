/**
 * Created by user on 2018/9/24/024.
 */

import { console } from 'debug-color2';
import { crlf } from 'crlf-normalize';
import { IEpubConfig } from '../config';
import { array_unique } from 'array-hyper-unique';

import shortid from 'shortid';
import hashSum from 'hash-sum';
import moment from 'moment';
import BPromise from 'bluebird';

export { hashSum, shortid }
export { array_unique }
export { moment }
export { console }

export { BPromise }

export function htmlPreface<T extends Pick<IEpubConfig, 'infoPreface' | 'infoPrefaceHTML'>>(conf: T): T & Pick<IEpubConfig, 'infoPreface' | 'infoPrefaceHTML'>
{
	if (conf.infoPreface)
	{
		conf.infoPreface = crlf(conf.infoPreface)
			.replace(/[\uFEFF]+/g, '')
			.replace(/[ \t\xA0　]+$/gm, '')
		;

		conf.infoPrefaceHTML = conf.infoPrefaceHTML || conf.infoPreface.replace(/\n/g, '<br/>');
	}

	return conf;
}

