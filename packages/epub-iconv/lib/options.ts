/**
 * Created by user on 2019/8/1.
 */
import sortObjectKeys from 'sort-object-keys2/core';
import { IEpubIconvOptions } from './buffer';
import { ITSValueOrArray } from 'ts-type';

export function handleOptions<T extends Partial<IEpubIconvOptions>, U>(opts: T, ...argv: U[]): T & U
{
	let ret = sortObjectKeys(Object.assign({}, opts, ...argv), {
		keys: [
			'cwd',
			'output',
			'iconv',
		]
	}) as T & U;

	if (ret.iconv != 'cn')
	{
		ret.iconv = 'tw';
	}

	return ret;
}

export function handlePattern(pattern: ITSValueOrArray<string>)
{
	if (!Array.isArray(pattern))
	{
		pattern = [pattern];
	}

	return pattern
		.filter(v => v)
		.map(v => v.replace(/\\/g, '/'))
		;
}
