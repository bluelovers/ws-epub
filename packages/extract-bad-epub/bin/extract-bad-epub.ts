#!/usr/bin/env node

import { load, saveAttach, autoExtract, console } from '../lib/index';
import FastGlob from '@bluelovers/fast-glob/bluebird';
import Bluebird = require('bluebird');
import * as path from 'path';

console.setOptions({
	time: true,
});

const cwd = process.cwd();

FastGlob([
	'*.epub'
], {
	cwd,
	absolute: true,
	deep: 0,
})
	.tap(ls => {

		console.info(cwd);
		console.info(`目前資料夾下找到`, ls.length, `epub`);

	})
	.mapSeries(file => {
		console.log(file);

		let target_path = path.join(cwd, path.parse(file).name + '_out');

		return autoExtract(file, {
			cwd: target_path,
		})
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
