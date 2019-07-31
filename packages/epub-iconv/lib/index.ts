/**
 * Created by user on 2019/7/31.
 */
import { loadZipBuffer, handleZipBuffer } from './buffer';
import { loadZipFile, handleZipFile } from './fs';

import { handleGlob } from './glob';

export {
	loadZipBuffer, handleZipBuffer,
	loadZipFile, handleZipFile,
	handleGlob,
};

export default handleZipFile;
