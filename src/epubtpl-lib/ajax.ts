
export function xhr()
{
	// @ts-ignore
	if ((null, typeof XMLHttpRequest) !== 'undefined')
	{
		return XMLHttpRequest;
	}
	// @ts-ignore
	else if ((null, typeof ActiveXObject) !== 'undefined')
	{
		return ActiveXObject;
	}

	// @ts-ignore
	return require("xmlhttprequest-ssl").XMLHttpRequest;
}

export function ajax(url, data?): Promise<any>
{
	return new Promise(function (resolve, reject)
	{
		let x = new (xhr())('MSXML2.XMLHTTP.3.0');
		x.open(data ? 'POST' : 'GET', url, 1);
		x.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
		x.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
		x.onreadystatechange = function ()
		{
			x.readyState > 3 && resolve({ 'data': x.responseText, 'xhr': x });
		};
		x.send(data);
	});
}

export default ajax;
