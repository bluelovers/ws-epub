"use strict";
/**
 * Created by user on 2019/7/31.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleGlob = void 0;
const tslib_1 = require("tslib");
const fast_glob_1 = tslib_1.__importDefault(require("@bluelovers/fast-glob"));
const fs_1 = require("./fs");
const upath2_1 = tslib_1.__importDefault(require("upath2"));
const fs_extra_1 = require("fs-extra");
const debug_color2_1 = require("debug-color2");
const options_1 = require("./options");
const bluebird_1 = tslib_1.__importDefault(require("bluebird"));
function handleGlob(pattern, options) {
    options = options || {};
    let { cwd = process.cwd(), showLog = true } = options;
    cwd = upath2_1.default.resolve(cwd);
    let { output = cwd } = options;
    options = (0, options_1.handleOptions)(options, {
        cwd,
        output: upath2_1.default.resolve(cwd, output),
        showLog,
    });
    ({ cwd, output } = options);
    const startTime = Date.now();
    return bluebird_1.default.resolve(pattern)
        .then(pattern => (0, options_1.handlePattern)(pattern))
        .tap(pattern => {
        if (showLog) {
            debug_color2_1.console.dir({
                pattern,
                options,
            });
        }
    })
        .then(pattern => fast_glob_1.default.async(pattern, {
        cwd,
    }))
        .tap(ls => {
        if (!ls.length) {
            return bluebird_1.default.reject(`沒有找到任何符合條件的 epub`);
        }
    })
        .map(file => {
        const fullpath = upath2_1.default.resolve(cwd, file);
        return bluebird_1.default.props({
            root: cwd,
            file,
            fullpath,
            buffer: (0, fs_1.handleZipFile)(fullpath, options),
        })
            .then(async (ret) => {
            let output_path;
            let { name, ext } = upath2_1.default.parse(ret.file);
            let idx = 0;
            do {
                let padend = '';
                if (idx) {
                    padend = `_${idx}`;
                }
                output_path = upath2_1.default.join(output, name + padend + ext);
                idx++;
            } while ((0, fs_extra_1.pathExistsSync)(output_path));
            await (0, fs_extra_1.outputFile)(output_path, ret.buffer);
            if (showLog) {
                debug_color2_1.console.info(ret.file, `=>`, upath2_1.default.normalize(output_path));
            }
            return {
                ...ret,
                output_path,
            };
        });
    })
        .tap(ls => {
        if (showLog) {
            debug_color2_1.console.success(`處理完成，總共處理 ${ls.length} 檔案`, `費時`, Date.now() - startTime, 'ms');
        }
    });
}
exports.handleGlob = handleGlob;
//# sourceMappingURL=glob.js.map