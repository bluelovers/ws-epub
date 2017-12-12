/* global module, require, exports, JSZip, JSZipUtils, Handlebars, html_beautify */

import * as JSZip from 'jszip';
import * as JSZipUtils from 'jszip-utils';
import { Handlebars } from '../util/handlebar-helpers';
import { html_beautify } from 'js-beautify';
import * as D from 'd.js';
import { ajax } from '../util/ajax';
import * as path from 'path';

// @ts-ignore
const EPUB_TEMPLATES_PATH = path.join(__dirname, '../../epub_templates');
const EPUB_TEMPLATES_TPL = path.join(EPUB_TEMPLATES_PATH, 'from_idpf_epub3');

let templates = {
	mimetype: 'wasteland/mimetype',
	container: 'wasteland/META-INF/container.xml',
	opf: 'wasteland/EPUB/wasteland.opf',
	ncx: 'wasteland//EPUB/wasteland.ncx',
	nav: 'wasteland/EPUB/wasteland-nav.xhtml',
	css: 'wasteland/EPUB/wasteland.css',
	content: 'wasteland/EPUB/wasteland-content.xhtml',
	sectionsTemplate: 'wasteland/EPUB/sections-template.xhtml',
};

for (let i in templates)
{
	templates[i] = `\{\{import \'${path.join(EPUB_TEMPLATES_TPL, templates[i])}'\}\}`;
}

let Builder = function ()
{

	this.make = function (epubConfig)
	{
		console.debug('building epub', epubConfig);
		let zip = new JSZip();

		let deferred = D();
		D.all(
			addMimetype(zip),
			addContainerInfo(zip, epubConfig),
			addManifestOpf(zip, epubConfig),
			addCover(zip, epubConfig),
			addEpub2Nav(zip, epubConfig),
			addEpub3Nav(zip, epubConfig),
			addStylesheets(zip, epubConfig),
			addContent(zip, epubConfig)
		).then(function ()
		{
			deferred.resolve(zip);
		});

		return deferred.promise;
	};

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
		zip.folder('EPUB').file(epubConfig.slug + '.opf', compile(templates.opf, epubConfig));
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
					let ext = epubConfig.coverUrl.substr(epubConfig.coverUrl.lastIndexOf('.') + 1);
					zip.folder('EPUB').file(epubConfig.slug + '-cover.' + ext, data, { binary: true });
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
		zip.folder('EPUB').file(epubConfig.slug + '.ncx', compile(templates.ncx, epubConfig));
	}

	function addEpub3Nav(zip, epubConfig)
	{
		zip.folder('EPUB').file(epubConfig.slug + '-nav.xhtml', compile(templates.nav, epubConfig));
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
			zip.folder('EPUB').file(epubConfig.slug + '.css', compile('{{{original}}}{{{custom}}}', styles, true));
			deferred.resolve(true);
		}
	}

	function addContent(zip, epubConfig)
	{
		Handlebars.registerPartial('sectionTemplate', templates.sectionsTemplate);
		zip.folder('EPUB').file(epubConfig.slug + '-content.xhtml', compile(templates.content, epubConfig));
	}

	function compile(template, content, skipFormatting?)
	{
		let html = formatHTML(Handlebars.compile(template)(content));

		return html;

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
