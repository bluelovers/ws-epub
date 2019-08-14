# epub-extract

> epub-extract for node-novel style

`npm install epub-extract`

## use

```
npx epub-extract -i path_of_file.epub

// extract all epub in folder
npx epub-extract --all
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