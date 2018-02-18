/**
 * Created by user on 2017/12/16/016.
 */

import * as fs from 'fs-iconv';
import EpubMaker, { hashSum, slugify } from '..';
import * as Promise from 'bluebird';
import * as path from 'path';
import * as StrUtil from 'str-util';
import * as moment from 'moment';
import * as novelGlobby from 'node-novel-globby';
import { mdconf_parse, IMdconfMeta } from 'node-novel-info';

/**
 * 小說資料夾名稱
 */
let novelID: string;

novelID = '黑之魔王';

/**
 * 小說 txt 的主資料夾路徑
 * @type {string}
 */
let TXT_PATH = path.join(__dirname, 'res', novelID);
TXT_PATH = path.join('D:\\Users\\Documents\\The Project\\nodejs-test\\node-novel2\\dist_novel\\user_out', novelID);

(async () =>
{
	let meta: IMdconfMeta;

	if (fs.existsSync(path.join(TXT_PATH, 'meta.md')))
	{
		meta = await fs.readFile(path.join(TXT_PATH, 'meta.md'))
			.then(mdconf_parse)
	}
	else if (fs.existsSync(path.join(TXT_PATH, 'README.md')))
	{
		meta = await fs.readFile(path.join(TXT_PATH, 'README.md'))
			.then(mdconf_parse)
	}
	else
	{
		throw new Error();
	}

	console.log(meta.novel.title);
	console.log(meta.novel.preface);

	let epub = new EpubMaker()
		.withTemplate('lightnovel')
		.withLanguage('zh')
		.withUuid(hashSum([
			meta.novel.title,
			meta.novel.author,
		]))
		.withTitle(meta.novel.title, meta.novel.title_short)
		.addAuthor(meta.novel.author)
		//.withPublisher('syosetu')
		//.withCover('./res/cover.jpg')
		//.withCover(meta.novel.cover)
		.withCollection({
			name: meta.novel.title,
		})
		.withInfoPreface(meta.novel.preface)
		.addTag(meta.novel.tags)
		.addAuthor(meta.contribute)
	;

	if (meta.novel.source)
	{
		epub.addLinks(meta.novel.source);
	}

	if (meta.novel.series)
	{
		epub.withSeries(meta.novel.series.name, meta.novel.series.position);
	}

	if (meta.novel.publisher)
	{
		epub.withPublisher(meta.novel.publisher);
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

	await novelGlobby.globby([
		'cover.*',
	], {
		cwd: TXT_PATH,
		absolute: true,
	})
		.then(ls =>
		{
			if (ls.length)
			{
				epub.withCover(ls[0]);
			}
		})
	;

	let globby_patterns: string[];
	let globby_options: novelGlobby.IOptions = {
		cwd: TXT_PATH,
		useDefaultPatternsExclude: true,
	};

	{
		let ret = novelGlobby.getOptions(globby_options);
		[globby_patterns, globby_options] = [ret.patterns, ret.options];
	}

	await novelGlobby
		.globbyASync(globby_patterns, globby_options)
		.then(function (ls)
		{
			console.log(ls);

			//process.exit();

			return ls;
		})
		.then(_ls =>
		{
			let idx = 1;

			return Promise
				.mapSeries(Object.keys(_ls), async function (val_dir)
				{
					let vid = `volume${idx++}`;

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
						let data = await fs.readFile(row.path);

						//console.log(data);

						if (row.ext == '.txt')
						{
							// @ts-ignore
							data = splitTxt(data.toString());
						}

						if (Buffer.isBuffer(data))
						{
							// @ts-ignore
							data = data.toString();
						}

//						if (row.file == '0000_插画.71349')
//						{
//							//console.log(data);
//
//							//process.exit();
//						}

						//let name = path.basename(filename, path.extname(filename));
						let name = row.chapter_title;

						console.log(row);

						let chapter = new EpubMaker.Section('chapter', `chapter${idx++}`, {
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
								//console.log(arr);

								if (volume.content && volume.content.cover && volume.content.cover.name)
								{
									arr.unshift(volume.content.cover.name);
								}

								let chapter = new EpubMaker.Section('non-specific backmatter', `image${idx++}`, {
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

	await fs.outputFile('./temp/' + epub.getFilename(), data);

	console.log(epub.getFilename(), moment());

})();

function splitTxt(txt)
{
	return (
		'<p>' +
		txt
			.toString()
			.replace(/\r\n|\r(?!\n)|\n/g, "\n")

			.replace(/\u003C/g, '&lt;')
			.replace(/\u003E/g, '&gt;')

			.replace(/&lt;(img.+)\/?&gt;/gm, function (...m)
			{
				//console.log(m);

				return `<${m[1].replace(/\/+$/, '')} class="inner-image"/>`;
			})

			.replace(/^[－＝\-—\=─]{3,}$/mg, '<hr/>')

			.replace(/\n/g, '</p><p>')
		+ '</p>')

		.replace(/<p><hr\/><\/p>/g, '<hr class="linehr"/>')

		.replace(/<p><\/p>/g, '<p class="linegroup softbreak">　 </p>')
		.replace(/<p>/g, '<p class="linegroup calibre1">')
		;
}
