# README.md

    簡易型 epub 簡繁轉換

## cli

```
npx epub-iconv --iconv cn *.epub
npx epub-iconv --iconv tw *.epub
npx epub-iconv --iconv cn "G:/Download/書蟲公主.epub"
```

```
epub-iconv

epub-iconv *.epub

Options:
  --help     Show help                                                 [boolean]
  --cwd      搜尋檔案時的基準資料夾
   [default: "G:\Users\The Project\nodejs-yarn\ws-epub\packages\epub-iconv\bin"]
  --output   處理後的檔案輸出路徑                                       [string]
  --iconv    cn 轉簡 tw 轉繁                                            [string]
  --showLog  是否輸出訊息                              [boolean] [default: true]
  --version  Show version number                                       [boolean]
```


## install

```
npm install -g epub-iconv
```

## demo

```ts
import { handleZipFile, handleGlob } from 'epub-iconv';
import { outputFile } from 'fs-extra';
import * as path from 'path';

handleZipFile('./res/書蟲公主.epub', {
	iconv: 'cn',
})
	.tap(buf => {
		return outputFile('./temp/書蟲公主.epub', buf)
	})
;

handleGlob([
	'./res/*.epub'
], {
	cwd: __dirname,
	output: path.join(__dirname, 'temp'),
	iconv: 'cn',
	showLog: true,
});
```