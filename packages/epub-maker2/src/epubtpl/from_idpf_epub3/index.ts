import { IBuilder, IBuilderCallback, IEpubConfig } from '../../var';
import zipLib, { JSZip, JSZipUtils } from '../../epubtpl-lib/zip';
import { Handlebars, compileTpl } from '../../epubtpl-lib/handlebar-helpers';
import { ajax } from '../../epubtpl-lib/ajax';
import path = require('upath2');

import epubTplLib, {} from '../../epubtpl-lib';

// @ts-ignore
export const EPUB_TEMPLATES_PATH = path.join(__dirname) as string;
export const EPUB_TEMPLATES_TPL = path.join(EPUB_TEMPLATES_PATH, 'tpl') as string;

let templates = {
	mimetype: 'mimetype',
	container: 'META-INF/container.xml',
	opf: 'EPUB/wasteland.opf',
	ncx: 'EPUB/wasteland.ncx',
	nav: 'EPUB/wasteland-nav.xhtml',
	css: 'EPUB/wasteland.css',
	content: 'EPUB/wasteland-content.xhtml',
	sectionsTemplate: 'EPUB/sections-template.xhtml',
};

for (let i in templates)
{
	templates[i] = `\{\{import \'${path.join(EPUB_TEMPLATES_TPL, templates[i])}'\}\}`;
}

let Builder = function ()
{

	this.make = function <T = JSZip>(epubConfig: IEpubConfig, options?): Promise<T>
	{
		console.debug('building epub', epubConfig);
		let zip = new JSZip();

		return Promise
			.all([
				zipLib.addMimetype(zip, epubConfig, options),
				zipLib.addContainerInfo(zip, epubConfig, options),
				addManifestOpf(zip, epubConfig, options),
				zipLib.addCover(zip, epubConfig, options),
				addEpub2Nav(zip, epubConfig, options),
				addEpub3Nav(zip, epubConfig, options),
				addStylesheets(zip, epubConfig, options),
				addContent(zip, epubConfig, options)
			])
			.then(function ()
			{
				return zip;
			})
			//.catch(err => console.log(err))
			;
	};

	function addManifestOpf(zip, epubConfig, options)
	{
		zip.folder('EPUB').file(epubConfig.slug + '.opf', compileTpl(templates.opf, epubConfig));
	}

	function addEpub2Nav(zip, epubConfig, options)
	{
		zip.folder('EPUB').file(epubConfig.slug + '.ncx', compileTpl(templates.ncx, epubConfig));
	}

	function addEpub3Nav(zip, epubConfig, options)
	{
		zip.folder('EPUB').file(epubConfig.slug + '-nav.xhtml', compileTpl(templates.nav, epubConfig));
	}

	async function addStylesheets(zip, epubConfig, options)
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

			css = await epubTplLib.compileCss(css);

			await zip.folder('EPUB')
				.folder('css')
				.file('main.css', css)
			;

			return true;
		}
	}

	function addContent(zip, epubConfig, options)
	{
		Handlebars.registerPartial('sectionTemplate', templates.sectionsTemplate);
		zip.folder('EPUB').file(epubConfig.slug + '-content.xhtml', compileTpl(templates.content, epubConfig));
	}

};

export const builder = new Builder();
export default builder;

if (typeof window !== 'undefined')
{
	// @ts-ignore
	window.epubMaker = builder;
}
