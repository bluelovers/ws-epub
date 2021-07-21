/**
 * Created by user on 2017/12/16/016.
 */

import EpubMaker, { hashSum, slugify } from 'epub-maker2';
import { chkInfo, IMdconfMeta, mdconf_parse } from 'node-novel-info';
import { fsLowCheckLevelMdconfAsync, pathDirNormalize } from './util';
import { console } from './log';
import { createUUID } from 'epub-maker2/src/lib/uuid';
import { crlf } from 'crlf-normalize';
import { EnumEpubConfigVertical } from 'epub-maker2/src/config';
import { NodeNovelInfo } from 'node-novel-info/class';
import { sortTree } from '@lazy-glob/sort-tree';
import { IArrayDeepInterface, IReturnRow } from 'node-novel-globby';
import { eachVolumeTitle, foreachArrayDeepAsync } from 'node-novel-globby/lib/util';
import { EnumEpubTypeName } from 'epub-maker2/src/epub-types';
import {
	_handleVolume,
	_handleVolumeImage,
	_handleVolumeImageEach,
	_hookAfterEpub,
	_hookAfterVolume,
	addContributeSection,
	createContributeSection,
	getAttachMetaByRow,
	IEpubRuntimeReturn,
	makeChapterID,
	makeVolumeID,
	SymCache,
	IEpubMakerSectionWithCache, addMarkdown, EnumPrefixIDType, EnumPrefixIDTitle, createMarkdownSection,
} from './epub';
import Bluebird from 'bluebird';
import path from 'upath2';
import moment from 'moment';
import * as novelGlobby from 'node-novel-globby/g';
import deepmerge from 'deepmerge-plus';
import { inspect } from 'util';
import { EpubStore } from './store';
import { splitTxt } from './html';
import { handleMarkdown } from './md';
import { createEpubContextDate, EPUB_CONTEXT_DATE } from '@node-novel/epub-util/lib/const';
import { loadFile } from 'fs-iconv';
import { readFile, outputFile, pathExistsSync } from 'fs-extra';

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

	/**
	 * 是否直排
	 */
	vertical?: boolean | EnumEpubConfigVertical,

	/**
	 * 下載網路資源
	 */
	downloadRemoteFile?: boolean,

	iconv?: string | 'cn' | 'tw' | 'chs' | 'cht' | 'zhs' | 'zht',

	/**
	 * 允許指定 epub 內的檔案更新日期
	 */
	epubContextDate?: moment.MomentInput | Date | moment.Moment | true;

	beforeMakeEpub?(runtime: {
		TXT_PATH: string,
		epub: EpubMaker,
		processReturn: IEpubRuntimeReturn,
		options: IOptions,
	}): void;
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

				if (pathExistsSync(path.join(confPath, 'meta.md')))
				{
					let file = path.join(confPath, 'meta.md');

					meta = await readFile(file)
						.then(mdconf_parse)
					;
				}
				else if (pathExistsSync(path.join(confPath, 'README.md')))
				{
					let file = path.join(confPath, 'README.md');

					meta = await readFile(file)
						.then(mdconf_parse)
					;
				}
			}

			meta = chkInfo(meta);

			return meta;
		})
		.catch((e: Error) =>
		{

			if (e.message == 'Error: mdconf_parse' || e.message == 'mdconf_parse')
			{
				return null
			}

			return Bluebird.reject(e)
		})
		.tap(meta =>
		{

			if (!meta || !meta.novel || !meta.novel.title)
			{
				throw new Error(`not a valid novelInfo data, ${inspect(options)}`);
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

	options = deepmerge.all([{}, defaultOptions, options]);

	if (options.iconv)
	{
		switch (options.iconv)
		{
			case 'chs':
			case 'cn':
			case 'zhs':
				options.iconv = 'cn';
				break;
			case 'cht':
			case 'tw':
			case 'zht':
				options.iconv = 'tw';
				break;
			default:
				break;
		}
	}

	return options
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

	store: EpubStore,
}

export function create(options: IOptions, cache = {}): Bluebird<INovelEpubReturnInfo>
{
	return Bluebird.resolve().then(async function ()
	{
		//console.log(options, defaultOptions);

		options = makeOptions(options);

		//console.dir(options, {colors: true});

		const novelID = options.novelID;
		const TXT_PATH = pathDirNormalize(options.inputPath);

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
				// @ts-ignore
				], Object.assign({}, globby_options, {
					absolute: true,
				}))
				.then(ls =>
				{
					if (ls.length)
					{
						epub.withCover(ls[0]);
					}

					//console.log(ls);
				})
			;
		}

		if (options.epubContextDate)
		{
			if (typeof options.epubContextDate == 'boolean')
			{
				options.epubContextDate = createEpubContextDate();
			}

			epub.withContextDate(options.epubContextDate);
		}

		//process.exit();

		const store = new EpubStore();

		let count_idx = 0;

		{
			let file = path.join(TXT_PATH, 'FOREWORD.md');

			if (pathExistsSync(file))
			{
				let source = await readFile(file);

				let mdReturn = handleMarkdown(source, {
					cwd: TXT_PATH,
				});

				createMarkdownSection({
					target: epub,
					mdReturn,
					processReturn: {
						// @ts-ignore
						temp: {
							count_idx,
						}
					},

					epubType: EnumEpubTypeName.FOREWORD,
					epubTitle: EnumPrefixIDTitle.FOREWORD,
					epubPrefix: EnumPrefixIDType.FOREWORD,
				});

				count_idx++;
			}
		};

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

					/**
					 * 去除掉排序ID後的章節名稱
					 */
					let vs_ret = eachVolumeTitle(volume_title, true);
					/**
					 * 章節名稱 含 排序用的ID 來避免同一個資料夾下 有兩個相同 章節名稱
					 */
					let vs_ret2 = eachVolumeTitle(value.dir, false);

					const dirname = value.path_dir;

					let _ds = (path.normalize(dirname) as string).split('/');

					const volume: IEpubMakerSectionWithCache = await Bluebird
						.resolve(vs_ret2.titles_full)
						.reduce(async function (vp: IEpubMakerSectionWithCache, key, index)
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
									epubOptions: options,
									store,
									cwd: dirname,
									cwdRoot: TXT_PATH,
								})
									.tap(ls =>
									{

										//console.log(ls);

										if (0 && ls.length)
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

							let vc: IEpubMakerSectionWithCache;

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
									store,
									epubOptions: options,
									processReturn: cache,
									cwd: dirname,
									cwdRoot: TXT_PATH,
								});

								if (index == 0)
								{
									if (temp._old_top_level)
									{
										await _handleVolumeImageEach(temp.cache_top_subs[temp._old_top_level.id], {
											epub,
											processReturn: cache,
											epubOptions: options,
											store,
											cwd: dirname,
											cwdRoot: TXT_PATH,
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

					let txt = await loadFile(value.path, {
							autoDecode: true,
						})
						.then(async function (data)
						{
							let txt = crlf(data.toString());

							if (value.ext == '.txt')
							{
								let attach = await getAttachMetaByRow(row);

								return splitTxt(txt, {
									attach,
									store,
									vid: volume.id,
									epub,
									epubOptions: options,
									cwd: dirname,
									cwdRoot: TXT_PATH,
								});
							}

							return txt;
						})
					;

					if (!options.noLog)
					{
						let {
							source_idx,
							source_totals,
							volume_title,
							chapter_title,
							dir,
							file,
						} = row;

						/*
						console.dir({
							source_idx,
							volume_title,
							chapter_title,
							dir,
							file,
						});
						 */

						console.info(`[${(source_idx + 1).toString().padStart(4, '0')}／${source_totals.toString().padStart(4, '0')}]`, volume_title, `／`, chapter_title)
					}

					let chapter = new EpubMaker.Section(EnumEpubTypeName.CHAPTER, makeChapterID(temp.count_idx++), {
						title: name,
						content: txt,
					}, true, false);

					stat.chapter++;

					volume.withSubSection(chapter);

					let vi = vs_ret.level - 1;

					let vol_key = vs_ret2.titles_full[vi];

					temp.cache_vol[vol_key]++;
					temp.prev_volume_title = volume_title;
					temp.prev_volume_dir = dirname;
					temp.prev_volume = volume;

					temp.prev_volume_row = {
						vol_key: vol_key + '.dir',
						dirname,
						value,
					};

					temp.
					cache_volume_row.push(temp.prev_volume_row);

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

						count_idx: count_idx,
						count_f: 0,
						count_d: 0,

						cacheTreeSection: {},
					},
				})
					.tap(async (processReturn: IEpubRuntimeReturn) =>
					{
						const { temp } = processReturn;

						/*
						await _handleVolumeImageEach(temp.cache_volume_row, {
							epub,
							processReturn,
							epubOptions: options,
							store,
							cwdRoot: TXT_PATH,
						});
						 */

						await _hookAfterVolume(temp.cache_volume_row, {
							epub,
							processReturn,
							epubOptions: options,
							store,
							cwdRoot: TXT_PATH,
						}, [
							_handleVolumeImage,
							addContributeSection,
						]);

						if (temp._old_top_level && !epub.hasSection(temp._old_top_level))
						{
							epub.withSection(temp._old_top_level);
						}

						if (temp._new_top_level && !epub.hasSection(temp._new_top_level))
						{
							epub.withSection(temp._new_top_level);
						}
					})
					;
			})
			.tap(async (processReturn: IEpubRuntimeReturn) =>
			{

				await _hookAfterEpub(epub, {
					epub,
					processReturn,
					epubOptions: options,
					store,
					cwd: TXT_PATH,
					cwdRoot: TXT_PATH,
				}, [

					async (epub, _data_) =>
					{
						const { cwdRoot } = _data_;

						await novelGlobby.globby([
								'CONTRIBUTE.md',
							], {
								cwd: cwdRoot,
								absolute: true,
								deep: 0,
							})
							.then(async (ls) =>
							{
								if (ls.length)
								{
									let file = ls[0];

									let source = await readFile(file);

									let mdReturn = handleMarkdown(source, {
										..._data_,
										cwd: cwdRoot,
									});

									createContributeSection({
										target: epub,
										mdReturn,
										processReturn,
									})
								}
							})
						;

						if (epub[SymCache] ==  null)
						{
							epub[SymCache] = {};
						}

						await _handleVolumeImage(epub, TXT_PATH, {
							epub,
							processReturn: processReturn,
							epubOptions: options,
							store,
							cwd: cwdRoot,
							cwdRoot: TXT_PATH,
						})

					},

				])

			})
		;

		//console.dir(epub.epubConfig.sections[0]);
		//console.dir(epub.epubConfig.landmarks.slice(0, 2));
		//process.exit();

		if (options.beforeMakeEpub)
		{
			options.beforeMakeEpub({
				TXT_PATH: TXT_PATH,
				epub,
				options,
				processReturn,
			});
		}

		let data = await epub.makeEpub();

		let _file_data = makeFilename(options, epub, meta);

		let { file, filename, now, basename, ext } = _file_data;

		await outputFile(file, data);

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

			store,
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
