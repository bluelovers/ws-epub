/**
 * Created by user on 2019/7/22.
 */
/// <reference types="node" />
import MarkdownIt = require('markdown-it');
import { IInternalProcessMarkdownItOptions } from './types';
export declare function createMarkdownIt(options?: MarkdownIt.Options, plusData?: Partial<IInternalProcessMarkdownItOptions>): MarkdownIt;
export declare function render(input: string, options?: Partial<IInternalProcessMarkdownItOptions>): string;
export declare function handleMarkdown(txt: Buffer | string, plusData?: IInternalProcessMarkdownItOptions): {
    plusData: IInternalProcessMarkdownItOptions;
    mdEnv: import("./types").IMdEnv;
    mdHtml: string;
};
