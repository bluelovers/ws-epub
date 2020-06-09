"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeDefaultTplData = exports.replaceTpl = void 0;
const tpl_1 = require("./tpl");
const debug_color2_1 = __importDefault(require("debug-color2"));
function replaceTpl(tpl, data) {
    let r = new RegExp(`\\$\\{(${Object.keys(data).join('|')})\\}`, 'gu');
    return tpl
        .replace(r, (s, k) => {
        return data[k] || '';
    });
}
exports.replaceTpl = replaceTpl;
function makeDefaultTplData(inputOptions, opts) {
    inputOptions = {
        ...inputOptions,
        ...opts,
    };
    if (inputOptions.inputConfigPath) {
        try {
            let c = require(inputOptions.inputConfigPath);
            inputOptions = {
                ...inputOptions,
                ...c,
            };
            debug_color2_1.default.info('將 inputConfigPath 內設定合併至本次執行參數內');
            debug_color2_1.default.dir(inputOptions);
        }
        catch (e) {
            debug_color2_1.default.error('[ERROR]', '讀取 inputConfigPath 時發生錯誤', e.message);
        }
    }
    //inputOptions.txtStyle = EnumTxtStyle.SHU_BOOK;
    let txtStyle = tpl_1.presetTxtStyle[inputOptions.txtStyle] || tpl_1.presetTxtStyle[0 /* NONE */];
    let tplBaseData = {};
    [
        'tplBannerStart',
        'tplVolumeStart',
        'tplChapterStart',
        'hr01',
        'hr02',
        'hr11',
        'hr12',
        'hr13',
    ].forEach(k => {
        if (inputOptions[k] == null) {
            inputOptions[k] = txtStyle[k];
        }
        inputOptions[k] = inputOptions[k] || '';
        tplBaseData[k] = inputOptions[k];
    });
    tplBaseData.eol = tpl_1.TPL_EOL;
    tplBaseData.eol2 = tpl_1.TPL_EOL2;
    return {
        inputOptions,
        tplBaseData,
    };
}
exports.makeDefaultTplData = makeDefaultTplData;
//# sourceMappingURL=index.js.map