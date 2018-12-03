"use strict";
/**
 * Created by user on 2018/9/24/024.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const debug_color2_1 = require("debug-color2");
exports.console = debug_color2_1.console;
const crlf_normalize_1 = require("crlf-normalize");
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
exports.default = debug_color2_1.console;
