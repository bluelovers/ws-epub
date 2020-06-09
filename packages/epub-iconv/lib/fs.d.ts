/// <reference types="node" />
import { IEpubIconvOptions } from './buffer';
import Bluebird from 'bluebird';
import JSZip from 'jszip';
export declare function loadZipFile(zipFilePath: string): Bluebird<JSZip>;
export declare function handleZipFile(zipFilePath: string, options?: IEpubIconvOptions): Bluebird<Buffer>;
