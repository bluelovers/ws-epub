/**
 * Created by user on 2018/2/18/018.
 */

import novelEpub from '../index';
import txtMerge from 'novel-txt-merge';
import * as path from 'path';

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

	await novelEpub({
		inputPath: TXT_PATH,
		outputPath: OUTPUT_PATH,
		filename: novelID,
	});

	console.timeEnd();

	// 由於無法取消壓縮圖片 導致仍然無法結束進程 只能用此方式強制停止
	process.exit();
})();
