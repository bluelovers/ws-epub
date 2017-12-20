/**
 * Created by user on 2017/12/20/020.
 */

import * as mdconf from 'mdconf';
import * as self from './mdconf';

export interface IMdconfMeta
{
	novel: {
		title: string,
		author: string,
		cover: string,
		preface: string,
		tags: string[],
	},

	contribute: string[],
}

export { mdconf }

export function mdconf_meta(data): IMdconfMeta
{
	return mdconf(data.toString()) as IMdconfMeta;
}

export default self;
//export default exports;
