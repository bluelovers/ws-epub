"use strict";
/**
 * Created by user on 2017/12/17/017.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const file_saver_1 = require("file-saver");
const __1 = require("..");
exports.EpubMaker = __1.EpubMaker;
/**
 * for web
 *
 * @param callback
 * @param options
 * @returns {Promise<Blob>}
 */
// @ts-ignore
__1.EpubMaker.prototype.downloadEpub = function downloadEpub(callback, options) {
    options = Object.assign({
        type: 'blob',
        useTitle: false,
    }, options);
    let self = this;
    // @ts-ignore
    return this.makeEpub(options).then(async function (epubZipContent) {
        let filename = self.getFilename(options.useTitle);
        console.debug('saving "' + filename + '"...');
        if (callback && typeof (callback) === 'function') {
            await callback(epubZipContent, filename);
        }
        file_saver_1.saveAs(epubZipContent, filename);
        return epubZipContent;
    });
};
// @ts-ignore
exports.default = __1.EpubMaker;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlsZS1zYXZlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImZpbGUtc2F2ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOztHQUVHOztBQUVILDJDQUFvQztBQUVwQywwQkFBK0I7QUFFdEIsb0JBRkEsYUFBUyxDQUVBO0FBRWxCOzs7Ozs7R0FNRztBQUNILGFBQWE7QUFDYixhQUFTLENBQUMsU0FBUyxDQUFDLFlBQVksR0FBRyxTQUFTLFlBQVksQ0FBQyxRQUFRLEVBQUUsT0FBUTtJQUUxRSxPQUFPLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQztRQUN2QixJQUFJLEVBQUUsTUFBTTtRQUNaLFFBQVEsRUFBRSxLQUFLO0tBQ2YsRUFBRSxPQUFPLENBQUMsQ0FBQztJQUVaLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQztJQUVoQixhQUFhO0lBQ2IsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFPLE9BQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLFdBQVcsY0FBb0I7UUFFNUUsSUFBSSxRQUFRLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7UUFFbEQsT0FBTyxDQUFDLEtBQUssQ0FBQyxVQUFVLEdBQUcsUUFBUSxHQUFHLE1BQU0sQ0FBQyxDQUFDO1FBQzlDLElBQUksUUFBUSxJQUFJLE9BQU0sQ0FBQyxRQUFRLENBQUMsS0FBSyxVQUFVLEVBQy9DO1lBQ0MsTUFBTSxRQUFRLENBQUMsY0FBYyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1NBQ3pDO1FBQ0QsbUJBQU0sQ0FBQyxjQUFjLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFFakMsT0FBTyxjQUFjLENBQUM7SUFDdkIsQ0FBQyxDQUFDLENBQUM7QUFDSixDQUFDLENBQUM7QUFFRixhQUFhO0FBQ2Isa0JBQWUsYUFBUyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDcmVhdGVkIGJ5IHVzZXIgb24gMjAxNy8xMi8xNy8wMTcuXG4gKi9cblxuaW1wb3J0IHsgc2F2ZUFzIH0gZnJvbSAnZmlsZS1zYXZlcic7XG5cbmltcG9ydCB7IEVwdWJNYWtlciB9IGZyb20gJy4uJztcblxuZXhwb3J0IHsgRXB1Yk1ha2VyIH07XG5cbi8qKlxuICogZm9yIHdlYlxuICpcbiAqIEBwYXJhbSBjYWxsYmFja1xuICogQHBhcmFtIG9wdGlvbnNcbiAqIEByZXR1cm5zIHtQcm9taXNlPEJsb2I+fVxuICovXG4vLyBAdHMtaWdub3JlXG5FcHViTWFrZXIucHJvdG90eXBlLmRvd25sb2FkRXB1YiA9IGZ1bmN0aW9uIGRvd25sb2FkRXB1YihjYWxsYmFjaywgb3B0aW9ucz8pOiBQcm9taXNlPEJsb2I+XG57XG5cdG9wdGlvbnMgPSBPYmplY3QuYXNzaWduKHtcblx0XHR0eXBlOiAnYmxvYicsXG5cdFx0dXNlVGl0bGU6IGZhbHNlLFxuXHR9LCBvcHRpb25zKTtcblxuXHRsZXQgc2VsZiA9IHRoaXM7XG5cblx0Ly8gQHRzLWlnbm9yZVxuXHRyZXR1cm4gdGhpcy5tYWtlRXB1YjxCbG9iPihvcHRpb25zKS50aGVuKGFzeW5jIGZ1bmN0aW9uIChlcHViWmlwQ29udGVudDogQmxvYilcblx0e1xuXHRcdGxldCBmaWxlbmFtZSA9IHNlbGYuZ2V0RmlsZW5hbWUob3B0aW9ucy51c2VUaXRsZSk7XG5cblx0XHRjb25zb2xlLmRlYnVnKCdzYXZpbmcgXCInICsgZmlsZW5hbWUgKyAnXCIuLi4nKTtcblx0XHRpZiAoY2FsbGJhY2sgJiYgdHlwZW9mKGNhbGxiYWNrKSA9PT0gJ2Z1bmN0aW9uJylcblx0XHR7XG5cdFx0XHRhd2FpdCBjYWxsYmFjayhlcHViWmlwQ29udGVudCwgZmlsZW5hbWUpO1xuXHRcdH1cblx0XHRzYXZlQXMoZXB1YlppcENvbnRlbnQsIGZpbGVuYW1lKTtcblxuXHRcdHJldHVybiBlcHViWmlwQ29udGVudDtcblx0fSk7XG59O1xuXG4vLyBAdHMtaWdub3JlXG5leHBvcnQgZGVmYXVsdCBFcHViTWFrZXI7XG4iXX0=