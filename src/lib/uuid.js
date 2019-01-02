"use strict";
/**
 * Created by user on 2018/9/8/008.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const getUuidByString = require("uuid-by-string");
const util_1 = require("./util");
function createUUID(input) {
    if (!input) {
        input = util_1.shortid();
    }
    else if (input.title) {
        input = util_1.hashSum([
            // @ts-ignore
            input.title,
            // @ts-ignore
            input.author,
        ]);
    }
    else if (typeof input !== 'string') {
        input = util_1.hashSum(input);
    }
    return getUuidByString(String(input)).toLowerCase();
}
exports.createUUID = createUUID;
exports.default = createUUID;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXVpZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInV1aWQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOztHQUVHOztBQUVILGtEQUFtRDtBQUVuRCxpQ0FBMEM7QUFHMUMsU0FBZ0IsVUFBVSxDQUFDLEtBQVc7SUFFckMsSUFBSSxDQUFDLEtBQUssRUFDVjtRQUNDLEtBQUssR0FBRyxjQUFPLEVBQUUsQ0FBQztLQUNsQjtTQUNJLElBQUssS0FBb0IsQ0FBQyxLQUFLLEVBQ3BDO1FBQ0MsS0FBSyxHQUFHLGNBQU8sQ0FBQztZQUNmLGFBQWE7WUFDYixLQUFLLENBQUMsS0FBSztZQUNYLGFBQWE7WUFDYixLQUFLLENBQUMsTUFBTTtTQUNaLENBQUMsQ0FBQztLQUNIO1NBQ0ksSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLEVBQ2xDO1FBQ0MsS0FBSyxHQUFHLGNBQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztLQUN2QjtJQUVELE9BQU8sZUFBZSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDO0FBQ3JELENBQUM7QUFyQkQsZ0NBcUJDO0FBRUQsa0JBQWUsVUFBVSxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDcmVhdGVkIGJ5IHVzZXIgb24gMjAxOC85LzgvMDA4LlxuICovXG5cbmltcG9ydCBnZXRVdWlkQnlTdHJpbmcgPSByZXF1aXJlKCd1dWlkLWJ5LXN0cmluZycpO1xuaW1wb3J0IHV1aWR2MSA9IHJlcXVpcmUoJ3V1aWQvdjEnKTtcbmltcG9ydCB7IGhhc2hTdW0sIHNob3J0aWQgfSBmcm9tICcuL3V0aWwnO1xuaW1wb3J0IHsgRXB1YkNvbmZpZyB9IGZyb20gJy4uL2NvbmZpZyc7XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVVVUlEKGlucHV0PzogYW55KTogc3RyaW5nXG57XG5cdGlmICghaW5wdXQpXG5cdHtcblx0XHRpbnB1dCA9IHNob3J0aWQoKTtcblx0fVxuXHRlbHNlIGlmICgoaW5wdXQgYXMgRXB1YkNvbmZpZykudGl0bGUpXG5cdHtcblx0XHRpbnB1dCA9IGhhc2hTdW0oW1xuXHRcdFx0Ly8gQHRzLWlnbm9yZVxuXHRcdFx0aW5wdXQudGl0bGUsXG5cdFx0XHQvLyBAdHMtaWdub3JlXG5cdFx0XHRpbnB1dC5hdXRob3IsXG5cdFx0XSk7XG5cdH1cblx0ZWxzZSBpZiAodHlwZW9mIGlucHV0ICE9PSAnc3RyaW5nJylcblx0e1xuXHRcdGlucHV0ID0gaGFzaFN1bShpbnB1dCk7XG5cdH1cblxuXHRyZXR1cm4gZ2V0VXVpZEJ5U3RyaW5nKFN0cmluZyhpbnB1dCkpLnRvTG93ZXJDYXNlKCk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNyZWF0ZVVVSURcbiJdfQ==