/**
 * Created by user on 2017/12/12/012.
 */

import * as moment from 'moment';

import { EpubMaker } from './js-epub-maker';

export interface IEpubConfig
{
	uuid?: string;
	templateName?: string;
	title?: string;
	slug?: string;
	lang?: string;
	author?: string;
	publisher?: string;

	rights?: IRightsConfig;
	coverUrl?: string;
	coverRights?: IRightsConfig;
	attributionUrl?: string;
	stylesheet?: {
		url,
		styles,
		replaceOriginal,
	};
	sections?: EpubMaker.Section[];
	toc?: EpubMaker.Section[];
	landmarks?: EpubMaker.Section[];
	options?;
	additionalFiles?: IFiles[];

	modification?: moment.Moment;
	modificationDate?: string;
	modificationDateYMD?: string;
	publication?: moment.Moment;
	publicationDate?: string;
	publicationDateYMD?: string;
}

export interface IRightsConfig
{
	description?: string,
	license?: string,
}

export interface IFiles
{
	url: string,
	folder: string,
	filename: string
}

export interface IBuilder
{
	make(epubConfig: IEpubConfig, options?): Promise<any>;
}

// @ts-ignore
export default exports;
