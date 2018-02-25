/**
 * Created by user on 2018/2/18/018.
 */

import novelEpub from '../index';
import * as path from 'path';

/**
 * 小說資料夾名稱
 */
let novelID: string;

//novelID = '黒の魔王';
novelID = '黑之魔王';

novelID = '四度目は嫌な死属性魔術師';

//novelID = '那个人，后来_(2272)';
//novelID = '讨厌第四次的死属性魔术师_(2206)';

//novelID = '野生のラスボスが現れた！';
//novelID = '野生的最终boss出现了_(2014)';

//novelID = '火輪を抱いた少女';

//novelID = 'ウォルテニア戦記';

//novelID = '公会的开挂接待小姐_(20)';

//novelID = '雪色エトランゼ';

//novelID = '自称贤者弟子的贤者';

//novelID = '抗いし者たちの系譜 逆襲の魔王';
//
//novelID = '異世界迷宮の最深部を目指そう';

//novelID = '暗黒騎士物語　～勇者を倒すために魔王に召喚されました～';

//novelID = '转生奇谭_(1782)';
//novelID = '女神异闻录2 罚_(755)';
//novelID = '尘骸魔京_(323)';
//novelID = '加速世界_(381)';

//novelID	 = '自卫队三部曲_(350)';

//novelID	 = '呼び出された殺戮者';

//novelID = '病娇女神の箱庭';

//novelID = '回復術士のやり直し～即死魔法とスキルコピーの超越ヒール～';

//novelID = '你与我最后的战场，亦或是世界起始的圣战_(2290)';

//novelID = 'シャチになりましたオルカナティブ';

//novelID = '自分が異世界に転移するなら';

//novelID = '百魔の主';

novelID = '奪う者　奪われる者';

//novelID = '人喰い転移者の異世界復讐譚　～無能はスキル『捕食』で成り上がる～';

/**
 * 小說 txt 的主資料夾路徑
 * @type {string}
 */
let TXT_PATH = path.join(__dirname, 'res', novelID);
TXT_PATH = path.join('D:\\Users\\Documents\\The Project\\nodejs-test\\node-novel2\\dist_novel\\user_out', novelID);
//TXT_PATH = path.join('D:\\Users\\Documents\\The Project\\nodejs-test\\node-novel2\\dist_novel\\dmzj_out', novelID);
//TXT_PATH = path.join('D:\\Users\\Documents\\The Project\\nodejs-test\\node-novel2\\dist_novel\\wenku8_out', novelID);
//TXT_PATH = path.join('D:\\Users\\Documents\\The Project\\nodejs-test\\node-novel2\\dist_novel\\webqxs_out', novelID);

//TXT_PATH = path.join('D:\\Users\\Documents\\The Project\\nodejs-test\\node-novel2\\dist_novel\\wenku8', novelID);

//TXT_PATH = path.join('D:\\Users\\Documents\\The Project\\nodejs-test\\node-novel2\\dist_novel\\user', novelID);

//TXT_PATH = path.join('D:\\Users\\Documents\\The Project\\nodejs-test\\node-novel2\\dist_novel\\epub_out', novelID);

let OUTPUT_PATH = path.join(__dirname, './temp');

(async () =>
{
	await novelEpub({
		inputPath: TXT_PATH,
		outputPath: OUTPUT_PATH,
		filename: novelID,
		padEndDate: true,
	});

	console.log('--------');

	if (1)
	{
		// @ts-ignore
		const txtMerge = await import('novel-txt-merge').then(function (mod)
		{
			return mod.default;
		})
			.catch(function (e)
			{
				console.warn(e.toString());
				return null;
			})
		;

		if (txtMerge)
		{
			await txtMerge(TXT_PATH, OUTPUT_PATH);
		}
	}
})();
