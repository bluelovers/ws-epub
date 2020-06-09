import { ITxtMergeOptions } from '../index';
import { EnumTxtStyle, presetTxtStyle, TPL_EOL, TPL_EOL2 } from './tpl';
import console from 'debug-color2';

export interface ITplData
{
	[k: string]: string,
}

export function replaceTpl(tpl: string, data: ITplData)
{
	let r = new RegExp(`\\$\\{(${Object.keys(data).join('|')})\\}`, 'gu');

	return tpl
		.replace(r, (s, k) => {
			return data[k] || ''
		})
	;
}

export function makeDefaultTplData(inputOptions?: Partial<ITxtMergeOptions>, opts?: object)
{
	inputOptions = {
		...inputOptions,
		...opts,
	};

	if (inputOptions.inputConfigPath)
	{
		try
		{
			let c = require(inputOptions.inputConfigPath);

			inputOptions = {
				...inputOptions,
				...c,
			};

			console.info('將 inputConfigPath 內設定合併至本次執行參數內');
			console.dir(inputOptions);
		}
		catch (e)
		{
			console.error('[ERROR]', '讀取 inputConfigPath 時發生錯誤', e.message);
		}
	}

	//inputOptions.txtStyle = EnumTxtStyle.SHU_BOOK;

	let txtStyle = presetTxtStyle[inputOptions.txtStyle] || presetTxtStyle[EnumTxtStyle.NONE];

	let tplBaseData: {
		'tplBannerStart': string;
		'tplVolumeStart': string;
		'tplChapterStart': string;
		'hr01': string;
		'hr02': string;
		'hr11': string;
		'hr12': string;
		'hr13': string;

		'eol': string;
		'eol2': string;
	} = {} as any;

	[
		'tplBannerStart',
		'tplVolumeStart',
		'tplChapterStart',
		'hr01',
		'hr02',
		'hr11',
		'hr12',
		'hr13',
	].forEach(k => {

		if (inputOptions[k] == null)
		{
			inputOptions[k] = txtStyle[k];
		}

		inputOptions[k] = inputOptions[k] || '';

		tplBaseData[k] = inputOptions[k];
	})
	;

	tplBaseData.eol = TPL_EOL;
	tplBaseData.eol2 = TPL_EOL2;

	return {
		inputOptions,
		tplBaseData,
	}
}
