"use strict";
/**
 * Created by user on 2018/9/24/024.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.htmlPreface = exports.BPromise = exports.console = exports.moment = exports.array_unique = exports.shortid = exports.hashSum = void 0;
const debug_color2_1 = require("debug-color2");
Object.defineProperty(exports, "console", { enumerable: true, get: function () { return debug_color2_1.console; } });
const crlf_normalize_1 = require("crlf-normalize");
const array_hyper_unique_1 = require("array-hyper-unique");
Object.defineProperty(exports, "array_unique", { enumerable: true, get: function () { return array_hyper_unique_1.array_unique; } });
const shortid = require("shortid");
exports.shortid = shortid;
const hashSum = require("hash-sum");
exports.hashSum = hashSum;
const moment = require("moment");
exports.moment = moment;
const BPromise = require("bluebird");
exports.BPromise = BPromise;
function htmlPreface(conf) {
    if (conf.infoPreface) {
        conf.infoPreface = crlf_normalize_1.crlf(conf.infoPreface)
            .replace(/[\uFEFF]+/g, '')
            .replace(/[ \t\xA0　]+$/gm, '');
        conf.infoPrefaceHTML = conf.infoPrefaceHTML || conf.infoPreface.replace(/\n/g, '<br/>');
    }
    return conf;
}
exports.htmlPreface = htmlPreface;
//# sourceMappingURL=util.js.map