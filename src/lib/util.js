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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOztHQUVHOztBQUVILCtDQUF1QztBQW1COUIsa0JBbkJBLHNCQUFPLENBbUJBO0FBbEJoQixtREFBc0M7QUFHdEMsU0FBZ0IsV0FBVyxDQUFpRSxJQUFPO0lBRWxHLElBQUksSUFBSSxDQUFDLFdBQVcsRUFDcEI7UUFDQyxJQUFJLENBQUMsV0FBVyxHQUFHLHFCQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQzthQUN2QyxPQUFPLENBQUMsWUFBWSxFQUFFLEVBQUUsQ0FBQzthQUN6QixPQUFPLENBQUMsZ0JBQWdCLEVBQUUsRUFBRSxDQUFDLENBQzlCO1FBRUQsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUMsZUFBZSxJQUFJLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztLQUN4RjtJQUVELE9BQU8sSUFBSSxDQUFDO0FBQ2IsQ0FBQztBQWJELGtDQWFDO0FBR0Qsa0JBQWUsc0JBQU8sQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ3JlYXRlZCBieSB1c2VyIG9uIDIwMTgvOS8yNC8wMjQuXG4gKi9cblxuaW1wb3J0IHsgY29uc29sZSB9IGZyb20gJ2RlYnVnLWNvbG9yMic7XG5pbXBvcnQgeyBjcmxmIH0gZnJvbSAnY3JsZi1ub3JtYWxpemUnO1xuaW1wb3J0IHsgSUVwdWJDb25maWcgfSBmcm9tICcuLi9jb25maWcnO1xuXG5leHBvcnQgZnVuY3Rpb24gaHRtbFByZWZhY2U8VCBleHRlbmRzIFBpY2s8SUVwdWJDb25maWcsICdpbmZvUHJlZmFjZScgfCAnaW5mb1ByZWZhY2VIVE1MJz4+KGNvbmY6IFQpOiBUICYgUGljazxJRXB1YkNvbmZpZywgJ2luZm9QcmVmYWNlJyB8ICdpbmZvUHJlZmFjZUhUTUwnPlxue1xuXHRpZiAoY29uZi5pbmZvUHJlZmFjZSlcblx0e1xuXHRcdGNvbmYuaW5mb1ByZWZhY2UgPSBjcmxmKGNvbmYuaW5mb1ByZWZhY2UpXG5cdFx0XHQucmVwbGFjZSgvW1xcdUZFRkZdKy9nLCAnJylcblx0XHRcdC5yZXBsYWNlKC9bIFxcdFxceEEw44CAXSskL2dtLCAnJylcblx0XHQ7XG5cblx0XHRjb25mLmluZm9QcmVmYWNlSFRNTCA9IGNvbmYuaW5mb1ByZWZhY2VIVE1MIHx8IGNvbmYuaW5mb1ByZWZhY2UucmVwbGFjZSgvXFxuL2csICc8YnIvPicpO1xuXHR9XG5cblx0cmV0dXJuIGNvbmY7XG59XG5cbmV4cG9ydCB7IGNvbnNvbGUgfVxuZXhwb3J0IGRlZmF1bHQgY29uc29sZTtcbiJdfQ==