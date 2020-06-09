"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports._removeAttrs = exports.fixCheerio = void 0;
function fixCheerio(target, $) {
    let _target = $(target);
    _target.filter('br').each(function (i, elem) {
        _removeAttrs(elem, $);
    });
    _target.find('br').each(function (i, elem) {
        _removeAttrs(elem, $);
    });
    return _target;
}
exports.fixCheerio = fixCheerio;
function _removeAttrs(elem, $) {
    let _self = $(elem);
    Object.keys(elem.attribs).forEach(k => _self.removeAttr(k));
    return _self;
}
exports._removeAttrs = _removeAttrs;
exports.default = fixCheerio;
//# sourceMappingURL=cheerio.js.map