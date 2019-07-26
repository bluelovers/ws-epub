import _zhRegExp from 'regexp-cjk';
import createZhRegExpPlugin from 'regexp-cjk-plugin-extra';
import { console } from './log';
import { toHalfWidth } from 'str-util';

const zhRegExp = _zhRegExp.use({
	on: [
		createZhRegExpPlugin({
			autoFullHaif: true,
		})
	],
});

export const allowedHtmlTagList = [
	's',
	'ruby',
	'i',
	'b',
	'sup',
	'sub',
] as const;

export const enum EnumHtmlTag
{
	OPEN = '&lt;|\\u003C|＜',
	CLOSE = '&gt;|\\u003E|＞',
}

export const reTxtImgTag = new zhRegExp(`[(（](?:插(?:圖|畫|絵)|圖(?:片|像)|画像)([a-z0-9ａ-ｚ０-９_―——─－一─——－\u2E3A\u0332\u0331\u02CD﹘\\-]+)[)）]`, 'iug', {
	greedyTable: 2,
});

export const reTxtHtmlTag = createHtmlTagRe(allowedHtmlTagList);
export const reHtmlRubyRt = createHtmlTagRe(['rt']);
export const reHtmlRubyRp = createHtmlTagRe(['rp']);

export const reHtmlTagOpen = new zhRegExp(EnumHtmlTag.OPEN, 'igu');
export const reHtmlTagClose = new zhRegExp(EnumHtmlTag.CLOSE, 'igu');

export const reHtmlAttr = new zhRegExp(`(?<=(?:[\\s 　]+))([\\wａ-ｚ０-９]+)(?:＝|═|=)([#＃\\wａ-ｚ０-９]+)`, 'iug', {
	greedyTable: 2,
});

if (0)
{
	console.dir({
		reTxtImgTag,
		reTxtHtmlTag,
		reHtmlRubyRt,
		reHtmlRubyRp,
		reHtmlTagOpen,
		reHtmlTagClose,
		reHtmlAttr,
	});
}

export function createHtmlTagRe(allowedHtmlTagList: string[] | readonly string[])
{
	return new zhRegExp(`(?:${EnumHtmlTag.OPEN})(${allowedHtmlTagList.join('|')})((?:\\s+[\\w \\t＝═=ａ-ｚ０-９]*?)?)(?:${EnumHtmlTag.CLOSE})([^\\n]*?)(?:${EnumHtmlTag.OPEN})(?:(?:\\/|／)\\1)(?:${EnumHtmlTag.CLOSE})`, 'iug', {
		greedyTable: 2,
	})
}

export function _convertHtmlTag001(input: string)
{
	return input
		.replace(new RegExp(EnumHtmlTag.OPEN, 'ig'), '<')
		.replace(new RegExp(EnumHtmlTag.CLOSE, 'ig'), '>')
		;
}

export function _fixRubyInnerContext(innerContext: string)
{
	let fn = _replaceHtmlTag(($0, $1, $2, $3) => {
		return `<${$1}${$2}>${$3}</${$1}>`
	});

	return innerContext
		.replace(reHtmlRubyRt, fn)
		.replace(reHtmlRubyRp, fn)
	;
}

export function _replaceHtmlTag(replacer: ((substring: string, ...args: string[]) => string))
{
	return ($0: string, $1: string, $2: string, ...argv: string[]) => {

		$1 = toHalfWidth($1);
		$2 = toHalfWidth($2);

		return replacer($0, $1, $2, ...argv)
	}
}
