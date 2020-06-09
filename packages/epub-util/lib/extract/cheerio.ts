import cheerio from 'cheerio';

export type ICheerio = ReturnType<typeof cheerio>
export type ICheerioStatic = ReturnType<typeof cheerio.load>
export type ICheerioElement = Parameters<typeof cheerio.contains>["0"];

export function fixCheerio<T extends unknown | ICheerio>(target: T, $: ICheerioStatic)
{
	let _target = $(target);

	_target.filter('br').each(function (i, elem)
	{
		_removeAttrs(elem, $)
	});

	_target.find('br').each(function (i, elem)
	{
		_removeAttrs(elem, $)
	});

	return _target
}

export function _removeAttrs<T extends ICheerioElement>(elem: T, $: ICheerioStatic)
{
	let _self = $(elem);

	Object.keys(elem.attribs).forEach(k => _self.removeAttr(k));

	return _self;
}

export default fixCheerio

