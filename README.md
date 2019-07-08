# novel-epub

> create epub from node-novel style ( this module from epub-maker2 submodule )
> 合併小說 => epub

## usage

### changelog

> 從 1.1.29 開始支援 附件表 ATTACH.md

只要小說內文出現以下格式(無視簡繁日漢字與全形半形)

- `(圖片xxx)`
- `(插圖xxx)`
- `(插畫xxx)`
- `(畫像xxx)`

並且 ATTACH.md 內具有對應的 xxx 則會將該圖片於打包時插入內文中
如果路徑為網址，只有在設定了 downloadRemoteFile 時，才會將網路圖片下載為檔案並且置入 epub，否則只會保持原有的網路圖片形式

> `npx novel-epub --downloadRemoteFile`

`xxx` 為隨意英文數字組合(純英文與數字)，可自由設定，也不需要按照順序

ATTACH.md
```md
# attach

## images

- 000: https://xs.dmzj.com/img/1406/79/a7e62ec50db1db823c61a2127aec9827.jpg
- 001: https://xs.dmzj.com/img/356/18/aad3384eb1d3755bfe958a2e276fc3c3.jpg
- 002: https://xs.dmzj.com/img/1256/36/966fddd3f964226937ef25bf7d921d7b.jpg
- 003: https://xs.dmzj.com/img/1151/48/83b213cf951287f3500a258aa6dcbd45.jpg
- 004: https://xs.dmzj.com/img/34/80/5ca3e65c2777c2761c11aa54e9680209.jpg

```

### 方案 1

小說資料夾所在位置輸入以下指令

`npx novel-epub`

### 方案 2

1. `npm install -g novel-epub` 將此命令安裝為 Global 命令
2. `novel-epub -i PathOfTxt -o PathOfOutput` 然後就可以執行以下指令

### 注意事項

* 此模組要求資料夾底下必須要有 README.md 或者 meta.md 的存在 格式為 [node-novel-info](https://www.npmjs.com/package/node-novel-info)

最低條件至少要有以下內容
```
# novel

- title: 自卫队三部曲
```

* 每一個子資料夾代表一個章/卷
* 會自動對名稱排序 即使是 全形/半形 + 中文數字 混用的情況依然可以排序

## cli

> novel-epub --help

```
Options:
  --help                Show help                                      [boolean]
  --input, -i           小說資料夾路徑 source novel txt folder path     [string]
  --output, -o          epub 輸出路徑 output path  [string] [default: (default)]
  --tpl, -t             epub 模板 epub tpl                              [string]
  --filename, -f        epub 檔名 filename                              [string]
  --useTitle                                                     [default: true]
  --filenameLocal       try auto choose filename                 [default: true]
  --date, -d            epub 檔名後面追加日期 add current date end of filename
                                                                       [boolean]
  --lang, -l            epub 語言 epub lang                             [string]
  --vertical            是否輸出直排模式                               [boolean]
  --downloadRemoteFile  是否將網路資源下載到 epub 內                   [boolean]
  --version             Show version number                            [boolean]
```

## demo

```ts
import novelEpub from 'node-novel-epub';
import * as path from 'path';

let novelID: string;

novelID = '黑之魔王';
let TXT_PATH = path.join(__dirname, 'res', novelID);

novelEpub({
	inputPath: TXT_PATH,
	outputPath: './temp',
});
```

## link

* [epub-maker2](https://www.npmjs.com/package/epub-maker2)
* [node-novel](https://www.npmjs.com/search?q=node-novel)
* [node-novel-globby](https://www.npmjs.com/package/node-novel-globby)
