# README.md

    epub 簡繁轉換 用法等同於 epub-iconv 但使用 novel-segment 來進行轉換

## cli

```
npx epub-iconv-segment --iconv cn *.epub
npx epub-iconv-segment --iconv tw *.epub
npx epub-iconv-segment --iconv cn "G:/Download/書蟲公主.epub"
```

```
epub-iconv-segment

epub-iconv-segment *.epub

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
npm install -g epub-iconv-segment
```

## demo

```ts
import handleGlobSegment from 'epub-iconv-segment';
import * as path from 'path';

handleGlobSegment([
	'./res/*.epub'
], {
	cwd: __dirname,
	output: path.join(__dirname, 'temp'),
	iconv: 'tw',
	showLog: true,
});
```