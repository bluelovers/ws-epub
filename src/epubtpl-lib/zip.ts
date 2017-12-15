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

export { JSZip, JSZipUtils }

JSZipUtils.getBinaryContentAsync = util.promisify(JSZipUtils.getBinaryContent);

export function addMimetype(zip: JSZip, epubConfig: IEpubConfig, options)
{
	return zip.file('mimetype', options.templates.mimetype);
}

export function addContainerInfo(zip: JSZip, epubConfig: IEpubConfig, options)
{
	return zip.folder('META-INF').file('container.xml', compileTpl(options.templates.container, epubConfig));
}

export function addFiles(zip: JSZip, epubConfig: IEpubConfig, options)
{
	return Promise.map(epubConfig.additionalFiles, function (file)
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
		;
	});
}

export async function addCover(zip: JSZip, epubConfig: IEpubConfig, options)
{
	if (epubConfig.coverUrl)
	{
		return JSZipUtils.getBinaryContentAsync(epubConfig.coverUrl)
			.then(function (data)
			{
				let ext = path.extname(epubConfig.coverUrl);

				return zip.folder('EPUB')
					//.folder('images')
					.file(epubConfig.slug + '-cover.' + ext, data, { binary: true });
			})
		;
	}

	return false;
}

export async function addSubSections(zip: JSZip, section: EpubMaker.Section, cb, epubConfig?: IEpubConfig, options?)
{
	await cb(zip, section, epubConfig, options);

	return Promise.map(section.subSections, function (subSection: EpubMaker.Section)
	{
		return addSubSections(zip, subSection, cb, epubConfig, options);
	});
}

// @ts-ignore
export default exports;
