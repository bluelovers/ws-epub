"use strict";
/**
 * Created by user on 2019/7/31.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleGlob = exports.handleZipFile = exports.loadZipFile = exports.handleZipBuffer = exports.loadZipBuffer = void 0;
const buffer_1 = require("./buffer");
Object.defineProperty(exports, "loadZipBuffer", { enumerable: true, get: function () { return buffer_1.loadZipBuffer; } });
Object.defineProperty(exports, "handleZipBuffer", { enumerable: true, get: function () { return buffer_1.handleZipBuffer; } });
const fs_1 = require("./fs");
Object.defineProperty(exports, "loadZipFile", { enumerable: true, get: function () { return fs_1.loadZipFile; } });
Object.defineProperty(exports, "handleZipFile", { enumerable: true, get: function () { return fs_1.handleZipFile; } });
const glob_1 = require("./glob");
Object.defineProperty(exports, "handleGlob", { enumerable: true, get: function () { return glob_1.handleGlob; } });
exports.default = fs_1.handleZipFile;
//# sourceMappingURL=index.js.map