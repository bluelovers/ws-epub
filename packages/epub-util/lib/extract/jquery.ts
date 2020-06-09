/// <reference types="jquery" />

export function fixJQuery<T extends unknown | JQueryStatic>(target: T, $: JQueryStatic)
{
	let _target = $(target);

	_target.filter('br').each(function ()
	{
		_removeAttrs(this as HTMLElement, $);
	});

	_target.find('br').each(function ()
	{
		_removeAttrs(this as HTMLElement, $);
	});

	return _target;
}

export function _removeAttrs<T extends HTMLElement>(elem: T, $: JQueryStatic)
{
	let _self = $(elem);

	Object.keys(elem.attributes).forEach(k => _self.removeAttr(k));

	return _self;
}

export default fixJQuery

