"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const handlebars_1 = require("handlebars");
exports.Handlebars = handlebars_1.default;
// @ts-ignore
const path = require("upath2");
// @ts-ignore
const fs = require("fs");
const _1 = require(".");
exports.mimetypes = {
    'jpeg': 'image/jpeg',
    'jpg': 'image/jpeg',
    'bmp': 'image/bmp',
    'png': 'image/png',
    'svg': 'image/svg+xml',
    'gif': 'image/gif',
    'ttf': 'application/x-font-truetype',
    'css': 'text/css',
};
handlebars_1.default.registerHelper('extension', function (str) {
    return ext(str);
});
handlebars_1.default.registerHelper('mimetype', function (str) {
    return exports.mimetypes[ext(str)];
});
handlebars_1.default.registerHelper('import', function (filePath, options) {
    filePath = path.normalize(filePath);
    let source = fs.readFileSync(filePath).toString();
    // @ts-ignore
    return new handlebars_1.default.SafeString(handlebars_1.default.compile(source)(Object.create(this)));
});
function ext(str) {
    if (str === undefined) {
        return str;
    }
    return str.substr(str.lastIndexOf('.') + 1);
}
function compileTpl(template, content, skipFormatting) {
    return _1.default.formatHTML(handlebars_1.default.compile(template)(content, {
        // @ts-ignore
        allowProtoMethodsByDefault: true,
        // @ts-ignore
        allowProtoPropertiesByDefault: true,
    }), skipFormatting);
}
exports.compileTpl = compileTpl;
exports.default = handlebars_1.default;
//# sourceMappingURL=handlebar-helpers.js.map