export declare const allowExtImage: readonly ["apng", "bmp", "bpg", "gif", "heic", "heif", "jpeg", "jpg", "png", "svg", "webp", "ico", "jfif"];
export declare function toGlobExtImage(): readonly [`*.{${string}}`, `image/*.{${string}}`, `images/*.{${string}}`, `img/*.{${string}}`, `imgs/*.{${string}}`];
export declare function isAllowExtImage(ext: string): boolean;
