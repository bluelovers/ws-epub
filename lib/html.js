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
    });
}
exports.fixHtml = fixHtml;
exports.default = fixHtml;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHRtbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImh0bWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOztHQUVHOztBQUVILGlEQUF1QztBQUV2QyxTQUFnQixPQUFPLENBQUMsSUFBSTtJQUUzQixPQUFPLHNCQUFNLENBQUMsSUFBSSxFQUFFO1FBQ25CLGtCQUFrQixFQUFFLElBQUk7UUFDeEIsa0JBQWtCLEVBQUUsSUFBSTtRQUN4QixvQkFBb0IsRUFBRSxJQUFJO1FBQzFCLGFBQWEsRUFBRSxJQUFJO0tBQ25CLENBQUMsQ0FBQztBQUNKLENBQUM7QUFSRCwwQkFRQztBQUVELGtCQUFlLE9BQU8sQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ3JlYXRlZCBieSB1c2VyIG9uIDIwMTgvMy8xNy8wMTcuXG4gKi9cblxuaW1wb3J0IHsgbWluaWZ5IH0gZnJvbSAnaHRtbC1taW5pZmllcic7XG5cbmV4cG9ydCBmdW5jdGlvbiBmaXhIdG1sKGh0bWwpOiBzdHJpbmdcbntcblx0cmV0dXJuIG1pbmlmeShodG1sLCB7XG5cdFx0Y29sbGFwc2VXaGl0ZXNwYWNlOiB0cnVlLFxuXHRcdHByZXNlcnZlTGluZUJyZWFrczogdHJ1ZSxcblx0XHRjb25zZXJ2YXRpdmVDb2xsYXBzZTogdHJ1ZSxcblx0XHRjYXNlU2Vuc2l0aXZlOiB0cnVlLFxuXHR9KTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgZml4SHRtbDtcbiJdfQ==