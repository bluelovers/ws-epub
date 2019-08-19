/**
 * Created by user on 2019/7/22.
 */

import MarkdownIt = require('markdown-it');
import { defaultsDeep } from 'lodash';
import { IInternalProcessContextOptions, IInternalProcessMarkdownItOptions } from './types';
import fs from 'fs-iconv';
import { buffer } from 'extract-bad-epub/lib/index';
import * as path from 'path';
import { ITSResolvable, ITSPartialWith, ITSUnpackedPromiseLike } from 'ts-type';

import { HTML_OPEN_CLOSE_TAG_RE } from 'markdown-it/lib/common/html_re';

export function createMarkdownIt(options?: MarkdownIt.Options, plusData?: Partial<IInternalProcessMarkdownItOptions>)
{
	options = defaultsDeep({}, options, <MarkdownIt.Options>{
		html: true,
		linkify: true,
		breaks: true,
		xhtmlOut: true,
	});

	return new MarkdownIt(options)

		.use(require('markdown-it-ruby'))
		.use(require('markdown-it-footnote'))
		.use(require('markdown-it-emoji'))
		.use(require("markdown-it-toc-and-anchor").default)
		.use(require('markdown-it-title'))
		.use(require('markdown-it-implicit-figures'), {
			dataType: true,
			figcaption: true,
		})
		.use(require('@toycode/markdown-it-class'), {
			figure: [
				//'fullpage',
				'ImageContainer',
				'page-break-before',
				'duokan-image-single',
			],
			img: [
				'inner-image',
			],
			hr: [
				'linehr',
			],
			p: [
				'linegroup',
				'calibre1',
			],
			h1: [
				'left',
			],
			h2: [
				'left',
			],
			h3: [
				'left',
			],
			h4: [
				'left',
			],
			h5: [
				'left',
			],
			h6: [
				'left',
			],
		})
		;
}

export function render(input: string, options: Partial<IInternalProcessMarkdownItOptions> = {}): string
{
	if (!options.md || options.mdOptions)
	{
		options.md = createMarkdownIt(options.mdOptions, options)
		;

		/**
		 * unsafe
		 * disable until fix markdown-it-include
		 *
		 * @todo 由於可以做到載入非此小說路徑下的檔案 所以停用此功能 直到有空弄個 fork 版 markdown-it-include
		 */
		if (0)
		{
			/*
			options.md = options.md.use(require('markdown-it-include'), {
			root: options.cwd,
		})
			 */
		}
	}

	options.mdEnv = options.mdEnv || {};

	let html = options.md.render(input, options.mdEnv);

	// @ts-ignore
	if (options.md.options.xhtmlOut)
	{
		html = html
			.replace(/<br\s*>/ig, '<br/>')
	}

	return html
		.replace(/(<p(?:\s\w="[\w\s]*")*>.+?)<\/p>/igs, '$1</p>\n<br/>')
		.replace(/(<p(?:\s\w="[\w\s]*")*>)<\/p>/ig, '<p class="linegroup calibre1">$1　 </p>')
		.replace(/<p(?=\s|>)/ig, '<div')
		.replace(/<\/\s*p>/ig, '</div>')
		;
}

export function handleMarkdown(txt: Buffer | string, plusData?: IInternalProcessMarkdownItOptions)
{
	defaultsDeep(plusData = plusData || {} as any, {
		md: null,
		mdEnv: {},
	});

	if (Buffer.isBuffer(txt))
	{
		txt = txt.toString();
	}

	let mdHtml = render(txt, plusData);

	return {
		plusData,
		mdEnv: plusData.mdEnv,
		mdHtml,
	}
}
