import Handlebars from 'handlebars';
export declare const mimetypes: {
    jpeg: string;
    jpg: string;
    bmp: string;
    png: string;
    svg: string;
    gif: string;
    ttf: string;
    css: string;
};
export declare function compileTpl(template: any, content: any, skipFormatting?: boolean): string;
export { Handlebars };
export default Handlebars;
