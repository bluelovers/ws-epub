/**
 * Created by user on 2017/12/15/015.
 */
import postcss from 'postcss';
import autoprefixer from 'autoprefixer';
import postcss_epub from 'postcss-epub';
import postcssStripInlineComments from 'postcss-strip-inline-comments';
export { postcss, autoprefixer, postcss_epub, postcssStripInlineComments };
export declare function compileCss(css: any): Promise<string>;
declare const _default: typeof import("./postcss");
export default _default;
