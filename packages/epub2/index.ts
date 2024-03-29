/**
 * Created by user on 2018/2/1/001.
 */

import Promise from 'bluebird';
import path from 'path';
import xml2js from 'xml2js';

import { EPub as libEPub } from './lib/epub';
import { TocElement } from './lib/epub/const';

export { SYMBOL_RAW_DATA } from './lib/types';

export class EPub extends libEPub
{
	static createAsync(epubfile: string, imagewebroot?: string, chapterwebroot?: string, ...argv): Promise<EPub>
	{
		const self = this;
		const p = self.libPromise;

		return new p(function (resolve, reject)
		{
			const epub = self.create(epubfile, imagewebroot, chapterwebroot, ...argv);

			const cb_err = function (err)
			{
				err.epub = epub;
				return reject(err);
			};

			epub.on('error', cb_err);
			epub.on('end', function (err)
			{
				if (err)
				{
					cb_err(err);
				}
				else
				{
					// @ts-ignore
					resolve(this);
				}
			});

			epub.parse();
		});
	}

	protected _p_method_cb<T>(method, options: Promise.FromNodeOptions = {}, ...argv): Promise<T>
	{
		const self = this;
		const p = this._getStatic().libPromise;

		return Promise.fromCallback(method.bind(self, argv), options);
	}

	public getChapterAsync(chapterId: string)
	{
		return this._p_method_cb<string>(this.getChapter, null, chapterId);
	}

	public getChapterRawAsync(chapterId: string)
	{
		return this._p_method_cb<string>(this.getChapterRaw, null, chapterId);
	}

	public getFileAsync(id: string)
	{
		return this._p_method_cb<[Buffer, string]>(this.getFile, {
			multiArgs: true,
		}, id);
	}

	public getImageAsync(id: string)
	{
		return this._p_method_cb<[Buffer, string]>(this.getImage, {
			multiArgs: true,
		}, id);
	}

	listImage(): TocElement[]
	{
		const epub = this;
		const mimes = [
			'image/jpeg',
		];
		const exts = [
			'jpg',
			'png',
			'gif',
			'webp',
			'tif',
			'bmp',
			//'jxr',
			//'psd'
		];

		return Object.keys(epub.manifest)
			.reduce(function (a, id)
			{
				let elem = epub.manifest[id];
				let mime = elem['media-type'] || elem.mediaType;

				if (mimes.includes(mime) || mime.indexOf('image') == 0 || exts.includes(path.extname(elem.href)))
				{
					a.push(elem)
				}

				return a;
			}, [])
			;
	}

	static override xml2jsOptions = Object.assign({}, libEPub.xml2jsOptions, {
		normalize: null,
	}) as xml2js.Options;

	/**
	 * allow change Promise class
	 * @type {PromiseConstructor}
	 */
	static libPromise = Promise;
}

export default EPub;
