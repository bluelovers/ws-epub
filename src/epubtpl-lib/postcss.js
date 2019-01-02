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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9zdGNzcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInBvc3Rjc3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOztHQUVHOztBQUVILG1DQUFtQztBQU0xQiwwQkFBTztBQUxoQiw2Q0FBNkM7QUFLM0Isb0NBQVk7QUFKOUIsNkNBQTZDO0FBSWIsb0NBQVk7QUFINUMsNEVBQTRFO0FBRzlCLGdFQUEwQjtBQUVqRSxLQUFLLFVBQVUsVUFBVSxDQUFDLEdBQUc7SUFFbkMsSUFBSSxNQUFNLEdBQUcsTUFDWixPQUFPLENBQUM7UUFDUCxZQUFZO1FBQ1osWUFBWSxDQUFDO1lBQ1osR0FBRyxFQUFFLElBQUk7WUFDVCxNQUFNLEVBQUUsS0FBSztZQUNiLE9BQU8sRUFBRSxLQUFLO1NBQ2QsQ0FBQztLQUNGLENBQUM7U0FDQSxPQUFPLENBQUMsR0FBRyxFQUFFO1FBQ2IsSUFBSSxFQUFFLFNBQVM7UUFDZixhQUFhO1FBQ2IsVUFBVSxFQUFFO1lBQ1gsMEJBQTBCO1NBQzFCO0tBQ0QsQ0FBQyxDQUNIO0lBRUQsc0JBQXNCO0lBRXRCLG9CQUFvQjtJQUNwQixPQUFPLE1BQU0sQ0FBQyxPQUFPLENBQUM7QUFDdkIsQ0FBQztBQXhCRCxnQ0F3QkM7QUFFRCxrQ0FBa0M7QUFDbEMsa0JBQWUsSUFBSSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDcmVhdGVkIGJ5IHVzZXIgb24gMjAxNy8xMi8xNS8wMTUuXG4gKi9cblxuaW1wb3J0ICogYXMgcG9zdGNzcyBmcm9tICdwb3N0Y3NzJztcbmltcG9ydCAqIGFzIGF1dG9wcmVmaXhlciBmcm9tICdhdXRvcHJlZml4ZXInO1xuaW1wb3J0ICogYXMgcG9zdGNzc19lcHViIGZyb20gJ3Bvc3Rjc3MtZXB1Yic7XG5pbXBvcnQgKiBhcyBwb3N0Y3NzU3RyaXBJbmxpbmVDb21tZW50cyBmcm9tICdwb3N0Y3NzLXN0cmlwLWlubGluZS1jb21tZW50cyc7XG5pbXBvcnQgKiBhcyBwb3N0Y3NzU2NzcyBmcm9tICdwb3N0Y3NzLXNjc3MnO1xuXG5leHBvcnQgeyBwb3N0Y3NzLCBhdXRvcHJlZml4ZXIsIHBvc3Rjc3NfZXB1YiwgcG9zdGNzc1N0cmlwSW5saW5lQ29tbWVudHMgfVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY29tcGlsZUNzcyhjc3MpXG57XG5cdGxldCByZXN1bHQgPSBhd2FpdFxuXHRcdHBvc3Rjc3MoW1xuXHRcdFx0cG9zdGNzc19lcHViLFxuXHRcdFx0YXV0b3ByZWZpeGVyKHtcblx0XHRcdFx0YWRkOiB0cnVlLFxuXHRcdFx0XHRyZW1vdmU6IGZhbHNlLFxuXHRcdFx0XHRmbGV4Ym94OiBmYWxzZSxcblx0XHRcdH0pLFxuXHRcdF0pXG5cdFx0XHQucHJvY2Vzcyhjc3MsIHtcblx0XHRcdFx0ZnJvbTogdW5kZWZpbmVkLFxuXHRcdFx0XHQvLyBAdHMtaWdub3JlXG5cdFx0XHRcdHByb2Nlc3NvcnM6IFtcblx0XHRcdFx0XHRwb3N0Y3NzU3RyaXBJbmxpbmVDb21tZW50cyxcblx0XHRcdFx0XSxcblx0XHRcdH0pXG5cdDtcblxuXHQvL2NvbnNvbGUubG9nKHJlc3VsdCk7XG5cblx0Ly9yZXR1cm4gcmVzdWx0LmNzcztcblx0cmV0dXJuIHJlc3VsdC5jb250ZW50O1xufVxuXG5pbXBvcnQgKiBhcyBzZWxmIGZyb20gJy4vcG9zdGNzcyc7XG5leHBvcnQgZGVmYXVsdCBzZWxmO1xuIl19