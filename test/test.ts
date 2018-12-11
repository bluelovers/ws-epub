/**
 * Created by user on 2018/2/2/002.
 */

import * as path from "path";
import epubExtract from '../';

let srcFile: string;

srcFile = './res/Long Feng Zhi Zu - Si Yuan rururu.epub';
//srcFile = './res/An Hei Qi Shi Wu Yu - Wei Zhi.epub'; // bad epub will fail
srcFile = './res/異世界で魅力チートを使.epub';

/*
srcFile = '‪D:\\Users\\Downloads\\轉生成為魔劍 1-427.epub';

srcFile = 'D:\\Program Files (Portable)\\Calibre Portable\\Calibre Library\\Wei Zhi\\Yuan Jiang Jun De Bu Si Qi Shi (246)\\Yuan Jiang Jun De Bu Si Qi Shi - Wei Zhi.epub';

srcFile = 'D:\\Program Files (Portable)\\Calibre Portable\\Calibre Library\\Tian Gong  Xiao\\No Fatigue~Zhan Dou 24Xiao Shi De N (266)\\No Fatigue~Zhan Dou 24Xiao Shi - Tian Gong  Xiao.epub';

srcFile = 'D:\\Program Files (Portable)\\Calibre Portable\\Calibre Library\\Ji Wei  Kong\\Hei Zhi Chuang Zao Zhao Huan Shi (267)\\Hei Zhi Chuang Zao Zhao Huan Sh - Ji Wei  Kong.epub';

srcFile = 'D:\\Users\\Downloads\\业之塔.epub';
*/

srcFile = 'D:\\Users\\Downloads\\賢者之劍.epub';

srcFile = `D:\\Program Files (Portable)\\Calibre Portable\\Calibre Library\\Qiu Ye  You\\Shi Yu Yuan Wei De Bu Si Mao Xian Z (168)\\Shi Yu Yuan Wei De Bu Si Mao Xi - Qiu Ye  You.epub`;

srcFile = 'D:\\Users\\Downloads\\無職的英雄　～本來也沒想要技能的說～.epub';

/*
[
	srcFile,
	path.normalize(srcFile),
	path.dirname(srcFile),
	srcFile.replace(/\\/g, '/')
].forEach(function (value, index, array)
{
	value = value.replace(/\u202A/g, '');

	console.log(path.isAbsolute(value), value);
});
*/

if (1)
{
	epubExtract(srcFile, {
		cwd: __dirname,
		//noFirePrefix: true,
//		noVolume: true,
	})
		.then(function (ret)
		{
			console.log(ret);
		})
	;
}


