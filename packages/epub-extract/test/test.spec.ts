import epubExtract from '../index';
import { join, relative } from 'upath2';
import FastGlob from '@bluelovers/fast-glob';

jest.setTimeout(5000 * 3);

describe(`describe`, () =>
{

	FastGlob
		.sync<string>([
			'*.epub',
		], {
			cwd: join(__dirname,'res'),
			absolute: true,
		})
		.forEach(srcFile => {

			test(relative(__dirname, srcFile), async () =>
			{
				let actual = await epubExtract(srcFile, {
					cwd: __dirname,
					//noFirePrefix: true,
					noVolume: true,
				});

				expect(actual).toBeTruthy();
				expect(relative(__dirname, actual)).toMatchSnapshot();

			});

		})
	;

})
