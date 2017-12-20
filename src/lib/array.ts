/**
 * Created by user on 2017/12/20/020.
 */

export function array_unique(array: any[])
{
	return array.filter(function (el, index, arr)
	{
		return index == arr.indexOf(el);
	});
}

import * as self from './array';

export default self;
//export default exports;
