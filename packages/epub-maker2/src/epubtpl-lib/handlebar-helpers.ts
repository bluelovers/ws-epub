import Handlebars from 'handlebars';
import path from 'upath2';
import { readFileSync } from 'fs';

import epubTplLib, {  } from './index';

export const mimetypes = {
	'jpeg': 'image/jpeg',
	'jpg': 'image/jpeg',
	'bmp': 'image/bmp',
	'png': 'image/png',
	'svg': 'image/svg+xml',
	'gif': 'image/gif',
	'ttf': 'application/x-font-truetype',
	'css': 'text/css',
};

Handlebars.registerHelper('extension', function (str)
{
	return ext(str);
});

Handlebars.registerHelper('mimetype', function (str)
{
	return mimetypes[ext(str)];
});

Handlebars.registerHelper('import', function (filePath, options)
{
	filePath = path.normalize(filePath);

	let source = readFileSync(filePath).toString();

	// @ts-ignore
	return new Handlebars.SafeString(Handlebars.compile(source)(Object.create(this)));
});

function ext(str)
{
	if (str === undefined)
	{
		return str;
	}

	return str.substr(str.lastIndexOf('.') + 1);
}

export function compileTpl(template, content, skipFormatting?: boolean): string
{
	return epubTplLib.formatHTML(Handlebars.compile(template)(content, {
		// @ts-ignore
		allowProtoMethodsByDefault: true,
		// @ts-ignore
		allowProtoPropertiesByDefault: true,
	}), skipFormatting);
}

export { Handlebars };

export default Handlebars;
