/**
 * Created by user on 2019/7/27.
 */
export declare const allowExtImage: readonly ["apng", "bmp", "bpg", "gif", "heic", "heif", "jpeg", "jpg", "png", "svg", "webp", "ico", "jfif"];
export declare function toGlobExtImage(): string[];
export declare function isAllowExtImage(ext: string): boolean;
