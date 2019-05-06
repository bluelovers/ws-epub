
export interface IEpubtypes
{
	'name': string | EnumEpubTypeName;
	'group': string | EnumEpubTypeGroup;
	'description': string;
}

export const enum EnumEpubTypeName
{
	ABSTRACT = 'abstract',
	FOREWORD = 'foreword',
	PREFACE = 'preface',
	INTRODUCTION = 'introduction',
	PREAMBLE = 'preamble',
	EPIGRAPH = 'epigraph',
	NON_SPECIFIC_FRONTMATTER = 'non-specific frontmatter',
	PART= 'part',
	CHAPTER = 'chapter',
	PROLOGUE = 'prologue',
	CONCLUSION = 'conclusion',
	EPILOGUE = 'epilogue',
	AFTERWORD = 'afterword',
	NON_SPECIFIC_BACKMATTER = 'non-specific backmatter',
	REARNOTE = 'rearnote'
}

export const enum EnumEpubTypeGroup
{
	FRONT_MATTER = 'Front Matter',
	BODY_MATTER = 'Body Matter',
	BACK_MATTER = 'Back Matter',
}

// source: http://www.idpf.org/epub/vocab/structure/epub-vocab-structure-20150826.html
export const epubtypes = [
	{
		'name': EnumEpubTypeName.ABSTRACT,
		'group': EnumEpubTypeGroup.FRONT_MATTER,
		'description': 'A short summary of the principle ideas, concepts and conclusions of the work, or of a section or except within it.'
	},
	{
		'name': EnumEpubTypeName.FOREWORD,
		'group': EnumEpubTypeGroup.FRONT_MATTER,
		'description': 'An introductory section that precedes the work, typically not written by the work\'s author.'
	},
	{
		'name': EnumEpubTypeName.PREFACE,
		'group': EnumEpubTypeGroup.FRONT_MATTER,
		'description': 'An introductory section that precedes the work, typically written by the work\'s author.'
	},
	{
		'name': 'introduction',
		'group': EnumEpubTypeGroup.FRONT_MATTER,
		'description': 'A section in the beginning of the work, typically introducing the reader to the scope or nature of the work\'s content.'
	},
	{
		'name': 'preamble',
		'group': EnumEpubTypeGroup.FRONT_MATTER,
		'description': 'A section in the beginning of the work, typically containing introductory and/or explanatory prose regarding the scope or nature of the work\'s content'
	},
	{
		'name': 'epigraph',
		'group': EnumEpubTypeGroup.FRONT_MATTER,
		'description': 'A quotation that is pertinent but not integral to the text.'
	},
	{
		'name': 'non-specific frontmatter',
		'group': EnumEpubTypeGroup.FRONT_MATTER,
		'description': 'Content placed in the frontmatter section, but which has no specific semantic meaning.'
	},
	{
		'name': 'part',
		'group': EnumEpubTypeGroup.BODY_MATTER,
		'description': 'An introductory section that sets the background to a story, typically part of the narrative.'
	},
	{
		'name': 'chapter',
		'group': EnumEpubTypeGroup.BODY_MATTER,
		'description': 'An introductory section that sets the background to a story, typically part of the narrative.'
	},
	{
		'name': 'prologue',
		'group': EnumEpubTypeGroup.BODY_MATTER,
		'description': 'An introductory section that sets the background to a story, typically part of the narrative.'
	},
	{
		'name': 'conclusion',
		'group': EnumEpubTypeGroup.BODY_MATTER,
		'description': 'An ending section that typically wraps up the work.'
	},
	{
		'name': 'epilogue',
		'group': EnumEpubTypeGroup.BODY_MATTER,
		'description': 'A concluding section that is typically written from a later point in time than the main story, although still part of the narrative.'
	},
	{
		'name': 'afterword',
		'group': EnumEpubTypeGroup.BACK_MATTER,
		'description': 'A closing statement from the author or a person of importance to the story, typically providing insight into how the story came to be written, its significance or related events that have transpired since its timeline.'
	},
	{
		'name': 'non-specific backmatter',
		'group': EnumEpubTypeGroup.BACK_MATTER,
		'description': 'Content placed in the backmatter section, but which has no specific semantic meaning.'
	},
	{
		'name': 'rearnote',
		'group': EnumEpubTypeGroup.BACK_MATTER,
		'description': 'A note appearing in the rear (backmatter) of the work, or at the end of a section.'
	},
] as const;

export let groups = {} as {
	[index: string]: IEpubtypes[];
};
for (let i = 0; i < epubtypes.length; i++)
{
	let group = epubtypes[i].group;
	(groups[group] || (groups[group] = [])).push(epubtypes[i]);
}

export enum EnumEpubType
{
	'abstract' = 'frontmatter',
	'foreword' = 'frontmatter',
	'preface' = 'frontmatter',
	'introduction' = 'frontmatter',
	'preamble' = 'frontmatter',
	'epigraph' = 'frontmatter',
	'non-specific frontmatter' = 'frontmatter',
	'part' = 'bodymatter',
	'chapter' = 'bodymatter',
	'prologue' = 'bodymatter',
	'conclusion' = 'bodymatter',
	'epilogue' = 'bodymatter',
	'afterword' = 'backmatter',
	'non-specific backmatter' = 'backmatter',
	'rearnote' = 'backmatter'
}

export function getGroup(epubtype: string | keyof EnumEpubType): string | EnumEpubType
{
	return EnumEpubType[epubtype];
}

export const types = epubtypes;

export default exports as typeof import('./epub-types');
