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

srcFile = 'C:\\Users\\User\\Downloads\\幼女轉生.epub';

srcFile = 'D:\\Users\\Downloads\\班级同学都被召唤到异世界.epub';

srcFile = 'D:\\Users\\Downloads\\衔尾蛇的纪录WEB_cd46a.epub';

//srcFile = 'D:\\Program Files (Portable)\\Calibre Portable\\Calibre Library\\wai_San Dao  Yu Meng\\Yi Nu geShi Jie hamobuniYan siiShi (415)\\Yi Nu geShi Jie hamobuniYan sii - wai_San Dao  Yu Meng.epub';

//srcFile = 'D:\\Program Files (Portable)\\Calibre Portable\\Calibre Library\\Wei Zhi\\[Title here] (388)\\[Title here] - Wei Zhi.epub';

srcFile = 'D:\\Users\\Downloads\\原貴族千金的未婚母親(2019-12-06 1238)_v1.2.epub';

//srcFile = 'D:\\Program Files (Portable)\\Calibre Portable\\Calibre Library\\player\\1-34 (1) (419)\\1-34 (1) - player.epub';

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
	console.log(777);

	epubExtract(srcFile, {
		cwd: __dirname,
		//noFirePrefix: true,
		noVolume: true,
	})
		.then(function (ret)
		{
			console.log(ret);

			console.log(888);
		})
	;
}


