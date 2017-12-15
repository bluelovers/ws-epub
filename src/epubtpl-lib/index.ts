/**
 * Created by user on 2017/12/15/015.
 */

import { html_beautify } from 'js-beautify';

export function formatHTML(htmlstr, skipFormatting?: boolean): string
{
	/*jslint camelcase:false*/
	return (skipFormatting || typeof html_beautify === 'undefined') ? htmlstr : html_beautify(htmlstr, {
		'end_with_newline': false,
		'indent_char': '\t',
		'indent_inner_html': true,
		'indent_size': '1',
		'preserve_newlines': false,
		'wrap_line_length': '0',
		'unformatted': [],
		'selector_separator_newline': false,
		'newline_between_rules': true
	});
	/*jslint camelcase:true*/
}

// @ts-ignore
export default exports;
