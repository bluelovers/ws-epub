/**
 * Created by user on 2017/12/12/012.
 */

import * as JSZip from 'jszip';
import { IFiles, ICover } from '../config';
import { compileTpl } from './handlebar-helpers';
import * as path from 'path';
import * as Promise from 'bluebird';
import { EpubMaker } from '../index';
import { fetchFile } from './ajax';

export { JSZip }

/*
export async function addMimetype(zip: JSZip, epub: EpubMaker, options)
{
	return zip.file('mimetype', options.templates.mimetype);
}

export function addContainerInfo(zip: JSZip, epub: EpubMaker, options)
{
	return zip.folder('META-INF').file('container.xml', compileTpl(options.templates.container, epub.epubConfig));
}
*/

export function parseFileSetting(coverUrl): IFiles
{
	let cover: ICover;

	if (typeof coverUrl == 'string')
	{
		let r = /^(?:\w+:)?\/{2,3}.+/;

		//console.log(path.isAbsolute(coverUrl), coverUrl, r.exec(coverUrl));

		if (!path.isAbsolute(coverUrl) && r.exec(coverUrl))
		{
			cover = {
				url: coverUrl,
			};
		}
		else
		{
			let cwd = this.epubConfig.cwd || process.cwd();

			cover = {
				file: path.isAbsolute(coverUrl) ? coverUrl : path.join(cwd, coverUrl),
			};
		}

		//console.log(cover);
	}
	else if (coverUrl && (coverUrl.url || coverUrl.file))
	{
		cover = coverUrl;
	}

	return cover;
}

export async function addStaticFiles(zip, staticFiles: IFiles[])
{
	return await Promise.map(staticFiles, async function (_file: IFiles)
	{
		let file = await fetchFile(_file);

		zip
			.folder(file.folder)
			.file(file.name, file.data)
		;

		return file;
	});
}

export function addFiles(zip: JSZip, epub: EpubMaker, options)
{
	let staticFiles = epub.epubConfig.additionalFiles.reduce(function (a, file)
	{
		a.push(Object.assign({}, file, {
			folder: file.folder ? path.join('EPUB', file.folder) : 'EPUB',
		}));

		return a;
	}, []);

	return addStaticFiles(zip, staticFiles);
}

export async function addCover(zip: JSZip, epub: EpubMaker, options)
{
	if (epub.epubConfig.cover)
	{
		epub.epubConfig.cover.basename = 'CoverDesign';
		let file = await fetchFile(epub.epubConfig.cover);

		//file.name = `CoverDesign${file.ext}`;

		let filename = file.name = file.folder ? path.join(file.folder, file.name) : file.name;

		zip
			.folder('EPUB')
			//.folder('images')
			.file(filename, file.data)
		;

		return filename;
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
