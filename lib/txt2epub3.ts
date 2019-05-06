/**
 * Created by user on 2017/12/16/016.
 */

import { ISectionContent } from 'epub-maker2/src/index';
import { htmlPreface } from 'epub-maker2/src/lib/util';
import EpubMaker, { hashSum, slugify } from 'epub-maker2';
import { array_unique, chkInfo, IMdconfMeta, mdconf_parse } from 'node-novel-info';
import { fsLowCheckLevelMdconfAsync, splitTxt, console } from './util';
import { createUUID } from 'epub-maker2/src/lib/uuid';
import { normalize_strip } from '@node-novel/normalize';
import { Console } from 'debug-color2';
import { crlf } from 'crlf-normalize';
import { EnumEpubConfigVertical } from 'epub-maker2/src/config';
import { NodeNovelInfo } from 'node-novel-info/class';
import { sortTree } from 'node-novel-globby/lib/glob-sort';
import { eachVolumeTitle, foreachArrayDeepAsync, IArrayDeepInterface, IReturnRow } from 'node-novel-globby';
import { EnumEpubTypeName } from 'epub-maker2/src/epub-types';
import {
	_handleVolume,
	_handleVolumeImage,
	_handleVolumeImageEach,
	IEpubRuntimeReturn,
	makeChapterID,
	makeVolumeID,
	SymCache,
} from './epub';
import fs = require('fs-iconv');
import Bluebird = require('bluebird');
import path = require('upath2');
import moment = require('moment');
import novelGlobby = require('node-novel-globby/g');
import deepmerge = require('deepmerge-plus');

export { console }

export interface IOptions
{
	/**
	 * 小說 txt 的主資料夾路徑
	 * @type {string}
	 */
	inputPath: string,
	outputPath: string,

	/**
	 * 小說名稱ID
	 */
	novelID?: string,
	filename?: string,

	novelConf?: unknown,

	epubTemplate?: unknown,

	epubLanguage?: string,

	padEndDate?: boolean,

	globbyOptions?: novelGlobby.IOptions,

	useTitle?: boolean,
	filenameLocal?: boolean | string[] | string,

	noLog?: boolean,

	vertical?: boolean | EnumEpubConfigVertical;
}

export const defaultOptions: Partial<IOptions> = Object.freeze({
	epubTemplate: 'lightnovel',
	//epubLanguage: 'zh',
	epubLanguage: 'zh-Hant-TW',
	//padEndDate: true,

	globbyOptions: {
		checkRoman: true,
		useDefaultPatternsExclude: true,
	},
});

export function getNovelConf(options: IOptions, cache = {}): Bluebird<IMdconfMeta>
{
	return Bluebird.resolve().then(async function ()
	{
		let meta: IMdconfMeta;
		let confPath: string;

		if (options.novelConf && typeof options.novelConf == 'object')
		{
			meta = options.novelConf;
		}
		else
		{
			if (typeof options.novelConf == 'string')
			{
				confPath = options.novelConf;
			}
			else
			{
				confPath = options.inputPath;
			}

			if (fs.existsSync(path.join(confPath, 'meta.md')))
			{
				let file = path.join(confPath, 'meta.md');

				meta = await fs.readFile(file)
					.then(mdconf_parse)
				;
			}
			else if (fs.existsSync(path.join(confPath, 'README.md')))
			{
				let file = path.join(confPath, 'README.md');

				meta = await fs.readFile(file)
					.then(mdconf_parse)
				;
			}
		}

		meta = chkInfo(meta);

		if (!meta || !meta.novel || !meta.novel.title)
		{
			throw new Error(`not a valid novelInfo data`);
		}

		return meta;
	})
}

export function makeOptions(options: IOptions): IOptions
{
	options = Object.keys(options)
		.filter(v => typeof options[v] != 'undefined')
		.reduce(function (a, b)
		{
			a[b] = options[b];

			return a
		}, {} as IOptions)
	;

	return options = deepmerge.all([{}, defaultOptions, options]);
}

export interface INovelEpubReturnInfo
{
	file: string,
	filename: string,
	epub: EpubMaker,

	outputPath: string,
	basename: string,
	ext: string,

	stat: {
		volume: number,
		chapter: number,
		image: number,
	},
}

export function create(options: IOptions, cache = {}): Bluebird<INovelEpubReturnInfo>
{
	return Bluebird.resolve().then(async function ()
	{
		//console.log(options, defaultOptions);

		options = makeOptions(options);

		//console.dir(options, {colors: true});

		let novelID = options.novelID;
		let TXT_PATH = options.inputPath;

		let meta = await getNovelConf(options, cache);

		const metaLib = new NodeNovelInfo(meta, {
			throw: false,
			lowCheckLevel: true,
		});

		let globby_patterns: string[];
		let globby_options: novelGlobby.IOptions = Object.assign({}, options.globbyOptions, {
			cwd: TXT_PATH,
			//useDefaultPatternsExclude: true,
			//checkRoman: true,
		});

		{
			[globby_patterns, globby_options] = novelGlobby.getOptions2(globby_options);
		}

		//console.log(options, globby_options);

		//console.dir(options);

		console.info(meta.novel.title);
		//console.log(meta.novel.preface);

		let epub: EpubMaker = new EpubMaker()
			.withTemplate(options.epubTemplate)
			.withLanguage(options.epubLanguage)
			.withUuid(createUUID(hashSum([
				meta.novel.title,
				meta.novel.author,
			])))
			.withTitle(meta.novel.title, meta.novel.title_short || meta.novel.title_zh)
			.withAuthor(meta.novel.author)
			.addAuthor(meta.novel.author)
			.withCollection({
				name: meta.novel.title,
			})
			.withInfoPreface(meta.novel.preface)
			.addTag(metaLib.tags())
			.addAuthor(metaLib.contributes())
		;

		if (options.vertical)
		{
			epub.setVertical(options.vertical);
		}

		epub.addTitles(metaLib.titles());

		if (options.filename)
		{
			epub.epubConfig.filename = options.filename;
		}

		metaLib.sources()
			.forEach(link => epub.addLinks(link))
		;

		if (meta.novel.series)
		{
			epub.withSeries(meta.novel.series.name, meta.novel.series.position);
		}
		else
		{
			epub.withSeries(meta.novel.title);
		}

		if (meta.novel.publisher)
		{
			epub.withPublisher(meta.novel.publisher || 'node-novel');
		}

		if (meta.novel.date)
		{
			epub.withModificationDate(meta.novel.date);
		}

		if (meta.novel.status)
		{
			epub.addTag(meta.novel.status);
		}

		if (meta.novel.cover)
		{
			epub.withCover(meta.novel.cover);
		}
		else
		{
			await novelGlobby.globby([
					'cover.*',
				], Object.assign({}, globby_options, {
					absolute: true,
				}))
				.then(ls =>
				{
					if (ls.length)
					{
						epub.withCover(ls[0]);
					}

					console.log(ls);
				})
			;
		}

		//process.exit();

		const processReturn = await novelGlobby
			.globbyASync(globby_patterns, globby_options)
			.tap(function (ls)
			{
				return ls;
			})
			.then(function (ls)
			{
				return sortTree(ls, null, globby_options)
			})
			.then(function (ls)
			{
				//console.dir(ls);

				return novelGlobby.globToListArrayDeep(ls, globby_options)
			})
			.tap(function (ls)
			{
				/*
				console.dir(ls, {
					depth: null,
					colors: true,
				});
				process.exit();
			 */

				return ls;
			})
			.then(_ls =>
			{
				//let idx = 1;

				//let cacheTreeSection = {} as Record<string, EpubMaker.Section>;

				//const SymCache = Symbol('cache');

				//let _new_top_level: EpubMaker.Section;
				//let _old_top_level: EpubMaker.Section;

				return foreachArrayDeepAsync(_ls as IArrayDeepInterface<IReturnRow>, async ({
					value,
					index,
					array,
					cache,
				}) =>
				{
					const { volume_title, chapter_title } = value;
					const { temp, data } = cache;
					const { stat } = data;

					const { cacheTreeSection } = temp;

					let vs_ret = eachVolumeTitle(volume_title, true);

					const dirname = value.path_dir;

					let _ds = (path.normalize(dirname) as string).split('/');

					const volume: EpubMaker.Section = await Bluebird
						.resolve(vs_ret.titles_full)
						.reduce(async function (vp: EpubMaker.Section, key, index)
						{
							let title = vs_ret.titles[index];

							key += '.dir';

							if (
								0
								&& temp.prev_volume_dir
								&& temp.prev_volume_dir != dirname
								&& (
									dirname.length < temp.prev_volume_dir.length
									//|| temp.prev_volume_dir.indexOf(dirname) == -1
								)
							)
							{
								await _handleVolumeImage(temp.prev_volume, temp.prev_volume_row.dirname, {
									epub,
									processReturn: cache,
								})
									.tap(ls =>
									{

										console.log(ls);

										if (ls.length)
										{
											console.log({

												prev_volume_dir: temp.prev_volume_dir,
												dirname,

												len: dirname.length < temp.prev_volume_dir.length,
												indexOf: temp.prev_volume_dir.indexOf(dirname),
											});
										}
									})
							}

							let vc: EpubMaker.Section;

							if (temp.cache_vol[key] == null)
							{
								let _nav_dir = _ds.slice(0, _ds.length - vs_ret.level + index + 1).join('/');

								//data.toc.push('- '.repeat(index + 1) + title);

								/*
								console.log({
									key,
									_nav_dir,
								});
								 */

								temp.count_d++;
								stat.volume++;

								temp.cache_vol[key] = (temp.cache_vol[key] | 0);

								let vid = makeVolumeID(temp.count_idx++);

								vc = cacheTreeSection[key] = new EpubMaker.Section('auto-toc', vid, {
									title: title,
								}, false, true);

								vc[SymCache] = vc[SymCache] || {};

								await _handleVolume(vc, _nav_dir, {
									epub,
									processReturn: cache,
								});

								if (index == 0)
								{
									if (temp._old_top_level)
									{
										await _handleVolumeImageEach(temp.cache_top_subs[temp._old_top_level.id], {
											epub,
											processReturn: cache,
										});

										if (!epub.hasSection(temp._old_top_level))
										{
											epub.withSection(temp._old_top_level);
										}
									}

									temp._old_top_level = temp._new_top_level;
									temp._new_top_level = vc;

									temp.cache_top_subs[vc.id] = temp.cache_top_subs[vc.id] || [];

									temp.cache_top_subs[vc.id].push({
										vol_key: key,
										dirname: _nav_dir,
									});
								}
							}

							vc = cacheTreeSection[key];

							if (vp && !vp.hasSubSection(vc))
							{
								vp.withSubSection(vc);
							}

							return vc
						}, null)
					;

					const row = value;

					let name = value.chapter_title;

					let txt = await fs.loadFile(value.path, {
							autoDecode: true,
						})
						.then(function (data)
						{
							let txt = crlf(data.toString());

							if (value.ext == '.txt')
							{
								return splitTxt(txt);
							}

							return txt;
						})
					;

					if (!options.noLog)
					{
						let {
							source_idx,
							volume_title,
							chapter_title,
							dir,
							file,
						} = row;

						console.dir({
							source_idx,
							volume_title,
							chapter_title,
							dir,
							file,
						});
					}

					let chapter = new EpubMaker.Section(EnumEpubTypeName.CHAPTER, makeChapterID(temp.count_idx++), {
						title: name,
						content: txt,
					}, true, false);

					stat.chapter++;

					volume.withSubSection(chapter);

					let vi = vs_ret.level - 1;

					let vol_key = vs_ret.titles_full[vi];

					temp.cache_vol[vol_key]++;
					temp.prev_volume_title = volume_title;
					temp.prev_volume_dir = dirname;
					temp.prev_volume = volume;

					temp.prev_volume_row = {
						vol_key: vol_key + '.dir',
						dirname,
						value,
					};

					temp.cache_volume_row.push(temp.prev_volume_row);

					return volume;

				}, <IEpubRuntimeReturn>{

					data: {
						stat: {
							volume: 0,
							chapter: 0,
							image: 0,
						},
					},

					temp: {
						cache_vol: {},

						prev_volume_title: null,
						prev_volume_dir: null,

						prev_volume: null,

						prev_volume_row: null,

						cache_top_subs: {},

						cache_volume_row: [],

						count_idx: 0,
						count_f: 0,
						count_d: 0,

						cacheTreeSection: {},
					},
				})
					.tap(async (processReturn: IEpubRuntimeReturn) =>
					{
						const { temp } = processReturn;

						await _handleVolumeImageEach(temp.cache_volume_row, {
							epub,
							processReturn,
						});

						if (temp._old_top_level && !epub.hasSection(temp._old_top_level))
						{
							epub.withSection(temp._old_top_level);
						}

						if (temp._new_top_level && !epub.hasSection(temp._new_top_level))
						{
							epub.withSection(temp._new_top_level);
						}

						/*

						console.dir(ret.data, {
							depth: null,
							colors: true,
						});
						console.dir(ret.temp, {
							depth: null,
							colors: true,
						});

						 */

						//process.exit();
					})
					;
			})
		;

		//console.dir(epub.epubConfig.sections[0]);
		//console.dir(epub.epubConfig.landmarks.slice(0, 2));
		//process.exit();

		let data = await epub.makeEpub();

		let _file_data = makeFilename(options, epub, meta);

		let { file, filename, now, basename, ext } = _file_data;

		await fs.outputFile(file, data);

		const stat = processReturn.data.stat;

		console.success(filename, now.format(), stat);

		return {
			file,
			filename,
			epub,

			outputPath: options.outputPath,

			basename,
			ext,

			stat,
		};
	});
}

export function makeFilename(options: IOptions, epub: EpubMaker, meta: IMdconfMeta)
{
	options = makeOptions(options);

	let filename = epub.getFilename(options.useTitle, true);

	if (!options.filename)
	{
		if (options.filenameLocal)
		{
			// @ts-ignore
			if (meta.novel.title_output)
			{
				// @ts-ignore
				filename = meta.novel.title_output;
			}
			else if (Array.isArray(options.filenameLocal))
			{
				for (let v of options.filenameLocal)
				{
					if (meta.novel[v])
					{
						filename = meta.novel[v];
						break;
					}
				}
			}
			else if (meta.novel.title_zh)
			{
				filename = meta.novel.title_zh;
			}
			else if (meta.novel.title_short)
			{
				filename = meta.novel.title_short;
			}
			else if (meta.novel.title_tw)
			{
				filename = meta.novel.title_tw;
			}
			else if (typeof options.filenameLocal == 'string')
			{
				filename = options.filenameLocal;
			}
		}
	}

	const basename = filename;

	let ext = EpubMaker.defaultExt;

	let now = moment();

	if (options.padEndDate)
	{
		filename += '_' + now.format('YYYYMMDD_HHmmss');
	}

	filename += ext;

	let file = path.join(options.outputPath, filename);

	return {
		file,
		ext,
		filename,
		options,
		now,
		basename,
		epub,
		meta,
	}
}

export default create;
