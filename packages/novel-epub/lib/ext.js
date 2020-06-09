"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAllowExtImage = exports.toGlobExtImage = exports.allowExtImage = void 0;
exports.allowExtImage = [
    'apng',
    'bmp',
    'bpg',
    'gif',
    'heic',
    'heif',
    'jpeg',
    'jpg',
    'png',
    'svg',
    'webp',
    'ico',
    'jfif',
];
function toGlobExtImage() {
    let exts = exports.allowExtImage.join(',');
    return [
        `*.{${exts}}`,
        `image/*.{${exts}}`,
        `images/*.{${exts}}`,
        `img/*.{${exts}}`,
        `imgs/*.{${exts}}`,
    ];
}
exports.toGlobExtImage = toGlobExtImage;
function isAllowExtImage(ext) {
    return exports.allowExtImage.includes(ext.replace(/^\./, '').toLowerCase());
}
exports.isAllowExtImage = isAllowExtImage;
//# sourceMappingURL=ext.js.map