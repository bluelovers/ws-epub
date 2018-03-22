/**
 * Created by user on 2017/12/16/016.
 */

import * as fs from 'fs-iconv';
import EpubMaker, { hashSum, slugify } from 'epub-maker2';
import * as Promise from 'bluebird';
import * as path from 'path';
import * as StrUtil from 'str-util';
import * as moment from 'moment';
import * as novelGlobby from 'node-novel-globby';
import { mdconf_parse, IMdconfMeta, chkInfo } from 'node-novel-info';
import { splitTxt } from './util';
import * as deepmerge from 'deepmerge-plus';

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

	novelConf?,

	epubTemplate?,

	epubLanguage?: string,

	padEndDate?: boolean,

	globbyOptions?: novelGlobby.IOptions,

	useTitle?: boolean,
	filenameLocal?: boolean | string[] | string,

	noLog?: boolean,
}

export const defaultOptions: Partial<IOptions> = {
	epubTemplate: 'lightnovel',
	epubLanguage: 'zh',
	//padEndDate: true,

	globbyOptions: {
		checkRoman: true,
		useDefaultPatternsExclude: true,
	},
};

export async function getNovelConf(options: IOptions, cache = {}): Promise<IMdconfMeta>
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
}

export function create(options: IOptions, cache = {}): Promise<{
	file: string,
	filename: string,
	epub: EpubMaker,

	outputPath: string,
	basename: string,
	ext: string,
}>
{
	return Promise.resolve().then(async function ()
	{
		options = deepmerge.all([{}, defaultOptions, options]);

		let novelID = options.novelID;
		let TXT_PATH = options.inputPath;

		let meta = await getNovelConf(options, cache);

		let globby_patterns: string[];
		let globby_options: novelGlobby.IOptions = Object.assign({}, options.globbyOptions, {
			cwd: TXT_PATH,
			//useDefaultPatternsExclude: true,
			//checkRoman: true,
		});

		{
			[globby_patterns, globby_options] = novelGlobby.getOptions(globby_options);
		}

		//console.log(options, globby_options);

		console.log(meta.novel.title);
		//console.log(meta.novel.preface);

		let epub = new EpubMaker()
			.withTemplate(options.epubTemplate)
			.withLanguage(options.epubLanguage)
			.withUuid(hashSum([
				meta.novel.title,
				meta.novel.author,
			]))
			.withTitle(meta.novel.title, meta.novel.title_short || meta.novel.title_zh)
			.addAuthor(meta.novel.author)
			.withCollection({
				name: meta.novel.title,
			})
			.withInfoPreface(meta.novel.preface)
			.addTag(meta.novel.tags)
			.addAuthor(meta.contribute)
		;

		if (options.filename)
		{
			epub.epubConfig.filename = options.filename;
		}

		if (meta.novel.source)
		{
			epub.addLinks(meta.novel.source);
		}

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

		await novelGlobby
			.globbyASync(globby_patterns, globby_options)
			.then(function (ls)
			{
				//console.log(ls);

				//process.exit();

				return ls;
			})
			.then(_ls =>
			{
				let idx = 1;

				return Promise
					.mapSeries(Object.keys(_ls), async function (val_dir)
					{
						let vid = `volume${(idx++).toString().padStart(4, '0')}`;

						let ls = _ls[val_dir];
						let dirname = ls[0].path_dir;
						let volume_title = ls[0].volume_title;

						let volume = new EpubMaker.Section('auto-toc', vid, {
							title: volume_title,
						}, false, true);

						await novelGlobby.globby([
								'cover.*',
							], {
								cwd: dirname,
								absolute: true,
							})
							.then(ls =>
							{
								if (ls.length)
								{
									let ext = path.extname(ls[0]);
									let name = `${vid}-cover${ext}`;

									epub.withAdditionalFile(ls[0], null, name);

									volume.setContent({
										cover: {
											name: name
										}
									});
								}
							})
						;

						//console.log(dirname);

						//volume.withSubSection(new EpubMaker.Section('auto-toc', null, null, false, false));

						await Promise.mapSeries(ls, async function (row)
						{
							//console.log(filename);

							//let data = await fs.readFile(path.join(TXT_PATH, dirname, filename));
							let data: string | Buffer = await fs.readFile(row.path);

							//console.log(data);

							if (row.ext == '.txt')
							{
								data = splitTxt(data.toString());
							}

							if (Buffer.isBuffer(data))
							{
								data = data.toString();
							}

							let name = row.chapter_title;

							if (!options.noLog)
							{
								console.log(row);
							}

							let chapter = new EpubMaker.Section('chapter', `chapter${(idx++).toString().padStart(4, '0')}`, {
								title: name,
								content: data.toString().replace(/\r\n|\r(?!\n)|\n/g, "\n"),
							}, true, false);

							volume.withSubSection(chapter);
						});

						await novelGlobby.globby([
								'*.{jpg,gif,png,jpeg,svg}',
								'!cover.*',
								'!*.txt',
							], {
								cwd: dirname,
								absolute: true,
							})
							.then(ls =>
							{
								let arr = [];

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

								if (arr.length)
								{
									if (volume.content && volume.content.cover && volume.content.cover.name)
									{
										arr.unshift(volume.content.cover.name);
									}

									let chapter = new EpubMaker.Section('non-specific backmatter', `image${(idx++).toString().padStart(4, '0')}`, {
										title: '插圖',
										content: arr.reduce(function (a, b)
										{
											let html = `<figure class="fullpage ImageContainer page-break-before"><img id="CoverImage" class="CoverImage" src="${b}" alt="Cover" /></figure>`;

											a.push(html);

											return a;
										}, []).join("\n"),
									}, true, false);

									volume.withSubSection(chapter);
								}
							})
						;

						epub.withSection(volume);

						return volume;
					})
					;
			})
		;

		let data = await epub.makeEpub();

		let filename = epub.getFilename(options.useTitle, true);

		if (!options.filename)
		{
			if (options.filenameLocal)
			{
				if (Array.isArray(options.filenameLocal))
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

		await fs.outputFile(file, data);

		console.log(filename, now);

		return {
			file,
			filename,
			epub,

			outputPath: options.outputPath,

			basename,
			ext,
		};
	});
}

export default create;
