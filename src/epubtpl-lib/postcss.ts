/**
 * Created by user on 2017/12/15/015.
 */

import * as postcss from 'postcss';
import * as autoprefixer from 'autoprefixer';
import * as postcss_epub from 'postcss-epub';

export { postcss, autoprefixer, postcss_epub }

export async function compileCss(css)
{
	let result = await
		postcss([
			postcss_epub,
			autoprefixer({
				add: true,
				remove: false,
				flexbox: false,
			})
		])
			.process(css)
	;

	return result.css;
}

import * as self from './postcss';
export default self;
