/**
 * Created by user on 2018/3/17/017.
 */

import { minify } from 'html-minifier';

export function fixHtml(html): string
{
	return minify(html, {
		collapseWhitespace: true,
		preserveLineBreaks: true,
		conservativeCollapse: true,
		caseSensitive: true,
	})
		.replace(/(?<=<br\/?>)(?!\s*[\r\n])/ig, '\n')
		.replace(/(?<=<\/p>)(?!\s*[\r\n])/ig, '\n')
		;
}

export default fixHtml;
