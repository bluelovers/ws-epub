/**
 * Created by user on 2017/12/12/012.
 */

import * as JSZip from 'jszip';
import * as JSZipUtils from 'jszip-utils';
import * as util from 'util';
import { compileTpl } from './handlebar-helpers';
import { IEpubConfig } from '../var';
import * as path from 'path';
import * as Promise from 'bluebird';
import { EpubMaker } from '../index';
import { xhr } from './ajax';
// @ts-ignore
import * as fs from 'fs-extra';

export { JSZip, JSZipUtils }

JSZipUtils.getBinaryContentAsync = Promise.promisify(JSZipUtils.getBinaryContent);

export function addMimetype(zip: JSZip, epub: EpubMaker, options)
{
	return zip.file('mimetype', options.templates.mimetype);
}

export function addContainerInfo(zip: JSZip, epub: EpubMaker, options)
{
	return zip.folder('META-INF').file('container.xml', compileTpl(options.templates.container, epub.epubConfig));
}

export function addFiles(zip: JSZip, epub: EpubMaker, options)
{
	JSZipUtils.xhr = JSZipUtils.xhr || xhr();

	return Promise.mapSeries(epub.epubConfig.additionalFiles, function (file)
	{
		return JSZipUtils.getBinaryContentAsync(file.url)
			.then(function (data)
			{
				return zip
					.folder('EPUB')
					.folder(file.folder)
					.file(file.filename, data, { binary: true })
					;
			})
			.tapCatch(function (err)
			{
				console.error(err);
			})
		;
	});
}

export async function addCover(zip: JSZip, epub: EpubMaker, options)
{
	if (epub.epubConfig.cover)
	{
		let file;
		let err;

		if (epub.epubConfig.cover.url)
		{
			JSZipUtils.xhr = JSZipUtils.xhr || xhr();

			file = await JSZipUtils.getBinaryContentAsync(epub.epubConfig.cover.url)
				.then(function (data)
				{
					let ext = epub.epubConfig.cover.ext = epub.epubConfig.cover.ext || path.extname(epub.epubConfig.cover.url);

					epub.epubConfig.cover.name = epub.epubConfig.cover.name
						|| `CoverDesign${ext}`
						|| epub.epubConfig.slug + '-cover' + ext
					;

					zip.folder('EPUB')
						//.folder('images')
						.file(epub.epubConfig.cover.name, data, {
							//binary: true
						})
					;

					console.log([
						//(data instanceof Blob),
						(data instanceof Uint8Array),
						(data instanceof Buffer),
					]);

					fs.writeFile(path.join('./temp/', epub.epubConfig.cover.name), data)

					return epub.epubConfig.cover.name;
				})
				.catch(function (e)
				{
					err = e;
				})
				;
		}

		if (!file && epub.epubConfig.cover.file)
		{
			let data = await fs.readFile(epub.epubConfig.cover.file);

			let ext = epub.epubConfig.cover.ext = epub.epubConfig.cover.ext || path.extname(epub.epubConfig.cover.file);

			epub.epubConfig.cover.name = epub.epubConfig.cover.name
				|| `CoverDesign${ext}`
				|| epub.epubConfig.slug + '-cover' + ext
			;

			zip.folder('EPUB')
				//.folder('images')
				.file(epub.epubConfig.cover.name, data);

			file = epub.epubConfig.cover.name;
		}

		if (!file)
		{
			let e = err || new ReferenceError();
			e.data = epub.epubConfig.cover;

			throw e;
		}
		else if (err)
		{
			//console.error(err);
		}

		if (file)
		{
			return true;
		}
	}

	return false;
}

export async function addSubSections(zip: JSZip, section: EpubMaker.Section, cb, epub: EpubMaker, options?)
{
	await cb(zip, section, epub.epubConfig, options);

	return Promise.mapSeries(section.subSections, function (subSection: EpubMaker.Section)
	{
		return addSubSections(zip, subSection, cb, epub, options);
	});
}

import * as self from './zip';
export default self;
