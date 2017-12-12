import * as slugify from 'slugify';
import './js/util/handlebar-helpers';
import { saveAs } from 'file-saver';
import * as moment from 'moment';

export const templateManagers = {
	// @ts-ignore
	'idpf-wasteland': require('./js/template-builders/idpf-wasteland-builder.js').builder,
	// @ts-ignore
	'lightnovel': require('./js/template-builders/lightnovel-builder.js').builder,
};

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

export class EpubMaker
{
	public epubConfig = {
		toc: [],
		landmarks: [],
		sections: [],
		stylesheet: {},
		additionalFiles: [],
		options: {},
	} as IEpubConfig;

	constructor(options?, config?: IEpubConfig)
	{
		Object.assign(this.epubConfig, config);
		Object.assign(this.epubConfig.options, options);
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

	withTemplate(templateName: string)
	{
		this.epubConfig.templateName = templateName;
		return this;
	}

	withTitle(title: string)
	{
		this.epubConfig.title = title;
		// @ts-ignore
		this.epubConfig.slug = slugify(title);
		return this;
	}

	withLanguage(lang: string)
	{
		this.epubConfig.lang = lang;
		return this;
	}

	withAuthor(fullName: string)
	{
		this.epubConfig.author = fullName;
		return this;
	}

	withPublisher(publisher: string)
	{
		this.epubConfig.publisher = publisher;
		return this;
	}

	withModificationDate(modificationDate, ...argv)
	{
		let data = moment(modificationDate, ...argv).local();

		this.epubConfig.modification = data;
		this.epubConfig.modificationDate = data.format(EpubMaker.dataFormat);
		this.epubConfig.modificationDateYMD = data.format('YYYY-MM-DD');
		return this;
	}

	withRights(rightsConfig: IRightsConfig)
	{
		this.epubConfig.rights = rightsConfig;
		return this;
	}

	withCover(coverUrl, rightsConfig: IRightsConfig)
	{
		this.epubConfig.coverUrl = coverUrl;
		this.epubConfig.coverRights = rightsConfig;
		return this;
	}

	withAttributionUrl(attributionUrl)
	{
		this.epubConfig.attributionUrl = attributionUrl;
		return this;
	}

	withStylesheetUrl(stylesheetUrl, replaceOriginal)
	{
		this.epubConfig.stylesheet = {
			url: stylesheetUrl,
			styles: '',
			replaceOriginal: replaceOriginal
		};
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
			filename: filename
		});
		return this;
	}

	withOption(key: string, value)
	{
		this.epubConfig.options[key] = value;
		return this;
	}

	setPublicationDate(new_data?)
	{
		let data = moment(new_data);

		this.epubConfig.publication = data;
		this.epubConfig.publicationDate = data.format(EpubMaker.dataFormat);
		this.epubConfig.publicationDateYMD = data.format('YYYY-MM-DD');

		return this;
	}

	getFilename(useTitle?: boolean): string
	{
		let ext = this.epubConfig.options.ext || '.epub';
		let filename;

		if (useTitle)
		{
			filename = this.epubConfig.title;
		}
		else
		{
			filename = this.epubConfig.slug;
		}

		return filename + ext;
	}

	makeEpub(options?)
	{
		let self = this;

		if (!this.epubConfig.publication)
		{
			this.setPublicationDate();
		}

		return templateManagers[this.epubConfig.templateName].make(this.epubConfig).then(function (epubZip)
		{
			let generateOptions = Object.assign({
				//type: 'blob',
				type: 'nodebuffer',
				mimeType: 'application/epub+zip',
				compression: 'DEFLATE'
			}, self.epubConfig.options.generateOptions, options);

			console.info('generating epub for: ' + self.epubConfig.title);
			let content = epubZip.generateAsync(generateOptions);

			return content;
		});
	}

	downloadEpub(callback, useTitle?: boolean)
	{
		let self = this;

		return this.makeEpub().then(function (epubZipContent)
		{
			let filename = self.getFilename(useTitle);

			console.debug('saving "' + filename + '"...');
			if (callback && typeof(callback) === 'function')
			{
				callback(epubZipContent, filename);
			}
			saveAs(epubZipContent, filename);
		});
	}
}

export namespace EpubMaker
{
	export let dataFormat = 'YYYY-MM-DDTHH:mm:ss.SSSZ';

	// epubtypes and descriptions, useful for vendors implementing a GUI
	// @ts-ignore
	export const epubtypes = require('./js/epub-types.js');

	/**
	 * @epubType Optional. Allows you to add specific epub type content such as [epub:type="titlepage"]
	 * @id Optional, but required if section should be included in toc and / or landmarks
	 * @content Optional. Should not be empty if there will be no subsections added to this section. Format: { title, content, renderTitle }
	 */
	export class Section
	{
		public epubType;
		public id;
		public content;
		public includeInToc: boolean;
		public includeInLandmarks: boolean;
		public subSections: Section[] = [];

		public parentSection: Section;
		public parentEpubMaker: EpubMaker;

		constructor(epubType, id, content, includeInToc: boolean, includeInLandmarks: boolean)
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
