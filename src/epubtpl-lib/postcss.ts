/**
 * Created by user on 2017/12/15/015.
 */

import * as postcss from 'postcss';
import * as autoprefixer from 'autoprefixer';
import * as postcss_epub from 'postcss-epub';
import * as postcssStripInlineComments from 'postcss-strip-inline-comments';
import * as postcssScss from 'postcss-scss';

export { postcss, autoprefixer, postcss_epub, postcssStripInlineComments }

export async function compileCss(css)
{
	let result = await
		postcss([
			postcss_epub,
			autoprefixer({
				add: true,
				remove: false,
				flexbox: false,
			}),
		])
			.process(css, {
				// @ts-ignore
				processors: [
					postcssStripInlineComments,
				],
			})
	;

	//console.log(result);

	//return result.css;
	return result.content;
}

import * as self from './postcss';
export default self;
