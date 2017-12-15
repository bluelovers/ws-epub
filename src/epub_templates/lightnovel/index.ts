import * as JSZip from 'jszip';
import * as JSZipUtils from 'jszip-utils';
import { Handlebars } from '../lib/handlebar-helpers';
import { html_beautify } from 'js-beautify';
import * as D from 'd.js';
import { ajax } from '../lib/ajax';
import * as path from 'path';
import { IBuilder, IBuilderCallback, IEpubConfig } from '../../var';
import * as postcss from 'postcss';
import * as autoprefixer from 'autoprefixer';
import * as postcss_epub from 'postcss-epub';

// @ts-ignore
export const EPUB_TEMPLATES_PATH = path.join(__dirname) as string;
export const EPUB_TEMPLATES_TPL = path.join(EPUB_TEMPLATES_PATH, 'tpl') as string;

export namespace Builder
{
	export let templates = {
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

	export function make<T = JSZip>(epubConfig: IEpubConfig, options?): Promise<T>
	{
		options = Object.assign({}, {
			templates: templates,
		}, options);

		console.debug('building epub', epubConfig, options);
		let zip = new JSZip();

		addAditionalInfo(zip, epubConfig, options);

		return Promise
			.all([
				addMimetype(zip, epubConfig, options),
				addContainerInfo(zip, epubConfig, options),
				addManifestOpf(zip, epubConfig, options),
				addCover(zip, epubConfig, options),
				addFiles(zip, epubConfig, options),
				addEpub2Nav(zip, epubConfig, options),
				addEpub3Nav(zip, epubConfig, options),
				addStylesheets(zip, epubConfig, options),
				addContent(zip, epubConfig, options),
			])
			.then(function ()
			{
				return zip;
			})
			.catch(err => console.log(err))
			;
	}

	export function addInfoSection(section, titlePrefix?, namePrefix?)
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

	export function addAditionalInfo(zip, epubConfig: IEpubConfig, options)
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

	export function addMimetype(zip: JSZip, epubConfig: IEpubConfig, options)
	{
		zip.file('mimetype', options.templates.mimetype);
	}

	export function addContainerInfo(zip, epubConfig, options)
	{
		zip.folder('META-INF').file('container.xml', compile(options.templates.container, epubConfig));
	}

	export function addManifestOpf(zip, epubConfig, options)
	{
		Handlebars.registerPartial('sectionsOPFManifestTemplate', options.templates.sectionsOPFManifestTemplate);
		Handlebars.registerPartial('sectionsOPFSpineTemplate', options.templates.sectionsOPFSpineTemplate);
		zip.folder('EPUB').file('lightnovel.opf', compile(options.templates.opf, epubConfig));
	}

	export async function addCover(zip, epubConfig, options)
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

	export function addEpub2Nav(zip, epubConfig, options)
	{
		Handlebars.registerPartial('sectionsNCXTemplate', options.templates.sectionsNCXTemplate);
		zip.folder('EPUB').file('lightnovel.ncx', compile(options.templates.ncx, epubConfig));
	}

	export function addEpub3Nav(zip, epubConfig, options)
	{
		Handlebars.registerPartial('sectionsNavTemplate', options.templates.sectionsNavTemplate);
		zip.folder('EPUB').file('nav.html', compile(options.templates.nav, epubConfig));
	}

	export function addStylesheets(zip, epubConfig, options)
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

		async function compileAndAddCss()
		{
			let styles = {
				original: epubConfig.stylesheet.replaceOriginal ? '' : options.templates.css,
				custom: epubConfig.styles || '',
			};

			let css = await compile(`${styles.original}\n${styles.custom}`, styles, true);

			let result = await postcss([
					postcss_epub,
					autoprefixer({
						add: true,
						remove: false,
						flexbox: false,
					})
				])
				.process(css)
			;

			console.log(result.css);

			zip.folder('EPUB')
				.folder('css')
				.file('main.css', result.css)
			;

			deferred.resolve(true);
		}
	}

	export function addFiles(zip, epubConfig, options)
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

	export function addSection(zip, section, options)
	{
		if (section.needPage)
		{
			let name = section.name;

			if (section.epubType == 'auto-toc')
			{
				zip.folder('EPUB').file(name + '.html', compile(options.templates.autoToc, section));
			}
			else
			{
				zip.folder('EPUB').file(name + '.html', compile(options.templates.content, section));
			}
		}
		for (let i = 0; i < section.subSections.length; i++)
		{
			addSection(zip, section.subSections[i], options);
		}
	}

	export function addContent(zip, epubConfig, options)
	{
		for (let i = 0; i < epubConfig.sections.length; i++)
		{
			addSection(zip, epubConfig.sections[i], options);
		}
	}

	export function compile(template, content, skipFormatting?: boolean): string
	{
		return formatHTML(Handlebars.compile(template)(content), skipFormatting);
	}

	export function formatHTML(htmlstr, skipFormatting?: boolean): string
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

export const builder = Builder as IBuilder;
export default builder as IBuilder;

if (typeof window !== 'undefined')
{
	// @ts-ignore
	window.epubMaker = builder;
}
