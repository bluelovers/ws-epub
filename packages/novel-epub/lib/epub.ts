import { IForeachArrayDeepReturn, IReturnRow } from 'node-novel-globby';
import EpubMaker, { ISectionContent } from 'epub-maker2';
import { fsLowCheckLevelMdconfAsync } from './util';
import { htmlPreface } from 'epub-maker2/src/lib/util';
import { LF } from 'crlf-normalize';
import { IMdconfMeta } from 'node-novel-info';
import { EnumEpubTypeName } from 'epub-maker2/src/epub-types';
import { INovelEpubReturnInfo } from './txt2epub3';
import { array_unique } from 'array-hyper-unique';
import { handleAttachFile } from './store';
import { IInternalProcessEpubOptions, IInternalProcessVolumeOptions, IResolvableBluebird } from './types';
import { novelImage } from './html';
import { handleMarkdown } from './md';
import { toGlobExtImage } from './ext';
import { toFullWidth } from 'str-util';
import Bluebird from 'bluebird';
import path from 'upath2';
import fs from 'fs-iconv';
import { globby } from 'node-novel-globby/g';
import { console } from './log';

export const SymCache = Symbol('cache');

export const enum EnumPrefixIDType
{
	VOLUME = 'volume',
	CHAPTER = 'chapter',
	IMAGE = 'image',
	CONTRIBUTE = 'contribute',
	FOREWORD = 'foreword',
}

export const enum EnumPrefixIDTitle
{
	IMAGE = '插圖',
	CONTRIBUTE = 'CONTRIBUTE',
	FOREWORD = 'FOREWORD',
}

export interface IEpubRuntimeReturnCacheVolumeRow
{
	vol_key: string,
	dirname: string,
	value: IReturnRow,
}

export type IEpubRuntimeReturn = IForeachArrayDeepReturn<IReturnRow, any, {
	stat: INovelEpubReturnInfo["stat"],
}, {
	cache_vol: {
		[vol: string]: number;
	},

	cache_volume_row: IEpubRuntimeReturnCacheVolumeRow[];

	cache_top_subs: {
		[k: string]: Omit<IEpubRuntimeReturnCacheVolumeRow, 'value'>[]
	};

	prev_volume_row?: IEpubRuntimeReturnCacheVolumeRow,

	prev_volume_title: string,
	prev_volume_dir: string,

	count_idx: number,
	count_f: number,
	count_d: number,

	cacheTreeSection: Record<string, IEpubMakerSectionWithCache>,

	prev_volume?: IEpubMakerSectionWithCache,

	_new_top_level?: IEpubMakerSectionWithCache,
	_old_top_level?: IEpubMakerSectionWithCache,

}>;

export interface IEpubMakerSectionWithCache extends EpubMaker.Section
{
	[SymCache]?: {
		cover?: boolean;
		image?: boolean;
		contribute?: boolean;
		foreword?: boolean;
	}
}

export function _handleVolume(volume: IEpubMakerSectionWithCache, dirname: string, _data_: IInternalProcessVolumeOptions)
{
	return Bluebird
		.resolve(null)
		.then(async function ()
		{
			const { processReturn, epub } = _data_;
			const { stat } = processReturn.data;

			let vid: string = volume.id;

			if (!volume[SymCache].cover)
			{
				volume[SymCache].cover = true;

				let file = path.join(dirname, 'README.md');

				let meta = await fsLowCheckLevelMdconfAsync(file).catch(e => null);

				//console.log(file, meta);

				await Bluebird.resolve(globby([
						'cover.*',
					], {
						cwd: dirname,
						absolute: true,
					}))
					.then(async (ls) =>
					{
						if (ls.length)
						{
							let ext = path.extname(ls[0]);
							let name = `${vid}-cover${ext}`;

							epub.withAdditionalFile(ls[0], null, name);

							return name;
						}
						else if (fs.existsSync(file))
						{
							if (meta && meta.novel)
							{
								if (meta.novel.cover)
								{
									let ext = '.png';
									let basename = `${vid}-cover`;
									let name = `${basename}${ext}`;

									let data = typeof meta.novel.cover === 'string' ? {
										url: meta.novel.cover,
									} : meta.novel.cover;

									data.ext = null;
									data.basename = basename;

									epub.withAdditionalFile(data, null, name);

									return name;
								}
							}
						}
					})
					.then(function (name)
					{
						let _ok = false;
						let data: ISectionContent = {};

						if (name)
						{
							_ok = true;
							data.cover = {
								name,
							};

							stat.image += 1;
						}

						if (meta && meta.novel)
						{
							if (meta.novel.preface)
							{
								_ok = true;
								//data.content = crlf(meta.novel.preface);

								data.content = htmlPreface({
									infoPreface: meta.novel.preface,
								}).infoPrefaceHTML;
							}
						}

						//console.log(name, _ok);

						if (_ok)
						{
							return data
						}

						return null
					})
					.tap(function (data)
					{
						if (data)
						{
							//console.log(volume);

							volume.setContent(data, true);
						}
					})
				;
			}

			if (!volume[SymCache].foreword)
			{
				volume[SymCache].foreword = true;

				let file = path.join(dirname, 'FOREWORD.md');

				if (fs.pathExistsSync(file))
				{
					addMarkdown({
						volume,
						dirname,
						_data_,
						file,
						epubType: EnumEpubTypeName.FOREWORD,
						epubPrefix: EnumPrefixIDType.FOREWORD,
						epubTitle: EnumPrefixIDTitle.FOREWORD,
					})
				}
			}
		})
		;
}

export function addMarkdown(options: {
	volume: IEpubMakerSectionWithCache,
	dirname: string,
	_data_: IInternalProcessVolumeOptions,
	file: string,
	epubType: EnumEpubTypeName,
	epubPrefix: EnumPrefixIDType,
	epubTitle: string | EnumPrefixIDTitle
	})
{
	return Bluebird.resolve(options)
		.then(async () => {

			let { volume, _data_, file, dirname } = options;

			const vid: string = volume.id;

			const { processReturn } = _data_;

			let source = await fs.readFile(file);

			let mdReturn = handleMarkdown(source, {
				..._data_,
				cwd: dirname,
				vid,
			});

			let chapter = createMarkdownSection({
				target: volume,
				mdReturn,
				processReturn,

				epubType: options.epubType,
				epubTitle: options.epubTitle,
				epubPrefix: options.epubPrefix,
			});

			return chapter
		})
	;
}

export function makePrefixID(count_idx: number, prefix: EnumPrefixIDType)
{
	return `${prefix}${(count_idx).toString().padStart(6, '0')}`;
}

export function makeVolumeID(count_idx: number)
{
	return makePrefixID(count_idx, EnumPrefixIDType.VOLUME);
}

export function makeChapterID(count_idx: number)
{
	return makePrefixID(count_idx, EnumPrefixIDType.CHAPTER);
}

export interface IAttachMetaData
{
	images: Record<string, string>
}

export function getAttachMeta(dirname: string): Promise<IAttachMetaData>
{
	return fsLowCheckLevelMdconfAsync(path.join(dirname, 'ATTACH.md'))
		// @ts-ignore
		.then<IAttachMetaData>((v: IMdconfMeta & {
			attach: IAttachMetaData
		}) =>
		{
			if (v.attach)
			{
				return v.attach as any as IAttachMetaData
			}
			// @ts-ignore
			else if (v.novel && v.novel.attach)
			{
				// @ts-ignore
				return v.novel.attach as any as IAttachMetaData
			}

			return v as any as IAttachMetaData
		})
		// @ts-ignore
		.then((attach: IAttachMetaData) => {

			if (attach && attach.images)
			{
				attach.images = Object.entries(attach.images)
					.reduce((a, [k, v]) => {

						a[k] = v;

						let k2 = k.toString().toLowerCase();

						if (a[k2] == null)
						{
							a[k2] = v;
						}

						k2 = k2.toUpperCase();

						if (a[k2] == null)
						{
							a[k2] = v;
						}

						return a;
					}, {} as IAttachMetaData["images"])
			}

			return attach
		})
		.catch(e => null as IAttachMetaData)
		;
}

const AttachMetaMap = new Map<string, IAttachMetaData>();

export async function getAttachMetaByRow(row: IReturnRow)
{
	if (!AttachMetaMap.has(row.path_dir))
	{
		let data = await getAttachMeta(row.path_dir);

		AttachMetaMap.set(row.path_dir, data);
	}

	return AttachMetaMap.get(row.path_dir)
}

export function _handleVolumeImage(volume: IEpubMakerSectionWithCache | EpubMaker, dirname: string, _data_: IInternalProcessVolumeOptions): Bluebird<string[]>
{

	const globImages = [
		...toGlobExtImage(),
		'!cover.*',
		'!*.txt',
	];

	const baseImagePath = 'image';
	const failbackExt = '.png';

	return Bluebird.resolve(null)
		.then(async function ()
		{
			if (volume[SymCache].image)
			{
				return [] as string[];
			}

			const { processReturn, epub, epubOptions, store, cwdRoot } = _data_;
			const { stat } = processReturn.data;

			let vid: string;

			if (volume instanceof EpubMaker)
			{
				vid = '';
			}
			else
			{
				vid = volume.id;
			}

			volume[SymCache].image = true;

			return globby(globImages, {
					cwd: dirname,
					absolute: true,
				})
				.then(async (ls) =>
				{
					let arr: string[] = [];
					let arr2: {
						attr?: string,
						src: string,
					}[] = [];

					for (let i in ls)
					{
						let img = ls[i];

						/*
						let ext = path.extname(img);

						let basename = path.basename(img, ext);

						// @ts-ignore
						let name = slugify(basename);

						if (!name || arr.includes(name))
						{
							name = hashSum([img, i, name]);
						}

						//name = `${vid}/${i}-` + name + ext;
						name = `${vid}/` + name + ext;

						arr.push('image/' + name);

						epub.withAdditionalFile(img, 'image', name);
						 */

						let ret = handleAttachFile(img, {
							vid,
							epub,
							epubOptions,
							store,
							basePath: baseImagePath,
							failbackExt,
							cwd: dirname,
							cwdRoot,
						});

						if (ret && !arr.includes(ret.returnPath))
						{
							arr.push(ret.returnPath);
							arr2.push({
								attr: ` alt="（IMG：${toFullWidth('' + ret.data.basename)}）"`,
								src: ret.returnPath,
							})
						}
					}

					let md_attach = await getAttachMeta(dirname);

					if (md_attach && (md_attach.images))
					{
						Object.values(md_attach.images)
							.forEach(v =>
							{
								if (v)
								{
									let ret = handleAttachFile(v, {
										vid,
										epub,
										epubOptions,
										store,
										basePath: baseImagePath,
										failbackExt,
										cwd: dirname,
										cwdRoot,
									});

									if (ret && !arr.includes(ret.returnPath))
									{
										arr.push(ret.returnPath);
										arr2.push({
											attr: ` alt="（插圖${toFullWidth(v)}）"`,
											src: ret.returnPath,
										})
									}
								}
							})
						;
					}

					arr = array_unique(arr);

					if (arr.length)
					{
						if (volume instanceof EpubMaker.Section)
						{
							if (volume.content && volume.content.cover && volume.content.cover.name)
							{
								arr.unshift(volume.content.cover.name);
							}
						}

						let chapter = new EpubMaker.Section(EnumEpubTypeName.NON_SPECIFIC_BACKMATTER, makePrefixID(processReturn.temp.count_idx++, EnumPrefixIDType.IMAGE), {
							title: EnumPrefixIDTitle.IMAGE,
							content: arr2.reduce(function (a, b)
							{
								let html = novelImage(b.src, {
									attr: b.attr,
								});

								a.push(html);

								return a;
							}, []).join(LF),
						}, true, false);

						stat.image += arr.length;

						//volume.withSubSection(chapter);

						_withSection(volume, chapter)
					}

					return ls;
				})
				;
		})
		;
}

export function _handleVolumeImageEach(ls: Omit<IEpubRuntimeReturnCacheVolumeRow, 'value'>[], _data_: IInternalProcessVolumeOptions): Bluebird<string[][]>
{
	const { processReturn, epub, store, epubOptions, cwd } = _data_;
	const temp = processReturn.temp;

	return Bluebird
		.resolve(array_unique(ls))
		.mapSeries(async function (row: Omit<IEpubRuntimeReturnCacheVolumeRow, 'value'>)
		{
			let key = row.vol_key;
			let volume = temp.cacheTreeSection[key];

			return _handleVolumeImage(volume, row.dirname, _data_)
				.tap(function (ls)
				{
					if (0 && ls.length)
					{
						console.log({
							volume,
							ls,
						});
					}
				})
				;
		})
		;
}

export function _hookAfterVolume(ls: IEpubRuntimeReturn["temp"]["cache_volume_row"],
	_data_: IInternalProcessVolumeOptions,
	afterVolumeTasks: ((volume: IEpubMakerSectionWithCache, dirname: string, _data_: IInternalProcessVolumeOptions, row: IEpubRuntimeReturnCacheVolumeRow) => IResolvableBluebird<unknown>)[],
)
{
	const { processReturn, epub, store, epubOptions, cwd } = _data_;
	const temp = processReturn.temp;

	ls = array_unique(ls);

	return Bluebird
		.resolve(ls)
		.mapSeries(async function (row: IEpubRuntimeReturnCacheVolumeRow, index)
		{
			let key = row.vol_key;
			let volume = temp.cacheTreeSection[key];

			return Bluebird.props({
				index,
				row,

				volume,

				mapData: Bluebird.mapSeries(afterVolumeTasks, async (fn, index) => {

					return {
						index,
						fn,
						ret: await fn(volume, row.dirname, _data_, row as IEpubRuntimeReturnCacheVolumeRow),
					};
				})
			});
		})
		;
}

export function _hookAfterEpub(epub: EpubMaker,
	_data_: IInternalProcessEpubOptions,
	afterEpubTasks: ((epub: EpubMaker, _data_: IInternalProcessEpubOptions) => IResolvableBluebird<unknown>)[],
)
{
	return Bluebird
		.resolve(epub)
		.then(async function (epub)
		{
			return Bluebird.props({

				epub,

				mapData: Bluebird.mapSeries(afterEpubTasks, async (fn, index) => {

					return {
						index,
						fn,
						ret: await fn(epub, _data_),
					};
				})
			});
		})
		;
}

export function addContributeSection(volume: IEpubMakerSectionWithCache, dirname: string, _data_: IInternalProcessVolumeOptions, row: IEpubRuntimeReturnCacheVolumeRow): Bluebird<boolean>
{
	return Bluebird.resolve(volume)
		.then(async (volume) => {

			if (volume[SymCache].contribute != null)
			{
				return;
			}

			volume[SymCache].contribute = false;

			return globby([
				'CONTRIBUTE.md',
			], {
				cwd: dirname,
				absolute: true,
				deep: 0,
			})
				.then(async (ls) => {

					if (ls.length)
					{
						const vid: string = volume.id;
						const attach = await getAttachMetaByRow(row.value);

						const { processReturn } = _data_;

						let file = ls[0];

						let source = await fs.readFile(file);

						let mdReturn = handleMarkdown(source, {
							..._data_,
							cwd: dirname,
							vid,
							attach,
						});

						let chapter = createContributeSection({
							target: volume,
							mdReturn,
							processReturn,
						});

						return volume[SymCache].contribute = true
					}
				})
			;
		})
	;
}

export function createContributeSection(options : {
	target: IEpubMakerSectionWithCache | EpubMaker,
	mdReturn: ReturnType<typeof handleMarkdown>,
	processReturn: Partial<IEpubRuntimeReturn>,
})
{
	return createMarkdownSection({
		...options,
		epubType: EnumEpubTypeName.NON_SPECIFIC_BACKMATTER,
		epubTitle: EnumPrefixIDTitle.CONTRIBUTE,
		epubPrefix: EnumPrefixIDType.CONTRIBUTE,
	})
}

export function createMarkdownSection(options : {
	target: IEpubMakerSectionWithCache | EpubMaker,
	mdReturn: ReturnType<typeof handleMarkdown>,
	processReturn: Partial<IEpubRuntimeReturn>,

	epubType: EnumEpubTypeName,
	epubPrefix: EnumPrefixIDType,
	epubTitle: string | EnumPrefixIDTitle
})
{
	const { target, mdReturn, processReturn, } = options;

	let title = mdReturn.mdEnv.title || options.epubTitle;

	let chapter = new EpubMaker.Section(options.epubType, makePrefixID(processReturn.temp.count_idx++, options.epubPrefix), {
		title,
		content: mdReturn.mdHtml,
	}, true, false);

	return _withSection(target, chapter)
}

export function _withSection(target: IEpubMakerSectionWithCache | EpubMaker, chapter: EpubMaker.Section)
{
	if (target instanceof EpubMaker)
	{
		target.withSection(chapter);
	}
	else
	{
		target.withSubSection(chapter);
	}

	return chapter
}
