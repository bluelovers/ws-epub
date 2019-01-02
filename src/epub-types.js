"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// source: http://www.idpf.org/epub/vocab/structure/epub-vocab-structure-20150826.html
exports.epubtypes = [
    {
        'name': 'abstract',
        'group': 'Front Matter',
        'description': 'A short summary of the principle ideas, concepts and conclusions of the work, or of a section or except within it.'
    },
    {
        'name': 'foreword',
        'group': 'Front Matter',
        'description': 'An introductory section that precedes the work, typically not written by the work\'s author.'
    },
    {
        'name': 'preface',
        'group': 'Front Matter',
        'description': 'An introductory section that precedes the work, typically written by the work\'s author.'
    },
    {
        'name': 'introduction',
        'group': 'Front Matter',
        'description': 'A section in the beginning of the work, typically introducing the reader to the scope or nature of the work\'s content.'
    },
    {
        'name': 'preamble',
        'group': 'Front Matter',
        'description': 'A section in the beginning of the work, typically containing introductory and/or explanatory prose regarding the scope or nature of the work\'s content'
    },
    {
        'name': 'epigraph',
        'group': 'Front Matter',
        'description': 'A quotation that is pertinent but not integral to the text.'
    },
    {
        'name': 'non-specific frontmatter',
        'group': 'Front Matter',
        'description': 'Content placed in the frontmatter section, but which has no specific semantic meaning.'
    },
    {
        'name': 'part',
        'group': 'Body Matter',
        'description': 'An introductory section that sets the background to a story, typically part of the narrative.'
    },
    {
        'name': 'chapter',
        'group': 'Body Matter',
        'description': 'An introductory section that sets the background to a story, typically part of the narrative.'
    },
    {
        'name': 'prologue',
        'group': 'Body Matter',
        'description': 'An introductory section that sets the background to a story, typically part of the narrative.'
    },
    {
        'name': 'conclusion',
        'group': 'Body Matter',
        'description': 'An ending section that typically wraps up the work.'
    },
    {
        'name': 'epilogue',
        'group': 'Body Matter',
        'description': 'A concluding section that is typically written from a later point in time than the main story, although still part of the narrative.'
    },
    {
        'name': 'afterword',
        'group': 'Back Matter',
        'description': 'A closing statement from the author or a person of importance to the story, typically providing insight into how the story came to be written, its significance or related events that have transpired since its timeline.'
    },
    {
        'name': 'non-specific backmatter',
        'group': 'Back Matter',
        'description': 'Content placed in the backmatter section, but which has no specific semantic meaning.'
    },
    {
        'name': 'rearnote',
        'group': 'Back Matter',
        'description': 'A note appearing in the rear (backmatter) of the work, or at the end of a section.'
    },
];
exports.groups = {};
for (let i = 0; i < exports.epubtypes.length; i++) {
    let group = exports.epubtypes[i].group;
    (exports.groups[group] || (exports.groups[group] = [])).push(exports.epubtypes[i]);
}
function getGroup(epubtype) {
    return {
        'abstract': 'frontmatter',
        'foreword': 'frontmatter',
        'preface': 'frontmatter',
        'introduction': 'frontmatter',
        'preamble': 'frontmatter',
        'epigraph': 'frontmatter',
        'non-specific frontmatter': 'frontmatter',
        'part': 'bodymatter',
        'chapter': 'bodymatter',
        'prologue': 'bodymatter',
        'conclusion': 'bodymatter',
        'epilogue': 'bodymatter',
        'afterword': 'backmatter',
        'non-specific backmatter': 'backmatter',
        'rearnote': 'backmatter'
    }[epubtype];
}
exports.getGroup = getGroup;
exports.types = exports.epubtypes;
const self = require("./epub-types");
exports.default = self;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXB1Yi10eXBlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImVwdWItdHlwZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFRQSxzRkFBc0Y7QUFDekUsUUFBQSxTQUFTLEdBQUc7SUFDeEI7UUFDQyxNQUFNLEVBQUUsVUFBVTtRQUNsQixPQUFPLEVBQUUsY0FBYztRQUN2QixhQUFhLEVBQUUsb0hBQW9IO0tBQ25JO0lBQ0Q7UUFDQyxNQUFNLEVBQUUsVUFBVTtRQUNsQixPQUFPLEVBQUUsY0FBYztRQUN2QixhQUFhLEVBQUUsOEZBQThGO0tBQzdHO0lBQ0Q7UUFDQyxNQUFNLEVBQUUsU0FBUztRQUNqQixPQUFPLEVBQUUsY0FBYztRQUN2QixhQUFhLEVBQUUsMEZBQTBGO0tBQ3pHO0lBQ0Q7UUFDQyxNQUFNLEVBQUUsY0FBYztRQUN0QixPQUFPLEVBQUUsY0FBYztRQUN2QixhQUFhLEVBQUUseUhBQXlIO0tBQ3hJO0lBQ0Q7UUFDQyxNQUFNLEVBQUUsVUFBVTtRQUNsQixPQUFPLEVBQUUsY0FBYztRQUN2QixhQUFhLEVBQUUseUpBQXlKO0tBQ3hLO0lBQ0Q7UUFDQyxNQUFNLEVBQUUsVUFBVTtRQUNsQixPQUFPLEVBQUUsY0FBYztRQUN2QixhQUFhLEVBQUUsNkRBQTZEO0tBQzVFO0lBQ0Q7UUFDQyxNQUFNLEVBQUUsMEJBQTBCO1FBQ2xDLE9BQU8sRUFBRSxjQUFjO1FBQ3ZCLGFBQWEsRUFBRSx3RkFBd0Y7S0FDdkc7SUFDRDtRQUNDLE1BQU0sRUFBRSxNQUFNO1FBQ2QsT0FBTyxFQUFFLGFBQWE7UUFDdEIsYUFBYSxFQUFFLCtGQUErRjtLQUM5RztJQUNEO1FBQ0MsTUFBTSxFQUFFLFNBQVM7UUFDakIsT0FBTyxFQUFFLGFBQWE7UUFDdEIsYUFBYSxFQUFFLCtGQUErRjtLQUM5RztJQUNEO1FBQ0MsTUFBTSxFQUFFLFVBQVU7UUFDbEIsT0FBTyxFQUFFLGFBQWE7UUFDdEIsYUFBYSxFQUFFLCtGQUErRjtLQUM5RztJQUNEO1FBQ0MsTUFBTSxFQUFFLFlBQVk7UUFDcEIsT0FBTyxFQUFFLGFBQWE7UUFDdEIsYUFBYSxFQUFFLHFEQUFxRDtLQUNwRTtJQUNEO1FBQ0MsTUFBTSxFQUFFLFVBQVU7UUFDbEIsT0FBTyxFQUFFLGFBQWE7UUFDdEIsYUFBYSxFQUFFLHNJQUFzSTtLQUNySjtJQUNEO1FBQ0MsTUFBTSxFQUFFLFdBQVc7UUFDbkIsT0FBTyxFQUFFLGFBQWE7UUFDdEIsYUFBYSxFQUFFLDROQUE0TjtLQUMzTztJQUNEO1FBQ0MsTUFBTSxFQUFFLHlCQUF5QjtRQUNqQyxPQUFPLEVBQUUsYUFBYTtRQUN0QixhQUFhLEVBQUUsdUZBQXVGO0tBQ3RHO0lBQ0Q7UUFDQyxNQUFNLEVBQUUsVUFBVTtRQUNsQixPQUFPLEVBQUUsYUFBYTtRQUN0QixhQUFhLEVBQUUsb0ZBQW9GO0tBQ25HO0NBQ2UsQ0FBQztBQUVQLFFBQUEsTUFBTSxHQUFHLEVBRW5CLENBQUM7QUFDRixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsaUJBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQ3pDO0lBQ0MsSUFBSSxLQUFLLEdBQUcsaUJBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7SUFDL0IsQ0FBQyxjQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxjQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsaUJBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQzNEO0FBRUQsU0FBZ0IsUUFBUSxDQUFDLFFBQWdCO0lBRXhDLE9BQU87UUFDTixVQUFVLEVBQUUsYUFBYTtRQUN6QixVQUFVLEVBQUUsYUFBYTtRQUN6QixTQUFTLEVBQUUsYUFBYTtRQUN4QixjQUFjLEVBQUUsYUFBYTtRQUM3QixVQUFVLEVBQUUsYUFBYTtRQUN6QixVQUFVLEVBQUUsYUFBYTtRQUN6QiwwQkFBMEIsRUFBRSxhQUFhO1FBQ3pDLE1BQU0sRUFBRSxZQUFZO1FBQ3BCLFNBQVMsRUFBRSxZQUFZO1FBQ3ZCLFVBQVUsRUFBRSxZQUFZO1FBQ3hCLFlBQVksRUFBRSxZQUFZO1FBQzFCLFVBQVUsRUFBRSxZQUFZO1FBQ3hCLFdBQVcsRUFBRSxZQUFZO1FBQ3pCLHlCQUF5QixFQUFFLFlBQVk7UUFDdkMsVUFBVSxFQUFFLFlBQVk7S0FDeEIsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUNiLENBQUM7QUFuQkQsNEJBbUJDO0FBRVksUUFBQSxLQUFLLEdBQUcsaUJBQVMsQ0FBQztBQUUvQixxQ0FBcUM7QUFDckMsa0JBQWUsSUFBSSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiXG5leHBvcnQgaW50ZXJmYWNlIElFcHVidHlwZXNcbntcblx0J25hbWUnOiBzdHJpbmc7XG5cdCdncm91cCc6IHN0cmluZztcblx0J2Rlc2NyaXB0aW9uJzogc3RyaW5nO1xufVxuXG4vLyBzb3VyY2U6IGh0dHA6Ly93d3cuaWRwZi5vcmcvZXB1Yi92b2NhYi9zdHJ1Y3R1cmUvZXB1Yi12b2NhYi1zdHJ1Y3R1cmUtMjAxNTA4MjYuaHRtbFxuZXhwb3J0IGNvbnN0IGVwdWJ0eXBlcyA9IFtcblx0e1xuXHRcdCduYW1lJzogJ2Fic3RyYWN0Jyxcblx0XHQnZ3JvdXAnOiAnRnJvbnQgTWF0dGVyJyxcblx0XHQnZGVzY3JpcHRpb24nOiAnQSBzaG9ydCBzdW1tYXJ5IG9mIHRoZSBwcmluY2lwbGUgaWRlYXMsIGNvbmNlcHRzIGFuZCBjb25jbHVzaW9ucyBvZiB0aGUgd29yaywgb3Igb2YgYSBzZWN0aW9uIG9yIGV4Y2VwdCB3aXRoaW4gaXQuJ1xuXHR9LFxuXHR7XG5cdFx0J25hbWUnOiAnZm9yZXdvcmQnLFxuXHRcdCdncm91cCc6ICdGcm9udCBNYXR0ZXInLFxuXHRcdCdkZXNjcmlwdGlvbic6ICdBbiBpbnRyb2R1Y3Rvcnkgc2VjdGlvbiB0aGF0IHByZWNlZGVzIHRoZSB3b3JrLCB0eXBpY2FsbHkgbm90IHdyaXR0ZW4gYnkgdGhlIHdvcmtcXCdzIGF1dGhvci4nXG5cdH0sXG5cdHtcblx0XHQnbmFtZSc6ICdwcmVmYWNlJyxcblx0XHQnZ3JvdXAnOiAnRnJvbnQgTWF0dGVyJyxcblx0XHQnZGVzY3JpcHRpb24nOiAnQW4gaW50cm9kdWN0b3J5IHNlY3Rpb24gdGhhdCBwcmVjZWRlcyB0aGUgd29yaywgdHlwaWNhbGx5IHdyaXR0ZW4gYnkgdGhlIHdvcmtcXCdzIGF1dGhvci4nXG5cdH0sXG5cdHtcblx0XHQnbmFtZSc6ICdpbnRyb2R1Y3Rpb24nLFxuXHRcdCdncm91cCc6ICdGcm9udCBNYXR0ZXInLFxuXHRcdCdkZXNjcmlwdGlvbic6ICdBIHNlY3Rpb24gaW4gdGhlIGJlZ2lubmluZyBvZiB0aGUgd29yaywgdHlwaWNhbGx5IGludHJvZHVjaW5nIHRoZSByZWFkZXIgdG8gdGhlIHNjb3BlIG9yIG5hdHVyZSBvZiB0aGUgd29ya1xcJ3MgY29udGVudC4nXG5cdH0sXG5cdHtcblx0XHQnbmFtZSc6ICdwcmVhbWJsZScsXG5cdFx0J2dyb3VwJzogJ0Zyb250IE1hdHRlcicsXG5cdFx0J2Rlc2NyaXB0aW9uJzogJ0Egc2VjdGlvbiBpbiB0aGUgYmVnaW5uaW5nIG9mIHRoZSB3b3JrLCB0eXBpY2FsbHkgY29udGFpbmluZyBpbnRyb2R1Y3RvcnkgYW5kL29yIGV4cGxhbmF0b3J5IHByb3NlIHJlZ2FyZGluZyB0aGUgc2NvcGUgb3IgbmF0dXJlIG9mIHRoZSB3b3JrXFwncyBjb250ZW50J1xuXHR9LFxuXHR7XG5cdFx0J25hbWUnOiAnZXBpZ3JhcGgnLFxuXHRcdCdncm91cCc6ICdGcm9udCBNYXR0ZXInLFxuXHRcdCdkZXNjcmlwdGlvbic6ICdBIHF1b3RhdGlvbiB0aGF0IGlzIHBlcnRpbmVudCBidXQgbm90IGludGVncmFsIHRvIHRoZSB0ZXh0Lidcblx0fSxcblx0e1xuXHRcdCduYW1lJzogJ25vbi1zcGVjaWZpYyBmcm9udG1hdHRlcicsXG5cdFx0J2dyb3VwJzogJ0Zyb250IE1hdHRlcicsXG5cdFx0J2Rlc2NyaXB0aW9uJzogJ0NvbnRlbnQgcGxhY2VkIGluIHRoZSBmcm9udG1hdHRlciBzZWN0aW9uLCBidXQgd2hpY2ggaGFzIG5vIHNwZWNpZmljIHNlbWFudGljIG1lYW5pbmcuJ1xuXHR9LFxuXHR7XG5cdFx0J25hbWUnOiAncGFydCcsXG5cdFx0J2dyb3VwJzogJ0JvZHkgTWF0dGVyJyxcblx0XHQnZGVzY3JpcHRpb24nOiAnQW4gaW50cm9kdWN0b3J5IHNlY3Rpb24gdGhhdCBzZXRzIHRoZSBiYWNrZ3JvdW5kIHRvIGEgc3RvcnksIHR5cGljYWxseSBwYXJ0IG9mIHRoZSBuYXJyYXRpdmUuJ1xuXHR9LFxuXHR7XG5cdFx0J25hbWUnOiAnY2hhcHRlcicsXG5cdFx0J2dyb3VwJzogJ0JvZHkgTWF0dGVyJyxcblx0XHQnZGVzY3JpcHRpb24nOiAnQW4gaW50cm9kdWN0b3J5IHNlY3Rpb24gdGhhdCBzZXRzIHRoZSBiYWNrZ3JvdW5kIHRvIGEgc3RvcnksIHR5cGljYWxseSBwYXJ0IG9mIHRoZSBuYXJyYXRpdmUuJ1xuXHR9LFxuXHR7XG5cdFx0J25hbWUnOiAncHJvbG9ndWUnLFxuXHRcdCdncm91cCc6ICdCb2R5IE1hdHRlcicsXG5cdFx0J2Rlc2NyaXB0aW9uJzogJ0FuIGludHJvZHVjdG9yeSBzZWN0aW9uIHRoYXQgc2V0cyB0aGUgYmFja2dyb3VuZCB0byBhIHN0b3J5LCB0eXBpY2FsbHkgcGFydCBvZiB0aGUgbmFycmF0aXZlLidcblx0fSxcblx0e1xuXHRcdCduYW1lJzogJ2NvbmNsdXNpb24nLFxuXHRcdCdncm91cCc6ICdCb2R5IE1hdHRlcicsXG5cdFx0J2Rlc2NyaXB0aW9uJzogJ0FuIGVuZGluZyBzZWN0aW9uIHRoYXQgdHlwaWNhbGx5IHdyYXBzIHVwIHRoZSB3b3JrLidcblx0fSxcblx0e1xuXHRcdCduYW1lJzogJ2VwaWxvZ3VlJyxcblx0XHQnZ3JvdXAnOiAnQm9keSBNYXR0ZXInLFxuXHRcdCdkZXNjcmlwdGlvbic6ICdBIGNvbmNsdWRpbmcgc2VjdGlvbiB0aGF0IGlzIHR5cGljYWxseSB3cml0dGVuIGZyb20gYSBsYXRlciBwb2ludCBpbiB0aW1lIHRoYW4gdGhlIG1haW4gc3RvcnksIGFsdGhvdWdoIHN0aWxsIHBhcnQgb2YgdGhlIG5hcnJhdGl2ZS4nXG5cdH0sXG5cdHtcblx0XHQnbmFtZSc6ICdhZnRlcndvcmQnLFxuXHRcdCdncm91cCc6ICdCYWNrIE1hdHRlcicsXG5cdFx0J2Rlc2NyaXB0aW9uJzogJ0EgY2xvc2luZyBzdGF0ZW1lbnQgZnJvbSB0aGUgYXV0aG9yIG9yIGEgcGVyc29uIG9mIGltcG9ydGFuY2UgdG8gdGhlIHN0b3J5LCB0eXBpY2FsbHkgcHJvdmlkaW5nIGluc2lnaHQgaW50byBob3cgdGhlIHN0b3J5IGNhbWUgdG8gYmUgd3JpdHRlbiwgaXRzIHNpZ25pZmljYW5jZSBvciByZWxhdGVkIGV2ZW50cyB0aGF0IGhhdmUgdHJhbnNwaXJlZCBzaW5jZSBpdHMgdGltZWxpbmUuJ1xuXHR9LFxuXHR7XG5cdFx0J25hbWUnOiAnbm9uLXNwZWNpZmljIGJhY2ttYXR0ZXInLFxuXHRcdCdncm91cCc6ICdCYWNrIE1hdHRlcicsXG5cdFx0J2Rlc2NyaXB0aW9uJzogJ0NvbnRlbnQgcGxhY2VkIGluIHRoZSBiYWNrbWF0dGVyIHNlY3Rpb24sIGJ1dCB3aGljaCBoYXMgbm8gc3BlY2lmaWMgc2VtYW50aWMgbWVhbmluZy4nXG5cdH0sXG5cdHtcblx0XHQnbmFtZSc6ICdyZWFybm90ZScsXG5cdFx0J2dyb3VwJzogJ0JhY2sgTWF0dGVyJyxcblx0XHQnZGVzY3JpcHRpb24nOiAnQSBub3RlIGFwcGVhcmluZyBpbiB0aGUgcmVhciAoYmFja21hdHRlcikgb2YgdGhlIHdvcmssIG9yIGF0IHRoZSBlbmQgb2YgYSBzZWN0aW9uLidcblx0fSxcbl0gYXMgSUVwdWJ0eXBlc1tdO1xuXG5leHBvcnQgbGV0IGdyb3VwcyA9IHt9IGFzIHtcblx0W2luZGV4OiBzdHJpbmddOiBJRXB1YnR5cGVzW107XG59O1xuZm9yIChsZXQgaSA9IDA7IGkgPCBlcHVidHlwZXMubGVuZ3RoOyBpKyspXG57XG5cdGxldCBncm91cCA9IGVwdWJ0eXBlc1tpXS5ncm91cDtcblx0KGdyb3Vwc1tncm91cF0gfHwgKGdyb3Vwc1tncm91cF0gPSBbXSkpLnB1c2goZXB1YnR5cGVzW2ldKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEdyb3VwKGVwdWJ0eXBlOiBzdHJpbmcpOiBzdHJpbmdcbntcblx0cmV0dXJuIHtcblx0XHQnYWJzdHJhY3QnOiAnZnJvbnRtYXR0ZXInLFxuXHRcdCdmb3Jld29yZCc6ICdmcm9udG1hdHRlcicsXG5cdFx0J3ByZWZhY2UnOiAnZnJvbnRtYXR0ZXInLFxuXHRcdCdpbnRyb2R1Y3Rpb24nOiAnZnJvbnRtYXR0ZXInLFxuXHRcdCdwcmVhbWJsZSc6ICdmcm9udG1hdHRlcicsXG5cdFx0J2VwaWdyYXBoJzogJ2Zyb250bWF0dGVyJyxcblx0XHQnbm9uLXNwZWNpZmljIGZyb250bWF0dGVyJzogJ2Zyb250bWF0dGVyJyxcblx0XHQncGFydCc6ICdib2R5bWF0dGVyJyxcblx0XHQnY2hhcHRlcic6ICdib2R5bWF0dGVyJyxcblx0XHQncHJvbG9ndWUnOiAnYm9keW1hdHRlcicsXG5cdFx0J2NvbmNsdXNpb24nOiAnYm9keW1hdHRlcicsXG5cdFx0J2VwaWxvZ3VlJzogJ2JvZHltYXR0ZXInLFxuXHRcdCdhZnRlcndvcmQnOiAnYmFja21hdHRlcicsXG5cdFx0J25vbi1zcGVjaWZpYyBiYWNrbWF0dGVyJzogJ2JhY2ttYXR0ZXInLFxuXHRcdCdyZWFybm90ZSc6ICdiYWNrbWF0dGVyJ1xuXHR9W2VwdWJ0eXBlXTtcbn1cblxuZXhwb3J0IGNvbnN0IHR5cGVzID0gZXB1YnR5cGVzO1xuXG5pbXBvcnQgKiBhcyBzZWxmIGZyb20gJy4vZXB1Yi10eXBlcyc7XG5leHBvcnQgZGVmYXVsdCBzZWxmO1xuIl19