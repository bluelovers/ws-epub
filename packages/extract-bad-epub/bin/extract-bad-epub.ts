#!/usr/bin/env node

import { load, saveAttach, autoExtract, console } from '../lib/index';
import FastGlob from '@bluelovers/fast-glob/bluebird';
import Bluebird = require('bluebird');

console.setOptions({
	time: true,
});

const cwd = process.cwd();

FastGlob([
	'*.epub'
], {
	cwd,
	absolute: true,
})
	.tap(ls => {

		console.info(cwd);
		console.info(`目前資料夾下找到`, ls.length, `epub`);

	})
	.mapSeries(file => {
		console.log(file);
		return autoExtract(file)
	})
	.then(ls => {

		if (ls.length)
		{
			console.success(`處理完成`, ls.length, `epub`);
		}
		else
		{
			console.red(`沒有找到任何 epub 檔案`);
		}

	})
;
