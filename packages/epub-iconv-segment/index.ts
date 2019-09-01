/**
 * Created by user on 2019/9/1.
 */
import { handleGlob } from 'epub-iconv/lib';
import { IEpubIconvGlobOptions } from 'epub-iconv/lib/glob';
import { ITSResolvable, ITSValueOrArray } from 'ts-type';
import Bluebird = require('bluebird');
import { textSegment, stringify } from 'novel-segment-cli';
import { cn2tw_min, tw2cn_min } from 'cjk-conv/lib/zh/convert/min';

async function stringifySegment(input: string)
{
	return stringify(await textSegment(input))
}

export function handleGlobSegment(pattern: ITSResolvable<ITSValueOrArray<string>>, options?: IEpubIconvGlobOptions)
{
	return handleGlob(pattern, {
		...options,
		iconvFn: {
			async tw(input)
			{
				return stringifySegment(input).then(v => cn2tw_min(v, {
					safe: false
				}))
			},
			async cn(input)
			{
				return stringifySegment(input).then(v => tw2cn_min(v))
			},
		}
	})
}

export default handleGlobSegment