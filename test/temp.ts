/**
 * Created by user on 2018/2/1/001.
 */

module EPub
{
	export interface TocElement
	{
		level: number;
		order: number;
		title: string;
		id: string;
		href?: string;
	}

	export interface ISpine
	{
		contents: ISpineContents,
		toc?: TocElement,

		itemref?: Object[],
	}

	export interface ISpineContents
	{
		[index: number]: Object,
	}

	export interface IMetadata
	{
		publisher?: string,
		language?: string,
		title?: string,
		subject?: string,
		description?: string,

		creator?: string,
		creatorFileAs?: string,

		date?: string,
		ISBN?: string,
		UUID?: string,
		cover?

		'belongs-to-collection'?: string,
		'calibre:series'?: string,
		'collection-type'?: string,

		[key: string]: any,
	}
}
