/**
 * Created by user on 2018/2/18/018.
 */

import novelEpub from '../index';
import * as path from 'path';
import * as Promise from 'bluebird';
import { EnumEpubConfigVertical } from 'epub-maker2/src/config';

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
novelID = '異世界迷宮の最深部を目指そう';

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

//novelID = '奪う者　奪われる者';

//novelID = '人喰い転移者の異世界復讐譚　～無能はスキル『捕食』で成り上がる～';

//novelID = '帰ってきてもファンタジー！？';

//novelID = '魔王様、リトライ！';

//novelID = '豚公爵に転生したから、今度は君に好きと言いたい';

//novelID = '転生したら剣でした';

//novelID = '天才魔法使與原娼婦新娘';

//novelID = '悠久の愚者アズリーの、賢者のすゝめ';

//novelID = '元将軍のアンデッドナイト';

//novelID = 'エルフ転生からのチート建国記';

//novelID = '再臨勇者の復讐譚　～失望しました、勇者やめて元魔王と組みます～';

//novelID = 'NO FATIGUE 24時間戦える男の転生譚';

//novelID = '２９歳独身は異世界で自由に生きた…かった。';

//novelID = '物語の中の銀の髪';

//novelID = '黒の創造召喚師';

//novelID = '俺の死亡フラグが留まるところを知らない';

//novelID = '乙女ゲームの悪（中略）ヒロインが鬼畜女装野郎だったので、助けて下さい';

//novelID = '蘇りの魔王';

//novelID = 'カルマの塔';

//novelID = '俺の異世界姉妹が自重しない！';

//novelID = 'その者。のちに・・・';

/**
 * @BUG 請勿同時更新多本書
 */
Promise.mapSeries([

	//'呼び出された殺戮者',
	//'魔王様、リトライ！',

	//'破壊の御子',

	//'百魔の主',

//	'黑之魔王',
//	'回復術士のやり直し～即死魔法とスキルコピーの超越ヒール～',

	//'かみがみ〜最も弱き反逆者〜',

//	'異世界迷宮の最深部を目指そう',

//	'天才魔法使與原娼婦新娘',

//	'没落予定なので、鍛治職人を目指す',

	//'異世界支配のスキルテイカー　～　ゼロから始める奴隷ハーレム　～',

	//'人喰い転移者の異世界復讐譚　～無能はスキル『捕食』で成り上がる～',

	//'病娇魅魔女儿是勇者妈妈的天敌',

	//'神明大人的魔法使',
	//'魔王神官和勇者美少女',

//	'四度目は嫌な死属性魔術師',

//	'蘇りの魔王',

//	'強欲の花',

//	'炎之魔女的守序信仰',

//	'豚公爵に転生したから、今度は君に好きと言いたい',

//	'瀆神之主',

//	'姫騎士がクラスメート！　〜異世界チートで奴隷化ハーレム〜',

//	'豚公爵に転生したから、今度は君に好きと言いたい',

	//'大劍師傳奇_(djs)',

//	'呼び出された殺戮者',

//	'暗黒騎士物語　～勇者を倒すために魔王に召喚されました～',
//
//	'虫虫酱むいむいたん',

//	'你這種傢伙別想打贏魔王',

//	'誰にでもできる影から助ける魔王討伐',

//	'裏世界郊游',

	'Genocide Online ～極惡千金的玩遊戲日記～',

] as string[], makeEpub);

async function makeEpub(novelID: string)
{
	/**
	 * 小說 txt 的主資料夾路徑
	 * @type {string}
	 */
	let TXT_PATH = path.join(__dirname, 'res', novelID);
	TXT_PATH = path.join('C:/Home/link/dist_novel/user_out/', novelID);
//TXT_PATH = path.join('D:\\Users\\Documents\\The Project\\nodejs-test\\node-novel2\\dist_novel\\dmzj_out', novelID);
//TXT_PATH = path.join('D:\\Users\\Documents\\The Project\\nodejs-test\\node-novel2\\dist_novel\\wenku8_out', novelID);
//TXT_PATH = path.join('D:\\Users\\Documents\\The Project\\nodejs-test\\node-novel2\\dist_novel\\webqxs_out', novelID);

//TXT_PATH = path.join('D:\\Users\\Documents\\The Project\\nodejs-test\\node-novel2\\dist_novel\\wenku8', novelID);

//TXT_PATH = path.join('D:\\Users\\Documents\\The Project\\nodejs-test\\node-novel2\\dist_novel\\user', novelID);

//TXT_PATH = path.join('D:\\Users\\Documents\\The Project\\nodejs-test\\node-novel2\\dist_novel\\epub_out', novelID);

	//TXT_PATH = path.join('D:\\Users\\Documents\\The Project\\nodejs-test\\node-novel2\\dist_novel\\sfacg_out', novelID);

//	TXT_PATH = path.join('D:\\Users\\Documents\\The Project\\nodejs-test\\node-novel2\\dist_novel\\iqing_out', novelID);

//	TXT_PATH = path.join('D:\\Users\\Documents\\The Project\\nodejs-test\\node-novel2\\dist_novel\\uukanshu_out', novelID);

//	TXT_PATH = path.join('D:\\Users\\Documents\\The Project\\nodejs-test\\node-novel2\\dist_novel\\cm', novelID);

//	TXT_PATH = path.join('D:\\Users\\Documents\\The Project\\nodejs-test\\node-novel2\\dist_novel\\millionbook', novelID);

//	TXT_PATH = path.join('D:\\Users\\Documents\\The Project\\nodejs-test\\node-novel2\\dist_novel\\girl_out', novelID);

	TXT_PATH = path.join('C:/Home/link/dist_novel/girl', novelID);

	let OUTPUT_PATH = path.join(__dirname, './temp');

	console.time();

	let ret = await novelEpub({
		inputPath: TXT_PATH,
		outputPath: OUTPUT_PATH,
//		filename: '123',
		//padEndDate: true,
		padEndDate: false,
		useTitle: true,

		filenameLocal: novelID,

		noLog: true,

		vertical: EnumEpubConfigVertical.VERTICAL_RL,

		downloadRemoteFile: true,
	});

	console.timeEnd();

	console.log('--------');

	if (1)
	{
		console.time();

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
			await txtMerge(TXT_PATH, OUTPUT_PATH, ret.basename);
		}

		console.timeEnd();
	}
}
