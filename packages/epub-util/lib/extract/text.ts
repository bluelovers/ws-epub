import removeZeroWidth, { nbspToSpace } from 'zero-width/lib';
import { crlf } from 'crlf-normalize';

export function fixText(text: string)
{
	return crlf(removeZeroWidth(nbspToSpace(text)))
		.replace(/^\n{2,}|\n{2,}$/g, '\n')
	;
}

export default fixText