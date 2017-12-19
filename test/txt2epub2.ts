/**
 * Created by user on 2017/12/16/016.
 */

import * as fs from 'fs-extra';
import * as mdconf from 'mdconf';
import EpubMaker from '..';
import * as Promise from 'bluebird';
import * as path from 'path';
import * as globby from 'globby';
import * as StrUtil from 'str-util';

let TXT_PATH = './res/四度目は嫌な死属性魔術師';

(async () =>
{
	let meta = await fs.readFile('./res/四度目は嫌な死属性魔術師/meta.md')
		.then(function (data)
		{
			return mdconf(data.toString());
		})
	;

	let epub = new EpubMaker()
		.withTemplate('lightnovel')
		.withLanguage('zh')
		.withTitle(meta.novel.title)
		.addAuthor(meta.novel.author)
		.withPublisher('syosetu')
		//.withCover('./res/cover.jpg')
		.withCover(meta.novel.cover)
		.withCollection({
			name: meta.novel.title,
		})
		.withInfoPreface(meta.novel.preface)
		.addTag([
			'syosetu',
			'异界', '穿越', '冒险', '后宫',
			//'病嬌',
		])
	;

	await globby([
		'**/*.txt',
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

				if (r.test(StrUtil.zh2num(file)))
				{
					a[dir][StrUtil.zh2num(file).replace(r, '$1')] = file;
				}
				else
				{
					a[dir][file] = file;
				}

				return a;
			}, {});
		})
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

	//console.log(epub);

})();

function splitTxt(txt)
{
	return (
		'<p>' +
		txt
			.replace(/\r\n|\r(?!\n)|\n/g, "\n")
			.replace(/\n/g, '</p><p>')
		+ '</p>')
		.replace(/<p><\/p>/g, '<p class="linegroup softbreak">　 </p>')
		.replace(/<p>/g, '<p class="linegroup calibre1">')
		;
}

// @ts-ignore
export default exports;
