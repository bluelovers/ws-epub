/// <reference types="jquery" />
export declare function fixJQuery<T extends unknown | JQueryStatic>(target: T, $: JQueryStatic): JQuery<T>;
export declare function _removeAttrs<T extends HTMLElement>(elem: T, $: JQueryStatic): JQuery<T>;
export default fixJQuery;
