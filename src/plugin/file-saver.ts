/**
 * Created by user on 2017/12/17/017.
 */

// @ts-ignore
import { saveAs } from 'file-saver';

import { EpubMaker } from '..';

export { EpubMaker };

/**
 * for web
 *
 * @param callback
 * @param options
 * @returns {Promise<Blob>}
 */
// @ts-ignore
EpubMaker.prototype.downloadEpub = function downloadEpub(callback, options?): Promise<Blob>
{
	options = Object.assign({
		type: 'blob',
		useTitle: false,
	}, options);

	let self = this;

	// @ts-ignore
	return this.makeEpub<Blob>(options).then(async function (epubZipContent: Blob)
	{
		let filename = self.getFilename(options.useTitle);

		console.debug('saving "' + filename + '"...');
		if (callback && typeof(callback) === 'function')
		{
			await callback(epubZipContent, filename);
		}
		saveAs(epubZipContent, filename);

		return epubZipContent;
	});
};

// @ts-ignore
export default EpubMaker;
