"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * this allow u try set date for all files, make u will get same md5 if context is same
 *
 * @param {JSZip} zip
 * @param {Date} date
 * @returns {JSZip}
 */
function fixedJSZipDate(zip, date) {
    if (!(date instanceof Date)) {
        throw new TypeError(`date must is Date object`);
    }
    zip.forEach((relativePath, file) => {
        file.date = date;
    });
    return zip;
}
exports.fixedJSZipDate = fixedJSZipDate;
exports.default = fixedJSZipDate;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUdBOzs7Ozs7R0FNRztBQUNILFNBQWdCLGNBQWMsQ0FBQyxHQUFVLEVBQUUsSUFBVTtJQUVwRCxJQUFJLENBQUMsQ0FBQyxJQUFJLFlBQVksSUFBSSxDQUFDLEVBQzNCO1FBQ0MsTUFBTSxJQUFJLFNBQVMsQ0FBQywwQkFBMEIsQ0FBQyxDQUFBO0tBQy9DO0lBRUQsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLFlBQVksRUFBRSxJQUFJLEVBQUUsRUFBRTtRQUNsQyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztJQUNsQixDQUFDLENBQUMsQ0FBQztJQUVILE9BQU8sR0FBRyxDQUFDO0FBQ1osQ0FBQztBQVpELHdDQVlDO0FBRUQsa0JBQWUsY0FBYyxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiXG5pbXBvcnQgSlNaaXAgPSByZXF1aXJlKCdqc3ppcCcpO1xuXG4vKipcbiAqIHRoaXMgYWxsb3cgdSB0cnkgc2V0IGRhdGUgZm9yIGFsbCBmaWxlcywgbWFrZSB1IHdpbGwgZ2V0IHNhbWUgbWQ1IGlmIGNvbnRleHQgaXMgc2FtZVxuICpcbiAqIEBwYXJhbSB7SlNaaXB9IHppcFxuICogQHBhcmFtIHtEYXRlfSBkYXRlXG4gKiBAcmV0dXJucyB7SlNaaXB9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmaXhlZEpTWmlwRGF0ZSh6aXA6IEpTWmlwLCBkYXRlOiBEYXRlKVxue1xuXHRpZiAoIShkYXRlIGluc3RhbmNlb2YgRGF0ZSkpXG5cdHtcblx0XHR0aHJvdyBuZXcgVHlwZUVycm9yKGBkYXRlIG11c3QgaXMgRGF0ZSBvYmplY3RgKVxuXHR9XG5cblx0emlwLmZvckVhY2goKHJlbGF0aXZlUGF0aCwgZmlsZSkgPT4ge1xuXHRcdGZpbGUuZGF0ZSA9IGRhdGU7XG5cdH0pO1xuXG5cdHJldHVybiB6aXA7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGZpeGVkSlNaaXBEYXRlXG4iXX0=