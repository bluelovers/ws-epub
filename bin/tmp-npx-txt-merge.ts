#!/usr/bin/env node

import * as yargs from 'yargs';
import * as path from 'path';
import * as Promise from 'bluebird';
import txtMerge from '../index';

const CWD = process.cwd();

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
		desc: 'source novel txt folder path',
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
		desc: ' output path',
		default: function ()
		{
			return CWD;
		},
	})
	.option('zh', {
		//default: true,
		boolean: true,
	})
	.command('$0', '', function (yargs)
	{
		if (yargs.argv.zh)
		{
			yargs.locale('zh_CN');
		}

		let inputPath = yargs.argv.input || yargs.argv._[0] || CWD;
		let outputPath = yargs.argv.output;

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

		return txtMerge(inputPath, outputPath);

		//yargs.showHelp('log');
	})
	.version()
	//.help()
	.argv
;
