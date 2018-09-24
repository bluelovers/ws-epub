/**
 * Created by user on 2017/12/12/012.
 */

import JSZip = require('jszip');
import { IFiles, ICover, EpubConfig, IEpubConfig } from '../config';
import { compileTpl } from './handlebar-helpers';
import * as path from 'path';
import BPromise = require('bluebird');
import { EpubMaker } from '../index';
import { fetchFile } from './ajax';
import hashSum = require('hash-sum');

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

export function parseFileSetting(coverUrl, epubConfig: IEpubConfig): IFiles
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
			let cwd = epubConfig.cwd || process.cwd();

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

export function addStaticFiles(zip, staticFiles: IFiles[])
{
	return BPromise.mapSeries(staticFiles, async function (_file: IFiles)
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

	return addStaticFiles(zip, staticFiles)
		.then(function (staticFiles)
		{

			epub.epubConfig.additionalFiles.forEach((v, i) => {

				let s = staticFiles[i];

				v.mime = v.mime || s.mime;
				v.name = s.name;

				if (v.folder === null)
				{
					// @ts-ignore
					v.href = v.name;
				}
				else
				{
					// @ts-ignore
					v.href = [v.folder, v.name].join('/');
				}

				// @ts-ignore
				v.id = v.id || 'additionalFiles-' + hashSum(v.name);

			});

			console.log(epub.epubConfig.additionalFiles, staticFiles);

			return staticFiles;
		})
		;
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

export function addSubSections(zip: JSZip, section: EpubMaker.Section, cb, epub: EpubMaker, options?)
{
	return BPromise
		.resolve(cb(zip, section, epub.epubConfig, options))
		.then(function ()
		{
			return BPromise.mapSeries(section.subSections, function (subSection: EpubMaker.Section)
			{
				return addSubSections(zip, subSection, cb, epub, options);
			});
		})
		;
}

import * as self from './zip';

export default self;
