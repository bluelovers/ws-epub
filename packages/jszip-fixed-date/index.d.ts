import JSZip from 'jszip';
/**
 * this allow u try set date for all files, make u will get same md5 if context is same
 *
 * @param {JSZip} zip
 * @param {Date} date
 * @returns {JSZip}
 */
export declare function fixedJSZipDate(zip: JSZip, date: Date): JSZip;
export default fixedJSZipDate;
