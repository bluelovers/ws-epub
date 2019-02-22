import { EpubMaker, ISlugify, slugify } from './index';
import { shortid, hashSum, moment, array_unique } from './lib/util';
import { crlf, chkcrlf, LF, CRLF, CR } from 'crlf-normalize';

import { deepmerge, deepmergeOptions } from 'node-novel-info/lib';
import { htmlPreface } from './lib/util';
import { createUUID } from './lib/uuid';

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

	is?: string,
	href?: string,
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
	title_short?: string,
	titles?: string[];

	slug?: string;

	lang?: string;

	author?: string;
	authorUrl?: string;
	authors?: {
		[index: string]: string,
	};
	authorsJSON?: string;

	publisher?: string;

	rights?: IRightsConfig;

	cover?: ICover;
	cwd?: string;

	identifiers?: string[];

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
	infoPrefaceHTML?: string;

	links?: EpubMetaLink[],

	vertical?: boolean | EnumEpubConfigVertical,
}

export enum EnumEpubConfigVertical
{
	NONE = 0,
	VERTICAL_RL = 1
}

export interface EpubMetaLink
{
	href: string,
	rel: string,
	id?: string,
	refines: string,
	'media-type': string,
}

export class EpubConfig implements IEpubConfig
{
	uuid?: string;
	templateName?: string;

	filename?: string;

	title?: string;
	title_short?: string;

	titles?: string[];

	slug?: string;

	lang?: string;

	author?: string;
	authorUrl?: string;
	authors?: {
		[index: string]: string,
	};
	authorsJSON?: string;

	publisher?: string;

	rights?: IRightsConfig;

	cover?: ICover;
	cwd?: string;

	identifiers?: string[];

	attributionUrl?: string;
	stylesheet?: IStylesheet;
	sections?: EpubMaker.Section[];
	toc?: EpubMaker.Section[];
	landmarks?: EpubMaker.Section[];
	options?: {
		libSlugify?: ISlugify,
		ext?: string,
		generateOptions?,
	};
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
	infoPrefaceHTML?: string;

	links?: EpubMetaLink[];

	/**
	 * 輸出成 直排
	 */
	vertical?: boolean | EnumEpubConfigVertical;

	constructor(epubConfig: IEpubConfig = {}, options: any = {})
	{
		if (epubConfig instanceof EpubConfig)
		{
			epubConfig = epubConfig.entries(false);

			delete epubConfig.slug;
			delete epubConfig.uuid;
		}

		Object.assign(this, EpubConfig.getDefaultEpubConfig(), deepmerge.all([{}, epubConfig, {
			options
		}], deepmergeOptions));
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

		return this;
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

		return this;
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

		return this;
	}

	addLink(data: EpubMetaLink | string, rel?: string)
	{
		rel = (rel || (<EpubMetaLink>data).rel) as string;

		if (typeof data == 'string')
		{
			data = {
				href: data.toString(),
				rel,
			} as EpubMetaLink;
		}

		let link = Object.assign({
			href: '',
			rel: '',
			id: '',
			refines: '',
			'media-type': '',
		} as EpubMetaLink, data);

		link.href = (link.href || data.href || '').toString();
		link.rel = link.rel || rel || data.rel || 'link-' + shortid();

		this.links = this.links || [];
		this.links.push(link);

		return this;
	}

	/**
	 * isbn:xxx
	 * calibre:xxx
	 * uuid:xxx
	 *
	 * @param {string} type
	 * @param {string} id
	 * @returns {this}
	 */
	addIdentifier(type: string, id?: string)
	{
		this.identifiers = this.identifiers || [];

		let ids = [];

		if (type && type !== '')
		{
			ids.push(type.toString());
		}
		if (id && id !== '')
		{
			ids.push(id.toString());
		}

		if (!ids.length)
		{
			throw new ReferenceError();
		}

		this.identifiers.push(ids.join(':'));

		return this;
	}

	setVertical(vertical?: boolean | EnumEpubConfigVertical)
	{
		if (vertical === true)
		{
			vertical = EnumEpubConfigVertical.VERTICAL_RL;
		}

		this.vertical = vertical || 0;

		return this;
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

		self.tags = self.tags || [];

		[
			self.tags,
		].forEach(a => (a || []).filter(v => v).map(v => v.toString()));

		{
			if (self.authors)
			{
				self.author = self.author || Object.keys(self.authors)[0];
				self.authorUrl = self.authorUrl || self.authors[self.author];
			}

			if (self.author)
			{
				let o = {};

				o[self.author] = (self.authorUrl || '').toString();

				self.authors = Object.assign(o, self.authors, o);
			}

			if (self.authors && Object.keys(self.authors).length)
			{
				for (let name in self.authors)
				{
					self.authors[name] = (self.authors[name] || '').toString();

					self.tags.push(name);
				}

				self.authorsJSON = JSON.stringify(self.authors);
			}
			else
			{
				self.authors = null;
			}
		}

		if (self.publisher)
		{
			self.tags.push(self.publisher);
		}
		else
		{
			self.publisher = 'epub-maker2';
		}

		{
			self.tags.push('epub-maker2');

			if (self.tags)
			{
				self.tags = array_unique(self.tags);
			}
		}

		if (self.titles)
		{
			self.titles = self.titles.filter(v => v && v != self.title && v != self.title_short);

			self.titles = array_unique(self.titles);
		}

		self.uuid = (self.uuid && typeof self.uuid == 'string') ? self.uuid : createUUID(self);
		self.slug = self.slug
			// @ts-ignore
			|| slugify(self.title)
			|| hashSum(self.title)
		;

		if (!self.modification)
		{
			self.modification = self.publication.clone();
		}

		if (self.modification)
		{
			self.modificationDate = self.modification.format('YYYY-MM-DDThh:mm:ss') + 'Z';
			self.modificationDateYMD = self.modification.format('YYYY-MM-DD');
		}

		if (!self.publication)
		{
			this.setPublication(true);
		}

		if (self.infoPreface)
		{
			/*
			self.infoPreface = crlf(self.infoPreface).replace(/[ \t\uFEFF\xA0　]+$/gm, '');

			self.infoPrefaceHTML = self.infoPrefaceHTML || self.infoPreface.replace(/\n/g, '<br/>')
			*/
			htmlPreface(self);
		}

		//console.log(self.infoPreface, self.infoPrefaceHTML);

		self.publicationDate = self.publication.format(EpubConfig.dateFormat);
		self.publicationDateYMD = self.publication.format('YYYY-MM-DD');

		if (self.collection || 1)
		{
			self.collection.name = self.collection.name || self.title;
			self.collection.position = self.collection.position || 1;
			self.collection.type = self.collection.type || 'series';
		}

		this.setVertical(self.vertical);

		return this;
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

	export function getDefaultEpubConfig()
	{
		return {
			toc: [],
			landmarks: [],
			sections: [],
			stylesheet: {},
			additionalFiles: [],
			options: {},
		};
	}

	export let defaultEpubConfig = getDefaultEpubConfig();
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
