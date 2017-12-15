/**
 * Created by user on 2017/12/12/012.
 */

import * as JSZip from 'jszip';
import * as JSZipUtils from 'jszip-utils';
import { compileTpl } from 'src/epubtpl-lib/handlebar-helpers';
import { IEpubConfig } from '../var';

export { JSZip, JSZipUtils }

export function addMimetype(zip: JSZip, epubConfig: IEpubConfig, options)
{
	zip.file('mimetype', options.templates.mimetype);
}

export function addContainerInfo(zip, epubConfig, options)
{
	zip.folder('META-INF').file('container.xml', compileTpl(options.templates.container, epubConfig));
}

export async function addCover(zip, epubConfig, options)
{
	if (epubConfig.coverUrl)
	{
		return new Promise(function (resolve, reject)
		{
			JSZipUtils.getBinaryContent(epubConfig.coverUrl, function (err, data)
			{
				if (!err)
				{
					let ext = epubConfig.coverUrl.substr(epubConfig.coverUrl.lastIndexOf('.') + 1);

					zip.folder('EPUB')
						//.folder('images')
						.file(epubConfig.slug + '-cover.' + ext, data, { binary: true });

					resolve('');
				}
				else
				{
					reject(err);
				}
			});
		});
	}

	return true;
}

// @ts-ignore
export default exports;
