/**
 * dir normalize with end of path.sep
 */
export declare function pathDirNormalize(dir: string, pathLib?: {
    normalize(path: string): string;
    sep: string;
}): string;
export default pathDirNormalize;
