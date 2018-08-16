import { IMdconfMeta } from 'node-novel-info';
export declare function txtMerge(inputPath: string, outputPath: string, outputFilename?: string, noSave?: boolean): Promise<{
    filename: string;
    fullpath: string;
    data: string;
}>;
export declare function makeFilename(meta?: IMdconfMeta, outputFilename?: string, a?: string[]): string;
export default txtMerge;
