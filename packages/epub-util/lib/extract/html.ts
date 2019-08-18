import { minify } from 'html-minifier';
import { crlf } from 'crlf-normalize';

export function fixHtml(html: string): string
{
	let options = {
		collapseWhitespace: true,
		preserveLineBreaks: true,
		conservativeCollapse: true,
		caseSensitive: true,
	};

	return minify(minify(crlf(html), options)
		.replace(/(?<=<br\/?>)(?!\s*[\r\n])/ig, '\n')
		.replace(/(?<=<\/p>)(?!\s*[\r\n])/ig, '\n')
		, options);
}

export function fixHtml2(html: string)
{
	try
	{
		return fixHtml(html)
	}
	catch (e)
	{
		console.warn((e as Error).message)
	}

	return html
}

export default fixHtml