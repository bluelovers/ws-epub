/**
 * Created by user on 2017/12/12/012.
 */

// @ts-ignore
import * as path from 'path';
import * as Promise from 'bluebird';
import { IEpubConfig, IRightsConfig, IBuilder } from './var';

// @ts-ignore
export const defaultPath = __dirname as string;

export const defaultList = {
	'idpf-wasteland': path.join(defaultPath, './epub_templates/from_idpf_epub3'),
	'lightnovel': path.join(defaultPath, './epub_templates/lightnovel'),
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

	async _get(t): Promise<IBuilder>
	{
		if (!t)
		{
			//
		}
		else if (typeof t == 'string')
		{
			let b = await import(t);

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
			else if (b.Builder)
			{
				return await new b.Builder();
			}
			else if (typeof b == 'function')
			{
				return await b();
			}
		}
		else if (typeof t.make == 'function')
		{
			return t;
		}
		else if (t.builder && typeof t.builder.make == 'function')
		{
			return t.builder;
		}
		else if (t.Builder)
		{
			return await new t.Builder();
		}
		else if (typeof t == 'function')
		{
			return await t();
		}

		throw new ReferenceError(`tpl "${name}" not exists`);
	}

	async get(name: string): Promise<IBuilder>
	{
		if (this.has(name))
		{
			return await this._get(this.list[name]);
		}

		return await this._get(await this.search(name));
	}

	async exec(name: string, epubConfig: IEpubConfig, options?)
	{
		let builder = await this.get(name);

		return builder.make(epubConfig, options);
	}

	search(name: string): string
	{
		let self = this;

		const fn = function (id)
		{
			return Promise.resolve(function ()
			{
				// @ts-ignore
				return require.reverse(id);
			});
		};

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

					return Promise.any(ps);
				}

				return Promise.reject(err);
			})
			.then(function (ret)
			{
				if (!ret || typeof ret !== 'string')
				{
					return Promise.reject(`${ret} not a valid path`);
				}

				return ret;
			})
			;
	}
}

export const templateManagers = new TemplateManagers();

// @ts-ignore
export default exports;
