/**
 * Created by User on 2019/7/21.
 */

// @ts-ignore
/// <reference types="mocha" />
// @ts-ignore
/// <reference types="benchmark" />
// @ts-ignore
/// <reference types="chai" />
// @ts-ignore
/// <reference types="node" />

// @ts-ignore
import { chai, relative, expect, path, assert, util, mochaAsync, SymbolLogOutput } from './_local-dev';

import { splitTxt } from '../lib/html';
import { IOptions } from '../index';
import { defaultsDeep } from 'lodash';
import { IInternalProcessContextOptions } from '../lib/types';

// @ts-ignore
describe(relative(__filename), () =>
{
	// @ts-ignore
	let currentTest: Mocha.Test;

	// @ts-ignore
	beforeEach(function ()
	{
		// @ts-ignore
		currentTest = this.currentTest;

		delete currentTest[SymbolLogOutput];

		//console.log('it:before', currentTest.title);
		//console.log('it:before', currentTest.fullTitle());
	});

	// @ts-ignore
	afterEach(function ()
	{
		let out = currentTest[SymbolLogOutput];
		let t = typeof out;

		if (t === 'string')
		{
			console.log(`----------`);
			console.log(out);
			console.log(`----------`);
		}
		else if (t === 'function')
		{
			out(currentTest)
		}
		else if (out != null)
		{
			console.dir(out);
		}

	});

	// @ts-ignore
	describe(`suite`, () =>
	{

		// @ts-ignore
		it(`full-width ruby`, async function ()
		{
			//console.log('it:inner', currentTest.title);
			//console.log('it:inner', currentTest.fullTitle());

			let actual = testHtml(`＜ｒｕｂｙ＞漢＜ｒｔ＞Ｋａｎ＜／ｒｔ＞字＜ｒｔ＞ｊｉ＜／ｒｔ＞＜／ｒｕｂｙ＞`);
			let expected;

			currentTest[SymbolLogOutput] = actual;

			console.dir(actual);

			expect(/<ruby>漢<rt>Ｋａｎ<\/rt>字<rt>ｊｉ<\/rt><\/ruby>/.test(actual)).to.be.ok;

			//expect(actual).to.be.ok;
			//expect(actual).to.be.deep.equal(expected);
			//assert.isOk(actual.value, util.inspect(actual));
		});

		// @ts-ignore
		it(`epubOptions: { iconv: 'cn' }`, async function ()
		{
			//console.log('it:inner', currentTest.title);
			//console.log('it:inner', currentTest.fullTitle());

			let actual = testHtml(`＜ｒｕｂｙ＞漢＜ｒｔ＞Ｋａｎ＜／ｒｔ＞字＜ｒｔ＞ｊｉ＜／ｒｔ＞＜／ｒｕｂｙ＞`, {
				epubOptions: {
					iconv: 'cn'
				}
			});
			let expected;

			currentTest[SymbolLogOutput] = actual;

			console.dir(actual);

			expect(/<ruby>汉<rt>Ｋａｎ<\/rt>字<rt>ｊｉ<\/rt><\/ruby>/.test(actual)).to.be.ok;

			//expect(actual).to.be.ok;
			//expect(actual).to.be.deep.equal(expected);
			//assert.isOk(actual.value, util.inspect(actual));
		});
	});
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
