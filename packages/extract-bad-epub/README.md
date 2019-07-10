# README.md

    從各種錯誤不合規範的 epub 內暴力提取 txt

## 使用方式

> 在具有 epub 的資料夾路徑下使用此指令

```
npx extract-bad-epub
```

## install

```
yarn add extract-bad-epub
```

```ts
import { load, saveAttach, autoExtract } from 'extract-bad-epub';

let srcFile = 'D:\\Users\\Downloads\\文字+插图.epub';

autoExtract(srcFile);
```
