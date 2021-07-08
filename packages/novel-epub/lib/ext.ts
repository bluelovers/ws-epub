
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
	'jfif',
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
	] as const
}

export function isAllowExtImage(ext: string)
{
	return allowExtImage.includes(ext.replace(/^\./, '').toLowerCase() as any)
}
