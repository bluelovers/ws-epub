import { EpubMaker, hashSum, slugify } from 'epub-maker2';
import * as path from 'path';
import LazyURL from 'lazy-url';
import { pathExistsSync, realpathSync } from 'fs-extra';
import execall from 'execall2';
import { transliterate as tr, slugify as tr_slugify } from 'transliteration';
import { IAttachMetaData } from './epub';
import { IOptions } from './txt2epub3';
import { toHalfWidth } from 'str-util';
import { IInternalProcessOptions } from './types';
import { console } from './log';
import { novelImage } from './html';
import { ParsedPath } from "path";
import { allowExtImage, isAllowExtImage } from './ext';
import { pathAtParent } from './util';

export interface IEpubStoreValue
{
	uuid: string,
	vid: string,
	basePath: string,
	ext: string,
	basename: string,
	value: string,
	isFile: boolean,
	oldExt: string,
	input: string,
}

export interface IEpubStoreOptions
{
	vid: string,
	basePath?: string,
	name?: string,
	ext?: string,

	chkExt?(ext: string): boolean;
	failbackExt?: string,
	failbackName?: string,

	cwd: string,
	cwdRoot: string,
}

export class EpubStore
{

	protected $cache = new Map<string, IEpubStoreValue>();
	protected $names = new Set<string>();
	protected $exists = new WeakSet<IEpubStoreValue>();

	_name(_data: ReturnType<typeof parsePath>, options: IEpubStoreOptions)
	{
		const { input, isFile } = _data;

		if (!this.$cache.has(input))
		{
			let { name = _data.name, ext = _data.ext, vid, basePath, chkExt = defaultChkExt, failbackExt, failbackName } = options;
			let i = 0;

			name = name || _data.name;

			try
			{
				name = tr_slugify(name).trim().slice(0, 22).trim() || name;
			}
			catch (e)
			{
			}

			let cur_name = name;

			if (isBadName(name) || isHashedLike(name))
			{
				if (failbackName)
				{
					cur_name = name = failbackName;
				}
				else
				{
					name = 'img_';
					cur_name = name + (++i).toString().padStart(3, '0');
				}
			}

			let oldExt = ext;

			if (failbackExt && chkExt(ext))
			{
				ext = failbackExt;
			}

			let value: string;
			let basename: string;

			do
			{
				basename = cur_name;
				value = `${vid}/${cur_name}${ext}`;
				cur_name = name + (++i).toString().padStart(3, '0');
			}
			while (this.$names.has(value));

			this.$names.add(value);

			this.$cache.set(input, {
				uuid: input,
				input,
				vid,
				basePath,
				ext,
				basename,
				value,
				isFile,
				oldExt,
			})
		}

		return this.$cache.get(input)
	}

	get(input: string, options: IEpubStoreOptions)
	{
		let _data = parsePath(input, options);

		if (_data)
		{
			return this._name(_data, options)
		}
	}

	add(data: IEpubStoreValue)
	{
		this.$exists.add(data)
	}

	exists(data: IEpubStoreValue)
	{
		return this.$exists.has(data)
	}

}

export function defaultChkExt(ext: string)
{
	return !ext || ext === '.' || /php|cgi|htm|js|ts/i.test(ext);
}

export function isBadName(input: string)
{
	return /index|^img$|\d{10,}/i.test(input) || isEncodeURI(input)
}

export function isHashedLike(input: string, maxCount: number = 3)
{
	let r = execall(/([a-f][0-9]|[0-9][a-f])/ig, input);

	return r.length >= maxCount;
}

export function isEncodeURI(input: string, maxCount: number = 3)
{
	let r = execall(/(%[0-9a-f]{2,})/ig, input);

	return r.length >= maxCount;
}

/**
 *
 * @example console.dir(parsePath(__filename))
 * @example console.dir(parsePath('https://xs.dmzj.com/img/1406/79/a7e62ec50db1db823c61a2127aec9827.jpg'))
 */
export function parsePath(input: string, options: IEpubStoreOptions)
{
	const { cwd, cwdRoot } = options;

	try
	{
		const isFile = true as const;
		let tempInput: string;

		if (cwd && pathExistsSync(tempInput = path.resolve(cwd, input)))
		{
			let data = path.parse(tempInput);
			let { ext, name } = data;

			name = decodeURIComponent(name);

			return _fn001({
				name,
				ext,
				data,
			})
		}
		else if (pathExistsSync(tempInput = path.resolve(input)))
		{
			let data = path.parse(tempInput);
			let { ext, name } = data;

			name = decodeURIComponent(name);

			return _fn001({
				name,
				ext,
				data,
			})
		}
		else if (pathExistsSync(tempInput = realpathSync(input)))
		{
			let data = path.parse(tempInput);
			let { ext, name } = data;

			name = decodeURIComponent(name);

			return _fn001({
				name,
				ext,
				data,
			})
		}

		function _fn001({
			name,
			ext,
			data,
		}: {
			name: string,
			ext: string,
			data: ParsedPath,
		})
		{
			/**
			 * 當使用本地圖片時只允許指定的副檔名
			 */
			if (isFile)
			{
				if (!isAllowExtImage(ext))
				{
					console.error(`'${ext}' 副導名不在允許清單內, ${allowExtImage}`);

					return null;
				}
				else if (!pathAtParent(tempInput, cwdRoot))
				{
					console.error(`檔案路徑必須要存在於目前小說資料夾下，不允許讀取其他資料夾\n${cwdRoot}\n${tempInput}`);

					return null;
				}
			}

			return {
				isFile,
				input: tempInput,
				ext,
				name,
				data,
			}
		}
	}
	catch (e)
	{

	}

	try
	{
		const isFile = false as const;

		let u = new URL(input);

		if (u.protocol && u.host)
		{
			let pathname = decodeURIComponent(u.pathname);

			let ext = path.extname(pathname);
			let name = path.basename(pathname, ext);

			let data = new LazyURL(u).toObject();

			if (!name)
			{
				name = hashSum(input)
			}

			return {
				isFile,
				input,
				ext,
				name,
				data,
			}
		}
	}
	catch (e)
	{

	}

	return null;
}

export interface IHandleAttachFileOptions extends IEpubStoreOptions, IInternalProcessOptions
{

}

export function handleAttachFile(input: string, plusData?: IHandleAttachFileOptions)
{
	const { store, vid, epub, epubOptions, failbackExt, failbackName } = plusData || {};

	let data = store.get(input, {
		...plusData,
		vid,
		failbackExt,
	});

	if (data)
	{
		let { value, input, basePath } = data;

		if (typeof basePath === 'undefined')
		{
			basePath = plusData.basePath;
		}

		let returnPath: string;

		if (basePath == null)
		{
			returnPath = `${value}`;
		}
		else
		{
			returnPath = `${basePath}/${value}`;
		}

		if (!data.isFile)
		{
			if (!epubOptions.downloadRemoteFile)
			{
				returnPath = input;

				return {
					ok: false as const,
					returnPath,
					input,
					value,
					basePath,
					isFile: data.isFile as false,
					data,
				};
			}
		}

		if (!store.exists(data))
		{
			epub.withAdditionalFile(input, basePath, value);
			store.add(data);
		}

		return {
			ok: true as const,
			returnPath,
			input,
			value,
			basePath,
			isFile: data.isFile,
			data,
		}
	}
}

export function getAttachID(id: string, attach: IAttachMetaData, returnFailbackObject?: boolean): {
	id: string,
	input: string,
}
{
	const { images } = attach || {} as IAttachMetaData;
	id = toHalfWidth(id).trim();

	if (!images[id])
	{
		id = id.toLowerCase()
	}

	if (!images[id])
	{
		id = id.toUpperCase()
	}

	let input = images[id];

	if (input && typeof input === 'string' && (input = input.trim()))
	{
		return {
			id, input,
		}
	}

	return {} as any
}
