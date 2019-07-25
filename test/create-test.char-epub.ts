/**
 * Created by user on 2018/2/18/018.
 */

import novelEpub from '../index';
import txtMerge from 'novel-txt-merge';
import * as path from 'path';
import crypto = require('crypto');
import JSZip = require('jszip');
import fs from 'fs-iconv';
import ZipFile from 'epub2/zipfile';

/**
 * 小說資料夾名稱
 */
let novelID: string;

novelID = 'test';

let TXT_PATH = path.join(__dirname, 'res', novelID);

let OUTPUT_PATH = path.join(__dirname, './temp');

(async () =>
{
	console.time();

	let ret = await novelEpub({
		inputPath: TXT_PATH,
		outputPath: OUTPUT_PATH,
		filename: novelID,
		epubContextDate: new Date('2019-07-24 06:00:00Z'),
	});

	console.dir(ret);

	let buf = await fs.readFile(ret.file);

	let zip = await JSZip.loadAsync(buf);

//	console.dir(zip.files);

	Object.values(zip.files).forEach(v => {
		// @ts-ignore
		console.log(v.name, v._data && v._data.crc32)
	});

//
	const md5 = crypto.createHash('md5');
	let result = md5.update(buf).digest('hex');

	console.dir(result);

	console.timeEnd();

	// 由於無法取消壓縮圖片 導致仍然無法結束進程 只能用此方式強制停止
	process.exit();
})();
