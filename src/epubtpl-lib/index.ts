/**
 * Created by user on 2017/12/15/015.
 */

import { html_beautify } from 'js-beautify';
import { minify, Options as IMinifyOptions } from 'html-minifier';

export function formatHTML(htmlstr, skipFormatting?: boolean): string
{
	if (skipFormatting || typeof html_beautify === 'undefined')
	{
		return htmlstr;
	}

	return htmlminify(htmlstr)
		//.replace(/<item id="" href="image\/" media-type="" \/>/ig, '')
		.replace(/^\n+|\n+$/, '\n')
	;
}

export function htmlminify(html: string, options: IMinifyOptions = {})
{
	options = Object.assign({
		collapseWhitespace: true,
		preserveLineBreaks: true,
		conservativeCollapse: true,
		caseSensitive: true,
		keepClosingSlash: true,

		ignoreCustomFragments: [
			/\<\/[ \t]*meta\>/i,
		],
	}, options);

	try
	{
		let ret = minify(html, options);

		return ret;
	}
	catch (e)
	{
		try
		{
			let ret = html_beautify(html, {
				end_with_newline: true,
				indent_char: '',
				indent_inner_html: false,
				indent_size: 0,
				indent_level: 0,
				max_preserve_newlines: 1,
				preserve_newlines: true,
				wrap_line_length: 0,
				unformatted: [],
				selector_separator_newline: false,
				newline_between_rules: true
			});

			return ret;
		}
		catch (e)
		{
			console.error(e);
		}
	}

	return html;
}

import * as self from './index';
export default self;
