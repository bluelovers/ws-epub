"use strict";
/**
 * Created by user on 2018/9/8/008.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const getUuidByString = require("uuid-by-string");
const hashSum = require("hash-sum");
const shortid = require("shortid");
function createUUID(input) {
    if (!input) {
        input = shortid();
    }
    else if (input.title) {
        input = hashSum([
            // @ts-ignore
            input.title,
            // @ts-ignore
            input.author,
        ]);
    }
    else if (typeof input !== 'string') {
        input = hashSum(input);
    }
    return getUuidByString(String(input)).toLowerCase();
}
exports.createUUID = createUUID;
exports.default = createUUID;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXVpZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInV1aWQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOztHQUVHOztBQUVILGtEQUFtRDtBQUVuRCxvQ0FBcUM7QUFDckMsbUNBQW9DO0FBR3BDLFNBQWdCLFVBQVUsQ0FBQyxLQUFXO0lBRXJDLElBQUksQ0FBQyxLQUFLLEVBQ1Y7UUFDQyxLQUFLLEdBQUcsT0FBTyxFQUFFLENBQUM7S0FDbEI7U0FDSSxJQUFLLEtBQW9CLENBQUMsS0FBSyxFQUNwQztRQUNDLEtBQUssR0FBRyxPQUFPLENBQUM7WUFDZixhQUFhO1lBQ2IsS0FBSyxDQUFDLEtBQUs7WUFDWCxhQUFhO1lBQ2IsS0FBSyxDQUFDLE1BQU07U0FDWixDQUFDLENBQUM7S0FDSDtTQUNJLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxFQUNsQztRQUNDLEtBQUssR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7S0FDdkI7SUFFRCxPQUFPLGVBQWUsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUNyRCxDQUFDO0FBckJELGdDQXFCQztBQUVELGtCQUFlLFVBQVUsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ3JlYXRlZCBieSB1c2VyIG9uIDIwMTgvOS84LzAwOC5cbiAqL1xuXG5pbXBvcnQgZ2V0VXVpZEJ5U3RyaW5nID0gcmVxdWlyZSgndXVpZC1ieS1zdHJpbmcnKTtcbmltcG9ydCB1dWlkdjEgPSByZXF1aXJlKCd1dWlkL3YxJyk7XG5pbXBvcnQgaGFzaFN1bSA9IHJlcXVpcmUoJ2hhc2gtc3VtJyk7XG5pbXBvcnQgc2hvcnRpZCA9IHJlcXVpcmUoJ3Nob3J0aWQnKTtcbmltcG9ydCB7IEVwdWJDb25maWcgfSBmcm9tICcuLi9jb25maWcnO1xuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVVVJRChpbnB1dD86IGFueSk6IHN0cmluZ1xue1xuXHRpZiAoIWlucHV0KVxuXHR7XG5cdFx0aW5wdXQgPSBzaG9ydGlkKCk7XG5cdH1cblx0ZWxzZSBpZiAoKGlucHV0IGFzIEVwdWJDb25maWcpLnRpdGxlKVxuXHR7XG5cdFx0aW5wdXQgPSBoYXNoU3VtKFtcblx0XHRcdC8vIEB0cy1pZ25vcmVcblx0XHRcdGlucHV0LnRpdGxlLFxuXHRcdFx0Ly8gQHRzLWlnbm9yZVxuXHRcdFx0aW5wdXQuYXV0aG9yLFxuXHRcdF0pO1xuXHR9XG5cdGVsc2UgaWYgKHR5cGVvZiBpbnB1dCAhPT0gJ3N0cmluZycpXG5cdHtcblx0XHRpbnB1dCA9IGhhc2hTdW0oaW5wdXQpO1xuXHR9XG5cblx0cmV0dXJuIGdldFV1aWRCeVN0cmluZyhTdHJpbmcoaW5wdXQpKS50b0xvd2VyQ2FzZSgpO1xufVxuXG5leHBvcnQgZGVmYXVsdCBjcmVhdGVVVUlEXG4iXX0=