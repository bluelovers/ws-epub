"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Handlebars = exports.compileTpl = exports.mimetypes = void 0;
const handlebars_1 = __importDefault(require("handlebars"));
exports.Handlebars = handlebars_1.default;
const upath2_1 = __importDefault(require("upath2"));
const fs_1 = require("fs");
const index_1 = __importDefault(require("./index"));
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
    filePath = upath2_1.default.normalize(filePath);
    let source = fs_1.readFileSync(filePath).toString();
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
    return index_1.default.formatHTML(handlebars_1.default.compile(template)(content, {
        // @ts-ignore
        allowProtoMethodsByDefault: true,
        // @ts-ignore
        allowProtoPropertiesByDefault: true,
    }), skipFormatting);
}
exports.compileTpl = compileTpl;
exports.default = handlebars_1.default;
//# sourceMappingURL=handlebar-helpers.js.map