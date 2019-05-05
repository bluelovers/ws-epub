/**
 * Created by user on 2018/1/28/028.
 */

import { IArrayDeepInterface, IReturnList, IReturnRow } from 'node-novel-globby';
import novelGlobby = require('node-novel-globby');
import novelGlobbyBase = require('node-novel-globby/g');
import path = require('path');
import BluebirdPromise = require('bluebird');
import moment = require('moment');
import { mdconf_parse, IMdconfMeta } from 'node-novel-info';
import { crlf, CRLF, LF } from 'crlf-normalize';
import fs, { trimFilename } from 'fs-iconv';
import UString from 'uni-string';
import { sortTree } from 'node-novel-globby/lib/glob-sort';
import { array_unique } from 'array-hyper-unique';
import { normalize_strip } from '@node-novel/normalize';
import { Console } from 'debug-color2';
import { NodeNovelInfo } from 'node-novel-info/class';
import { getNovelTitleFromMeta } from 'node-novel-info';
import {
	eachVolumeTitle,
	foreachArrayDeepAsync,
	IForeachArrayDeepCache,
	IForeachArrayDeepReturn,
} from 'node-novel-globby/lib/util';

const console = new Console(null, {
	enabled: true,
	inspectOptions: {
		colors: true,
	},
	chalkOptions: {
		enabled: true,
	},
});

console.enabledColor = true;

const hr_len = 15;
const eol = CRLF;
const eol2 = eol.repeat(2);

const hr1 = '＝'.repeat(hr_len);
const hr2 = '－'.repeat(hr_len);

export type ITxtRuntimeReturn = IForeachArrayDeepReturn<IReturnRow, any, {
	toc: string[],
	context: string[],
}, {
	cache_vol: {
		[vol: string]: number;
	},

	prev_volume_title: string,

	count_idx: number,
	count_f: number,
	count_d: number,

}>

/**
 *
 * @param inputPath 輸入路徑
 * @param outputPath 輸出路徑
 * @param outputFilename 參考用檔案名稱
 * @param noSave 不儲存檔案僅回傳 txt 內容
 */
export function txtMerge(inputPath: string,
	outputPath: string,
	outputFilename?: string,
	noSave?: boolean,
): BluebirdPromise<{
	filename: string,
	fullpath: string,
	data: string,
}>
{
	return BluebirdPromise.resolve().then(async function ()
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
			[globby_patterns, globby_options] = novelGlobby.getOptions2(globby_options);

			//globby_patterns.push('!*/*/*/**/*');
		}

		let meta: IMdconfMeta;

		//console.info(`PATH_CWD: ${PATH_CWD}\n`);

		//console.log(globby_patterns);
		//console.log(globby_options);

		// @ts-ignore
		meta = await novelGlobbyBase.globbyASync([
				'README.md',
			], globby_options)
			//.then(sortTree)
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

		//console.log(globby_patterns);

		return novelGlobbyBase.globbyASync(globby_patterns, globby_options)
			.then(ls => sortTree(ls, null, globby_options))
			.then(function (ls)
			{
				return novelGlobby.globToListArrayDeep(ls, globby_options)
			})
			.tap(function (ls)
			{
				//console.log(ls);
				//throw new Error('test');
				//process.exit();
			})
			.then(function (_ls)
			{
				if (!_ls || !Object.keys(_ls).length)
				{
					// @ts-ignore
					return BluebirdPromise.reject(`沒有可合併的檔案存在`);
				}

				//let count_f = 0;
				//let count_d = 0;

				//let count_idx = 0;

				return foreachArrayDeepAsync(_ls as IArrayDeepInterface<IReturnRow>, async ({
					value,
					index,
					array,
					cache,
				}) =>
				{
					const { volume_title, chapter_title } = value;
					const { temp, data } = cache;

					//temp.cache_vol = temp.cache_vol || {};
					//temp.toc = temp.toc || [];
					//temp.context = temp.context || [];

					let vs_ret = eachVolumeTitle(volume_title, true);

					vs_ret.titles_full
						.forEach(function (key, index)
					{
						let title = vs_ret.titles[index];

						if (temp.cache_vol[key] == null)
						{
							data.toc.push('- '.repeat(index + 1) + title);

							temp.count_d++;

							temp.cache_vol[key] = (temp.cache_vol[key] | 0);
						}
					})
					;

					let vi = vs_ret.level - 1;

					let vol_key = vs_ret.titles_full[vi];

					temp.cache_vol[vol_key]++;

					if (temp.prev_volume_title != volume_title)
					{
						let _vol_prefix = `第${String(++temp.count_idx).padStart(5, '0')}話：${vol_key}${eol}`;

						data.context.push(`${hr1}CHECK${eol}${_vol_prefix}${vs_ret.titles[vi]}${eol}${hr1}${eol}`)
					}

					data.toc.push('- '.repeat(vs_ret.level + 1) + chapter_title);

					let _prefix = `第${String(++temp.count_idx).padStart(5, '0')}話：${chapter_title}${eol}`;

					let txt = await fs.readFile(value.path);

					temp.count_f++;

					data.context.push(`${hr2}BEGIN${eol}${_prefix}${chapter_title}${eol}${hr2}BODY${eol2}${txt}${eol2}${hr2}END${eol2}`);

					temp.prev_volume_title = volume_title;

				}, <ITxtRuntimeReturn>{

					data: {
						toc: [] as string[],
						context: [] as string[],
					},

					temp: {
						cache_vol: {},

						prev_volume_title: null,

						count_idx: 0,
						count_f: 0,
						count_d: 0,
					},
				})
					.tap(function (ret)
					{
						//console.dir(ret.temp);

						//console.log(ret.temp.context.join(eol));

						//process.exit();
					})
					.then(async function (processReturn)
					{
						let a = processReturn.data.context;

						let filename2 = makeFilename(meta, outputFilename, a, _ls, {
							TXT_PATH,
							processReturn,
						});

						let txt = a.join(eol);
						txt = crlf(txt, eol);

						let fullpath = path.join(PATH_CWD, outputDirPathPrefix, `${filename2}`);

						if (!noSave)
						{
							await fs.outputFile(fullpath, txt);
						}

						return {
							filename: filename2,
							fullpath,
							data: txt,

							temp: processReturn.temp,
						};
					})
					.tap(function (data)
					{
						console.success('[DONE] done.');

						console.info(`Total D: ${data.temp.count_d}\nTotal F: ${data.temp.count_f}\n\n[FILENAME] ${data.filename}`);
					})
					// @ts-ignore
					.tapCatch(function (e)
					{
						console.error(`[ERROR] something wrong!!`);
						console.trace(e);
					})
					;
			})
			.tapCatch(function (e)
			{
				console.error(`[ERROR] can't found any file in '${TXT_PATH}'`);
				console.trace(e);
			})
			;
	})
}

export function getMetaTitles(meta: IMdconfMeta): string[]
{
	return getNovelTitleFromMeta(meta);
}

/**
 * 回傳處理後的檔案名稱
 */
export function makeFilename(meta?: IMdconfMeta, outputFilename?: string, a: string[] = [], _ls?: IReturnList, _argv: {
	TXT_PATH?: string,
	processReturn?: ITxtRuntimeReturn,
} = {} as any): string
{
	if (_argv.processReturn && _argv.processReturn.data.toc.length)
	{
		let ret = _argv.processReturn.data.toc;

		ret.unshift(`目錄索引：`);
		ret.push(hr2 + eol);

		a.unshift(ret.join(eol));
	}

	const metaLib = new NodeNovelInfo(meta, {
		throw: false,
		lowCheckLevel: true,
	});

	if (meta && meta.novel)
	{
		let txt = `${meta.novel.title}${eol}${meta.novel.author}${eol}${metaLib.sources()
			.join(eol)}${eol}${eol}${meta.novel.preface}${eol}${eol}`;

		let a2 = [];

		let novelID = _argv && _argv.TXT_PATH && path.basename(_argv.TXT_PATH) || '';

		let titles = [novelID].concat(metaLib.titles())
			.filter(v => v && v != meta.novel.title)
		;

		if (titles.length)
		{
			a2.push(`其他名稱：${eol}` + titles.join(eol) + eol);
			a2.push(hr2);
		}

		let _arr: string[];
		let _label = '';
		let _join = '、';

		_arr = metaLib.authors()
			.filter(v => v && v != meta.novel.author)
		;
		_label = '其他作者：';

		if (_arr && _arr.length)
		{
			a2.push(_label + _arr.join(_join) + eol);
		}

		_arr = metaLib.illusts();
		_label = '繪師：';

		if (_arr && _arr.length)
		{
			a2.push(_label + _arr.join(_join) + eol);
		}

		_arr = metaLib.contributes();
		_label = '貢獻者：';

		if (_arr && _arr.length)
		{
			a2.push(_label + _arr.join(_join) + eol);
		}

		_arr = metaLib.tags();
		_label = '標籤：';

		if (_arr && _arr.length)
		{
			a2.push(_label + _arr.join(_join) + eol);
		}

		if (a2.length)
		{
			a2.unshift(hr2);

			a2.push(hr2);

			txt += a2.join(eol);
		}

//		console.log(txt);
//		process.exit();

		a.unshift(txt);
	}

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

	return filename2;
}

export default txtMerge;
