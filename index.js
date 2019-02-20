"use strict";
/**
 * Created by user on 2018/2/18/018.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const txt2epub3_1 = require("./lib/txt2epub3");
exports.getNovelConf = txt2epub3_1.getNovelConf;
exports.makeFilename = txt2epub3_1.makeFilename;
exports.makeOptions = txt2epub3_1.makeOptions;
exports.defaultOptions = txt2epub3_1.defaultOptions;
function novelEpub(options) {
    return txt2epub3_1.create(options);
}
exports.novelEpub = novelEpub;
exports.default = novelEpub;
//export default exports;
//# sourceMappingURL=index.js.map