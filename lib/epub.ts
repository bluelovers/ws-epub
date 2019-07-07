import { IForeachArrayDeepReturn, IReturnRow } from 'node-novel-globby';
import EpubMaker, { hashSum, ISectionContent, slugify } from 'epub-maker2';
import Bluebird = require('bluebird');
import { console, fsLowCheckLevelMdconfAsync, splitTxt } from './util';
import { htmlPreface } from 'epub-maker2/src/lib/util';
import path = require('upath2');
import fs = require('fs-iconv');
import moment = require('moment');
import novelGlobby = require('node-novel-globby/g');
import deepmerge = require('deepmerge-plus');
import { crlf, LF } from 'crlf-normalize';
import { chkInfo, IMdconfMeta, mdconf_parse } from 'node-novel-info';
import { EnumEpubTypeName } from 'epub-maker2/src/epub-types';
import { INovelEpubReturnInfo } from './txt2epub3';
import { array_unique } from 'array-hyper-unique';

export default exports as typeof import('./epub');

export const SymCache = Symbol('cache');

export const enum EnumPrefixIDType
{
	VOLUME = 'volume',
	CHAPTER = 'chapter',
	IMAGE = 'image',
}

export const enum EnumPrefixIDTitle
{
	IMAGE = '插圖',
}

export type IEpubRuntimeReturn = IForeachArrayDeepReturn<IReturnRow, any, {
	stat: INovelEpubReturnInfo["stat"],
}, {
	cache_vol: {
		[vol: string]: number;
	},

	cache_volume_row: {
		vol_key: string,
		dirname: string,
		value?: IReturnRow,
	}[];

	cache_top_subs: {
		[k: string]: {
			vol_key: string,
			dirname: string,
		}[]
	};

	prev_volume_row?: {
		vol_key: string,
		dirname: string,
		value: IReturnRow,
	},

	prev_volume_title: string,
	prev_volume_dir: string,

	count_idx: number,
	count_f: number,
	count_d: number,

	cacheTreeSection: Record<string, EpubMaker.Section>,

	prev_volume?: EpubMaker.Section,

	_new_top_level?: EpubMaker.Section,
	_old_top_level?: EpubMaker.Section,

}>;

export function _handleVolume(volume: EpubMaker.Section, dirname: string, _data_: {
	processReturn: Partial<IEpubRuntimeReturn>,
	epub: EpubMaker,
})
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

				await Bluebird.resolve(novelGlobby.globby([
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
		.then<IAttachMetaData>((v: IMdconfMeta & {
			attach: IAttachMetaData
		}) =>
		{
			if (v.attach)
			{
				return v.attach
			}
			// @ts-ignore
			else if (v.novel && v.novel.attach)
			{
				// @ts-ignore
				return v.novel.attach as any as IAttachMetaData
			}

			return v as any as IAttachMetaData
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

export function _handleVolumeImage(volume: EpubMaker.Section, dirname: string, _data_: {
	processReturn: Partial<IEpubRuntimeReturn>,
	epub: EpubMaker,
})
{
	return Bluebird.resolve(null)
		.then(async function ()
		{
			if (volume[SymCache].image)
			{
				return [] as string[];
			}

			const { processReturn, epub } = _data_;
			const { stat } = processReturn.data;

			const vid: string = volume.id;

			volume[SymCache].image = true;

			return novelGlobby.globby([
					'*.{jpg,gif,png,jpeg,svg}',
					'image/*.{jpg,gif,png,jpeg,svg}',
					'images/*.{jpg,gif,png,jpeg,svg}',
					'!cover.*',
					'!*.txt',
				], {
					cwd: dirname,
					absolute: true,
				})
				.then(async (ls) =>
				{
					let arr: string[] = [];

					for (let i in ls)
					{
						let img = ls[i];

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
					}

					let md_attach = await getAttachMeta(dirname);

					if (md_attach && (md_attach.images))
					{
						Object.values(md_attach.images)
							.forEach(v =>
							{
								if (v)
								{
									arr.push(v);
								}
							})
						;
					}

					if (arr.length)
					{
						if (volume.content && volume.content.cover && volume.content.cover.name)
						{
							arr.unshift(volume.content.cover.name);
						}

						let chapter = new EpubMaker.Section(EnumEpubTypeName.NON_SPECIFIC_BACKMATTER, makePrefixID(processReturn.temp.count_idx++, EnumPrefixIDType.IMAGE), {
							title: EnumPrefixIDTitle.IMAGE,
							content: arr.reduce(function (a, b)
							{
								let html = htmlImage(b);

								a.push(html);

								return a;
							}, []).join(LF),
						}, true, false);

						stat.image += arr.length;

						volume.withSubSection(chapter);
					}

					return ls;
				})
				;
		})
		;
}

export function htmlImage(src: string)
{
	return `<figure class="fullpage ImageContainer page-break-before"><img id="CoverImage" class="CoverImage" src="${src}" alt="Cover" /></figure>`;
}

export function _handleVolumeImageEach(ls: IEpubRuntimeReturn["temp"]["cache_volume_row"], _data_: {
	processReturn: Partial<IEpubRuntimeReturn>,
	epub: EpubMaker,
})
{
	const { processReturn, epub } = _data_;
	const temp = processReturn.temp;

	return Bluebird
		.resolve(array_unique(ls))
		.mapSeries(async function (row)
		{
			let key = row.vol_key;
			let volume = temp.cacheTreeSection[key];

			return _handleVolumeImage(volume, row.dirname, {
				epub,
				processReturn,
			})
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