/**
 * Created by user on 2018/2/18/018.
 */

import { create, IOptions } from './lib/txt2epub3';

export function novelEpub(options: IOptions)
{
	return create(options);
}

export default novelEpub;
//export default exports;
