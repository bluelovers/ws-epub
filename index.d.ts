import { IReturnList } from 'node-novel-globby';
import { IMdconfMeta } from 'node-novel-info';
export declare function txtMerge(inputPath: string, outputPath: string, outputFilename?: string, noSave?: boolean): Promise<{
    filename: string;
    fullpath: string;
    data: string;
}>;
export declare function getMetaTitles(meta: IMdconfMeta): string[];
export declare function makeFilename(meta?: IMdconfMeta, outputFilename?: string, a?: string[], _ls?: IReturnList): string;
export default txtMerge;
