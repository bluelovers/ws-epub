/**
 * Created by user on 2017/12/12/012.
 */

import { JSZip } from './epubtpl-lib/zip';
import * as moment from 'moment';

import { EpubMaker } from './index';

export interface ICover
{
	name?: string;
	ext?: string;

	file?,
	url?: string,
	rights?: IRightsConfig,
}

export interface IEpubConfig
{
	uuid?: string;
	templateName?: string;

	filename?: string;

	title?: string;
	slug?: string;

	lang?: string;
	author?: string;
	publisher?: string;

	rights?: IRightsConfig;

	cover?: ICover;
	cwd?: string;

	//coverUrl?: string;
	//coverRights?: IRightsConfig;

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
	make(epub: EpubMaker, options?): Promise<JSZip>;
}

export interface IBuilderCallback<T, U> extends Function
{
	(zip: T, epubConfig: IEpubConfig, options?, ...argv): Promise<U>;
}

import * as self from './var';

// @ts-ignore
export default self;
