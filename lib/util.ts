/**
 * Created by user on 2018/2/18/018.
 */

import getUuidByString = require('uuid-by-string');
import { crlf } from 'crlf-normalize';
import { createUUID } from 'epub-maker2/src/lib/uuid';
import { IMdconfMeta, mdconf_parse } from 'node-novel-info';
import fs = require('fs-iconv');
import { Console } from 'debug-color2';
import { IAttachMetaData } from './epub';
import zhRegExp from 'regexp-cjk';
import { toHalfWidth } from 'str-util';

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

const reTxtImgTag = new zhRegExp(`[(（](?:插圖|圖片|插畫|画像)([a-z0-9ａ-ｚ０-９_-]+)[)）]`, 'iug', {
	greedyTable: 2,
});

export function novelImage(src: string)
{
	return `<figure class="fullpage ImageContainer page-break-before"><img src="${src}" class="inner-image"/></figure>`;
}

export function splitTxt(txt, plusData?: {
	attach?: IAttachMetaData
})
{
	const { attach = {} as IAttachMetaData } = plusData || {};
	const { images } = attach || {} as IAttachMetaData;

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

			.replace(reTxtImgTag, (s, id: string) => {

				if (images && id)
				{
					id = toHalfWidth(id);

					if (images[id])
					{
						return novelImage(images[id]);
					}
					else if (images[id = id.toLowerCase()])
					{
						return novelImage(images[id]);
					}
					else if (images[id = id.toUpperCase()])
					{
						return novelImage(images[id]);
					}
				}

				return s;
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

