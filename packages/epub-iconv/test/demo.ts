/**
 * Created by user on 2019/7/31.
 */
import { handleZipFile, handleGlob } from 'epub-iconv';
import { outputFile } from 'fs-extra';
import * as path from 'path';

//handleZipFile(path.join(__dirname, 'res', '書蟲公主.epub'), {
//	iconv: 'cn',
//})
//	.tap(buf => {
//		return outputFile(path.join(__dirname, 'temp', '書蟲公主.epub'), buf)
//	})
//;

handleGlob([
	path.join(__dirname, './res/*.epub'),
], {
	cwd: __dirname,
	output: path.join(__dirname, 'temp'),
	iconv: 'cn',
	showLog: true,
});
