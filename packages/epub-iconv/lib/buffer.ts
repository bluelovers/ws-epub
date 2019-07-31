/**
 * Created by user on 2019/7/31.
 */

import JSZip = require('jszip');
import Bluebird = require('bluebird');
import ICONV from 'iconv-jschardet';
import { ITSResolvable } from 'ts-type';
import { cn2tw_min, tw2cn_min } from 'cjk-conv/lib/zh/convert/min';

export function loadZipBuffer(zipBuffer: ITSResolvable<Buffer>)
{
	return Bluebird.resolve(zipBuffer)
		.then(zipBuffer => JSZip.loadAsync(zipBuffer))
	;
}

export interface IEpubIconvOptions
{
	iconv?: 'cn' | 'tw';
}

export function handleZipObject(zip: ITSResolvable<JSZip>, options?: IEpubIconvOptions)
{
	return Bluebird.resolve(zip)
		.then(async (zip) => {

			let fnIconv: typeof cn2tw_min | typeof tw2cn_min;
			options = options || {};

			switch (options.iconv)
			{
				case 'cn':
					fnIconv = tw2cn_min;
					break;
				case 'tw':
				default:
					fnIconv = cn2tw_min;
					break;
			}

			await Bluebird
				.resolve(zip.file(/\.(?:x?html?|txt)$/))
				.map(async (zipFile) => {

					let buf = await zipFile
						.async('nodebuffer')
						.then(buf => ICONV.encode(buf, 'utf8'))
						.then(buf => Buffer.from(fnIconv(buf.toString())))
					;

					return zip.file(zipFile.name, buf)
				})
			;

			return zip;
		})
	;
}

export function handleZipBuffer(zipBuffer: ITSResolvable<Buffer>, options?: IEpubIconvOptions)
{
	return loadZipBuffer(zipBuffer)
		.then(buf => handleZipObject(buf, options))
		.then(zip => zip.generateAsync({
			type: 'nodebuffer',
			mimeType: 'application/epub+zip',
			compression: 'DEFLATE',
			compressionOptions: {
				level: 9
			},
		}))
	;
}
