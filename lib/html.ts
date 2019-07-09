/**
 * Created by user on 2019/7/9.
 */

import { IInternalProcessContextOptions } from './types';
import { IAttachMetaData } from './epub';
import { cn2tw_min, tw2cn_min } from 'cjk-conv/lib/zh/convert/min';
import { _fixRubyInnerContext, allowedHtmlTagList, reTxtHtmlTag, reTxtImgTag } from './tags';
import { getAttachID, handleAttachFile } from './store';
import { toHalfWidth } from 'str-util';
import { console } from './log';

export function novelImage(src: string, failback?: string)
{
	if (failback)
	{
		failback = ` lowsrc="${failback}" `;
	}
	else
	{
		failback = '';
	}

	return `<figure class="fullpage ImageContainer page-break-before"><img src="${src}" class="inner-image" ${failback}/></figure>`;
}

export function splitTxt(txt, plusData?: IInternalProcessContextOptions)
{
	const { attach = {} as IAttachMetaData, store, vid, epub, epubOptions, cwd } = plusData || {};
	const { images } = attach || {} as IAttachMetaData;

	if (epubOptions.iconv)
	{
		if (epubOptions.iconv === 'cn')
		{
			txt = tw2cn_min(txt)
		}
		else if (epubOptions.iconv === 'tw')
		{
			txt = cn2tw_min(txt)
		}
	}

	return (
		'<div>' +
		txt
			.toString()
			.replace(/\r\n|\r(?!\n)|\n/g, "\n")

			.replace(/\u003C/g, '&lt;')
			.replace(/\u003E/g, '&gt;')

			.replace(/&lt;(img[^\n]+?)\/?&gt;/gm, function (...m)
			{
				//console.log(m);

				return `<${m[1].replace(/\/+$/, '')} class="inner-image"/>`;
			})

			.replace(reTxtImgTag, (s, id: string) =>
			{

				if (images && store && id)
				{
					let input: string;

					({ id, input } = getAttachID(id, {
						images,
					}));

					if (input)
					{
						let ret = handleAttachFile(input, {
							...plusData,
							store,
							epubOptions,
							epub,
							vid,
							failbackExt: '.jpg',
							basePath: 'image',
							cwd,
						});

						if (ret)
						{
							if (ret.ok && !ret.isFile)
							{
								return novelImage(ret.returnPath, ret.input);
							}

							return novelImage(ret.returnPath);
						}
					}
				}

				return s;
			})

			.replace(reTxtHtmlTag, (s, ...argv) =>
			{

				let [tagName = '', attr = '', innerContext = ''] = argv as string[];

				tagName = toHalfWidth(tagName).toLowerCase();

				switch (tagName as (typeof allowedHtmlTagList)[number])
				{
					case 's':
					case 'i':
					case 'b':
					case 'sup':
					case 'sub':
						return `<${tagName}>` + innerContext + `</${tagName}>`;
					case 'ruby':
						return '<ruby>' + _fixRubyInnerContext(innerContext) + '</ruby>';
					default:
						console.warn(`not support ${tagName}`, argv, s)
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