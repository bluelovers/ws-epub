/**
 * Created by user on 2019/7/27.
 */

export const allowExtImage = [
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
] as const;

export function toGlobExtImage()
{
	let exts = allowExtImage.join(',');

	return [
		`*.{${exts}}`,
		`image/*.{${exts}}`,
		`images/*.{${exts}}`,
		`img/*.{${exts}}`,
		`imgs/*.{${exts}}`,
	]
}

export function isAllowExtImage(ext: string)
{
	return allowExtImage.includes(ext.replace(/^\./, '').toLowerCase() as any)
}
