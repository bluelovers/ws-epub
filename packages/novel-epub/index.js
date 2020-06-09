"use strict";
/**
 * Created by user on 2018/2/18/018.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultOptions = exports.makeOptions = exports.makeFilename = exports.getNovelConf = exports.novelEpub = void 0;
const txt2epub3_1 = require("./lib/txt2epub3");
Object.defineProperty(exports, "getNovelConf", { enumerable: true, get: function () { return txt2epub3_1.getNovelConf; } });
Object.defineProperty(exports, "makeFilename", { enumerable: true, get: function () { return txt2epub3_1.makeFilename; } });
Object.defineProperty(exports, "makeOptions", { enumerable: true, get: function () { return txt2epub3_1.makeOptions; } });
Object.defineProperty(exports, "defaultOptions", { enumerable: true, get: function () { return txt2epub3_1.defaultOptions; } });
function novelEpub(options) {
    return txt2epub3_1.create(options);
}
exports.novelEpub = novelEpub;
exports.default = novelEpub;
//export default exports;
//# sourceMappingURL=index.js.map