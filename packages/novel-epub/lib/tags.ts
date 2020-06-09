import _zhRegExp from 'regexp-cjk';
import createZhRegExpPlugin from 'regexp-cjk-plugin-extra';
import { console } from './log';
import { toHalfWidth } from 'str-util';

export * from '@node-novel/parse-txt-tag/lib/tags';
import { _fixRubyInnerContext, _replaceHtmlTag, _convertHtmlTag001 } from '@node-novel/parse-txt-tag/lib/util';

export { _fixRubyInnerContext, _replaceHtmlTag, _convertHtmlTag001 }
