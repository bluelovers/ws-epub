#!/usr/bin/env node

import updateNotifier from '@yarn-tool/update-notifier';
import yargs from 'yargs';
import { handleGlob, IEpubIconvGlobOptions } from '../lib/glob';
import path from 'path';
import { console } from 'debug-color2';
import * as pkg from '../package.json';

updateNotifier(path.join(__dirname, '..'));

let argv = yargs
	.scriptName(pkg.name)
	.example(`epub-iconv --iconv cn *.epub`, ``)
	.option('cwd', {
		normalize: true,
		desc: `搜尋檔案時的基準資料夾`,
		default: process.cwd(),
	})
	.option('output', {
		desc: `處理後的檔案輸出路徑`,
		requiresArg: true,
		string: true,
	})
	.option('iconv', {
		desc: `cn 轉簡 tw 轉繁`,
		requiresArg: true,
		string: true,
	})
	.option('showLog', {
		desc: `是否輸出訊息`,
		boolean: true,
		default: true,
	})
	.showHelpOnFail(true)
	.version()
	.command('$0', `epub-iconv *.epub`, (yargs) => yargs,  function (argv)
	{
		let options: IEpubIconvGlobOptions = {
			cwd: argv.cwd,
			output: argv.output,
			iconv: argv.iconv as IEpubIconvGlobOptions["iconv"],
			showLog: argv.showLog,
		};

		let pattern: string[] = argv._;

		if (!pattern.length)
		{
			pattern = ['*.epub'];
		}

		return handleGlob(pattern, options);
	})
	.argv
;

