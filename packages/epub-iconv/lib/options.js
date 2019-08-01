"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Created by user on 2019/8/1.
 */
const core_1 = require("sort-object-keys2/core");
function handleOptions(opts, ...argv) {
    let ret = core_1.default(Object.assign({}, opts, ...argv), {
        keys: [
            'cwd',
            'output',
            'iconv',
        ]
    });
    if (ret.iconv != 'cn') {
        ret.iconv = 'tw';
    }
    return ret;
}
exports.handleOptions = handleOptions;
function handlePattern(pattern) {
    if (!Array.isArray(pattern)) {
        pattern = [pattern];
    }
    return pattern
        .filter(v => v)
        .map(v => v.replace(/\\/g, '/'));
}
exports.handlePattern = handlePattern;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3B0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm9wdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7R0FFRztBQUNILGlEQUFvRDtBQUlwRCxTQUFnQixhQUFhLENBQTBDLElBQU8sRUFBRSxHQUFHLElBQVM7SUFFM0YsSUFBSSxHQUFHLEdBQUcsY0FBYyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLElBQUksRUFBRSxHQUFHLElBQUksQ0FBQyxFQUFFO1FBQzFELElBQUksRUFBRTtZQUNMLEtBQUs7WUFDTCxRQUFRO1lBQ1IsT0FBTztTQUNQO0tBQ0QsQ0FBVSxDQUFDO0lBRVosSUFBSSxHQUFHLENBQUMsS0FBSyxJQUFJLElBQUksRUFDckI7UUFDQyxHQUFHLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztLQUNqQjtJQUVELE9BQU8sR0FBRyxDQUFDO0FBQ1osQ0FBQztBQWhCRCxzQ0FnQkM7QUFFRCxTQUFnQixhQUFhLENBQUMsT0FBZ0M7SUFFN0QsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQzNCO1FBQ0MsT0FBTyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7S0FDcEI7SUFFRCxPQUFPLE9BQU87U0FDWixNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7U0FDZCxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUMvQjtBQUNILENBQUM7QUFYRCxzQ0FXQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ3JlYXRlZCBieSB1c2VyIG9uIDIwMTkvOC8xLlxuICovXG5pbXBvcnQgc29ydE9iamVjdEtleXMgZnJvbSAnc29ydC1vYmplY3Qta2V5czIvY29yZSc7XG5pbXBvcnQgeyBJRXB1Ykljb252T3B0aW9ucyB9IGZyb20gJy4vYnVmZmVyJztcbmltcG9ydCB7IElUU1ZhbHVlT3JBcnJheSB9IGZyb20gJ3RzLXR5cGUnO1xuXG5leHBvcnQgZnVuY3Rpb24gaGFuZGxlT3B0aW9uczxUIGV4dGVuZHMgUGFydGlhbDxJRXB1Ykljb252T3B0aW9ucz4sIFU+KG9wdHM6IFQsIC4uLmFyZ3Y6IFVbXSk6IFQgJiBVXG57XG5cdGxldCByZXQgPSBzb3J0T2JqZWN0S2V5cyhPYmplY3QuYXNzaWduKHt9LCBvcHRzLCAuLi5hcmd2KSwge1xuXHRcdGtleXM6IFtcblx0XHRcdCdjd2QnLFxuXHRcdFx0J291dHB1dCcsXG5cdFx0XHQnaWNvbnYnLFxuXHRcdF1cblx0fSkgYXMgVCAmIFU7XG5cblx0aWYgKHJldC5pY29udiAhPSAnY24nKVxuXHR7XG5cdFx0cmV0Lmljb252ID0gJ3R3Jztcblx0fVxuXG5cdHJldHVybiByZXQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBoYW5kbGVQYXR0ZXJuKHBhdHRlcm46IElUU1ZhbHVlT3JBcnJheTxzdHJpbmc+KVxue1xuXHRpZiAoIUFycmF5LmlzQXJyYXkocGF0dGVybikpXG5cdHtcblx0XHRwYXR0ZXJuID0gW3BhdHRlcm5dO1xuXHR9XG5cblx0cmV0dXJuIHBhdHRlcm5cblx0XHQuZmlsdGVyKHYgPT4gdilcblx0XHQubWFwKHYgPT4gdi5yZXBsYWNlKC9cXFxcL2csICcvJykpXG5cdFx0O1xufVxuIl19