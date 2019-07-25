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
import Bluebird = require('bluebird');

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

	let old_md5 = await fileMd5('./temp/test.epub').then(data => data.md5).catch(e => null);

	let ret = await novelEpub({
		inputPath: TXT_PATH,
		outputPath: OUTPUT_PATH,
		filename: novelID,
		//epubContextDate: new Date('2019-07-24 06:00:00Z'),
		epubContextDate: true,
	});

	console.dir(ret);

	let _data = await fileMd5(ret.file);

	let zip = await JSZip.loadAsync(_data.buf);

//	console.dir(zip.files);

	Object.values(zip.files).forEach(v => {
		console.log(v.name, v.date)
	});

	console.dir({
		old_md5,
		md5: _data.md5,
	});

	console.timeEnd();

	// 由於無法取消壓縮圖片 導致仍然無法結束進程 只能用此方式強制停止
	process.exit();
})();

function fileMd5(file: string)
{
	return Bluebird.resolve(fs.readFile(file))
		.then((buf) => {

			const md5 = crypto.createHash('md5').update(buf).digest('hex');

			return Bluebird.props({
				file,
				buf,
				md5,
			})
		})
	;
}