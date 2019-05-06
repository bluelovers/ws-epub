/**
 * Created by user on 2018/2/18/018.
 */

import getUuidByString = require('uuid-by-string');
import { crlf } from 'crlf-normalize';
import { createUUID } from 'epub-maker2/src/lib/uuid';
import { IMdconfMeta, mdconf_parse } from 'node-novel-info';
import fs = require('fs-iconv');
import { Console } from 'debug-color2';

export const console = new Console(null, {
	enabled: true,
	inspectOptions: {
		colors: true,
	},
	chalkOptions: {
		enabled: true,
	},
});

console.enabledColor = true;

export { createUUID }

//export function createUUID(input?: unknown)
//{
//	return getUuidByString(String(input)).toLowerCase();
//}

export function splitTxt(txt)
{
	return (
		'<div>' +
		txt
			.toString()
			.replace(/\r\n|\r(?!\n)|\n/g, "\n")

			.replace(/\u003C/g, '&lt;')
			.replace(/\u003E/g, '&gt;')

			.replace(/&lt;(img.+?)\/?&gt;/gm, function (...m)
			{
				//console.log(m);

				return `<${m[1].replace(/\/+$/, '')} class="inner-image"/>`;
			})

			.replace(/^[ ]*[－＝\-—\=─–]{3,}[ ]*$/mg, '<hr/>')

			//.replace(/^([－＝\-—\=─═─＝=══－\-─—◆◇]+)$/mg, '<span class="overflow-line">$1</span>')

			.replace(/\n/g, '</div>\n<div>')
		+ '</div>')

		.replace(/<div><hr\/><\/div>/g, '<hr class="linehr"/>')

		.replace(/<div>[ ]*([－＝—=─═─＝=══－\-─—～◆◇\*＊\+＊＊↣◇◆☆★■□☆◊▃\p{Punctuation}]+)[ ]*<\/div>/ug, '<div class="linegroup calibre1 overflow-line">$1</div>')

		.replace(/<div><\/div>/g, '<div class="linegroup softbreak">　 </div>')
		.replace(/<div>/g, '<div class="linegroup calibre1">')
		;
}

/**
 * 讀取不標準的 mdconf
 */
export function parseLowCheckLevelMdconf(data: string | Buffer)
{
	return mdconf_parse(data, {
		// 當沒有包含必要的內容時不產生錯誤
		throw: false,
		// 允許不標準的 info 內容
		lowCheckLevel: true,
	});
}

export function fsLowCheckLevelMdconf(file: string)
{
	return parseLowCheckLevelMdconf(fs.readFileSync(file));
}

export function fsLowCheckLevelMdconfAsync(file: string)
{
	return fs.readFile(file).then(parseLowCheckLevelMdconf);
}

export default exports as typeof import('./util');
