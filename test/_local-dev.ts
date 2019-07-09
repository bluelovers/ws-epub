// @ts-ignore
import _chai = require('chai');
// @ts-ignore
// @ts-ignore
//import { expect, assert } from 'chai';

import { IChaiInstalled } from 'chai-asserttype-extra'
//import ChaiPlugin = require('chai-asserttype-extra');
// @ts-ignore
import ChaiStatic = Chai.ChaiStatic;

let chai: IChaiInstalled<ChaiStatic> | ChaiStatic;

if (requireResolve('chai-asserttype-extra'))
{
	const ChaiPlugin = require('chai-asserttype-extra').ChaiPlugin;

	chai = ChaiPlugin.install(_chai) as IChaiInstalled<ChaiStatic>;
}
else
{
	chai = _chai;
}

if (requireResolve('chai-string'))
{
	chai.use(require('chai-string'));
}

const { expect, assert } = chai;

export { chai, expect, assert }

export const SymbolLogOutput = Symbol('output');

// @ts-ignore
import path = require('path');
// @ts-ignore
import util = require('util');

// @ts-ignore
(util.inspect.defaultOptions = util.inspect.defaultOptions || {}).colors = true;

export { path, util };

// @ts-ignore
export const rootDir: string = path.join(__dirname, '..');

export function relative(filename: string): string
{
	return path.relative(rootDir, filename);
}

export function mochaAsync(fn: Function)
{
	return async (done) =>
	{
		try
		{
			await fn();
			done();
		}
		catch (err)
		{
			done(err);
		}
	};
}

export default exports as typeof import('./_local-dev');

export function requireResolve(name: string): string
{
	try
	{
		return require.resolve(name)
	}
	catch (e)
	{

	}
	return null;
}
