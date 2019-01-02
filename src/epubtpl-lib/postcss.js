"use strict";
/**
 * Created by user on 2017/12/15/015.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const postcss = require("postcss");
exports.postcss = postcss;
const autoprefixer = require("autoprefixer");
exports.autoprefixer = autoprefixer;
const postcss_epub = require("postcss-epub");
exports.postcss_epub = postcss_epub;
const postcssStripInlineComments = require("postcss-strip-inline-comments");
exports.postcssStripInlineComments = postcssStripInlineComments;
async function compileCss(css) {
    let result = await postcss([
        postcss_epub,
        autoprefixer({
            add: true,
            remove: false,
            flexbox: false,
        }),
    ])
        .process(css, {
        from: undefined,
        // @ts-ignore
        processors: [
            postcssStripInlineComments,
        ],
    });
    //console.log(result);
    //return result.css;
    return result.content;
}
exports.compileCss = compileCss;
const self = require("./postcss");
exports.default = self;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9zdGNzcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInBvc3Rjc3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOztHQUVHOztBQUVILG1DQUFtQztBQU0xQiwwQkFBTztBQUxoQiw2Q0FBNkM7QUFLM0Isb0NBQVk7QUFKOUIsNkNBQTZDO0FBSWIsb0NBQVk7QUFINUMsNEVBQTRFO0FBRzlCLGdFQUEwQjtBQUVqRSxLQUFLLFVBQVUsVUFBVSxDQUFDLEdBQUc7SUFFbkMsSUFBSSxNQUFNLEdBQUcsTUFDWixPQUFPLENBQUM7UUFDUCxZQUFZO1FBQ1osWUFBWSxDQUFDO1lBQ1osR0FBRyxFQUFFLElBQUk7WUFDVCxNQUFNLEVBQUUsS0FBSztZQUNiLE9BQU8sRUFBRSxLQUFLO1NBQ2QsQ0FBQztLQUNGLENBQUM7U0FDQSxPQUFPLENBQUMsR0FBRyxFQUFFO1FBQ2IsSUFBSSxFQUFFLFNBQVM7UUFDZixhQUFhO1FBQ2IsVUFBVSxFQUFFO1lBQ1gsMEJBQTBCO1NBQzFCO0tBQ0QsQ0FBQyxDQUNIO0lBRUQsc0JBQXNCO0lBRXRCLG9CQUFvQjtJQUNwQixPQUFPLE1BQU0sQ0FBQyxPQUFPLENBQUM7QUFDdkIsQ0FBQztBQXhCRCxnQ0F3QkM7QUFFRCxrQ0FBa0M7QUFDbEMsa0JBQWUsSUFBSSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXHJcbiAqIENyZWF0ZWQgYnkgdXNlciBvbiAyMDE3LzEyLzE1LzAxNS5cclxuICovXHJcblxyXG5pbXBvcnQgKiBhcyBwb3N0Y3NzIGZyb20gJ3Bvc3Rjc3MnO1xyXG5pbXBvcnQgKiBhcyBhdXRvcHJlZml4ZXIgZnJvbSAnYXV0b3ByZWZpeGVyJztcclxuaW1wb3J0ICogYXMgcG9zdGNzc19lcHViIGZyb20gJ3Bvc3Rjc3MtZXB1Yic7XHJcbmltcG9ydCAqIGFzIHBvc3Rjc3NTdHJpcElubGluZUNvbW1lbnRzIGZyb20gJ3Bvc3Rjc3Mtc3RyaXAtaW5saW5lLWNvbW1lbnRzJztcclxuaW1wb3J0ICogYXMgcG9zdGNzc1Njc3MgZnJvbSAncG9zdGNzcy1zY3NzJztcclxuXHJcbmV4cG9ydCB7IHBvc3Rjc3MsIGF1dG9wcmVmaXhlciwgcG9zdGNzc19lcHViLCBwb3N0Y3NzU3RyaXBJbmxpbmVDb21tZW50cyB9XHJcblxyXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY29tcGlsZUNzcyhjc3MpXHJcbntcclxuXHRsZXQgcmVzdWx0ID0gYXdhaXRcclxuXHRcdHBvc3Rjc3MoW1xyXG5cdFx0XHRwb3N0Y3NzX2VwdWIsXHJcblx0XHRcdGF1dG9wcmVmaXhlcih7XHJcblx0XHRcdFx0YWRkOiB0cnVlLFxyXG5cdFx0XHRcdHJlbW92ZTogZmFsc2UsXHJcblx0XHRcdFx0ZmxleGJveDogZmFsc2UsXHJcblx0XHRcdH0pLFxyXG5cdFx0XSlcclxuXHRcdFx0LnByb2Nlc3MoY3NzLCB7XHJcblx0XHRcdFx0ZnJvbTogdW5kZWZpbmVkLFxyXG5cdFx0XHRcdC8vIEB0cy1pZ25vcmVcclxuXHRcdFx0XHRwcm9jZXNzb3JzOiBbXHJcblx0XHRcdFx0XHRwb3N0Y3NzU3RyaXBJbmxpbmVDb21tZW50cyxcclxuXHRcdFx0XHRdLFxyXG5cdFx0XHR9KVxyXG5cdDtcclxuXHJcblx0Ly9jb25zb2xlLmxvZyhyZXN1bHQpO1xyXG5cclxuXHQvL3JldHVybiByZXN1bHQuY3NzO1xyXG5cdHJldHVybiByZXN1bHQuY29udGVudDtcclxufVxyXG5cclxuaW1wb3J0ICogYXMgc2VsZiBmcm9tICcuL3Bvc3Rjc3MnO1xyXG5leHBvcnQgZGVmYXVsdCBzZWxmO1xyXG4iXX0=