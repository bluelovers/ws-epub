"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.types = exports.getGroup = exports.EnumEpubType = exports.groups = exports.epubtypes = exports.EnumEpubTypeGroup = exports.EnumEpubTypeName = void 0;
var EnumEpubTypeName;
(function (EnumEpubTypeName) {
    EnumEpubTypeName["ABSTRACT"] = "abstract";
    EnumEpubTypeName["FOREWORD"] = "foreword";
    EnumEpubTypeName["PREFACE"] = "preface";
    EnumEpubTypeName["INTRODUCTION"] = "introduction";
    EnumEpubTypeName["PREAMBLE"] = "preamble";
    EnumEpubTypeName["EPIGRAPH"] = "epigraph";
    EnumEpubTypeName["NON_SPECIFIC_FRONTMATTER"] = "non-specific frontmatter";
    EnumEpubTypeName["PART"] = "part";
    EnumEpubTypeName["CHAPTER"] = "chapter";
    EnumEpubTypeName["PROLOGUE"] = "prologue";
    EnumEpubTypeName["CONCLUSION"] = "conclusion";
    EnumEpubTypeName["EPILOGUE"] = "epilogue";
    EnumEpubTypeName["AFTERWORD"] = "afterword";
    EnumEpubTypeName["NON_SPECIFIC_BACKMATTER"] = "non-specific backmatter";
    EnumEpubTypeName["REARNOTE"] = "rearnote";
})(EnumEpubTypeName || (exports.EnumEpubTypeName = EnumEpubTypeName = {}));
var EnumEpubTypeGroup;
(function (EnumEpubTypeGroup) {
    EnumEpubTypeGroup["FRONT_MATTER"] = "Front Matter";
    EnumEpubTypeGroup["BODY_MATTER"] = "Body Matter";
    EnumEpubTypeGroup["BACK_MATTER"] = "Back Matter";
})(EnumEpubTypeGroup || (exports.EnumEpubTypeGroup = EnumEpubTypeGroup = {}));
// source: http://www.idpf.org/epub/vocab/structure/epub-vocab-structure-20150826.html
exports.epubtypes = [
    {
        'name': "abstract" /* EnumEpubTypeName.ABSTRACT */,
        'group': "Front Matter" /* EnumEpubTypeGroup.FRONT_MATTER */,
        'description': 'A short summary of the principle ideas, concepts and conclusions of the work, or of a section or except within it.'
    },
    {
        'name': "foreword" /* EnumEpubTypeName.FOREWORD */,
        'group': "Front Matter" /* EnumEpubTypeGroup.FRONT_MATTER */,
        'description': 'An introductory section that precedes the work, typically not written by the work\'s author.'
    },
    {
        'name': "preface" /* EnumEpubTypeName.PREFACE */,
        'group': "Front Matter" /* EnumEpubTypeGroup.FRONT_MATTER */,
        'description': 'An introductory section that precedes the work, typically written by the work\'s author.'
    },
    {
        'name': 'introduction',
        'group': "Front Matter" /* EnumEpubTypeGroup.FRONT_MATTER */,
        'description': 'A section in the beginning of the work, typically introducing the reader to the scope or nature of the work\'s content.'
    },
    {
        'name': 'preamble',
        'group': "Front Matter" /* EnumEpubTypeGroup.FRONT_MATTER */,
        'description': 'A section in the beginning of the work, typically containing introductory and/or explanatory prose regarding the scope or nature of the work\'s content'
    },
    {
        'name': 'epigraph',
        'group': "Front Matter" /* EnumEpubTypeGroup.FRONT_MATTER */,
        'description': 'A quotation that is pertinent but not integral to the text.'
    },
    {
        'name': 'non-specific frontmatter',
        'group': "Front Matter" /* EnumEpubTypeGroup.FRONT_MATTER */,
        'description': 'Content placed in the frontmatter section, but which has no specific semantic meaning.'
    },
    {
        'name': 'part',
        'group': "Body Matter" /* EnumEpubTypeGroup.BODY_MATTER */,
        'description': 'An introductory section that sets the background to a story, typically part of the narrative.'
    },
    {
        'name': 'chapter',
        'group': "Body Matter" /* EnumEpubTypeGroup.BODY_MATTER */,
        'description': 'An introductory section that sets the background to a story, typically part of the narrative.'
    },
    {
        'name': 'prologue',
        'group': "Body Matter" /* EnumEpubTypeGroup.BODY_MATTER */,
        'description': 'An introductory section that sets the background to a story, typically part of the narrative.'
    },
    {
        'name': 'conclusion',
        'group': "Body Matter" /* EnumEpubTypeGroup.BODY_MATTER */,
        'description': 'An ending section that typically wraps up the work.'
    },
    {
        'name': 'epilogue',
        'group': "Body Matter" /* EnumEpubTypeGroup.BODY_MATTER */,
        'description': 'A concluding section that is typically written from a later point in time than the main story, although still part of the narrative.'
    },
    {
        'name': 'afterword',
        'group': "Back Matter" /* EnumEpubTypeGroup.BACK_MATTER */,
        'description': 'A closing statement from the author or a person of importance to the story, typically providing insight into how the story came to be written, its significance or related events that have transpired since its timeline.'
    },
    {
        'name': 'non-specific backmatter',
        'group': "Back Matter" /* EnumEpubTypeGroup.BACK_MATTER */,
        'description': 'Content placed in the backmatter section, but which has no specific semantic meaning.'
    },
    {
        'name': 'rearnote',
        'group': "Back Matter" /* EnumEpubTypeGroup.BACK_MATTER */,
        'description': 'A note appearing in the rear (backmatter) of the work, or at the end of a section.'
    },
];
exports.groups = {};
for (let i = 0; i < exports.epubtypes.length; i++) {
    let group = exports.epubtypes[i].group;
    (exports.groups[group] || (exports.groups[group] = [])).push(exports.epubtypes[i]);
}
var EnumEpubType;
(function (EnumEpubType) {
    EnumEpubType["abstract"] = "frontmatter";
    EnumEpubType["foreword"] = "frontmatter";
    EnumEpubType["preface"] = "frontmatter";
    EnumEpubType["introduction"] = "frontmatter";
    EnumEpubType["preamble"] = "frontmatter";
    EnumEpubType["epigraph"] = "frontmatter";
    EnumEpubType["non-specific frontmatter"] = "frontmatter";
    EnumEpubType["part"] = "bodymatter";
    EnumEpubType["chapter"] = "bodymatter";
    EnumEpubType["prologue"] = "bodymatter";
    EnumEpubType["conclusion"] = "bodymatter";
    EnumEpubType["epilogue"] = "bodymatter";
    EnumEpubType["afterword"] = "backmatter";
    EnumEpubType["non-specific backmatter"] = "backmatter";
    EnumEpubType["rearnote"] = "backmatter";
})(EnumEpubType || (exports.EnumEpubType = EnumEpubType = {}));
function getGroup(epubtype) {
    return EnumEpubType[epubtype];
}
exports.getGroup = getGroup;
exports.types = exports.epubtypes;
exports.default = exports;
//# sourceMappingURL=epub-types.js.map