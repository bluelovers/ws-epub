/**
 * Created by user on 2017/12/16/016.
 */

import * as fs from 'fs-extra';
import EpubMaker, { hashSum } from '..';
import * as Promise from 'bluebird';
import * as path from 'path';
import * as globby from 'globby';
import * as StrUtil from 'str-util';
import * as moment from 'moment';
import { mdconf_meta, IMdconfMeta } from '../src/plugin/mdconf';

let novelID: string;
novelID = '黒の魔王';
novelID = '四度目は嫌な死属性魔術師';

//let TXT_PATH = './res/四度目は嫌な死属性魔術師';
let TXT_PATH = path.join(__dirname, 'res', novelID);

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
		.withCover(meta.novel.cover)
		.withCollection({
			name: meta.novel.title,
		})
		.withInfoPreface(meta.novel.preface)
		.addTag(meta.novel.tags)
	;

	await globby([
		'**/*.txt',
		'!**/*.raw.txt',
		'!**/*.new.txt',
		'!**/out/**/*',
		'!**/raw/**/*',
		'!**/*_out/**/*',
		'!**/待修正屏蔽字.txt',
		'!**/英語.txt',
	], {
		cwd: TXT_PATH,
	})
		.then(ls =>
		{
			return ls.reduce(function (a, b)
			{
				let dir = path.dirname(b);
				let file = path.basename(b);

				//console.log(b);

				a[dir] = a[dir] || {};

				let r = /^第?(\d+)話.+$/;

				let s2 = StrUtil.zh2num(file) as string;

				if (r.test(s2))
				{
					a[dir][s2.replace(r, '$1')] = file;
				}
				else
				{
					a[dir][file] = file;
				}

				return a;
			}, {});
		})
		.then(p_sort_list)
		/*
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
		*/
		.then(_ls =>
		{
			let idx = 1;

			return Promise
				.mapSeries(Object.keys(_ls), async function (dirname)
				{
					let volume = new EpubMaker.Section('auto-toc', `volume${idx++}`, {
						title: dirname,
					}, false, true);

					let ls = _ls[dirname];

					//console.log(dirname);

					//volume.withSubSection(new EpubMaker.Section('auto-toc', null, null, false, false));

					await Promise.mapSeries(ls, async function (filename)
					{
						//console.log(filename);

						let data = await fs.readFile(path.join(TXT_PATH, dirname, filename));

						//console.log(data);

						data = splitTxt(data.toString());

						let name = path.basename(filename, path.extname(filename));

						let chapter = new EpubMaker.Section('chapter', `chapter${idx++}`, {
							title: name,
							content: data,
						}, true, false);

						volume.withSubSection(chapter);
					});

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

			.replace(/\n/g, '</p><p>')
		+ '</p>')
		.replace(/<p><\/p>/g, '<p class="linegroup softbreak">　 </p>')
		.replace(/<p>/g, '<p class="linegroup calibre1">')
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
