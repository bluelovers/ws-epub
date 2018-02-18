# novel-epub

> create epub from node-novel style ( this module from epub-maker2 submodule )
> 合併小說 => epub

## usage

### 方案 1

小說資料夾所在位置輸入以下指令

`npx novel-epub`

### 方案 2

1. `npm install -g novel-epub` 將此命令安裝為 Global 命令
2. `novel-epub -i PathOfTxt -o PathOfOutput` 然後就可以執行以下指令

## cli

```
Options:
  --input, -i     source novel txt folder path                          [string]
  --output, -o     output path                     [string] [default: (default)]  
  --tpl, -t       epub tpl                                              [string]  
  --filename, -f  filename                                              [string]  
  --date, -d      add current date end of filename                     [boolean]  
  --lang, -l      epub lang                                             [string]  
  --version       Show version number                                  [boolean]
```

```
Options:
  --input, -i     小說資料夾路徑
  --output, -o     epub 輸出路徑
  --tpl, -t       epub 模板
  --filename, -f  epub 檔名
  --date, -d      epub 檔名後面追加日期
  --lang, -l      epub 語言
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
