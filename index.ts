/**
 * Created by user on 2018/1/28/028.
 */

import * as novelGlobby from 'node-novel-globby';
import * as path from 'path';
import * as Promise from 'bluebird';
import * as moment from 'moment';
import { mdconf_parse, IMdconfMeta } from 'node-novel-info';
import { crlf, CRLF } from 'crlf-normalize';
import fs, { trimFilename } from 'fs-iconv';
import UString from 'uni-string';

export async function txtMerge(inputPath: string, outputPath: string, outputFilename?: string)
{
	const TXT_PATH: string = inputPath;
	const PATH_CWD: string = outputPath;
	const outputDirPathPrefix = 'out';

	if (!inputPath || !outputPath || typeof inputPath != 'string' || typeof outputPath != 'string')
	{
		throw new ReferenceError('must set inputPath, outputPath');
	}

	let globby_patterns: string[];
	let globby_options: novelGlobby.IOptions = {
		cwd: TXT_PATH,
		useDefaultPatternsExclude: true,
		absolute: true,
	};

	{
		[globby_patterns, globby_options] = novelGlobby.getOptions(globby_options);

		globby_patterns.push('!*/*/**/*');
	}

	let meta: IMdconfMeta;

	//console.info(`PATH_CWD: ${PATH_CWD}\n`);

	//console.log(globby_patterns);
	//console.log(globby_options);

	meta = await novelGlobby.globbyASync([
			'README.md',
		], globby_options)
		.then(novelGlobby.returnGlobList)
		.tap(function (ls)
		{
			//console.log(ls);
		})
		.then(async function (ls)
		{
			let data = await fs.readFile(ls[0]);

			return mdconf_parse(data, {
				throw: false,
			});
		})
		.tap(function (ls)
		{
			//console.log(ls);
		})
		.catch(function ()
		{
			console.warn(`[WARN] README.md not exists! (${path.join(globby_options.cwd, 'README.md')})`);
		})
	;

	let hr_len = 15;

	let hr1 = '＝'.repeat(hr_len);
	let hr2 = '－'.repeat(hr_len);

	//console.log(globby_patterns);

	await novelGlobby.globbyASync(globby_patterns, globby_options)
		.tap(function (ls)
		{
			//console.log(ls);

			//throw new Error('test');
		})
		.then(function (_ls)
		{
			const eol = '\n';

			if (!_ls || !Object.keys(_ls).length)
			{
				return Promise.reject();
			}

			let count_f = 0;
			let count_d = 0;

			return Promise
				.mapSeries(Object.keys(_ls), async function (val_dir, index, len)
				{
					let ls: novelGlobby.IReturnRow[] = _ls[val_dir];

					let volume_title = ls[0].volume_title;

					let txt = `${hr1}CHECK\n${volume_title}\n${hr1}\n`;

					let a = await Promise.mapSeries(ls, async function (row: novelGlobby.IReturnRow)
					{
						let data = await fs.readFile(row.path);

						let txt = `${hr2}BEGIN\n${row.chapter_title}\n${hr2}BODY\n\n${data}\n\n${hr2}END\n\n`;

						count_f++;

						return txt;
					});

					a.unshift(txt);

					count_d++;

					return a.join(eol);
				})
				.then(async function (a)
				{
					if (meta && meta.novel)
					{
						let txt = `${meta.novel.title}\n${meta.novel.author}\n${meta.novel.source || ''}\n\n${meta.novel.preface}\n\n`;

						let a2 = [];

						if (Array.isArray(meta.contribute) && meta.contribute.length)
						{
							a2.push(meta.contribute.join('、') + "\n\n");
						}

						if (a2.length)
						{
							a2.unshift(hr2);

							txt += a2.join(CRLF);
						}

						a.unshift(txt);
					}

					let txt = a.join(eol);

					txt = crlf(txt, CRLF);

					let filename: string;

					if (typeof outputFilename == 'string' && outputFilename)
					{
						filename = outputFilename;
					}

					if (!filename && meta && meta.novel)
					{
						if (meta.novel.title_short)
						{
							filename = meta.novel.title_short;
						}
						else if (meta.novel.title)
						{
							filename = meta.novel.title;
						}
						else if (meta.novel.title_zh)
						{
							filename = meta.novel.title_zh;
						}
					}

					filename = filename || 'temp';

					let filename2 = trimFilename(filename)
						.replace(/\./, '_')
						.replace(/^[_+\-]+|[_+\-]+$/, '')
					;

					filename2 = UString.create(filename2).split('').slice(0, 20).join('');
					filename2 = trimFilename(filename2);

					if (!filename2)
					{
						console.error(`[ERROR] Bad Filename: ${filename} => ${filename2}`);

						filename2 = 'temp';
					}

					filename += '_' + moment().local().format('YYYYMMDDHHmm');

					filename2 = `${filename2}.out.txt`;

					await fs.outputFile(path.join(PATH_CWD, outputDirPathPrefix, `${filename2}`), txt);

					return filename2;
				})
				.tap(function (filename)
				{
					console.log('[DONE] done.');

					console.info(`Total D: ${count_d}\nTotal F: ${count_f}\n\n[FILENAME] ${filename}`);
				})
				.catchThrow(function (e)
				{
					console.error(`[ERROR] something wrong!!`);
					console.trace(e);

					return e;
				})
				;
		})
		.catch(function (e)
		{
			console.error(`[ERROR] can't found any file in '${PATH_CWD}'`);
			console.trace(e);
		})
	;

}

export default txtMerge;
