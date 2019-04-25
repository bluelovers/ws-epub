export interface IEpubtypes {
    'name': string;
    'group': string;
    'description': string;
}
export declare const epubtypes: IEpubtypes[];
export declare let groups: {
    [index: string]: IEpubtypes[];
};
export declare function getGroup(epubtype: string): string;
export declare const types: IEpubtypes[];
declare const _default: typeof import("./epub-types");
export default _default;
