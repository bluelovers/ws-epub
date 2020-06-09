/**
 * Created by user on 2018/2/7/007.
 */

// @ts-ignore
import { EPub, SYMBOL_RAW_DATA } from 'epub2';
import { fixToc } from 'epub2/lib/toc';
import * as cheerio from 'cheerio';
import * as path from 'path';
import * as fs from 'fs-iconv';
import { trimFilename } from 'fs-iconv';

import * as Promise from 'bluebird';
import * as novelInfo from 'node-novel-info';
import { fixHtml2 } from './lib/html';
import removeZeroWidth, { nbspToSpace } from 'zero-width/lib';
import { fixText } from '@node-novel/epub-util/lib/extract/text';
import { fixCheerio } from '@node-novel/epub-util/lib/extract/cheerio';

export const IDKEY = 'epub';

export interface IOptions
{
	outputDir?: string,
	cwd?: string,

	/**
	 * print log message
	 */
	log?: boolean,

	noFirePrefix?: boolean,

	/**
	 * 用來強制解決某些目錄錯亂 或者 無法處理多層目錄的問題
	 */
	noVolume?: boolean,
}

export function epubExtract(srcFile: string, options: IOptions = {}): Promise<string>
{
	let cwd = options.cwd || process.cwd();

	//srcFile = srcFile.replace(/\u202A/g, '');

	//console.log(srcFile.charCodeAt(0));
	//console.log(path.isAbsolute(srcFile));

	if (!path.isAbsolute(srcFile))
	{
		srcFile = path.join(cwd, srcFile);
	}

	{
		let exists = fs.pathExistsSync(srcFile);

		if (!exists)
		{
			throw new Error(`file doesn't exist. "${srcFile}"`);
		}
	}

	if (!options.outputDir)
	{
		options.outputDir = path.join(cwd, IDKEY)
	}
	else if (!path.isAbsolute(options.outputDir))
	{
		options.outputDir = path.join(cwd, options.outputDir);
	}

	const PATH_NOVEL_MAIN = options.outputDir;

	// @ts-ignore
	return EPub.createAsync(srcFile)
		.then(async function (epub)
		{
			// 強制修正無對應的 toc
			await fixToc(epub);

			if (!epub.metadata.title)
			{
				epub.metadata.title = path.basename(srcFile, path.extname(srcFile))
			}

			let path_novel = path.join(PATH_NOVEL_MAIN,
				fixText(trimFilename(epub.metadata.title))
			);

			let currentVolume;
			let volume_list = [];

			let lastLevel = 0;

			await Promise.mapSeries(epub.toc, async function (elem, index)
			{
				let doc;
				let $;

				let isVolume: boolean;
				let skip: boolean;

				if ((epub.metadata.subject || []).includes('epub-maker2'))
				{
					if (/^\d+$|^volume\d+/.test(elem.id) && !elem.level)
					{
						isVolume = true;
					}
					else if (/^\d+|^chapter\d+/.test(elem.id))
					{
						isVolume = false;
					}
					else if (/^image\d+/.test(elem.id))
					{
						isVolume = false;
					}
					else
					{
						skip = true;
					}
				}
				else if (epub.ncx_depth >= 0)
				{
					if (!elem.level)
					{
						isVolume = true;
					}
				}

				let volume_index = index;
				let chapter_index = index;

				if (!skip)
				{
					if (options.noVolume)
					{
						isVolume = false;
					}
					else if (!isVolume && lastLevel != elem.level)
					{
						// 強制產生目錄
						doc = await epub.getChapterAsync(elem.id);
						$ = getCheerio(doc = fixHtml2(doc));

						let volume_title: string;

						let a = $('section header h2').eq(0);

						if (!a.length)
						{
							a = $('h2, h3, h1').eq(0);
						}

						if (!a.length && !elem.title)
						{
							let doc = await epub.getChapterRawAsync(elem.id);
							let $ = getCheerio(doc);
							a = $('title').eq(0);
						}

						volume_title = (a.text() || elem.title).replace(/^\s+|\s+$/g, '');

						volume_title = fixText(volume_title);

						currentVolume = volume_list[volume_list.length] = {
							level: elem.level,
							volume_index: volume_index,
							volume_title: volume_title || 'null',
							chapter_list: [],
						};

						lastLevel = elem.level;
					}

					if (isVolume)
					{
						doc = await epub.getChapterAsync(elem.id);
						$ = getCheerio(doc = fixHtml2(doc));

						let a = $('section header h2').eq(0);

						if (!a.length)
						{
							a = $('h2, h3, h1').eq(0);
						}

						if (!a.length && !elem.title)
						{
							let doc = await epub.getChapterRawAsync(elem.id);
							let $ = getCheerio(doc);

							a = $('title').eq(0);
						}

						let volume_title = (a.text() || elem.title).replace(/^\s+|\s+$/g, '');

						volume_title = fixText(volume_title);

						currentVolume = volume_list[volume_list.length] = {
							level: elem.level,
							volume_index: volume_index,
							volume_title,
							chapter_list: [],
						}
					}
					else
					{
						doc = await epub.getChapterAsync(elem.id);
						$ = getCheerio(doc = fixHtml2(doc));

						let chapter_title: string;

						let a = $('section header h2').eq(0);

						if (!a.length)
						{
							a = $('h2, h3, h1').eq(0);
						}

						if (!a.length && !elem.title)
						{
							let doc = await epub.getChapterRawAsync(elem.id);
							let $ = getCheerio(doc = fixHtml2(doc));

							a = $('title').eq(0);
						}

						chapter_title = (a.text() || elem.title).replace(/^\s+|\s+$/g, '');

						chapter_title = fixText(chapter_title);

						a = $('section article').eq(0);

						if (!a.length)
						{
							a = $.root();
						}

						a.html((function (old)
						{
							let html = fixHtml2(old);

							html = html.replace(/(\/p>)(?=[^\n]*?<p)/ig, '$1\n');

							return html;
						})(a.html()));

						let chapter_article = a.text().replace(/^[\r\n]+|[\r\n\s]+$/g, '');

						if (!currentVolume)
						{
							currentVolume = volume_list[volume_list.length] = {
								level: Math.max(0, elem.level - 1),
								volume_index: volume_index,
								volume_title: 'null',
								chapter_list: [],
							};
						}

						chapter_article = fixText(chapter_article);

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
								level: elem.level,
								chapter_index: chapter_index,
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
				let vid = volume.volume_index.toString().padStart(4, '0') + '0';

				let dirname = path.join(path_novel,
					`${vid} ${trimFilename(volume.volume_title)}`
					)
				;

				return Promise.mapSeries(volume.chapter_list, async function (chapter)
				{
					let ext = '.txt';

					// @ts-ignore
					let name = trimFilename(chapter.chapter_title);

					if (!options.noFirePrefix)
					{
						// @ts-ignore
						let cid = chapter.chapter_index.toString().padStart(4, '0') + '0';

						name = `${cid}_${name}`;
					}

					let file = path.join(dirname,

						`${name}${ext}`
					);

					// @ts-ignore
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

export function getCheerio(doc: string)
{
	let $ = cheerio.load(fixHtml2(doc));

	fixCheerio('body', $);

	return $
}

export { fixText }

export default epubExtract;
