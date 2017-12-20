import * as moment from 'moment';
import * as slugify from 'slugify';
import { EpubMaker } from './index';
import * as deepmerge from 'deepmerge';
import * as shortid from 'shortid';
import * as hashSum from 'hash-sum';
import { array_unique } from './lib/array';

export interface ICover extends IFiles
{
	rights?: IRightsConfig,
}

export interface IStylesheet extends IFiles
{
	styles?: string,
	replaceOriginal?: boolean,
}

export interface IRightsConfig
{
	description?: string,
	license?: string,
}

export interface IFiles
{
	url?: string,
	file?: string,

	folder?: string,
	name?: string,

	basename?: string,
	ext?: string,
	mime?: string,
	data?;
}

export interface ICollection
{
	name?: string,
	type?: string,
	position?: number,
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
	authors?: {
		[index: string]: string,
	};

	publisher?: string;

	rights?: IRightsConfig;

	cover?: ICover;
	cwd?: string;

	attributionUrl?: string;
	stylesheet?: IStylesheet;
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

	/**
	 * <meta property="belongs-to-collection" id="id-2">黒の魔王WEB</meta>
	 * <meta refines="#id-2" property="collection-type">series</meta>
	 * <meta refines="#id-2" property="group-position">1</meta>
	 */
	collection?: ICollection;

	/**
	 * <dc:subject>
	 */
	tags?: string[];

	infoPreface?: string;
}

export class EpubConfig implements IEpubConfig
{
	uuid?: string;
	templateName?: string;

	filename?: string;

	title?: string;
	slug?: string;

	lang?: string;

	author?: string;
	authors?: {
		[index: string]: string,
	};

	publisher?: string;

	rights?: IRightsConfig;

	cover?: ICover;
	cwd?: string;

	attributionUrl?: string;
	stylesheet?: IStylesheet;
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

	/**
	 * <meta property="belongs-to-collection" id="id-2">黒の魔王WEB</meta>
	 * <meta refines="#id-2" property="collection-type">series</meta>
	 * <meta refines="#id-2" property="group-position">1</meta>
	 */
	collection?: ICollection;

	/**
	 * <dc:subject>
	 */
	tags?: string[];

	infoPreface?: string;

	constructor(epubConfig: IEpubConfig = {}, options: any = {})
	{
		if (epubConfig instanceof EpubConfig)
		{
			epubConfig = epubConfig.entries(false);

			delete epubConfig.slug;
			delete epubConfig.uuid;
		}

		Object.assign(this, EpubConfig.defaultEpubConfig, deepmerge(epubConfig, {
			options
		}));
	}

	get langMain()
	{
		return this.lang;
	}

	get subjects(): string[]
	{
		return this.tags;
	}

	set subjects(val: string[])
	{
		this.tags = val;
	}

	setModification(val, ...argv)
	{
		let data;

		if (val === true)
		{
			data = moment();
		}
		else
		{
			data = moment(val, ...argv);
		}

		let self = this as IEpubConfig;
		self.modification = data.local();
	}

	setPublication(val, ...argv)
	{
		let data;

		if (val === true)
		{
			data = moment();
		}
		else
		{
			data = moment(val, ...argv);
		}

		let self = this as IEpubConfig;
		self.publication = data.local();
	}

	addAuthor(name: string, url: string = null)
	{
		if (!name)
		{
			throw new ReferenceError();
		}

		let self = this as IEpubConfig;

		self.authors = self.authors || {};

		self.authors[name] = url;
	}

	$clone()
	{
		// @ts-ignore
		return new (this.__proto__.constructor)(this);
	}

	static $create(epubConfig: IEpubConfig = {}, options: any = {})
	{
		return new this(epubConfig, options)
	}

	$auto()
	{
		let self = this as IEpubConfig;

		[
			self.tags,
		].forEach(a => (a || []).filter(v => v).map(v => v.toString()));

		if (self.tags)
		{
			self.tags = array_unique(self.tags);
		}

		if (!self.author && self.authors)
		{
			self.author = Object.keys(self.authors)[0];
		}

		self.uuid = (self.uuid && typeof self.uuid == 'string') ? self.uuid : shortid();
		self.slug = self.slug
			// @ts-ignore
			|| slugify(self.title)
			|| hashSum(self.title)
		;

		if (self.modification)
		{
			self.modificationDate = self.modification.format(EpubConfig.dateFormat);
			self.modificationDateYMD = self.modification.format('YYYY-MM-DD');
		}

		if (!self.publication)
		{
			this.setPublication(true);
		}

		self.publicationDate = self.publication.format(EpubConfig.dateFormat);
		self.publicationDateYMD = self.publication.format('YYYY-MM-DD');

		if (self.collection)
		{
			self.collection.type = self.collection.type || 'series';
		}
	}

	entries(auto = true): IEpubConfig
	{
		if (auto)
		{
			this.$auto();
		}

		return Object.entries(this)
			.reduce(function (a, b)
			{
				a[b[0]] = b[1];

				return a;
			}, {})
		;
	}

	toJSON(auto?: boolean, replacer = null, space = "\t"): string
	{
		if (auto)
		{
			this.$auto();
		}

		return JSON.stringify(this.entries(), replacer, space);
	}

	toArray(auto?: boolean)
	{
		if (auto)
		{
			this.$auto();
		}

		return Object.entries(this);
	}
}

export namespace EpubConfig
{
	export let dateFormat = 'YYYY-MM-DDTHH:mm:ss.SSSZ';

	export let defaultEpubConfig = {
		toc: [],
		landmarks: [],
		sections: [],
		stylesheet: {},
		additionalFiles: [],
		options: {},
	} as IEpubConfig;
}

//let a = new EpubConfig({lang: 'zh'});
//
//a.addAuthor('菱影代理');
//
//a.setPublication(true);
//
//let b = new EpubConfig(a);
//
//a.lang = 'jp';
//
//console.log(a, b.$auto());

// @ts-ignore
export default EpubConfig as EpubConfig;
