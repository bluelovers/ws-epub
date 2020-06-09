import { IInternalProcessContextOptions } from '../lib/types';
import { IOptions } from '..';
import { defaultsDeep } from 'lodash';
import { splitTxt } from '../lib/html';

test(`full-width ruby`, () =>
{

	let actual = testHtml(`＜ｒｕｂｙ＞漢＜ｒｔ＞Ｋａｎ＜／ｒｔ＞字＜ｒｔ＞ｊｉ＜／ｒｔ＞＜／ｒｕｂｙ＞`);
	let expected;

	expect(actual).toMatch(/<ruby>漢<rt>Ｋａｎ<\/rt>字<rt>ｊｉ<\/rt><\/ruby>/);

	expect(actual).toMatchSnapshot();

});

test(`epubOptions: { iconv: 'cn' }`, () =>
{

	let actual = testHtml(`＜ｒｕｂｙ＞漢＜ｒｔ＞Ｋａｎ＜／ｒｔ＞字＜ｒｔ＞ｊｉ＜／ｒｔ＞＜／ｒｕｂｙ＞`, {
		epubOptions: {
			iconv: 'cn',
		},
	});
	let expected;

	expect(actual).toMatch(/<ruby>汉<rt>Ｋａｎ<\/rt>字<rt>ｊｉ<\/rt><\/ruby>/);

	expect(actual).toMatchSnapshot();

});

function testHtml(txt: string, plusData?: Partial<Omit<IInternalProcessContextOptions, 'epubOptions'>> & {
	epubOptions: Partial<IOptions>
})
{
	plusData = defaultsDeep(plusData || {}, {
		epub: null,
		epubOptions: {
			//iconv: 'cn'
		} as IOptions,
		store: null,
		cwd: null,
		vid: null,
		attach: null,
	});

	return splitTxt(txt, plusData as IInternalProcessContextOptions);
}
