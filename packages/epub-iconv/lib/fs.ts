import { readFile } from 'fs-extra';
import { handleZipObject, IEpubIconvOptions, loadZipBuffer, handleZipBuffer } from './buffer';
import Bluebird = require('bluebird');
import JSZip = require('jszip');

export function loadZipFile(zipFilePath: string)
{
	return loadZipBuffer(readFile(zipFilePath))
}

export function handleZipFile(zipFilePath: string, options?: IEpubIconvOptions)
{
	return handleZipBuffer(readFile(zipFilePath), options)
}