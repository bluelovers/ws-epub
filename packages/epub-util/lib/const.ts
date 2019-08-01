
export function createEpubContextDate()
{
	return new Date('2000-12-24 23:00:00Z')
}

export function createJSZipGeneratorOptions()
{
	return {
		type: 'nodebuffer',
		mimeType: 'application/epub+zip',
		compression: 'DEFLATE',
		compressionOptions: {
			level: 9
		},
	} as const
}

/**
 * 固定 epub 內檔案日期 用來保持相同的 md5
 */
export const EPUB_CONTEXT_DATE = createEpubContextDate();

