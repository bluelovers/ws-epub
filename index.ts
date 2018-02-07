/**
 * Created by user on 2018/2/7/007.
 */

import { EPub } from 'epub2';
import * as cheerio from 'cheerio';
import * as path from 'path';
import * as fs from 'fs-iconv';
import { trimFilename } from 'fs-iconv';

import * as Promise from 'bluebird';
import * as novelInfo from 'node-novel-info';

export const IDKEY = 'epub';

export interface IOptions
{
	outputDir?: string,
	cwd?: string,
	log?: boolean,
}

export async function epubExtract(srcFile: string, options: IOptions = {})
{
	let cwd = options.cwd || process.cwd();

	if (!path.isAbsolute(srcFile))
	{
		srcFile = path.join(cwd, srcFile);
	}

	{
		let exists = await fs.pathExists(srcFile);

		if (!exists)
		{
			throw new Error(`file not exists. "${srcFile}"`);
		}
	}

	if (!options.outputDir)
	{
		options.outputDir = path.join(process.cwd(), IDKEY)
	}
	else if (!path.isAbsolute(options.outputDir))
	{
		options.outputDir = path.join(cwd, options.outputDir);
	}

	//console.log(srcFile, options.outputDir);

	const PATH_NOVEL_MAIN = options.outputDir;

	return EPub.createAsync(srcFile)
		.then(async function (epub)
		{
			let path_novel = path.join(PATH_NOVEL_MAIN,
				trimFilename(epub.metadata.title)
			);

			let currentVolume;
			let volume_list = [];

			await Promise.mapSeries(epub.toc, async function (elem)
			{
				let doc;
				let $;

				let isVolume: boolean;
				let skip: boolean;

				if ((epub.metadata.subject || []).includes('epub-maker2'))
				{
					if (/^\d+$/.test(elem.id) && !elem.level)
					{
						isVolume = true;
					}
					else if (/^\d+/.test(elem.id))
					{
						isVolume = false;
					}
					else
					{
						skip = true;
					}
				}
				else if (epub.ncx_depth > 1)
				{
					if (!elem.level)
					{
						isVolume = true;
					}
				}

				if (!skip)
				{
					if (isVolume)
					{
						doc = await epub.getChapterAsync(elem.id);
						$ = cheerio.load(doc);

						let a = $('section header h2').eq(0);

						if (!a.length)
						{
							a = $('h2, h3, h1').eq(0);
						}

						currentVolume = volume_list[volume_list.length] = {
							volume_index: volume_list.length,
							volume_title: a.text().replace(/^\s+|\s+$/g, ''),
							chapter_list: [],
						}
					}
					else
					{
						doc = await epub.getChapterAsync(elem.id);
						$ = cheerio.load(doc);

						let chapter_title: string;

						let a = $('section header h2').eq(0);

						if (!a.length)
						{
							a = $('h2, h3, h1').eq(0);
						}

						chapter_title = (a.text() || elem.title).replace(/^\s+|\s+$/g, '')

						a = $('section article').eq(0);

						if (!a.length)
						{
							a = $.root();
						}

						let chapter_article = a.text().replace(/^[\r\n]+|[\r\n\s]+$/g, '');

						if (!currentVolume)
						{
							currentVolume = volume_list[volume_list.length] = {
								volume_index: volume_list.length,
								volume_title: 'null',
								chapter_list: [],
							};
						}

						if (chapter_article.indexOf(chapter_title) == 0)
						{
							chapter_article = chapter_article
								.slice(chapter_title.length)
								.replace(/^[\r\n]+|[\r\n\s]+$/g, '')
							;
						}

						currentVolume
							.chapter_list
							.push({
								chapter_index: currentVolume.chapter_list.length,
								chapter_title,
								chapter_article,
							})
						;
					}
				}
			});

			let novel = {
				novel_title: epub.metadata.title,
				novel_author: epub.metadata.creator,

				novel_desc: epub.metadata.description,
				novel_date: epub.metadata.date,
				novel_publisher: epub.metadata.publisher,

				volume_list,

				tags: epub.metadata.subject,

				contribute: epub.metadata.contribute,
			};

			await Promise.mapSeries(volume_list,async function (volume)
			{
				let vid = volume.volume_index.toString().padStart(3, '0') + '00';

				let dirname = path.join(path_novel,
					`${vid} ${trimFilename(volume.volume_title)}`
					)
				;

				return await Promise.mapSeries(volume.chapter_list, async function (chapter)
				{
					let ext = '.txt';
					let cid = chapter.chapter_index.toString().padStart(3, '0') + '00';

					let file = path.join(dirname,
						`${cid}_${trimFilename(chapter.chapter_title)}${ext}`
					);

					let text = chapter.chapter_article;

					await fs.outputFile(file, text);

					if (options.log)
					{
						console.log(file);
					}

					return file;
				});
			});

			{
				let epubMaker2 = false;
				let nodeNovel = false;

				epubMaker2 = (epub.metadata.subject || []).includes('epub-maker2');
				nodeNovel = (epub.metadata.subject || []).includes('node-novel');

				let options = {};
				options[IDKEY] = {
					'epub-maker2': epubMaker2,
					'node-novel': nodeNovel,
				};

				let md = novelInfo.stringify({
					options,
				}, novel, {
					tags: [
						IDKEY,
						"epub-extract",
						"node-novel",
					],

					options: {
						textlayout: {
							allow_lf2: true,
						},
					},
				});

				let file = path.join(path_novel, `README.md`);
				await fs.outputFile(file, md);
			}

			return path_novel;
		})
		;
}

export default epubExtract;
