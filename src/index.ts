import * as slugify from 'slugify';
import * as moment from 'moment';
import { templateManagers } from './template';
import * as shortid from 'shortid';
import * as hashSum from 'hash-sum';
import * as path from 'path';
import { parseFileSetting } from './epubtpl-lib/zip';
import { EpubConfig, IEpubConfig, ICover, IRightsConfig, IFiles, IStylesheet, ICollection } from './config';

export class EpubMaker
{
	public epubConfig: EpubConfig;

	constructor(options?, config?: IEpubConfig)
	{
		this.epubConfig = new EpubConfig(config, options);
	}

	static create(options?, ...argv)
	{
		return new this(options, ...argv);
	}

	withUuid(uuid: string)
	{
		this.epubConfig.uuid = uuid;
		return this;
	}

	withTemplate(templateName)
	{
		this.epubConfig.templateName = templateName;
		return this;
	}

	withTitle(title: string)
	{
		this.epubConfig.title = title;
		// @ts-ignore
		this.epubConfig.slug = slugify(title) || hashSum(title);

		return this;
	}

	withLanguage(lang: string)
	{
		this.epubConfig.lang = lang;
		return this;
	}

	get lang()
	{
		return this.epubConfig.lang;
	}

	withAuthor(fullName: string)
	{
		this.epubConfig.author = fullName;
		return this;
	}

	addAuthor(fullName: string, url?: string)
	{
		this.epubConfig.addAuthor(fullName, url);
		return this;
	}

	withPublisher(publisher: string)
	{
		this.epubConfig.publisher = publisher;
		return this;
	}

	withCollection(data: ICollection)
	{
		this.epubConfig.collection = Object.assign(this.epubConfig.collection || {}, data);

		return this;
	}

	withModificationDate(modificationDate, ...argv)
	{
		let data = moment(modificationDate, ...argv).local();

		this.epubConfig.modification = data;
		this.epubConfig.modificationDate = data.format(EpubMaker.dateFormat);
		this.epubConfig.modificationDateYMD = data.format('YYYY-MM-DD');
		return this;
	}

	withRights(rightsConfig: IRightsConfig)
	{
		this.epubConfig.rights = rightsConfig;
		return this;
	}

	withCover(coverUrl: string | ICover, rightsConfig?: IRightsConfig)
	{
		let cover = parseFileSetting(coverUrl, this.epubConfig) as ICover;

		if (cover && rightsConfig)
		{
			cover.rights = rightsConfig;
		}

		if (!cover)
		{
			throw new ReferenceError();
		}

		this.epubConfig.cover = Object.assign(this.epubConfig.cover || {}, cover);

		//this.epubConfig.coverUrl = coverUrl;
		//this.epubConfig.coverRights = rightsConfig;

		return this;
	}

	withAttributionUrl(attributionUrl)
	{
		this.epubConfig.attributionUrl = attributionUrl;
		return this;
	}

	withStylesheetUrl(stylesheetUrl, replaceOriginal?: boolean)
	{
		let data = parseFileSetting(stylesheetUrl, this.epubConfig) as IStylesheet;

		this.epubConfig.stylesheet = Object.assign(this.epubConfig.stylesheet, data, {
			replaceOriginal: replaceOriginal,
		});

		return this;
	}

	withSection(section: EpubMaker.Section)
	{
		section.parentEpubMaker = this;

		this.epubConfig.sections.push(section);
		Array.prototype.push.apply(this.epubConfig.toc, section.collectToc());
		Array.prototype.push.apply(this.epubConfig.landmarks, section.collectLandmarks());
		return this;
	}

	withAdditionalFile(fileUrl, folder, filename)
	{
		this.epubConfig.additionalFiles.push({
			url: fileUrl,
			folder: folder,
			name: filename
		});
		return this;
	}

	withOption(key: string, value)
	{
		this.epubConfig.options[key] = value;
		return this;
	}

	withInfoPreface(str: string)
	{
		this.epubConfig.infoPreface = str.toString();
		return this;
	}

	addTag(tag)
	{
		tag = (Array.isArray(tag) ? tag : [tag]).reduce(function (a, b)
		{
			if (Array.isArray(b))
			{
				return a.concat(b);
			}
			else
			{
				a.push(b);
			}

			return a;
		}, []);

		this.epubConfig.tags = (this.epubConfig.tags || []).concat(tag);
		return this;
	}

	setPublicationDate(new_data?)
	{
		let data = moment(new_data);

		this.epubConfig.publication = data;
		this.epubConfig.publicationDate = data.format(EpubMaker.dateFormat);
		this.epubConfig.publicationDateYMD = data.format('YYYY-MM-DD');

		return this;
	}

	getFilename(useTitle?: boolean): string
	{
		let ext = this.epubConfig.options.ext || EpubMaker.defaultExt;
		let filename;

		if (this.epubConfig.filename)
		{
			filename = this.epubConfig.filename;
		}
		else if (useTitle && this.epubConfig.title)
		{
			filename = this.epubConfig.title;
		}
		else
		{
			filename = this.epubConfig.slug;
		}

		return filename + ext;
	}

	vaild()
	{
		let ret = [];

		if (!this.epubConfig.title || !this.epubConfig.slug)
		{
			ret.push('title, slug');
		}

		if (ret.length)
		{
			return ret;
		}

		return null;
	}

	build(options?)
	{
		let self = this;

		if (!this.epubConfig.publication)
		{
			this.setPublicationDate();
		}

		if (!this.epubConfig.uuid)
		{
			this.withUuid(shortid());
		}

		this.epubConfig.$auto();

		let chk = this.vaild();

		if (chk)
		{
			throw chk;
		}

		//this.epubConfig.langMain = this.epubConfig.langMain || this.epubConfig.lang;

		[]
			.concat(this.epubConfig.sections, this.epubConfig.toc, this.epubConfig.landmarks)
			.forEach(function (section: EpubMaker.Section, index)
			{
				section._EpubMaker_ = self;
			})
		;

		return templateManagers.exec(this.epubConfig.templateName, this, options);
	}

	/**
	 * for node.js
	 *
	 * @param options
	 * @returns {Promise<T>}
	 */
	makeEpub<T = Buffer | Blob>(options?): Promise<T | any | Buffer | Blob>
	{
		let self = this;

		return this.build(options).then(async function (epubZip)
		{
			let generateOptions = Object.assign({
				type: 'nodebuffer',
				mimeType: 'application/epub+zip',
				compression: 'DEFLATE'
			}, self.epubConfig.options.generateOptions, options);

			console.info('generating epub for: ' + self.epubConfig.title);
			let content = await epubZip.generateAsync(generateOptions);

			return content;
		});
	}
}

export interface ISectionConfig
{
	lang?: string;
}

export namespace EpubMaker
{
	export let defaultExt = '.epub';
	export let dateFormat = 'YYYY-MM-DDTHH:mm:ss.SSSZ';

	// epubtypes and descriptions, useful for vendors implementing a GUI
	// @ts-ignore
	export const epubtypes = require('./epub-types.js');

	/**
	 * @epubType Optional. Allows you to add specific epub type content such as [epub:type="titlepage"]
	 * @id Optional, but required if section should be included in toc and / or landmarks
	 * @content Optional. Should not be empty if there will be no subsections added to this section. Format: { title, content, renderTitle }
	 */
	export class Section
	{
		public _EpubMaker_: EpubMaker;

		public epubType;
		public id;
		public content;
		public includeInToc: boolean;
		public includeInLandmarks: boolean;
		public subSections: Section[] = [];

		public sectionConfig: ISectionConfig = {};

		public parentSection: Section;
		public parentEpubMaker: EpubMaker;

		constructor(epubType, id, content, includeInToc?: boolean, includeInLandmarks?: boolean)
		{
			this.epubType = epubType;
			this.id = id;
			this.content = content;
			this.includeInToc = includeInToc;
			this.includeInLandmarks = includeInLandmarks;
			this.subSections = [];

			if (content)
			{
				content.renderTitle = content.renderTitle !== false; // 'undefined' should default to true
			}
		}

		get epubTypeGroup()
		{
			return epubtypes.getGroup(this.epubType);
		}

		get lang()
		{
			return this.sectionConfig.lang || (this._EpubMaker_ ? this._EpubMaker_.lang : null) || null;
		}

		get langMain()
		{
			return (this._EpubMaker_ ? this._EpubMaker_.lang : null) || null;
		}

		static create(epubType, id, content, includeInToc: boolean, includeInLandmarks: boolean, ...argv)
		{
			return new this(epubType, id, content, includeInToc, includeInLandmarks, ...argv);
		}

		withSubSection(subsection: Section)
		{
			subsection.parentSection = this;

			this.subSections.push(subsection);
			return this;
		};

		collectToc()
		{
			return this.collectSections(this, 'includeInToc');
		};

		collectLandmarks()
		{
			return this.collectSections(this, 'includeInLandmarks');
		};

		collectSections(section: Section, prop: string): Section[]
		{
			let sections = section[prop] ? [section] : [];
			for (let i = 0; i < section.subSections.length; i++)
			{
				Array.prototype.push.apply(sections, this.collectSections(section.subSections[i], prop));
			}
			return sections;
		}
	}
}

export default EpubMaker;

if (typeof window !== 'undefined')
{
	// @ts-ignore
	window.EpubMaker = EpubMaker;
}
