import { CRLF } from 'crlf-normalize';

/**
 * Created by user on 2019/5/10.
 */

export const TPL_HR_LEN = 15;

export const TPL_EOL = CRLF;
export const TPL_EOL2 = CRLF.repeat(2);

export const TPL_HR1 = '＝'.repeat(TPL_HR_LEN);
export const TPL_HR2 = '－'.repeat(TPL_HR_LEN);

//export const TPL_VOLUME_START = '${hr01}${eol}${prefix}${title}${eol}${hr02}${eol}';

//export const TPL_CHAPTER_START = '`${hr11}${eol}${prefix}${chapter_title}${eol}${hr12}${eol2}${txt}${eol2}${hr2}END${eol2}`';

export const TPL_VOLUME_START = '${prefix}${eol}${title}';

export const TPL_CHAPTER_START = '${prefix}${eol}${title}';

export const enum EnumTxtStyle
{
	NONE = 0,
	/**
	 * 書僕開放格式
	 */
	SHU_BOOK = 0x10,
}

export const SHU_BOOK_BANNER = '(= 書僕開放格式 =)${eol}(= 書名：${title} =)${eol}(= 作者：${author} =)${eol}(= 語言：${lang} =)';

export const presetTxtStyle: {
	[k in EnumTxtStyle]?: {
		/**
		 * 檔案開頭
		 */
		'tplBannerStart': string;
		/**
		 * 章 風格
		 */
		'tplVolumeStart': string;
		/**
		 * 話 風格
		 */
		'tplChapterStart': string;
		/**
		 * 分隔線 章 開始
		 */
		'hr01': string;
		/**
		 * 分隔線 章
		 */
		'hr02': string;
		/**
		 * 分隔線 話 開始
		 */
		'hr11': string;
		/**
		 * 分隔線 話 內文
		 */
		'hr12': string;
		/**
		 * 分隔線 話 結束
		 */
		'hr13': string;
	}
} = {

	[EnumTxtStyle.NONE]: {
		'tplBannerStart': '',
		'tplVolumeStart': '${prefix}${eol}${title}',
		'tplChapterStart': '${prefix}${eol}${title}',
		'hr01': TPL_HR1 + 'CHECK',
		'hr02': TPL_HR1,
		'hr11': TPL_HR2 + 'BEGIN',
		'hr12': TPL_HR2 + 'BODY',
		'hr13': TPL_HR2 + 'END',
	},

};

presetTxtStyle[EnumTxtStyle.SHU_BOOK] = {
	...presetTxtStyle[EnumTxtStyle.NONE],
	'tplBannerStart': SHU_BOOK_BANNER,
	'tplVolumeStart': '= ${prefix} =${eol}${title}',
	'tplChapterStart': '= ${prefix} =${eol}${title}',
};
