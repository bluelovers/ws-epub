#!/usr/bin/env node

import { globby } from 'node-novel-globby';
import * as yargs from 'yargs';
import * as path from 'path';
import epubExtract from '..';
import * as Promise from 'bluebird';

let cli = yargs
	.usage("$0 [-o dir] [-i file]")
	.example('$0 -o epub name.epub', 'extract name.epub to epub dir')

	.command('all', 'extract all epub')
	.alias('a', 'all')

	.command('v', 'show log')

	.alias('o', 'output')
	.nargs('o', 1)
	.describe('o', 'output dir path')

	.alias('i', 'input')
	.nargs('i', 1)
	.describe('i', 'input file path')
;

//console.log(cli.argv);

let srcFile = cli.argv.input || cli.argv._[0];
let outputDir = cli.argv.output;

(async () =>
{
	let cwd = process.cwd();

	{
		let chk = path.relative(cwd, __dirname);
		if (['', '.', '..'].includes(chk))
		{
			return Promise.reject(`not allow cwd path "${cwd}"`);
		}
	}

	let ls: string[];

	let options = {
		cwd,
		outputDir,
		log: cli.argv.v,
	};

	if (!srcFile)
	{
		ls = await globby([
			'*.epub',
		], {
			cwd,
			absolute: true,
		});

		if (cli.argv.all === true)
		{
			if (!ls.length)
			{
				return Promise.reject(`can't found any epub file in "${cwd}"`)
			}

			return Promise
				.map(ls, function (srcFile)
			{
				return epubExtract(srcFile, options);
			})
				.then(function (ls)
				{
					return ls.join("\n");
				})
				;
		}
		else
		{
			srcFile = ls[0];
		}
	}

	if (!srcFile)
	{
		cli.showHelp('log');

		console.log(['current epub list:'].concat(ls || []).join("\n- "));
	}
	else
	{
		return await epubExtract(srcFile, options);
	}
})()
	.catch(function (e)
	{
		cli.showHelp();

		if (e instanceof Error)
		{
			console.trace(e);
		}
		else
		{
			console.error('[ERROR]', e);
		}
	})
	.then(function (ls)
	{
		console.log('[DONE]\n', ls);
	})
;
