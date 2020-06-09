import epubExtract from '../index';
import { join, relative } from 'path';
import FastGlob from '@bluelovers/fast-glob';

describe(`describe`, () =>
{

	FastGlob
		.sync<string>([

		], {
			cwd: join(__dirname,'res'),
			absolute: true,
		})
		.forEach(srcFile => {

			test(relative(__dirname, srcFile), async (done) =>
			{
				let actual = await epubExtract(srcFile, {
					cwd: __dirname,
					//noFirePrefix: true,
					noVolume: true,
				});

				expect(actual).toBeTruthy();
				expect(relative(__dirname, actual)).toMatchSnapshot();

				done();
			});

		})
	;

})
