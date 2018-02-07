export declare const IDKEY = "epub";
export interface IOptions {
    outputDir?: string;
}
export declare function epubExtract(srcFile: string, options?: IOptions): Promise<string>;
export default epubExtract;
