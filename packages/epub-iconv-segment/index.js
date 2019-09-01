"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Created by user on 2019/9/1.
 */
const lib_1 = require("epub-iconv/lib");
const novel_segment_cli_1 = require("novel-segment-cli");
const min_1 = require("cjk-conv/lib/zh/convert/min");
async function stringifySegment(input) {
    return novel_segment_cli_1.stringify(await novel_segment_cli_1.textSegment(input));
}
function handleGlobSegment(pattern, options) {
    return lib_1.handleGlob(pattern, {
        ...options,
        iconvFn: {
            async tw(input) {
                return stringifySegment(input).then(v => min_1.cn2tw_min(v, {
                    safe: false
                }));
            },
            async cn(input) {
                return stringifySegment(input).then(v => min_1.tw2cn_min(v));
            },
        }
    });
}
exports.handleGlobSegment = handleGlobSegment;
exports.default = handleGlobSegment;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBOztHQUVHO0FBQ0gsd0NBQTRDO0FBSTVDLHlEQUEyRDtBQUMzRCxxREFBbUU7QUFFbkUsS0FBSyxVQUFVLGdCQUFnQixDQUFDLEtBQWE7SUFFNUMsT0FBTyw2QkFBUyxDQUFDLE1BQU0sK0JBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFBO0FBQzNDLENBQUM7QUFFRCxTQUFnQixpQkFBaUIsQ0FBQyxPQUErQyxFQUFFLE9BQStCO0lBRWpILE9BQU8sZ0JBQVUsQ0FBQyxPQUFPLEVBQUU7UUFDMUIsR0FBRyxPQUFPO1FBQ1YsT0FBTyxFQUFFO1lBQ1IsS0FBSyxDQUFDLEVBQUUsQ0FBQyxLQUFLO2dCQUViLE9BQU8sZ0JBQWdCLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsZUFBUyxDQUFDLENBQUMsRUFBRTtvQkFDckQsSUFBSSxFQUFFLEtBQUs7aUJBQ1gsQ0FBQyxDQUFDLENBQUE7WUFDSixDQUFDO1lBQ0QsS0FBSyxDQUFDLEVBQUUsQ0FBQyxLQUFLO2dCQUViLE9BQU8sZ0JBQWdCLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsZUFBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7WUFDdkQsQ0FBQztTQUNEO0tBQ0QsQ0FBQyxDQUFBO0FBQ0gsQ0FBQztBQWpCRCw4Q0FpQkM7QUFFRCxrQkFBZSxpQkFBaUIsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ3JlYXRlZCBieSB1c2VyIG9uIDIwMTkvOS8xLlxuICovXG5pbXBvcnQgeyBoYW5kbGVHbG9iIH0gZnJvbSAnZXB1Yi1pY29udi9saWInO1xuaW1wb3J0IHsgSUVwdWJJY29udkdsb2JPcHRpb25zIH0gZnJvbSAnZXB1Yi1pY29udi9saWIvZ2xvYic7XG5pbXBvcnQgeyBJVFNSZXNvbHZhYmxlLCBJVFNWYWx1ZU9yQXJyYXkgfSBmcm9tICd0cy10eXBlJztcbmltcG9ydCBCbHVlYmlyZCA9IHJlcXVpcmUoJ2JsdWViaXJkJyk7XG5pbXBvcnQgeyB0ZXh0U2VnbWVudCwgc3RyaW5naWZ5IH0gZnJvbSAnbm92ZWwtc2VnbWVudC1jbGknO1xuaW1wb3J0IHsgY24ydHdfbWluLCB0dzJjbl9taW4gfSBmcm9tICdjamstY29udi9saWIvemgvY29udmVydC9taW4nO1xuXG5hc3luYyBmdW5jdGlvbiBzdHJpbmdpZnlTZWdtZW50KGlucHV0OiBzdHJpbmcpXG57XG5cdHJldHVybiBzdHJpbmdpZnkoYXdhaXQgdGV4dFNlZ21lbnQoaW5wdXQpKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gaGFuZGxlR2xvYlNlZ21lbnQocGF0dGVybjogSVRTUmVzb2x2YWJsZTxJVFNWYWx1ZU9yQXJyYXk8c3RyaW5nPj4sIG9wdGlvbnM/OiBJRXB1Ykljb252R2xvYk9wdGlvbnMpXG57XG5cdHJldHVybiBoYW5kbGVHbG9iKHBhdHRlcm4sIHtcblx0XHQuLi5vcHRpb25zLFxuXHRcdGljb252Rm46IHtcblx0XHRcdGFzeW5jIHR3KGlucHV0KVxuXHRcdFx0e1xuXHRcdFx0XHRyZXR1cm4gc3RyaW5naWZ5U2VnbWVudChpbnB1dCkudGhlbih2ID0+IGNuMnR3X21pbih2LCB7XG5cdFx0XHRcdFx0c2FmZTogZmFsc2Vcblx0XHRcdFx0fSkpXG5cdFx0XHR9LFxuXHRcdFx0YXN5bmMgY24oaW5wdXQpXG5cdFx0XHR7XG5cdFx0XHRcdHJldHVybiBzdHJpbmdpZnlTZWdtZW50KGlucHV0KS50aGVuKHYgPT4gdHcyY25fbWluKHYpKVxuXHRcdFx0fSxcblx0XHR9XG5cdH0pXG59XG5cbmV4cG9ydCBkZWZhdWx0IGhhbmRsZUdsb2JTZWdtZW50Il19