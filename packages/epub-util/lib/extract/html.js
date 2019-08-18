"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const html_minifier_1 = require("html-minifier");
const crlf_normalize_1 = require("crlf-normalize");
function fixHtml(html) {
    let options = {
        collapseWhitespace: true,
        preserveLineBreaks: true,
        conservativeCollapse: true,
        caseSensitive: true,
    };
    return html_minifier_1.minify(html_minifier_1.minify(crlf_normalize_1.crlf(html), options)
        .replace(/(?<=<br\/?>)(?!\s*[\r\n])/ig, '\n')
        .replace(/(?<=<\/p>)(?!\s*[\r\n])/ig, '\n'), options);
}
exports.fixHtml = fixHtml;
function fixHtml2(html) {
    try {
        return fixHtml(html);
    }
    catch (e) {
        console.warn(e.message);
    }
    return html;
}
exports.fixHtml2 = fixHtml2;
exports.default = fixHtml;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHRtbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImh0bWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSxpREFBdUM7QUFDdkMsbURBQXNDO0FBRXRDLFNBQWdCLE9BQU8sQ0FBQyxJQUFZO0lBRW5DLElBQUksT0FBTyxHQUFHO1FBQ2Isa0JBQWtCLEVBQUUsSUFBSTtRQUN4QixrQkFBa0IsRUFBRSxJQUFJO1FBQ3hCLG9CQUFvQixFQUFFLElBQUk7UUFDMUIsYUFBYSxFQUFFLElBQUk7S0FDbkIsQ0FBQztJQUVGLE9BQU8sc0JBQU0sQ0FBQyxzQkFBTSxDQUFDLHFCQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsT0FBTyxDQUFDO1NBQ3ZDLE9BQU8sQ0FBQyw2QkFBNkIsRUFBRSxJQUFJLENBQUM7U0FDNUMsT0FBTyxDQUFDLDJCQUEyQixFQUFFLElBQUksQ0FBQyxFQUN6QyxPQUFPLENBQUMsQ0FBQztBQUNiLENBQUM7QUFiRCwwQkFhQztBQUVELFNBQWdCLFFBQVEsQ0FBQyxJQUFZO0lBRXBDLElBQ0E7UUFDQyxPQUFPLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQTtLQUNwQjtJQUNELE9BQU8sQ0FBQyxFQUNSO1FBQ0MsT0FBTyxDQUFDLElBQUksQ0FBRSxDQUFXLENBQUMsT0FBTyxDQUFDLENBQUE7S0FDbEM7SUFFRCxPQUFPLElBQUksQ0FBQTtBQUNaLENBQUM7QUFaRCw0QkFZQztBQUVELGtCQUFlLE9BQU8sQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IG1pbmlmeSB9IGZyb20gJ2h0bWwtbWluaWZpZXInO1xuaW1wb3J0IHsgY3JsZiB9IGZyb20gJ2NybGYtbm9ybWFsaXplJztcblxuZXhwb3J0IGZ1bmN0aW9uIGZpeEh0bWwoaHRtbDogc3RyaW5nKTogc3RyaW5nXG57XG5cdGxldCBvcHRpb25zID0ge1xuXHRcdGNvbGxhcHNlV2hpdGVzcGFjZTogdHJ1ZSxcblx0XHRwcmVzZXJ2ZUxpbmVCcmVha3M6IHRydWUsXG5cdFx0Y29uc2VydmF0aXZlQ29sbGFwc2U6IHRydWUsXG5cdFx0Y2FzZVNlbnNpdGl2ZTogdHJ1ZSxcblx0fTtcblxuXHRyZXR1cm4gbWluaWZ5KG1pbmlmeShjcmxmKGh0bWwpLCBvcHRpb25zKVxuXHRcdC5yZXBsYWNlKC8oPzw9PGJyXFwvPz4pKD8hXFxzKltcXHJcXG5dKS9pZywgJ1xcbicpXG5cdFx0LnJlcGxhY2UoLyg/PD08XFwvcD4pKD8hXFxzKltcXHJcXG5dKS9pZywgJ1xcbicpXG5cdFx0LCBvcHRpb25zKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZpeEh0bWwyKGh0bWw6IHN0cmluZylcbntcblx0dHJ5XG5cdHtcblx0XHRyZXR1cm4gZml4SHRtbChodG1sKVxuXHR9XG5cdGNhdGNoIChlKVxuXHR7XG5cdFx0Y29uc29sZS53YXJuKChlIGFzIEVycm9yKS5tZXNzYWdlKVxuXHR9XG5cblx0cmV0dXJuIGh0bWxcbn1cblxuZXhwb3J0IGRlZmF1bHQgZml4SHRtbCJdfQ==