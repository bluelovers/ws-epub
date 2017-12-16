/**
 * Created by user on 2017/12/16/016.
 */

import * as fs from 'fs-extra';
import EpubMaker from '..';
import * as Promise from 'bluebird';
import * as path from 'path';

let TXT_PATH = './res';

(async () =>
{

	let epub = new EpubMaker()
		.withTemplate('lightnovel')
		.withLanguage('zh')
		.withTitle('黒の魔王')
		.withAuthor('菱影代理')
		.withCover('./res/cover.jpg')
		.withCover('https://2.bp.blogspot.com/-qG7giNZTRuI/VkpMgj44IfI/AAAAAAAAAL4/MldUKuehBaE/s1600/volumen-1-0.jpg')
	;

	await fs.readdir(TXT_PATH)
		.then(ls =>
		{
			return Promise
				.filter(ls, async function (dirname)
				{
					let stat = await fs.stat(path.join(TXT_PATH, dirname));

					return stat.isDirectory();
				})
				.mapSeries(async function (dirname)
				{
					let volume = new EpubMaker.Section('auto-toc', null, {
						title: dirname,
					}, false, true);

					let ls = await fs.readdir(path.join(TXT_PATH, dirname))
					;

					//volume.withSubSection(new EpubMaker.Section('auto-toc', null, null, false, false));

					await Promise.filter(ls, async function (filename)
					{
						let file = path.join(TXT_PATH, dirname, filename);

						let stat = await fs.stat(file);

						return stat.isFile() && path.extname(file) == '.txt';
					}).mapSeries(async function (filename)
					{
						let data = await fs.readFile(path.join(TXT_PATH, dirname, filename));

						data = splitTxt(data.toString());

						let name = path.basename(filename, path.extname(filename));

						let chapter = new EpubMaker.Section('chapter', 'chapter-1', {
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
