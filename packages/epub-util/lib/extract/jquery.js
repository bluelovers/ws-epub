"use strict";
/// <reference types="jquery" />
Object.defineProperty(exports, "__esModule", { value: true });
exports._removeAttrs = exports.fixJQuery = void 0;
function fixJQuery(target, $) {
    let _target = $(target);
    _target.filter('br').each(function () {
        _removeAttrs(this, $);
    });
    _target.find('br').each(function () {
        _removeAttrs(this, $);
    });
    return _target;
}
exports.fixJQuery = fixJQuery;
function _removeAttrs(elem, $) {
    let _self = $(elem);
    Object.keys(elem.attributes).forEach(k => _self.removeAttr(k));
    return _self;
}
exports._removeAttrs = _removeAttrs;
exports.default = fixJQuery;
//# sourceMappingURL=jquery.js.map