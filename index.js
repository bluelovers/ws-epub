"use strict";
/**
 * Created by user on 2018/2/18/018.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const txt2epub3_1 = require("./lib/txt2epub3");
function novelEpub(options) {
    return txt2epub3_1.create(options);
}
exports.novelEpub = novelEpub;
exports.default = novelEpub;
//export default exports;
