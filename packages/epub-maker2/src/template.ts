/**
 * Created by user on 2017/12/12/012.
 */

import path from 'upath2';
import { BPromise } from './lib/util';
import { IEpubConfig, IBuilder } from './var';
import { EpubMaker } from './index';

export const defaultPath = path.join(__dirname, './epubtpl') as string;

export const defaultList = {
	'idpf-wasteland': path.join(defaultPath, './from_idpf_epub3'),
	'lightnovel': path.join(defaultPath, './lightnovel'),
} as IList;

export interface IOptions
{
	list?: IList;
}

export interface IList
{
	'idpf-wasteland': string;
	'lightnovel': string;

	[index: string]: any;
}

export class TemplateManagers
{
	public basePath = defaultPath;
	public list = defaultList;
	public paths: string[] = [];

	constructor(options: IOptions = {})
	{
		Object.assign(this.list, options.list);
	}

	value()
	{
		return this.list;
	}

	/**
	 *
	 * @param {string} key
	 * @param {any | string | IBuilder} value
	 * @returns {this}
	 */
	add<T = any | string | IBuilder>(key: string, value: T)
	{
		this.list[key] = value;

		return this;
	}

	has<T = any | string | IBuilder>(name: string): T
	{
		return (this.list[name]);
	}

	_get(t): BPromise<IBuilder>
	{
		return BPromise.resolve().then(async function ()
		{
			let fn = async function (b)
			{
				if (!b)
				{
					//
				}
				else if (b.init)
				{
					return await b.init();
				}
				else if (b.builder)
				{
					return b.builder;
				}
				else if (b.Builder && typeof b.Builder.make == 'function')
				{
					return b.Builder;
				}
				else if (b.Builder)
				{
					return await new b.Builder();
				}
				else if (typeof b == 'function')
				{
					return await b();
				}

				throw new ReferenceError(`tpl "${name}" not exists`);
			};

			let r: IBuilder;

			if (!t)
			{
				//
			}
			else if (typeof t == 'string')
			{
				let b = await import(t);

				r = await fn(b);
			}
			else
			{
				r = await fn(t);
			}

			if (r)
			{
				return r;
			}

			throw new ReferenceError(`tpl "${name}" not exists`);
		})
	}

	get(name: string)
	{
		const self = this;

		return BPromise.resolve().then(async function ()
		{
			if (self.has(name))
			{
				return self._get(self.list[name]);
			}

			return self._get(await self.search(name));
		});
	}

	exec(name: string, epub: EpubMaker, options?)
	{
		const self = this;

		return BPromise.resolve().then(async function ()
		{
			let builder = await self.get(name);

			return builder.make(epub, options);
		});
	}

	search(name: string): string
	{
		let self = this;

		const fn = function (id)
		{
			return BPromise.resolve(function ()
			{
				// @ts-ignore
				return require.reverse(id);
			});
		};

		// @ts-ignore
		return fn(name)
			.catch(function ()
			{
				return fn(path.join(self.basePath, name));
			})
			.catch(function (err)
			{
				if (Array.isArray(self.paths))
				{
					let ps = [];

					for (let v of self.paths)
					{
						ps.push(fn(path.join(v, name)));
					}

					return BPromise.any(ps);
				}

				return BPromise.reject(err);
			})
			// @ts-ignore
			.then(function (ret)
			{
				if (!ret || typeof ret !== 'string')
				{
					return BPromise.reject(`${ret} not a valid path`);
				}

				return ret;
			})
			.catch(function ()
			{
				return fn(path.join('@epubtpl', name));
			})
			;
	}
}

export const templateManagers = new TemplateManagers();

export default exports as typeof import('./template');
