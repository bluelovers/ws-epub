import * as slugify from 'slugify';
import './js/util/handlebar-helpers';
import { saveAs } from 'file-saver';

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
	slug?;
	lang?: string;
	author?: string;
	publisher?;
	modificationDate?;
	modificationDateYMD?;
	rights?;
	coverUrl?;
	coverRights?;
	attributionUrl?;
	stylesheet?;
	sections?;
	toc?;
	landmarks?;
	options?;
	additionalFiles?;
	publicationDate?;
	publicationDateYMD?;
}

export function EpubMaker()
{
	let self = this;
	let epubConfig = {
		toc: [],
		landmarks: [],
		sections: [],
		stylesheet: {},
		additionalFiles: [],
		options: {}
	} as IEpubConfig;

	this.withUuid = function (uuid)
	{
		epubConfig.uuid = uuid;
		return self;
	};

	this.withTemplate = function (templateName)
	{
		epubConfig.templateName = templateName;
		return self;
	};

	this.withTitle = function (title)
	{
		epubConfig.title = title;
		// @ts-ignore
		epubConfig.slug = slugify(title);
		return self;
	};

	this.withLanguage = function (lang)
	{
		epubConfig.lang = lang;
		return self;
	};

	this.withAuthor = function (fullName)
	{
		epubConfig.author = fullName;
		return self;
	};

	this.withPublisher = function (publisher)
	{
		epubConfig.publisher = publisher;
		return self;
	};

	this.withModificationDate = function (modificationDate)
	{
		epubConfig.modificationDate = modificationDate.toISOString();
		epubConfig.modificationDateYMD = epubConfig.modificationDate.substr(0, 10);
		return self;
	};

	this.withRights = function (rightsConfig)
	{
		epubConfig.rights = rightsConfig;
		return self;
	};

	this.withCover = function (coverUrl, rightsConfig)
	{
		epubConfig.coverUrl = coverUrl;
		epubConfig.coverRights = rightsConfig;
		return self;
	};

	this.withAttributionUrl = function (attributionUrl)
	{
		epubConfig.attributionUrl = attributionUrl;
		return self;
	};

	this.withStylesheetUrl = function (stylesheetUrl, replaceOriginal)
	{
		epubConfig.stylesheet = {
			url: stylesheetUrl,
			styles: '',
			replaceOriginal: replaceOriginal
		};
		return self;
	};

	this.withSection = function (section)
	{
		epubConfig.sections.push(section);
		Array.prototype.push.apply(epubConfig.toc, section.collectToc());
		Array.prototype.push.apply(epubConfig.landmarks, section.collectLandmarks());
		return self;
	};

	this.withAdditionalFile = function (fileUrl, folder, filename)
	{
		epubConfig.additionalFiles.push({
			url: fileUrl,
			folder: folder,
			filename: filename
		});
		return self;
	};

	this.withOption = function (key, value)
	{
		epubConfig.options[key] = value;
		return self;
	};

	this.makeEpub = function ()
	{
		epubConfig.publicationDate = new Date().toISOString();
		epubConfig.publicationDateYMD = epubConfig.publicationDate.substr(0, 10);
		return templateManagers[epubConfig.templateName].make(epubConfig).then(function (epubZip)
		{
			console.info('generating epub for: ' + epubConfig.title);
			var content = epubZip.generate({ type: 'blob', mimeType: 'application/epub+zip', compression: 'DEFLATE' });
			return content;
		});
	};

	this.downloadEpub = function (callback, useTitle)
	{
		self.makeEpub().then(function (epubZipContent)
		{
			var filename;
			if (useTitle)
			{
				filename = epubConfig.title + '.epub';
			}
			else
			{
				filename = epubConfig.slug + '.epub';
			}
			console.debug('saving "' + filename + '"...');
			if (callback && typeof(callback) === 'function')
			{
				callback(epubZipContent, filename);
			}
			saveAs(epubZipContent, filename);
		});
	};
}

export namespace EpubMaker
{
	// epubtypes and descriptions, useful for vendors implementing a GUI
	// @ts-ignore
	export const epubtypes = require('./js/epub-types.js');

	/**
	 * @epubType Optional. Allows you to add specific epub type content such as [epub:type="titlepage"]
	 * @id Optional, but required if section should be included in toc and / or landmarks
	 * @content Optional. Should not be empty if there will be no subsections added to this section. Format: { title, content, renderTitle }
	 */
	export function Section(epubType, id, content, includeInToc, includeInLandmarks)
	{
		var self = this;
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

		this.withSubSection = function (subsection)
		{
			self.subSections.push(subsection);
			return self;
		};

		this.collectToc = function ()
		{
			return collectSections(this, 'includeInToc');
		};

		this.collectLandmarks = function ()
		{
			return collectSections(this, 'includeInLandmarks');
		};

		function collectSections(section, prop)
		{
			var sections = section[prop] ? [section] : [];
			for (var i = 0; i < section.subSections.length; i++)
			{
				Array.prototype.push.apply(sections, collectSections(section.subSections[i], prop));
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
