import { IOptions } from './txt2epub3';
import { EpubMaker } from 'epub-maker2';
import { EpubStore } from './store';
import { IAttachMetaData, IEpubRuntimeReturn } from './epub';
import MarkdownIt = require('markdown-it');
import { ITSResolvable, ITSPartialWith, ITSUnpackedPromiseLike, ITSRequiredWith } from 'ts-type';
import Bluebird = require('bluebird');

export interface IInternalProcessOptions
{
	store: EpubStore,
	epub: EpubMaker,
	epubOptions: IOptions,
	cwd: string,
	cwdRoot: string,
}

export interface IInternalProcessContextOptions extends IInternalProcessOptions
{
	vid: string,
	attach: IAttachMetaData,
}

export interface IMdEnv
{
	title?: string,
	[k: string]: unknown,
}

export interface IInternalProcessMarkdownItOptions extends Partial<IInternalProcessContextOptions>
{
	mdOptions?: MarkdownIt.Options,
	md?: MarkdownIt,
	mdEnv?: IMdEnv,
}

export interface IInternalProcessVolumeOptions extends Omit<IInternalProcessOptions, 'cwd'>
{
	processReturn: Partial<IEpubRuntimeReturn>,
	cwd?: string,
}

export interface IInternalProcessEpubOptions extends IInternalProcessOptions
{
	processReturn: IEpubRuntimeReturn,
}

export type IResolvableBluebird<T> = ITSResolvable<T> | Bluebird<T>

