# epub-maker2

> Easily create epub files with javascript

`npm i epub-maker2`

fork from `epub-maker`, [old README](README.old.md)

## demo

* see [txt2epub3.ts](https://github.com/bluelovers/node-novel-epub/blob/master/lib/txt2epub3.ts)

### EpubMaker.libSlugify

* the default slugify is [slugify](https://www.npmjs.com/package/slugify)
* but u can change it if wanna handle cjk/chinese by [transliteration](https://www.npmjs.com/package/transliteration)

```ts
import { slugify } from 'transliteration';
```

```ts
// global change
EpubMaker.libSlugify = slugify

// or only runtime
let epub = new EpubMaker({
    libSlugify: slugify,
});

// if can't handle will return '';
epub.slugify('你好，世界');

// if can't handle will return hashSum;
epub.slugifyWithFallback('你好，世界');
```

```ts
export interface ISlugify
{
	(input: string, ...argv): string
}
```

## downloadEpub

this is old `epub-maker` api, but we split this to optional

u need install by self `npm i epub-maker2 file-saver`

```ts
import EpubMaker from 'epub-maker2';
import 'epub-maker2/src/plugin/file-saver';

let epub = new EpubMaker();

// ...

eoub.downloadEpub(callback, options);
```

## cli

* see [novel-epub](https://www.npmjs.com/package/novel-epub)

## link

* [node-novel](https://www.npmjs.com/search?q=node-novel)
