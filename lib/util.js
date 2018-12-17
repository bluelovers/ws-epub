"use strict";
/**
 * Created by user on 2018/2/18/018.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const uuid_1 = require("epub-maker2/src/lib/uuid");
exports.createUUID = uuid_1.createUUID;
//export function createUUID(input?: unknown)
//{
//	return getUuidByString(String(input)).toLowerCase();
//}
function splitTxt(txt) {
    return ('<div>' +
        txt
            .toString()
            .replace(/\r\n|\r(?!\n)|\n/g, "\n")
            .replace(/\u003C/g, '&lt;')
            .replace(/\u003E/g, '&gt;')
            .replace(/&lt;(img.+?)\/?&gt;/gm, function (...m) {
            //console.log(m);
            return `<${m[1].replace(/\/+$/, '')} class="inner-image"/>`;
        })
            .replace(/^[ ]*[－＝\-—\=─–]{3,}[ ]*$/mg, '<hr/>')
            //.replace(/^([－＝\-—\=─═─＝=══－\-─—◆◇]+)$/mg, '<span class="overflow-line">$1</span>')
            .replace(/\n/g, '</div>\n<div>')
        + '</div>')
        .replace(/<div><hr\/><\/div>/g, '<hr class="linehr"/>')
        .replace(/<div>[ ]*([－＝\-—\=─═─＝=══－\-─—～◆◇\*＊\+＊＊↣◇◆☆★■□☆◊▃]+)[ ]*<\/div>/g, '<div class="linegroup calibre1 overflow-line">$1</div>')
        .replace(/<div><\/div>/g, '<div class="linegroup softbreak">　 </div>')
        .replace(/<div>/g, '<div class="linegroup calibre1">');
}
exports.splitTxt = splitTxt;
const self = require("./util");
exports.default = self;
//export default exports;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOztHQUVHOztBQUlILG1EQUFzRDtBQUU3QyxxQkFGQSxpQkFBVSxDQUVBO0FBRW5CLDZDQUE2QztBQUM3QyxHQUFHO0FBQ0gsdURBQXVEO0FBQ3ZELEdBQUc7QUFFSCxTQUFnQixRQUFRLENBQUMsR0FBRztJQUUzQixPQUFPLENBQ04sT0FBTztRQUNQLEdBQUc7YUFDRCxRQUFRLEVBQUU7YUFDVixPQUFPLENBQUMsbUJBQW1CLEVBQUUsSUFBSSxDQUFDO2FBRWxDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsTUFBTSxDQUFDO2FBQzFCLE9BQU8sQ0FBQyxTQUFTLEVBQUUsTUFBTSxDQUFDO2FBRTFCLE9BQU8sQ0FBQyx1QkFBdUIsRUFBRSxVQUFVLEdBQUcsQ0FBQztZQUUvQyxpQkFBaUI7WUFFakIsT0FBTyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyx3QkFBd0IsQ0FBQztRQUM3RCxDQUFDLENBQUM7YUFFRCxPQUFPLENBQUMsNkJBQTZCLEVBQUUsT0FBTyxDQUFDO1lBRWhELHFGQUFxRjthQUVwRixPQUFPLENBQUMsS0FBSyxFQUFFLGVBQWUsQ0FBQztVQUMvQixRQUFRLENBQUM7U0FFVixPQUFPLENBQUMscUJBQXFCLEVBQUUsc0JBQXNCLENBQUM7U0FFdEQsT0FBTyxDQUFDLG1FQUFtRSxFQUFFLHdEQUF3RCxDQUFDO1NBRXRJLE9BQU8sQ0FBQyxlQUFlLEVBQUUsMkNBQTJDLENBQUM7U0FDckUsT0FBTyxDQUFDLFFBQVEsRUFBRSxrQ0FBa0MsQ0FBQyxDQUNyRDtBQUNILENBQUM7QUFoQ0QsNEJBZ0NDO0FBRUQsK0JBQStCO0FBRS9CLGtCQUFlLElBQUksQ0FBQztBQUNwQix5QkFBeUIiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENyZWF0ZWQgYnkgdXNlciBvbiAyMDE4LzIvMTgvMDE4LlxuICovXG5cbmltcG9ydCBnZXRVdWlkQnlTdHJpbmcgPSByZXF1aXJlKCd1dWlkLWJ5LXN0cmluZycpO1xuaW1wb3J0IHsgY3JsZiB9IGZyb20gJ2NybGYtbm9ybWFsaXplJztcbmltcG9ydCB7IGNyZWF0ZVVVSUQgfSBmcm9tICdlcHViLW1ha2VyMi9zcmMvbGliL3V1aWQnO1xuXG5leHBvcnQgeyBjcmVhdGVVVUlEIH1cblxuLy9leHBvcnQgZnVuY3Rpb24gY3JlYXRlVVVJRChpbnB1dD86IHVua25vd24pXG4vL3tcbi8vXHRyZXR1cm4gZ2V0VXVpZEJ5U3RyaW5nKFN0cmluZyhpbnB1dCkpLnRvTG93ZXJDYXNlKCk7XG4vL31cblxuZXhwb3J0IGZ1bmN0aW9uIHNwbGl0VHh0KHR4dClcbntcblx0cmV0dXJuIChcblx0XHQnPGRpdj4nICtcblx0XHR0eHRcblx0XHRcdC50b1N0cmluZygpXG5cdFx0XHQucmVwbGFjZSgvXFxyXFxufFxccig/IVxcbil8XFxuL2csIFwiXFxuXCIpXG5cblx0XHRcdC5yZXBsYWNlKC9cXHUwMDNDL2csICcmbHQ7Jylcblx0XHRcdC5yZXBsYWNlKC9cXHUwMDNFL2csICcmZ3Q7JylcblxuXHRcdFx0LnJlcGxhY2UoLyZsdDsoaW1nLis/KVxcLz8mZ3Q7L2dtLCBmdW5jdGlvbiAoLi4ubSlcblx0XHRcdHtcblx0XHRcdFx0Ly9jb25zb2xlLmxvZyhtKTtcblxuXHRcdFx0XHRyZXR1cm4gYDwke21bMV0ucmVwbGFjZSgvXFwvKyQvLCAnJyl9IGNsYXNzPVwiaW5uZXItaW1hZ2VcIi8+YDtcblx0XHRcdH0pXG5cblx0XHRcdC5yZXBsYWNlKC9eWyBdKlvvvI3vvJ1cXC3igJRcXD3ilIDigJNdezMsfVsgXSokL21nLCAnPGhyLz4nKVxuXG5cdFx0XHQvLy5yZXBsYWNlKC9eKFvvvI3vvJ1cXC3igJRcXD3ilIDilZDilIDvvJ094pWQ4pWQ77yNXFwt4pSA4oCU4peG4peHXSspJC9tZywgJzxzcGFuIGNsYXNzPVwib3ZlcmZsb3ctbGluZVwiPiQxPC9zcGFuPicpXG5cblx0XHRcdC5yZXBsYWNlKC9cXG4vZywgJzwvZGl2PlxcbjxkaXY+Jylcblx0XHQrICc8L2Rpdj4nKVxuXG5cdFx0LnJlcGxhY2UoLzxkaXY+PGhyXFwvPjxcXC9kaXY+L2csICc8aHIgY2xhc3M9XCJsaW5laHJcIi8+JylcblxuXHRcdC5yZXBsYWNlKC88ZGl2PlsgXSooW++8je+8nVxcLeKAlFxcPeKUgOKVkOKUgO+8nT3ilZDilZDvvI1cXC3ilIDigJTvvZ7il4bil4dcXCrvvIpcXCvvvIrvvIrihqPil4fil4bimIbimIXilqDilqHimIbil4riloNdKylbIF0qPFxcL2Rpdj4vZywgJzxkaXYgY2xhc3M9XCJsaW5lZ3JvdXAgY2FsaWJyZTEgb3ZlcmZsb3ctbGluZVwiPiQxPC9kaXY+JylcblxuXHRcdC5yZXBsYWNlKC88ZGl2PjxcXC9kaXY+L2csICc8ZGl2IGNsYXNzPVwibGluZWdyb3VwIHNvZnRicmVha1wiPuOAgCA8L2Rpdj4nKVxuXHRcdC5yZXBsYWNlKC88ZGl2Pi9nLCAnPGRpdiBjbGFzcz1cImxpbmVncm91cCBjYWxpYnJlMVwiPicpXG5cdFx0O1xufVxuXG5pbXBvcnQgKiBhcyBzZWxmIGZyb20gJy4vdXRpbCc7XG5cbmV4cG9ydCBkZWZhdWx0IHNlbGY7XG4vL2V4cG9ydCBkZWZhdWx0IGV4cG9ydHM7XG4iXX0=