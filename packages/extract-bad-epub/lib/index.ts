/**
 * Created by user on 2019/7/10.
 */

import JSZip = require('jszip');
import Bluebird = require('bluebird');
import { outputFile, readFile, trimFilename } from 'fs-iconv';
import { BufferFrom, decode, ENUM_NODE_ENCODING } from 'iconv-jschardet';
import micromatch = require('micromatch');
import { JSDOM, createJSDOM, IJSDOM, asyncJSDOM } from 'jsdom-extra';
import { minify } from 'html-minifier';
import path from 'upath2';
import { stringify } from 'mdconf2';
import { Console } from 'debug-color2';

export const console = new Console(null, {
	enabled: true,
	inspectOptions: {
		colors: true,
	},
	chalkOptions: {
		enabled: true,
	},
});

console.enabledColor = true;

export interface IImages extends Record<string, string>
{

}

export interface ICache
{
	_attach?: Record<string, {
		images: IImages,
	}>
}

export interface IFile
{
	index: number;
	name: string;
	isDir: boolean;
	title: string;
	innerText: string;
	imgs: IImages;
}

export interface IReturnData
{
	zip: JSZip;
	txts: IFile[];
	files: {
		[key: string]: JSZip.JSZipObject;
	};
	cache: ICache;
}

export function autoExtract(srcFile: string, setting?: {
	cwd?: string
})
{
	return load(srcFile)
		.tap(async (data) =>
		{
			const cwd = setting && setting.cwd || path.join(process.cwd(), fixFilename(path.basename(srcFile)));

			let options = {
				...data,
				cwd,
			};

			console.dir({
				srcFile,
				cwd,
			});

			return Bluebird.all([
				saveTxt(options),
				saveAttach(options)
			]);
		})
		;
}

export default autoExtract

export function fixFilename(file: string)
{
	return trimFilename(decodeURIComponent(file))
}

export function buffer(buf: Buffer, cache: ICache = {})
{
	return Bluebird.resolve(JSZip.loadAsync(buf, {
			decodeFileName(bytes)
			{
				return decodeURIComponent(decode(bytes))
			},
		}))
		.then<IReturnData>(async (zip) =>
		{
			let txts = await files(zip.file(/\.(?:xhtml|html?)$/), cache);

			return Bluebird.props({
				zip,
				txts,
				files: zip.files,
				cache,
			})
		})
		;
}

export function files(files: JSZip.JSZipObject[], cache: ICache = {})
{
	if (cache._attach == null)
	{
		cache._attach = {};
	}

	return Bluebird.resolve(files)
		.map(async (file, index) => {
			let buf = await file.async("nodebuffer")
				.then(decode)
				.then(buf => {

					try
					{
						return fixHtml(buf.toString())
					}
					catch (e)
					{

					}

					return buf;
				})
			;

			let jsdom = await asyncJSDOM(buf);
			let { $, document } = jsdom;

			let title: string = document.title;

			let _parse = path.parse(file.name);
			let _id = fixFilename(_parse.name).replace(/[^\w_\-]+/g, '').slice(0, 20);

			// @ts-ignore
			cache._attach[_parse.dir] = cache._attach[_parse.dir] || {};

			cache._attach[_parse.dir].images = cache._attach[_parse.dir].images || {};

			let imgs: Record<string, string> = {};

			$('img').each((i, elem) => {

				let _this = $(elem);
				let src = (_this.attr('src') || '').trim();

				if (src)
				{
					let _name = _id + i.toString().padStart(3, '0');

					while (cache._attach[_parse.dir].images[_name] != null)
					{
						_name = _id + (++i).toString().padStart(3, '0');
					}

					src = decodeURIComponent(src);

					imgs[_name] = src;
					cache._attach[_parse.dir].images[_name] = src;

					_this.after(`\n(圖片${_name})\n`);
					_this.remove();
				}

			});

			let innerText: string = $(document.body)
				.text()
				.replace(/^\n{2,}|\n{2,}$/g, '\n')
			;

			return <IFile>{
				index,
				name: file.name,
				isDir: file.dir,
				title,
				innerText,
				imgs,
			}
		})
	;
}

export function saveAttach(options: IReturnData & {
	cwd: string,
})
{
	return Bluebird.resolve(Object.entries(options.cache._attach))
		.map(async ([dir, data]) =>
		{
			let cwd = path.join(options.cwd, dir);

			await Bluebird
				.resolve(Object.entries(data.images))
				.map(async ([id, src], index, length) => {
					let _img = path.join(dir, src);
					let _img_path = path.join(cwd, src);

					return Bluebird
						.resolve(options.zip.file(_img))
						.then(v => v.async('nodebuffer'))
						.then(buf =>
						{
							console.gray(`[img][${padNum(index)}/${padNum(length)}]`, _img_path);

							return outputFile(_img_path, buf)
						})
						.catch(e =>
						{
							console.error(e.message, {
								dir,
								name: src,
								_img,
							})
						})
						;

				})
			;

			return outputFile(path.join(cwd, 'ATTACH.md'), stringify({
				attach: data,
			}))
		})
	;
}

export function load(file: string, cache: ICache = {})
{
	return Bluebird.resolve(readFile(file)).then(buf => buffer(buf, cache))
}

export function padNum(n: string | number)
{
	return n.toString().padStart(3, '0');
}

export function saveTxt(options: IReturnData & {
	cwd: string,
})
{
	return Bluebird
		.resolve(options.txts)
		.map(async (file, index, length) =>
		{
			let _parse = path.parse(file.name);

			let filename = path.join(options.cwd, _parse.dir, _parse.name + '_' + fixFilename(file.title) + '.txt');

			console.gray.log(`[txt][${padNum(index)}/${padNum(length)}]`, filename);
			await outputFile(filename, file.innerText);

			return filename
		})
}

export function fixHtml(html: string): string
{
	return minify(html, {
		collapseWhitespace: true,
		preserveLineBreaks: true,
		conservativeCollapse: true,
		caseSensitive: true,
	});
}