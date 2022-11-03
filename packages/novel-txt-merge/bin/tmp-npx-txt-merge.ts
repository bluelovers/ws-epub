#!/usr/bin/env node

import yargs from 'yargs';
import path from 'path';

import txtMerge from '../index';
import { console } from 'debug-color2';

console.enabledColor = true;

import { updateNotifier } from '@yarn-tool/update-notifier';

const CWD = process.cwd();

updateNotifier(path.join(__dirname, '..'));

let cli = yargs
	.default({
		//input: process.cwd(),
	})
	.option('input', {
		alias: ['i'],
		//demandOption: true,
		requiresArg: true,
		normalize: true,
		type: 'string',
		desc: 'source novel txt folder path 要打包的 txt 來源資料夾',
		/*
		default: function ()
		{
			//return process.cwd();
		},
		*/
	})
	.option('output', {
		alias: ['o'],
		//demandOption: true,
		requiresArg: true,
		normalize: true,
		type: 'string',
		desc: ' output path 輸出資料夾',
		default: function ()
		{
			return CWD;
		},
	})
	.option('zh', {
		//default: true,
		boolean: true,
	})
	.option('txtStyle', {
		desc: '內建的 txt 風格 0=預設 16=書僕',
		number: true,
	})
	.option('configPath', {
		desc: '指定設定檔路徑會以設定檔內的資料來覆寫目前設定',
		normalize: true,
	})
	// @ts-ignore
	.command('$0', '', function (yargs)
	{
		if (yargs.argv.zh)
		{
			yargs.locale('zh_CN');
		}

		let inputPath = yargs.argv.input || yargs.argv._[0] || CWD;
		let outputPath = yargs.argv.output as any as string;

		if (!path.isAbsolute(inputPath))
		{
			inputPath = path.join(CWD, inputPath);
		}

		if (!path.isAbsolute(outputPath))
		{
			outputPath = path.join(CWD, outputPath);
		}

		console.log(`currentPath:\n  `, inputPath);
		console.log(`inputPath:\n  `, inputPath);
		console.log(`outputPath:\n  `, outputPath);

		if (inputPath.indexOf(__dirname) == 0 || outputPath.indexOf(__dirname) == 0)
		{
			console.error(`[FAIL] path not allow`);

			yargs.showHelp();

			process.exit(1);

			return;
		}

		console.log(`\n`);

		//console.log(666, yargs.argv);

		return txtMerge(inputPath, outputPath, {
			txtStyle: yargs.argv.txtStyle,
			inputConfigPath: yargs.argv.configPath,
		});

		//yargs.showHelp('log');
	})
	.version()
	//.help()
	.argv
;
