
import * as JSZip from 'jszip';
import * as JSZipUtils from 'jszip-utils';
import { Handlebars } from '../handlebar-helpers';
import { html_beautify } from 'js-beautify';
import * as D from 'd.js';
import { ajax } from '../ajax';
// @ts-ignore
import * as path from 'path';

// @ts-ignore
const EPUB_TEMPLATES_PATH = path.join(__dirname);
const EPUB_TEMPLATES_TPL = path.join(EPUB_TEMPLATES_PATH, 'tpl');

let templates = {
	mimetype: 'mimetype',
	container: 'META-INF/container.xml',
	opf: 'EPUB/lightnovel.opf',
	ncx: 'EPUB/lightnovel.ncx',
	nav: 'EPUB/nav.html',
	css: 'EPUB/css/main.css',
	content: 'EPUB/content.html',
	autoToc: 'EPUB/auto-toc.html',
	sectionsNavTemplate: 'EPUB/sections-nav-template.html',
	sectionsNCXTemplate: 'EPUB/sections-ncx-template.xml',
	sectionsOPFManifestTemplate: 'EPUB/sections-opf-manifest-template.xml',
	sectionsOPFSpineTemplate: 'EPUB/sections-opf-spine-template.xml'
};

for (let i in templates)
{
	templates[i] = `\{\{import \'${path.join(EPUB_TEMPLATES_TPL, templates[i])}'\}\}`;
}

let Builder = function ()
{

	this.make = function (epubConfig): Promise<JSZip>
	{
		console.debug('building epub', epubConfig);
		let zip = new JSZip();

		addAditionalInfo(epubConfig);

		return Promise
			.all([
				addMimetype(zip),
				addContainerInfo(zip, epubConfig),
				addManifestOpf(zip, epubConfig),
				addCover(zip, epubConfig),
				addFiles(zip, epubConfig),
				addEpub2Nav(zip, epubConfig),
				addEpub3Nav(zip, epubConfig),
				addStylesheets(zip, epubConfig),
				addContent(zip, epubConfig),
			])
			.then(function ()
			{
				return zip;
			})
			.catch(err => console.log(err))
			;
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

	async function addCover(zip, epubConfig)
	{
		if (epubConfig.coverUrl)
		{
			return new Promise(function (resolve, reject)
			{
				JSZipUtils.getBinaryContent(epubConfig.coverUrl, function (err, data)
				{
					if (!err)
					{
						let ext = epubConfig.coverUrl.substr(epubConfig.coverUrl.lastIndexOf('.') + 1);
						zip.folder('EPUB')
							//.folder('images')
							.file(epubConfig.slug + '-cover.' + ext, data, { binary: true });
						resolve('');
					}
					else
					{
						reject(err);
					}
				});
			});
		}
		else
		{
			return true;
		}
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
