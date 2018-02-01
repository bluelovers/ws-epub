/**
 * Created by user on 2018/2/1/001.
 */

import * as libEPub from './epub';
import * as Promise from 'bluebird';

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
					resolve(this);
				}
			});

			epub.parse();
		});
	}

	protected _p_method_cb<T>(method, options: Promise.FromNodeOptions = {}, ...argv): Promise<T>
	{
		const self = this;
		const p = EPub.libPromise;

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
}

export module EPub
{
	/**
	 * allow change Promise class
	 * @type {PromiseConstructor}
	 */
	export let libPromise = Promise;
}

export default EPub;
