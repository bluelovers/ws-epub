import * as path from 'path';

/**
 * dir normalize with end of path.sep
 */
export function pathDirNormalize(dir: string, pathLib: {
	normalize(path: string): string,
	sep: string,
} = path): string
{
	return path.normalize(dir + path.sep)
}

export default pathDirNormalize;
