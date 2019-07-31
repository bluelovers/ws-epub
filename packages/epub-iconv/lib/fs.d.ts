/// <reference types="node" />
import { IEpubIconvOptions } from './buffer';
import Bluebird = require('bluebird');
import JSZip = require('jszip');
export declare function loadZipFile(zipFilePath: string): Bluebird<JSZip>;
export declare function handleZipFile(zipFilePath: string, options?: IEpubIconvOptions): Bluebird<Buffer>;
