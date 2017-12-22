/**
 * Created by user on 2017/12/16/016.
 */

import * as fs from 'fs-extra';
import EpubMaker, { hashSum, slugify } from '..';
import * as Promise from 'bluebird';
import * as path from 'path';
import * as globby from 'globby';
import * as StrUtil from 'str-util';
import * as moment from 'moment';
import { mdconf_meta, IMdconfMeta } from '../src/plugin/mdconf';

/**
 * 小說資料夾名稱
 */
let novelID: string;

novelID = '黒の魔王';
//novelID = '四度目は嫌な死属性魔術師';

//novelID = '那个人，后来_(2272)';
//novelID = '讨厌第四次的死属性魔术师_(2206)';

/**
 * 小說 txt 的主資料夾路徑
 * @type {string}
 */
let TXT_PATH = path.join(__dirname, 'res', novelID);
//TXT_PATH = path.join('D:\\Users\\Documents\\The Project\\nodejs-test\\node-novel2\\dist_novel\\dmzj_out', novelID);

(async () =>
{
	let meta: IMdconfMeta = await fs.readFile(path.join(TXT_PATH, 'meta.md'))
		.then(mdconf_meta)
	;

	let epub = new EpubMaker()
		.withTemplate('lightnovel')
		.withLanguage('zh')
		.withUuid(hashSum([
			meta.novel.title,
			meta.novel.author,
		]))
		.withTitle(meta.novel.title)
		.addAuthor(meta.novel.author)
		.withPublisher('syosetu')
		//.withCover('./res/cover.jpg')
		//.withCover(meta.novel.cover)
		.withCollection({
			name: meta.novel.title,
		})
		.withInfoPreface(meta.novel.preface)
		.addTag(meta.novel.tags)
	;

	if (meta.novel.cover)
	{
		epub.withCover(meta.novel.cover);
	}

	await globby([
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

	let globby_options = {
		cwd: TXT_PATH,
	};

	await globby([
		'**/*.txt',
		'!**/*.raw.txt',
		'!**/*.new.txt',
		'!**/out/**/*',
		'!**/raw/**/*',
		'!**/*_out/**/*',
		'!**/待修正屏蔽字.txt',
		'!**/英語.txt',
	], globby_options)
		.then(function (ls)
		{
			return glob_to_list(ls, globby_options);
		})
		.then(p_sort_list)
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

					await globby([
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
							data = splitTxt(data.toString());
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

					await globby([
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

								name = `${vid}/${i}-` + name + ext;

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
			.replace(/\r\n|\r(?!\n)|\n/g, "\n")

			.replace(/\u003C/g, '&lt;')
			.replace(/\u003E/g, '&gt;')

			.replace(/&lt;(img.+)\/?&gt;/gm, function (...m)
			{
				//console.log(m);

				return `<${m[1].replace(/\/+$/, '')} class="inner-image"/>`;
			})

			.replace(/^[－＝\-\=]{3,}$/mg, '<hr/>')

			.replace(/\n/g, '</p><p>')
		+ '</p>')

		.replace(/<p><hr\/><\/p>/g, '<hr class="linehr"/>')

		.replace(/<p><\/p>/g, '<p class="linegroup softbreak">　 </p>')
		.replace(/<p>/g, '<p class="linegroup calibre1">')
		;
}

function glob_to_list(glob_ls: string[], options = {})
{
	return Promise.resolve(glob_ls)
		.then(ls =>
		{
			return ls.reduce(function (a, b)
			{
				let dir = path.dirname(b);
				let ext = path.extname(b);
				let file = path.basename(b, ext);

				//console.log(b);

				let row = {
					path: options.cwd && !path.isAbsolute(b) ? path.join(options.cwd, b) : b,
					path_dir: options.cwd && !path.isAbsolute(dir) ? path.join(options.cwd, dir) : dir,

					dir: dir,
					file: file,
					ext: ext,

					volume_title: dir,
					chapter_title: file,

					val_file: file,
					val_dir: dir,
				};

				if (row.volume_title.match(/^\d+(.+)_\(\d+\)$/))
				{
					row.volume_title = RegExp.$1.trim();
				}

				if (row.chapter_title.match(/^\d+_(.+)\.\d+$/))
				{
					row.chapter_title = RegExp.$1.trim();
				}

				let r = /^第?(\d+)話/;
				let s2 = StrUtil.zh2num(row.val_file) as string;

				if (r.test(s2))
				{
					row.val_file = s2.replace(r, '$1');
				}

				a[row.val_dir] = a[row.val_dir] || {};
				a[row.val_dir][row.val_file] = row;

				return a;
			}, {});
		})
	;
}

function p_sort_list(ls: {
	[key: string]: {
		[key: string]: any,
	}
})
{
	return Promise.resolve(ls)
		.then(ls =>
		{
			//console.log(ls);

			let ks = Object.keys(ls)
				.reduce(function (a, b)
				{
					a[StrUtil.zh2num(b)] = b;

					return a;
				}, {})
			;

			let ks2 = Object.keys(ks);
			ks2.sort();

			let ks3 = ks2.reduce(function (a, b)
			{
				let key = ks[b];

				a[key] = ls[key];

				return a;
			}, {});

			return ks3;
		})
		.then(ls =>
		{
			//console.log(ls);

			for (let dir in ls)
			{
				let a = Object.keys(ls[dir]);
				a.sort();

				ls[dir] = Object.values(a.reduce(function (a, b)
				{
					a[b] = ls[dir][b];

					return a;
				}, {}));
			}

			return ls;
		})
		;
}

// @ts-ignore
export default exports;
