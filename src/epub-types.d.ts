export interface IEpubtypes {
    'name': string;
    'group': string;
    'description': string;
}
export declare const epubtypes: self.IEpubtypes[];
export declare let groups: {
    [index: string]: self.IEpubtypes[];
};
export declare function getGroup(epubtype: string): string;
export declare const types: self.IEpubtypes[];
import * as self from './epub-types';
export default self;
