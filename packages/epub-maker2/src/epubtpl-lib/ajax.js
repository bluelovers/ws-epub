"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchFile = exports.fetch = void 0;
const cross_fetch_1 = __importDefault(require("cross-fetch"));
exports.fetch = cross_fetch_1.default;
const fetch_file_or_url_1 = __importDefault(require("@node-novel/fetch-file-or-url"));
exports.fetchFile = fetch_file_or_url_1.default;
exports.default = cross_fetch_1.default;
//# sourceMappingURL=ajax.js.map