/**
 * Created by user on 2017/12/15/015.
 */

import postcss from 'postcss';
import autoprefixer from 'autoprefixer';
import postcss_epub from 'postcss-epub';
import postcssStripInlineComments from 'postcss-strip-inline-comments';

import postcssScss from 'postcss-scss';

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
				from: undefined,
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

export default exports as typeof import('./postcss');
