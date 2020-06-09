/**
 * Created by user on 2018/2/18/018.
 */

// @ts-ignore
import { readFile, readFileSync } from 'fs-iconv';
import { createUUID } from 'epub-maker2/src/lib/uuid';
import { mdconf_parse, IMdconfMeta } from 'node-novel-info';
import Bluebird = require('bluebird');
import path = require('upath2');
import { pathDirNormalize as _pathDirNormalize } from 'path-dir-normalize';

export { createUUID }

//export function createUUID(input?: unknown)
//{
//	return getUuidByString(String(input)).toLowerCase();
//}

/**
 * 讀取不標準的 mdconf
 */
export function parseLowCheckLevelMdconf(data: string | Buffer)
{
	return mdconf_parse(data, {
		// 當沒有包含必要的內容時不產生錯誤
		throw: false,
		// 允許不標準的 info 內容
		lowCheckLevel: true,
	});
}

export function fsLowCheckLevelMdconf(file: string)
{
	return parseLowCheckLevelMdconf(readFileSync(file));
}

export function fsLowCheckLevelMdconfAsync(file: string)
{
	return (readFile(file) as Promise<Buffer>).then(parseLowCheckLevelMdconf);
}

export function pathAtParent(cwd: string, cwdRoot: string)
{
	cwd = path.normalize(cwd).toLowerCase();
	cwdRoot = pathDirNormalize(cwdRoot).toLowerCase();

	return (cwdRoot === cwd) || pathDirNormalize(path.dirname(cwd)).startsWith(cwdRoot)
}

export function pathDirNormalize(dir: string)
{
	return _pathDirNormalize(dir, path)
}
