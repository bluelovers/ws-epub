/**
 * Created by user on 2019/7/31.
 */

import JSZip = require('jszip');
import Bluebird = require('bluebird');
import ICONV from 'iconv-jschardet';
import { ITSResolvable } from 'ts-type';
import { cn2tw_min, tw2cn_min } from 'cjk-conv/lib/zh/convert/min';
import { createJSZipGeneratorOptions } from '@node-novel/epub-util/lib/const';
import { handleOptions } from './options';

export function loadZipBuffer(zipBuffer: ITSResolvable<Buffer>)
{
	return Bluebird.resolve(zipBuffer)
		.then(zipBuffer => JSZip.loadAsync(zipBuffer))
	;
}

export type IIconvFn = ((input: string) => ITSResolvable<string>) | typeof cn2tw_min | typeof tw2cn_min;

export interface IEpubIconvOptions
{
	iconv?: 'cn' | 'tw';
	iconvFn?: {
		'cn'?: IIconvFn,
		'tw'?: IIconvFn,
	}
}

export function handleZipObject(zip: ITSResolvable<JSZip>, options?: IEpubIconvOptions)
{
	return Bluebird.resolve(zip)
		.then(async (zip) => {

			let fnIconv: IIconvFn;
			options = handleOptions(options);

			{
				let { tw = cn2tw_min, cn = tw2cn_min } = options.iconvFn;

				options.iconvFn.tw = tw;
				options.iconvFn.cn = cn;
			};

			if (options.iconvFn && options.iconvFn[options.iconv])
			{
				fnIconv = options.iconvFn[options.iconv];
			}
			else
			{
				switch (options.iconv)
				{
					case 'cn':
						fnIconv = options.iconvFn.cn || tw2cn_min;
						break;
					case 'tw':
					default:
						fnIconv = options.iconvFn.tw || cn2tw_min;
						break;
				}
			}

			await Bluebird
				.resolve(zip.file(/\.(?:x?html?|txt)$/))
				.map(async (zipFile) => {

					let buf = await zipFile
						.async('nodebuffer')
						.then(buf => ICONV.encode(buf, 'utf8'))
						.then(buf => fnIconv(buf.toString()))
						.then(buf => Buffer.from(buf))
					;

					return zip.file(zipFile.name, buf, {
						date: zipFile.date,
						createFolders: false,
					})
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
		.then(zip => zip.generateAsync(createJSZipGeneratorOptions()))
	;
}

