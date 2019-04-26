#!/usr/bin/env node

import yargs = require('yargs');
import path = require('path');
import Promise = require('bluebird');
import txtMerge from '../index';
import PACKAGE_JSON = require('../package.json');
import updateNotifier = require('update-notifier');
import { Console } from 'debug-color2';
const console = new Console(null, {
	enabled: true,
	inspectOptions: {
		colors: true,
	},
	chalkOptions: {
		enabled: true,
	},
});

console.enabledColor = true;

const CWD = process.cwd();

updateNotifier({
	pkg: PACKAGE_JSON,
}).notify();

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

		return txtMerge(inputPath, outputPath);

		//yargs.showHelp('log');
	})
	.version()
	//.help()
	.argv
;
