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
	let ret = mdconf(data.toString()) as IMdconfMeta;

	ret.novel.preface = (ret.novel.preface
		&& ret.novel.preface.length
		&& Array.isArray(ret.novel.preface)) ?
		ret.novel.preface.join("\n") : ret.novel.preface
	;

	return ret;
}

export default self;
//export default exports;
