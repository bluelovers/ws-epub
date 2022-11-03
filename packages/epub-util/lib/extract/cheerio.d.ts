import cheerio from 'cheerio';
export type ICheerio = ReturnType<typeof cheerio>;
export type ICheerioStatic = ReturnType<typeof cheerio.load>;
export type ICheerioElement = Parameters<typeof cheerio.contains>["0"];
export declare function fixCheerio<T extends unknown | ICheerio>(target: T, $: ICheerioStatic): cheerio.Cheerio;
export declare function _removeAttrs<T extends ICheerioElement>(elem: T, $: ICheerioStatic): cheerio.Cheerio;
export default fixCheerio;
