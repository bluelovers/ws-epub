# epub-extract

> epub-extract for node-novel style

`npm install epub-extract`

## use

```
npx epub-extract -i path_of_file.epub

// extract all epub in folder
npx epub-extract --all
```

```
epub-extract.js [-o dir] [-i file]

Commands:
  epub-extract.js all  extract all epub
  epub-extract.js v    show log

Options:
  --help        Show help                                              [boolean]
  --version     Show version number                                    [boolean]
  -o, --output  output dir path
  -i, --input   input file path

Examples:
  epub-extract.js -o epub name.epub  extract name.epub to epub dir
```

## demo

```
import epubExtract from 'epub-extract';

epubExtract(srcFile, options);
```

#### Options

If ouput directory is ommited epub-extract will output the decompressed epub to the current working directory.

E.g. User/username/here

```
{
    cwd: 'string' // current working directory
    outputDir: 'string' // output directory
    noVolume: 'boolean' // §
    noFirePrefix: 'boolean',
    log: 'boolean', // will console log file
}
```