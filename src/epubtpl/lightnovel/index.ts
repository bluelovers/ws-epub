import zipLib, { JSZip, JSZipUtils } from '../../epubtpl-lib/zip';
import { Handlebars, compileTpl } from '../../epubtpl-lib/handlebar-helpers';
import { ajax } from '../../epubtpl-lib/ajax';
import { compileCss } from '../../epubtpl-lib/postcss';
import * as path from 'path';
import { IBuilder, IBuilderCallback, IEpubConfig } from '../../var';
import { EpubMaker } from '../../index';
import * as Promise from 'bluebird';

import epubTplLib, {} from '../../epubtpl-lib';

// @ts-ignore
export const EPUB_TEMPLATES_PATH = path.join(__dirname) as string;
export const EPUB_TEMPLATES_TPL = path.join(EPUB_TEMPLATES_PATH, 'tpl') as string;

declare module '../../index'
{
	namespace EpubMaker
	{
		interface Section
		{
			needPage: boolean;
			name: string;
		}
	}
}

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

	export async function make<T = JSZip>(epubConfig: IEpubConfig, options?): Promise<T>
	{
		options = Object.assign({}, {
			templates: templates,
		}, options);

		console.debug('building epub', epubConfig, options);
		let zip = new JSZip();

		await addAditionalInfo(zip, epubConfig, options);

		return Promise
			.all([
				zipLib.addMimetype(zip, epubConfig, options),
				zipLib.addContainerInfo(zip, epubConfig, options),
				addManifestOpf(zip, epubConfig, options),
				zipLib.addCover(zip, epubConfig, options),
				zipLib.addFiles(zip, epubConfig, options),
				addEpub2Nav(zip, epubConfig, options),
				addEpub3Nav(zip, epubConfig, options),
				addStylesheets(zip, epubConfig, options),
				addContent(zip, epubConfig, options),
			])
			.then(function ()
			{
				return zip;
			})
			//.catch(err => console.log(err))
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

	export function addManifestOpf(zip, epubConfig, options)
	{
		Handlebars.registerPartial('sectionsOPFManifestTemplate', options.templates.sectionsOPFManifestTemplate);
		Handlebars.registerPartial('sectionsOPFSpineTemplate', options.templates.sectionsOPFSpineTemplate);

		zip.folder('EPUB').file('lightnovel.opf', compileTpl(options.templates.opf, epubConfig));
	}

	export function addEpub2Nav(zip, epubConfig, options)
	{
		Handlebars.registerPartial('sectionsNCXTemplate', options.templates.sectionsNCXTemplate);
		zip.folder('EPUB').file('lightnovel.ncx', compileTpl(options.templates.ncx, epubConfig));
	}

	export function addEpub3Nav(zip, epubConfig, options)
	{
		Handlebars.registerPartial('sectionsNavTemplate', options.templates.sectionsNavTemplate);
		zip.folder('EPUB').file('nav.html', compileTpl(options.templates.nav, epubConfig));
	}

	export async function addStylesheets(zip, epubConfig, options)
	{
		if (epubConfig.stylesheet.url)
		{
			return ajax(epubConfig.stylesheet.url).then(function (result)
			{
				epubConfig.styles = result.data;

				return compileAndAddCss();
			});
		}

		return compileAndAddCss();

		async function compileAndAddCss()
		{
			let styles = {
				original: epubConfig.stylesheet.replaceOriginal ? '' : options.templates.css,
				custom: epubConfig.styles || '',
			};

			let css = await compileTpl(`${styles.original}\n${styles.custom}`, styles, true);

			css = await compileCss(css);

			return zip.folder('EPUB')
				.folder('css')
				.file('main.css', css)
				;
		}
	}

	export function addSection(zip: JSZip, section: EpubMaker.Section, epubConfig, options)
	{
		return zipLib.addSubSections(zip, section, function (zip, section, epubConfig, options)
		{
			if (section.needPage)
			{
				let name = section.name + '.html';

				if (section.epubType == 'auto-toc')
				{
					return zip
						.folder('EPUB')
						.file(name, compileTpl(options.templates.autoToc, section))
						;
				}
				else
				{
					return zip
						.folder('EPUB')
						.file(name, compileTpl(options.templates.content, section))
						;
				}
			}

			return false;
		}, epubConfig, options);

		/*
		if (section.needPage)
		{
			let name = section.name + '.html';

			if (section.epubType == 'auto-toc')
			{
				zip.folder('EPUB').file(name, compileTpl(options.templates.autoToc, section));
			}
			else
			{
				zip.folder('EPUB').file(name, compileTpl(options.templates.content, section));
			}
		}

		return Promise.map(section.subSections, function (subSection: EpubMaker.Section)
		{
			return addSection(zip, subSection, options);
		});
		*/
	}

	export function addContent(zip, epubConfig, options)
	{
		return Promise.map(epubConfig.sections, function (section)
		{
			return addSection(zip, section, epubConfig, options);
		});
	}
}

export const builder = Builder as IBuilder;
export default builder as IBuilder;

if (typeof window !== 'undefined')
{
	// @ts-ignore
	window.epubMaker = builder;
}
