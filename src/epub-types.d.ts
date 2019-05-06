export interface IEpubtypes {
    'name': string | EnumEpubTypeName;
    'group': string | EnumEpubTypeGroup;
    'description': string;
}
export declare const enum EnumEpubTypeName {
    ABSTRACT = "abstract",
    FOREWORD = "foreword",
    PREFACE = "preface",
    INTRODUCTION = "introduction",
    PREAMBLE = "preamble",
    EPIGRAPH = "epigraph",
    NON_SPECIFIC_FRONTMATTER = "non-specific frontmatter",
    PART = "part",
    CHAPTER = "chapter",
    PROLOGUE = "prologue",
    CONCLUSION = "conclusion",
    EPILOGUE = "epilogue",
    AFTERWORD = "afterword",
    NON_SPECIFIC_BACKMATTER = "non-specific backmatter",
    REARNOTE = "rearnote"
}
export declare const enum EnumEpubTypeGroup {
    FRONT_MATTER = "Front Matter",
    BODY_MATTER = "Body Matter",
    BACK_MATTER = "Back Matter"
}
export declare const epubtypes: readonly [{
    readonly 'name': EnumEpubTypeName.ABSTRACT;
    readonly 'group': EnumEpubTypeGroup.FRONT_MATTER;
    readonly 'description': "A short summary of the principle ideas, concepts and conclusions of the work, or of a section or except within it.";
}, {
    readonly 'name': EnumEpubTypeName.FOREWORD;
    readonly 'group': EnumEpubTypeGroup.FRONT_MATTER;
    readonly 'description': "An introductory section that precedes the work, typically not written by the work's author.";
}, {
    readonly 'name': EnumEpubTypeName.PREFACE;
    readonly 'group': EnumEpubTypeGroup.FRONT_MATTER;
    readonly 'description': "An introductory section that precedes the work, typically written by the work's author.";
}, {
    readonly 'name': "introduction";
    readonly 'group': EnumEpubTypeGroup.FRONT_MATTER;
    readonly 'description': "A section in the beginning of the work, typically introducing the reader to the scope or nature of the work's content.";
}, {
    readonly 'name': "preamble";
    readonly 'group': EnumEpubTypeGroup.FRONT_MATTER;
    readonly 'description': "A section in the beginning of the work, typically containing introductory and/or explanatory prose regarding the scope or nature of the work's content";
}, {
    readonly 'name': "epigraph";
    readonly 'group': EnumEpubTypeGroup.FRONT_MATTER;
    readonly 'description': "A quotation that is pertinent but not integral to the text.";
}, {
    readonly 'name': "non-specific frontmatter";
    readonly 'group': EnumEpubTypeGroup.FRONT_MATTER;
    readonly 'description': "Content placed in the frontmatter section, but which has no specific semantic meaning.";
}, {
    readonly 'name': "part";
    readonly 'group': EnumEpubTypeGroup.BODY_MATTER;
    readonly 'description': "An introductory section that sets the background to a story, typically part of the narrative.";
}, {
    readonly 'name': "chapter";
    readonly 'group': EnumEpubTypeGroup.BODY_MATTER;
    readonly 'description': "An introductory section that sets the background to a story, typically part of the narrative.";
}, {
    readonly 'name': "prologue";
    readonly 'group': EnumEpubTypeGroup.BODY_MATTER;
    readonly 'description': "An introductory section that sets the background to a story, typically part of the narrative.";
}, {
    readonly 'name': "conclusion";
    readonly 'group': EnumEpubTypeGroup.BODY_MATTER;
    readonly 'description': "An ending section that typically wraps up the work.";
}, {
    readonly 'name': "epilogue";
    readonly 'group': EnumEpubTypeGroup.BODY_MATTER;
    readonly 'description': "A concluding section that is typically written from a later point in time than the main story, although still part of the narrative.";
}, {
    readonly 'name': "afterword";
    readonly 'group': EnumEpubTypeGroup.BACK_MATTER;
    readonly 'description': "A closing statement from the author or a person of importance to the story, typically providing insight into how the story came to be written, its significance or related events that have transpired since its timeline.";
}, {
    readonly 'name': "non-specific backmatter";
    readonly 'group': EnumEpubTypeGroup.BACK_MATTER;
    readonly 'description': "Content placed in the backmatter section, but which has no specific semantic meaning.";
}, {
    readonly 'name': "rearnote";
    readonly 'group': EnumEpubTypeGroup.BACK_MATTER;
    readonly 'description': "A note appearing in the rear (backmatter) of the work, or at the end of a section.";
}];
export declare let groups: {
    [index: string]: IEpubtypes[];
};
export declare enum EnumEpubType {
    'abstract' = "frontmatter",
    'foreword' = "frontmatter",
    'preface' = "frontmatter",
    'introduction' = "frontmatter",
    'preamble' = "frontmatter",
    'epigraph' = "frontmatter",
    'non-specific frontmatter' = "frontmatter",
    'part' = "bodymatter",
    'chapter' = "bodymatter",
    'prologue' = "bodymatter",
    'conclusion' = "bodymatter",
    'epilogue' = "bodymatter",
    'afterword' = "backmatter",
    'non-specific backmatter' = "backmatter",
    'rearnote' = "backmatter"
}
export declare function getGroup(epubtype: string | keyof EnumEpubType): string | EnumEpubType;
export declare const types: readonly [{
    readonly 'name': EnumEpubTypeName.ABSTRACT;
    readonly 'group': EnumEpubTypeGroup.FRONT_MATTER;
    readonly 'description': "A short summary of the principle ideas, concepts and conclusions of the work, or of a section or except within it.";
}, {
    readonly 'name': EnumEpubTypeName.FOREWORD;
    readonly 'group': EnumEpubTypeGroup.FRONT_MATTER;
    readonly 'description': "An introductory section that precedes the work, typically not written by the work's author.";
}, {
    readonly 'name': EnumEpubTypeName.PREFACE;
    readonly 'group': EnumEpubTypeGroup.FRONT_MATTER;
    readonly 'description': "An introductory section that precedes the work, typically written by the work's author.";
}, {
    readonly 'name': "introduction";
    readonly 'group': EnumEpubTypeGroup.FRONT_MATTER;
    readonly 'description': "A section in the beginning of the work, typically introducing the reader to the scope or nature of the work's content.";
}, {
    readonly 'name': "preamble";
    readonly 'group': EnumEpubTypeGroup.FRONT_MATTER;
    readonly 'description': "A section in the beginning of the work, typically containing introductory and/or explanatory prose regarding the scope or nature of the work's content";
}, {
    readonly 'name': "epigraph";
    readonly 'group': EnumEpubTypeGroup.FRONT_MATTER;
    readonly 'description': "A quotation that is pertinent but not integral to the text.";
}, {
    readonly 'name': "non-specific frontmatter";
    readonly 'group': EnumEpubTypeGroup.FRONT_MATTER;
    readonly 'description': "Content placed in the frontmatter section, but which has no specific semantic meaning.";
}, {
    readonly 'name': "part";
    readonly 'group': EnumEpubTypeGroup.BODY_MATTER;
    readonly 'description': "An introductory section that sets the background to a story, typically part of the narrative.";
}, {
    readonly 'name': "chapter";
    readonly 'group': EnumEpubTypeGroup.BODY_MATTER;
    readonly 'description': "An introductory section that sets the background to a story, typically part of the narrative.";
}, {
    readonly 'name': "prologue";
    readonly 'group': EnumEpubTypeGroup.BODY_MATTER;
    readonly 'description': "An introductory section that sets the background to a story, typically part of the narrative.";
}, {
    readonly 'name': "conclusion";
    readonly 'group': EnumEpubTypeGroup.BODY_MATTER;
    readonly 'description': "An ending section that typically wraps up the work.";
}, {
    readonly 'name': "epilogue";
    readonly 'group': EnumEpubTypeGroup.BODY_MATTER;
    readonly 'description': "A concluding section that is typically written from a later point in time than the main story, although still part of the narrative.";
}, {
    readonly 'name': "afterword";
    readonly 'group': EnumEpubTypeGroup.BACK_MATTER;
    readonly 'description': "A closing statement from the author or a person of importance to the story, typically providing insight into how the story came to be written, its significance or related events that have transpired since its timeline.";
}, {
    readonly 'name': "non-specific backmatter";
    readonly 'group': EnumEpubTypeGroup.BACK_MATTER;
    readonly 'description': "Content placed in the backmatter section, but which has no specific semantic meaning.";
}, {
    readonly 'name': "rearnote";
    readonly 'group': EnumEpubTypeGroup.BACK_MATTER;
    readonly 'description': "A note appearing in the rear (backmatter) of the work, or at the end of a section.";
}];
declare const _default: typeof import("./epub-types");
export default _default;
