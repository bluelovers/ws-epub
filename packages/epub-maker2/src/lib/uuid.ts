/**
 * Created by user on 2018/9/8/008.
 */

import getUuidByString from 'uuid-by-string';
import uuidv1 from 'uuid/v1';
import { hashSum, shortid } from './util';
import { EpubConfig } from '../config';

export function createUUID(input?: any): string
{
	if (!input)
	{
		input = shortid();
	}
	else if ((input as EpubConfig).title)
	{
		input = hashSum([
			// @ts-ignore
			input.title,
			// @ts-ignore
			input.author,
		]);
	}
	else if (typeof input !== 'string')
	{
		input = hashSum(input);
	}

	return getUuidByString(String(input)).toLowerCase();
}

export default createUUID

