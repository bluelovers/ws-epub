import cheerio from 'cheerio';
export declare type ICheerio = ReturnType<typeof cheerio>;
export declare type ICheerioStatic = ReturnType<typeof cheerio.load>;
export declare type ICheerioElement = Parameters<typeof cheerio.contains>["0"];
export declare function fixCheerio<T extends unknown | ICheerio>(target: T, $: ICheerioStatic): Cheerio;
export declare function _removeAttrs<T extends ICheerioElement>(elem: T, $: ICheerioStatic): Cheerio;
export default fixCheerio;
