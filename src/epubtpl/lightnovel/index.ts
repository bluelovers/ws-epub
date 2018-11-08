import zipLib, { JSZip } from '../../epubtpl-lib/zip';
import { Handlebars, compileTpl } from '../../epubtpl-lib/handlebar-helpers';
import { fetchFile } from '../../epubtpl-lib/ajax';
import { compileCss } from '../../epubtpl-lib/postcss';
import * as path from 'path';
import { IBuilder, IBuilderCallback, IEpubConfig } from '../../var';
import { EpubMaker } from '../../index';
import BPromise = require('bluebird');
import * as shortid from 'shortid';

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

			rank: number | string;
		}
	}
}

export namespace Builder
{
	export let templates = {
		//mimetype: 'mimetype',
		//container: 'META-INF/container.xml',
		opf: 'EPUB/content.opf',
		ncx: 'EPUB/toc.ncx',
		nav: 'EPUB/nav.xhtml',
		css: 'EPUB/css/main.css',
		content: 'EPUB/content.xhtml',
		autoToc: 'EPUB/auto-toc.xhtml',
		sectionsNavTemplate: 'EPUB/sections-nav-template.html',
		sectionsNCXTemplate: 'EPUB/sections-ncx-template.xml',
		sectionsOPFManifestTemplate: 'EPUB/sections-opf-manifest-template.xml',
		sectionsOPFSpineTemplate: 'EPUB/sections-opf-spine-template.xml',

		coverPage: 'EPUB/CoverPage.xhtml',
		tableOfContents: 'EPUB/TableOfContents.xhtml',

		sectionsInfo: 'EPUB/sections-info.html',
		sectionsScript: 'EPUB/sections-script.html',

		contents: 'EPUB/contents.xhtml',
	};

	for (let i in templates)
	{
		templates[i] = `\{\{import \'${path.join(EPUB_TEMPLATES_TPL, templates[i])}'\}\}`;
	}

	let playOrder = 0;

	export let staticFiles = {
		'mimetype': 'mimetype',
		'META-INF/container.xml': 'META-INF/container.xml',
	};

	for (let i in staticFiles)
	{
		staticFiles[i] = path.join(EPUB_TEMPLATES_TPL, staticFiles[i]);
	}

	export function make(epub: EpubMaker, options?): BPromise<JSZip>
	{
		//let epubConfig = epub.epubConfig;

		options = Object.assign({}, {
			templates: templates,
		}, options);

		//console.debug('[building epub]', epub.epubConfig);
		//console.debug('[building epub]', options);
		let zip = new JSZip();

		//await addAditionalInfo(zip, epub, options);

		Handlebars.registerPartial('sectionsInfo', options.templates.sectionsInfo);
		Handlebars.registerPartial('sectionsScript', options.templates.sectionsScript);

		return BPromise
			.mapSeries([
				addStaticFiles,

				addAditionalInfo,

				//zipLib.addMimetype,
				//zipLib.addContainerInfo,
				addCover,

				zipLib.addFiles,

				addStylesheets,
				addManifestOpf,
				addEpub2Nav,
				addEpub3Nav,
				addContent,

				tableOfContents,
			], async function (fn, index)
			{
				if (fn === zipLib.addFiles)
				{
					return (fn as typeof zipLib.addFiles)(zip, epub, options)
						.then(function (ls)
						{
							return ls;
						})
						;
				}

				return fn(zip, epub, options);
			})
			.tap(function ()
			{
				//console.log(epub.epubConfig.cover);
			})
			.then(function ()
			{
				return zip;
			})
			//.catch(err => console.log(err))
			;
	}

	export function addStaticFiles(zip, epub: EpubMaker, options)
	{
		let ls = Object.keys(staticFiles).reduce(function (a, key)
		{
			let b = {
				name: key,
				ext: '',
				file: staticFiles[key],
			};

			a.push(b);

			return a;
		}, []);

		return zipLib.addStaticFiles(zip, ls);
	}

	export async function tableOfContents(zip, epub: EpubMaker, options)
	{
		zip
			.folder('EPUB')
			.file('TableOfContents.xhtml', compileTpl(options.templates.tableOfContents, epub.epubConfig))
		;

		zip
			.folder('EPUB')
			.file('contents.xhtml', compileTpl(options.templates.contents, epub.epubConfig))
		;
	}

	export async function addCover(zip, epub: EpubMaker, options)
	{
		let bool = await zipLib.addCover(zip, epub, options);

		if (bool)
		{
			zip
				.folder('EPUB')
				.file('CoverPage.xhtml', compileTpl(options.templates.coverPage, epub.epubConfig))
			;
		}
	}

	export function addInfoSection(section, titlePrefix?, namePrefix?)
	{
		let c = '_';

		if (!section.content)
		{
			section.content = {};
		}
		if (titlePrefix)
		{
			titlePrefix = section.content.fullTitle = titlePrefix + ' - ' + section.content.title;
			namePrefix = section.name = namePrefix + c + section.rank;
		}
		else
		{
			titlePrefix = section.content.fullTitle = section.content.title;
			namePrefix = section.name = section.rank;
		}
		if (section.content.content || section.content.renderTitle || section.epubType == 'auto-toc')
		{
			section.needPage = true;
		}

		section.playOrder = playOrder++;

		if (!section.id)
		{
			section.id = (section.epubType || '').toString().replace('/\W/g', '') + shortid();
		}

		for (let i = 0; i < section.subSections.length; i++)
		{
			section.subSections[i].rank = i.toString().padStart(3, '0');
			addInfoSection(section.subSections[i], titlePrefix, namePrefix);
		}
	}

	export function addAditionalInfo(zip, epub: EpubMaker, options)
	{
		//Default options
		// @ts-ignore
		epub.epubConfig.options.tocName = epub.epubConfig.options.tocName || 'Menu';
		//Generate name and full title for each section/subsection
		for (let i = 0; i < epub.epubConfig.sections.length; i++)
		{
			epub.epubConfig.sections[i].rank = i.toString().padStart(3, '0');
			addInfoSection(epub.epubConfig.sections[i]);
		}
	}

	export function addManifestOpf(zip, epub: EpubMaker, options)
	{
		Handlebars.registerPartial('sectionsOPFManifestTemplate', options.templates.sectionsOPFManifestTemplate);
		Handlebars.registerPartial('sectionsOPFSpineTemplate', options.templates.sectionsOPFSpineTemplate);

		zip.folder('EPUB').file('content.opf', compileTpl(options.templates.opf, epub.epubConfig));
	}

	export function addEpub2Nav(zip, epub: EpubMaker, options)
	{
		Handlebars.registerPartial('sectionsNCXTemplate', options.templates.sectionsNCXTemplate);
		zip.folder('EPUB').file('toc.ncx', compileTpl(options.templates.ncx, epub.epubConfig));
	}

	export function addEpub3Nav(zip, epub: EpubMaker, options)
	{
		Handlebars.registerPartial('sectionsNavTemplate', options.templates.sectionsNavTemplate);
		zip.folder('EPUB').file('nav.xhtml', compileTpl(options.templates.nav, epub.epubConfig));
	}

	export async function addStylesheets(zip, epub: EpubMaker, options)
	{
		if (epub.epubConfig.stylesheet.url || epub.epubConfig.stylesheet.file)
		{
			let file = await fetchFile(epub.epubConfig.stylesheet);

			epub.epubConfig.stylesheet.styles += "\n" + file.data.toString();
		}

		return compileAndAddCss();

		async function compileAndAddCss()
		{
			let styles = {
				original: epub.epubConfig.stylesheet.replaceOriginal ? '' : options.templates.css,
				custom: epub.epubConfig.stylesheet.styles || '',
			};

			let css = await compileTpl(`${styles.original}\n${styles.custom}`, styles, true);

			css = await compileCss(css);

			return zip.folder('EPUB')
				.folder('css')
				.file('main.css', css)
				;
		}
	}

	export function addSection(zip: JSZip, section: EpubMaker.Section, epub: EpubMaker, options)
	{
		return zipLib.addSubSections(zip, section, function (zip, section, epubConfig, options)
		{
			if (section.needPage)
			{
				let name = section.name + '.xhtml';

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
		}, epub, options);
	}

	export function addContent(zip, epub: EpubMaker, options)
	{
		return BPromise.mapSeries(epub.epubConfig.sections, function (section)
		{
			return addSection(zip, section, epub, options);
		});
	}
}

// @ts-ignore
export const builder = Builder as IBuilder;
export default builder as IBuilder;

/*
if (typeof window !== 'undefined')
{
	// @ts-ignore
	window.epubMaker = builder;
}
*/
