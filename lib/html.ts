/**
 * Created by user on 2019/7/9.
 */

import { IInternalProcessContextOptions } from './types';
import { IAttachMetaData } from './epub';
import { cn2tw_min, tw2cn_min } from 'cjk-conv/lib/zh/convert/min';
import { _fixRubyInnerContext, allowedHtmlTagList, reTxtHtmlTag, reTxtImgTag } from './tags';
import { getAttachID, handleAttachFile } from './store';
import { toHalfWidth, toFullWidth } from 'str-util';
import { console } from './log';
import { parse as parseNodeNovelTxtTag } from '@node-novel/parse-txt-tag';

export function novelImage(src: string, options: {
	failback?: string,
	attr?: string,
} = {})
{
	let { failback = '', attr = '' } = options || {};

	if (failback && failback.length)
	{
		failback = ` lowsrc="${failback}" `;
	}
	else
	{
		failback = '';
	}

	return `<figure class="fullpage ImageContainer page-break-before duokan-image-single"><div><img src="${src}" class="inner-image" ${failback} ${attr}/></div></figure>`;
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

	let context: string = txt
		.toString()
		.replace(/\r\n|\r(?!\n)|\n/g, "\n")

		.replace(/\u003C/g, '&lt;')
		.replace(/\u003E/g, '&gt;')

		.replace(/&lt;(img[^\n]+?)\/?&gt;/gm, function (...m)
		{
			//console.log(m);

			return `<${m[1].replace(/\/+$/, '')} class="inner-image"/>`;
		})
	;

	context = parseNodeNovelTxtTag(context, {
		on:{
			img({
				tagName,
				innerContext: id,
			})
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
							let _options: Parameters<typeof novelImage>["1"] = {
								attr: ` alt="（插圖${toFullWidth(id)}）"`,
							};

							if (ret.ok && !ret.isFile)
							{
								_options.failback = ret.input;

								return novelImage(ret.returnPath, _options);
							}

							return novelImage(ret.returnPath, _options);
						}
					}
				}

				return null;
			},
			default({
				tagName,
				attr,
				innerContext,
				cache,
				attach,
			})
			{
				if (tagName !== 'img' && !allowedHtmlTagList.includes(tagName))
				{
					console.warn(`not support ${tagName}`, attr, innerContext)
				}

				return null
			},
		}
	}).context;

	context = ('<div>' + context
		.replace(/^[ ]*[－＝\-—\=─–]{3,}[ ]*$/mg, '<hr/>')

		//.replace(/^([－＝\-—\=─═─＝=══－\-─—◆◇]+)$/mg, '<span class="overflow-line">$1</span>')

		.replace(/\n/g, '</div>\n<div>')
		+ '</div>')

		.replace(/<div><hr\/><\/div>/g, '<hr class="linehr"/>')

		.replace(/<div>[ ]*([－＝—=─═─＝=══－\-─—～◆◇\*＊\+＊＊↣◇◆☆★■□☆◊▃\p{Punctuation}]+)[ ]*<\/div>/ug, '<div class="linegroup calibre1 overflow-line">$1</div>')

		.replace(/<div><\/div>/g, '<div class="linegroup softbreak">　 </div>')
		.replace(/<div>/g, '<div class="linegroup calibre1">')
	;

	return context;
}

export default splitTxt
