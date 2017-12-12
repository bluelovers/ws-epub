namespace xhr
{
	// @ts-ignore
	export let x = (XMLHttpRequest || ActiveXObject || require("xmlhttprequest").XMLHttpRequest);
}

export const XMLHttpRequest = xhr.x;

import * as D from 'd.js';

export function ajax(url, data?): Promise<any>
{
	let deferred = D();

	try
	{
		let x = new (XMLHttpRequest || ActiveXObject)('MSXML2.XMLHTTP.3.0');
		x.open(data ? 'POST' : 'GET', url, 1);
		x.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
		x.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
		x.onreadystatechange = function ()
		{
			x.readyState > 3 && deferred.resolve({ 'data': x.responseText, 'xhr': x });
		};
		x.send(data);
	}
	catch (e)
	{
		console.error(e);
		deferred.reject(e);
	}

	return deferred.promise;
}

export default ajax;
