/* global module, require, exports, JSZip, JSZipUtils, Handlebars, html_beautify */

import * as JSZip from 'jszip';
import * as JSZipUtils from 'jszip-utils';
import { Handlebars } from '../util/handlebar-helpers';
import { html_beautify } from 'js-beautify';
import * as D from 'd.js';
import { ajax } from '../util/ajax';

let templates = {
	mimetype: '@@import src/epub_templates/lightnovel/mimetype',
	container: '@@import src/epub_templates/lightnovel/META-INF/container.xml',
	opf: '@@import src/epub_templates/lightnovel/EPUB/lightnovel.opf',
	ncx: '@@import src/epub_templates/lightnovel/EPUB/lightnovel.ncx',
	nav: '@@import src/epub_templates/lightnovel/EPUB/nav.html',
	css: '@@import src/epub_templates/lightnovel/EPUB/css/main.css',
	content: '@@import src/epub_templates/lightnovel/EPUB/content.html',
	autoToc: '@@import src/epub_templates/lightnovel/EPUB/auto-toc.html',
	sectionsNavTemplate: '@@import src/epub_templates/lightnovel/EPUB/sections-nav-template.html',
	sectionsNCXTemplate: '@@import src/epub_templates/lightnovel/EPUB/sections-ncx-template.xml',
	sectionsOPFManifestTemplate: '@@import src/epub_templates/lightnovel/EPUB/sections-opf-manifest-template.xml',
	sectionsOPFSpineTemplate: '@@import src/epub_templates/lightnovel/EPUB/sections-opf-spine-template.xml'
};

let Builder = function ()
{

	this.make = function (epubConfig)
	{
		console.debug('building epub', epubConfig);
		let zip = new JSZip();

		let deferred = D();
		addAditionalInfo(epubConfig);
		D.all(
			addMimetype(zip),
			addContainerInfo(zip, epubConfig),
			addManifestOpf(zip, epubConfig),
			addCover(zip, epubConfig),
			addFiles(zip, epubConfig),
			addEpub2Nav(zip, epubConfig),
			addEpub3Nav(zip, epubConfig),
			addStylesheets(zip, epubConfig),
			addContent(zip, epubConfig)
		).then(function ()
		{
			deferred.resolve(zip);
		}, function (err) { console.log(err); });

		return deferred.promise;
	};

	function addInfoSection(section, titlePrefix?, namePrefix?)
	{
		if (!section.content)
		{
			section.content = {};
		}
		if (titlePrefix)
		{
			titlePrefix = section.content.fullTitle = titlePrefix + ' - ' + section.content.title;
			namePrefix = section.name = namePrefix + '-' + section.rank;
		}
		else
		{
			titlePrefix = section.content.fullTitle = section.content.title;
			namePrefix = section.name = '' + section.rank;
		}
		if (section.content.content || section.content.renderTitle || section.epubType == 'auto-toc')
		{
			section.needPage = true;
		}
		for (let i = 0; i < section.subSections.length; i++)
		{
			section.subSections[i].rank = i;
			addInfoSection(section.subSections[i], titlePrefix, namePrefix);
		}
	}

	function addAditionalInfo(epubConfig)
	{
		//Default options
		epubConfig.options.tocName = epubConfig.options.tocName || 'Menu';
		//Generate name and full title for each section/subsection
		for (let i = 0; i < epubConfig.sections.length; i++)
		{
			epubConfig.sections[i].rank = i;
			addInfoSection(epubConfig.sections[i]);
		}
	}

	function addMimetype(zip)
	{
		zip.file('mimetype', templates.mimetype);
	}

	function addContainerInfo(zip, epubConfig)
	{
		zip.folder('META-INF').file('container.xml', compile(templates.container, epubConfig));
	}

	function addManifestOpf(zip, epubConfig)
	{
		Handlebars.registerPartial('sectionsOPFManifestTemplate', templates.sectionsOPFManifestTemplate);
		Handlebars.registerPartial('sectionsOPFSpineTemplate', templates.sectionsOPFSpineTemplate);
		zip.folder('EPUB').file('lightnovel.opf', compile(templates.opf, epubConfig));
	}

	function addCover(zip, epubConfig)
	{
		let deferred = D();

		if (epubConfig.coverUrl)
		{
			JSZipUtils.getBinaryContent(epubConfig.coverUrl, function (err, data)
			{
				if (!err)
				{
					zip.folder('EPUB')
						.folder('images')
						.file(epubConfig.options.coverFilename, data, { binary: true });
					deferred.resolve('');
				}
				else
				{
					deferred.reject(err);
				}
			});
		}
		else
		{
			deferred.resolve(true);
		}
		return deferred.promise;
	}

	function addEpub2Nav(zip, epubConfig)
	{
		Handlebars.registerPartial('sectionsNCXTemplate', templates.sectionsNCXTemplate);
		zip.folder('EPUB').file('lightnovel.ncx', compile(templates.ncx, epubConfig));
	}

	function addEpub3Nav(zip, epubConfig)
	{
		Handlebars.registerPartial('sectionsNavTemplate', templates.sectionsNavTemplate);
		zip.folder('EPUB').file('nav.html', compile(templates.nav, epubConfig));
	}

	function addStylesheets(zip, epubConfig)
	{
		let deferred = D();
		if (epubConfig.stylesheet.url)
		{
			return ajax(epubConfig.stylesheet.url).then(function (result)
			{
				epubConfig.styles = result.data;
				compileAndAddCss();
			});
		}
		else
		{
			compileAndAddCss();
		}
		return deferred.promise;

		function compileAndAddCss()
		{
			let styles = {
				original: epubConfig.stylesheet.replaceOriginal ? '' : templates.css,
				custom: epubConfig.styles
			};
			zip.folder('EPUB').folder('css').file('main.css', compile('{{{original}}}{{{custom}}}', styles, true));
			deferred.resolve(true);
		}
	}

	function addFiles(zip, epubConfig)
	{
		let deferred_list = [];
		for (let i = 0; i < epubConfig.additionalFiles.length; i++)
		{
			let file = epubConfig.additionalFiles[i];
			let deferred = new D();
			JSZipUtils.getBinaryContent(file.url, (function (file, deferred)
			{
				return function (err, data)
				{
					if (!err)
					{
						zip.folder('EPUB').folder(file.folder).file(file.filename, data, { binary: true });
						deferred.resolve('');
					}
					else
					{
						deferred.reject(err);
					}
				};
			})(file, deferred));
			deferred_list.push(deferred.promise);
		}
		return D.all(deferred_list);
	}

	function addSection(zip, section)
	{
		if (section.needPage)
		{
			if (section.epubType == 'auto-toc')
			{
				zip.folder('EPUB').file(section.name + '.html', compile(templates.autoToc, section));
			}
			else
			{
				zip.folder('EPUB').file(section.name + '.html', compile(templates.content, section));
			}
		}
		for (let i = 0; i < section.subSections.length; i++)
		{
			addSection(zip, section.subSections[i]);
		}
	}

	function addContent(zip, epubConfig)
	{
		for (let i = 0; i < epubConfig.sections.length; i++)
		{
			addSection(zip, epubConfig.sections[i]);
		}
	}

	function compile(template, content, skipFormatting?)
	{
		return formatHTML(Handlebars.compile(template)(content));

		function formatHTML(htmlstr)
		{
			/*jslint camelcase:false*/
			return (skipFormatting || typeof html_beautify === 'undefined') ? htmlstr : html_beautify(htmlstr, {
				'end_with_newline': false,
				'indent_char': '\t',
				'indent_inner_html': true,
				'indent_size': '1',
				'preserve_newlines': false,
				'wrap_line_length': '0',
				'unformatted': [],
				'selector_separator_newline': false,
				'newline_between_rules': true
			});
			/*jslint camelcase:true*/
		}
	}
};

export const builder = new Builder();
export default builder;

if (typeof window !== 'undefined')
{
	// @ts-ignore
	window.epubMaker = builder;
}
