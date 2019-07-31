/**
 * Created by user on 2019/7/31.
 */

import FastGlob, { Options as IFastGlobOptions } from '@bluelovers/fast-glob';
import { ITSResolvable, ITSValueOrArray } from 'ts-type';
import { IEpubIconvOptions } from './buffer';
import Bluebird = require('bluebird');
import JSZip = require('jszip');
import { handleZipFile } from './fs';
import * as path from 'path';
import { outputFile, pathExistsSync } from 'fs-extra';
import { console } from 'debug-color2';

export interface IEpubIconvGlobOptions extends IEpubIconvOptions
{
	cwd?: string,
	output?: string,
	showLog?: boolean,
}

export function handleGlob(pattern: ITSResolvable<ITSValueOrArray<string>>, options?: IEpubIconvGlobOptions)
{
	options = options || {};
	const { cwd = process.cwd(), showLog = true } = options;
	const { output = cwd } = options;

	const startTime = Date.now();

	return Bluebird.resolve(pattern)
		.then(pattern => Array.isArray(pattern) ? pattern : [pattern])
		.then(pattern => FastGlob.async(pattern, {
			cwd,
		}))
		.tap(ls => {

			if (!ls.length)
			{
				return Bluebird.reject(`沒有找到任何符合條件的 epub`)
			}

		})
		.map(file => {
			const fullpath = path.resolve(cwd, file);

			return Bluebird.props({
				root: cwd,
				file,
				fullpath,
				buffer: handleZipFile(fullpath, options),
			})
				.then(async (ret) => {

					let output_path: string;
					let { name, ext } = path.parse(ret.file);

					let idx = 0;

					do
					{
						let padend: string = '';

						if (idx)
						{
							padend = `_${idx}`;
						}

						output_path = path.join(output, name + padend + ext);
						idx++;
					}
					while (pathExistsSync(output_path));

					await outputFile(output_path, ret.buffer);

					return {
						...ret,
						output_path,
					}
				})
				.tap(ret => {
					if (showLog)
					{
						console.info(ret.file, `=>`, ret.output_path)
					}
				})
				;
		})
		.tap(ls => {

			if (showLog)
			{
				console.success(`處理完成，總共處理 ${ls.length} 檔案`, `費時`, Date.now() - startTime, 'ms')
			}

		})
	;
}