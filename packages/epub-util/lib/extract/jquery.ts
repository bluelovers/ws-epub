/// <reference types="jquery" />

export function fixJQuery(target: unknown | JQueryStatic, $: JQueryStatic)
{
	let _target = $(target);

	_target.filter('br').each(function ()
	{
		// @ts-ignore
		let _self = $(this);
		// @ts-ignore
		$.each(this.attributes, function() {
			// @ts-ignore
			_self.removeAttr(this.name);
		});
	});

	_target.find('br').each(function ()
	{
		// @ts-ignore
		let _self = $(this);
		// @ts-ignore
		$.each(this.attributes, function() {
			// @ts-ignore
			_self.removeAttr(this.name);
		});
	});

	return _target;
}

export default fixJQuery
