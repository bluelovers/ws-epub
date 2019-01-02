"use strict";
/**
 * Created by user on 2017/12/15/015.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const js_beautify_1 = require("js-beautify");
const html_minifier_1 = require("html-minifier");
function formatHTML(htmlstr, skipFormatting) {
    if (skipFormatting || typeof js_beautify_1.html_beautify === 'undefined') {
        return htmlstr;
    }
    return htmlminify(htmlstr)
        //.replace(/<item id="" href="image\/" media-type="" \/>/ig, '')
        .replace(/^\n+|\n+$/, '\n');
}
exports.formatHTML = formatHTML;
function htmlminify(html, options = {}) {
    options = Object.assign({
        collapseWhitespace: true,
        preserveLineBreaks: true,
        conservativeCollapse: true,
        caseSensitive: true,
        keepClosingSlash: true,
        ignoreCustomFragments: [
            /\<\/[ \t]*meta\>/i,
        ],
    }, options);
    try {
        let ret = html_minifier_1.minify(html, options);
        return ret;
    }
    catch (e) {
        try {
            let ret = js_beautify_1.html_beautify(html, {
                end_with_newline: true,
                indent_char: '',
                indent_inner_html: false,
                indent_size: 0,
                indent_level: 0,
                max_preserve_newlines: 1,
                preserve_newlines: true,
                wrap_line_length: 0,
                unformatted: [],
                selector_separator_newline: false,
                newline_between_rules: true
            });
            return ret;
        }
        catch (e) {
            console.error(e);
        }
    }
    return html;
}
exports.htmlminify = htmlminify;
const self = require("./index");
exports.default = self;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7O0FBRUgsNkNBQTRDO0FBQzVDLGlEQUFrRTtBQUVsRSxTQUFnQixVQUFVLENBQUMsT0FBTyxFQUFFLGNBQXdCO0lBRTNELElBQUksY0FBYyxJQUFJLE9BQU8sMkJBQWEsS0FBSyxXQUFXLEVBQzFEO1FBQ0MsT0FBTyxPQUFPLENBQUM7S0FDZjtJQUVELE9BQU8sVUFBVSxDQUFDLE9BQU8sQ0FBQztRQUN6QixnRUFBZ0U7U0FDL0QsT0FBTyxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsQ0FDM0I7QUFDRixDQUFDO0FBWEQsZ0NBV0M7QUFFRCxTQUFnQixVQUFVLENBQUMsSUFBWSxFQUFFLFVBQTBCLEVBQUU7SUFFcEUsT0FBTyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUM7UUFDdkIsa0JBQWtCLEVBQUUsSUFBSTtRQUN4QixrQkFBa0IsRUFBRSxJQUFJO1FBQ3hCLG9CQUFvQixFQUFFLElBQUk7UUFDMUIsYUFBYSxFQUFFLElBQUk7UUFDbkIsZ0JBQWdCLEVBQUUsSUFBSTtRQUV0QixxQkFBcUIsRUFBRTtZQUN0QixtQkFBbUI7U0FDbkI7S0FDRCxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBRVosSUFDQTtRQUNDLElBQUksR0FBRyxHQUFHLHNCQUFNLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBRWhDLE9BQU8sR0FBRyxDQUFDO0tBQ1g7SUFDRCxPQUFPLENBQUMsRUFDUjtRQUNDLElBQ0E7WUFDQyxJQUFJLEdBQUcsR0FBRywyQkFBYSxDQUFDLElBQUksRUFBRTtnQkFDN0IsZ0JBQWdCLEVBQUUsSUFBSTtnQkFDdEIsV0FBVyxFQUFFLEVBQUU7Z0JBQ2YsaUJBQWlCLEVBQUUsS0FBSztnQkFDeEIsV0FBVyxFQUFFLENBQUM7Z0JBQ2QsWUFBWSxFQUFFLENBQUM7Z0JBQ2YscUJBQXFCLEVBQUUsQ0FBQztnQkFDeEIsaUJBQWlCLEVBQUUsSUFBSTtnQkFDdkIsZ0JBQWdCLEVBQUUsQ0FBQztnQkFDbkIsV0FBVyxFQUFFLEVBQUU7Z0JBQ2YsMEJBQTBCLEVBQUUsS0FBSztnQkFDakMscUJBQXFCLEVBQUUsSUFBSTthQUMzQixDQUFDLENBQUM7WUFFSCxPQUFPLEdBQUcsQ0FBQztTQUNYO1FBQ0QsT0FBTyxDQUFDLEVBQ1I7WUFDQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQ2pCO0tBQ0Q7SUFFRCxPQUFPLElBQUksQ0FBQztBQUNiLENBQUM7QUEvQ0QsZ0NBK0NDO0FBRUQsZ0NBQWdDO0FBQ2hDLGtCQUFlLElBQUksQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ3JlYXRlZCBieSB1c2VyIG9uIDIwMTcvMTIvMTUvMDE1LlxuICovXG5cbmltcG9ydCB7IGh0bWxfYmVhdXRpZnkgfSBmcm9tICdqcy1iZWF1dGlmeSc7XG5pbXBvcnQgeyBtaW5pZnksIE9wdGlvbnMgYXMgSU1pbmlmeU9wdGlvbnMgfSBmcm9tICdodG1sLW1pbmlmaWVyJztcblxuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdEhUTUwoaHRtbHN0ciwgc2tpcEZvcm1hdHRpbmc/OiBib29sZWFuKTogc3RyaW5nXG57XG5cdGlmIChza2lwRm9ybWF0dGluZyB8fCB0eXBlb2YgaHRtbF9iZWF1dGlmeSA9PT0gJ3VuZGVmaW5lZCcpXG5cdHtcblx0XHRyZXR1cm4gaHRtbHN0cjtcblx0fVxuXG5cdHJldHVybiBodG1sbWluaWZ5KGh0bWxzdHIpXG5cdFx0Ly8ucmVwbGFjZSgvPGl0ZW0gaWQ9XCJcIiBocmVmPVwiaW1hZ2VcXC9cIiBtZWRpYS10eXBlPVwiXCIgXFwvPi9pZywgJycpXG5cdFx0LnJlcGxhY2UoL15cXG4rfFxcbiskLywgJ1xcbicpXG5cdDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGh0bWxtaW5pZnkoaHRtbDogc3RyaW5nLCBvcHRpb25zOiBJTWluaWZ5T3B0aW9ucyA9IHt9KVxue1xuXHRvcHRpb25zID0gT2JqZWN0LmFzc2lnbih7XG5cdFx0Y29sbGFwc2VXaGl0ZXNwYWNlOiB0cnVlLFxuXHRcdHByZXNlcnZlTGluZUJyZWFrczogdHJ1ZSxcblx0XHRjb25zZXJ2YXRpdmVDb2xsYXBzZTogdHJ1ZSxcblx0XHRjYXNlU2Vuc2l0aXZlOiB0cnVlLFxuXHRcdGtlZXBDbG9zaW5nU2xhc2g6IHRydWUsXG5cblx0XHRpZ25vcmVDdXN0b21GcmFnbWVudHM6IFtcblx0XHRcdC9cXDxcXC9bIFxcdF0qbWV0YVxcPi9pLFxuXHRcdF0sXG5cdH0sIG9wdGlvbnMpO1xuXG5cdHRyeVxuXHR7XG5cdFx0bGV0IHJldCA9IG1pbmlmeShodG1sLCBvcHRpb25zKTtcblxuXHRcdHJldHVybiByZXQ7XG5cdH1cblx0Y2F0Y2ggKGUpXG5cdHtcblx0XHR0cnlcblx0XHR7XG5cdFx0XHRsZXQgcmV0ID0gaHRtbF9iZWF1dGlmeShodG1sLCB7XG5cdFx0XHRcdGVuZF93aXRoX25ld2xpbmU6IHRydWUsXG5cdFx0XHRcdGluZGVudF9jaGFyOiAnJyxcblx0XHRcdFx0aW5kZW50X2lubmVyX2h0bWw6IGZhbHNlLFxuXHRcdFx0XHRpbmRlbnRfc2l6ZTogMCxcblx0XHRcdFx0aW5kZW50X2xldmVsOiAwLFxuXHRcdFx0XHRtYXhfcHJlc2VydmVfbmV3bGluZXM6IDEsXG5cdFx0XHRcdHByZXNlcnZlX25ld2xpbmVzOiB0cnVlLFxuXHRcdFx0XHR3cmFwX2xpbmVfbGVuZ3RoOiAwLFxuXHRcdFx0XHR1bmZvcm1hdHRlZDogW10sXG5cdFx0XHRcdHNlbGVjdG9yX3NlcGFyYXRvcl9uZXdsaW5lOiBmYWxzZSxcblx0XHRcdFx0bmV3bGluZV9iZXR3ZWVuX3J1bGVzOiB0cnVlXG5cdFx0XHR9KTtcblxuXHRcdFx0cmV0dXJuIHJldDtcblx0XHR9XG5cdFx0Y2F0Y2ggKGUpXG5cdFx0e1xuXHRcdFx0Y29uc29sZS5lcnJvcihlKTtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gaHRtbDtcbn1cblxuaW1wb3J0ICogYXMgc2VsZiBmcm9tICcuL2luZGV4JztcbmV4cG9ydCBkZWZhdWx0IHNlbGY7XG4iXX0=