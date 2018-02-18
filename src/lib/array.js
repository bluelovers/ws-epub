"use strict";
/**
 * Created by user on 2017/12/20/020.
 */
Object.defineProperty(exports, "__esModule", { value: true });
function array_unique(array) {
    return array.filter(function (el, index, arr) {
        return index == arr.indexOf(el);
    });
}
exports.array_unique = array_unique;
const self = require("./array");
exports.default = self;
//export default exports;
