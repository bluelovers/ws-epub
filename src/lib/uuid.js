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
