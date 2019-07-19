"use strict";
/**
 * Created by user on 2018/3/17/017.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const html_minifier_1 = require("html-minifier");
function fixHtml(html) {
    return html_minifier_1.minify(html, {
        collapseWhitespace: true,
        preserveLineBreaks: true,
        conservativeCollapse: true,
        caseSensitive: true,
    })
        .replace(/(?<=<br\/?>)(?!\s*[\r\n])/ig, '\n')
        .replace(/(?<=<\/p>)(?!\s*[\r\n])/ig, '\n');
}
exports.fixHtml = fixHtml;
exports.default = fixHtml;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHRtbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImh0bWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOztHQUVHOztBQUVILGlEQUF1QztBQUV2QyxTQUFnQixPQUFPLENBQUMsSUFBSTtJQUUzQixPQUFPLHNCQUFNLENBQUMsSUFBSSxFQUFFO1FBQ25CLGtCQUFrQixFQUFFLElBQUk7UUFDeEIsa0JBQWtCLEVBQUUsSUFBSTtRQUN4QixvQkFBb0IsRUFBRSxJQUFJO1FBQzFCLGFBQWEsRUFBRSxJQUFJO0tBQ25CLENBQUM7U0FDQSxPQUFPLENBQUMsNkJBQTZCLEVBQUUsSUFBSSxDQUFDO1NBQzVDLE9BQU8sQ0FBQywyQkFBMkIsRUFBRSxJQUFJLENBQUMsQ0FDMUM7QUFDSCxDQUFDO0FBWEQsMEJBV0M7QUFFRCxrQkFBZSxPQUFPLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENyZWF0ZWQgYnkgdXNlciBvbiAyMDE4LzMvMTcvMDE3LlxuICovXG5cbmltcG9ydCB7IG1pbmlmeSB9IGZyb20gJ2h0bWwtbWluaWZpZXInO1xuXG5leHBvcnQgZnVuY3Rpb24gZml4SHRtbChodG1sKTogc3RyaW5nXG57XG5cdHJldHVybiBtaW5pZnkoaHRtbCwge1xuXHRcdGNvbGxhcHNlV2hpdGVzcGFjZTogdHJ1ZSxcblx0XHRwcmVzZXJ2ZUxpbmVCcmVha3M6IHRydWUsXG5cdFx0Y29uc2VydmF0aXZlQ29sbGFwc2U6IHRydWUsXG5cdFx0Y2FzZVNlbnNpdGl2ZTogdHJ1ZSxcblx0fSlcblx0XHQucmVwbGFjZSgvKD88PTxiclxcLz8+KSg/IVxccypbXFxyXFxuXSkvaWcsICdcXG4nKVxuXHRcdC5yZXBsYWNlKC8oPzw9PFxcL3A+KSg/IVxccypbXFxyXFxuXSkvaWcsICdcXG4nKVxuXHRcdDtcbn1cblxuZXhwb3J0IGRlZmF1bHQgZml4SHRtbDtcbiJdfQ==