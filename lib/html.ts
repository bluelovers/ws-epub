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
	});
}

export default fixHtml;
