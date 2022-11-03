"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchFile = exports.fetch = void 0;
const tslib_1 = require("tslib");
const cross_fetch_1 = tslib_1.__importDefault(require("cross-fetch"));
exports.fetch = cross_fetch_1.default;
const fetch_file_or_url_1 = tslib_1.__importDefault(require("@node-novel/fetch-file-or-url"));
exports.fetchFile = fetch_file_or_url_1.default;
exports.default = cross_fetch_1.default;
//# sourceMappingURL=ajax.js.map