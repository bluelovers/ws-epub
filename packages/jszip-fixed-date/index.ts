import JSZip from 'jszip';

/**
 * this allow u try set date for all files, make u will get same md5 if context is same
 *
 * @param {JSZip} zip
 * @param {Date} date
 * @returns {JSZip}
 */
export function fixedJSZipDate(zip: JSZip, date: Date)
{
	if (!(date instanceof Date))
	{
		throw new TypeError(`date must is Date object`)
	}

	zip.forEach((relativePath, file) => {
		file.date = date;
	});

	return zip;
}

export default fixedJSZipDate
