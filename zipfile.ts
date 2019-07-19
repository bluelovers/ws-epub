/**
 * Created by user on 2018/2/1/001.
 */

export let ZipFile: IZipFile;

export interface IZipFile
{
	names: string[];
	count: number;
	constructor(filename: string);
	readFile(name: string, cb: (error, buffer: Buffer) => void): void;
}

try
{
	// zipfile is an optional dependency:
	ZipFile = require("zipfile").ZipFile;
}
catch (err)
{
	// Mock zipfile using pure-JS adm-zip:
	const AdmZip = require('adm-zip');

	// @ts-ignore
	ZipFile = (class
	{
		protected admZip;
		public names: string[];

		constructor(filename: string)
		{
			this.admZip = new AdmZip(filename);
			this.names = this.admZip.getEntries().map(function (zipEntry)
			{
				return zipEntry.entryName;
			});
		}

		public readFile(name: string, cb: (error, buffer) => void)
		{
			this.admZip.readFileAsync(this.admZip.getEntry(name), (buffer, error) =>
			{
				if (error || !buffer)
				{
					name = decodeURIComponent(name);

					this.admZip.readFileAsync(this.admZip.getEntry(name), (buffer, error) => cb(error, buffer));
				}
				else
				{
					cb(error, buffer);
				}
			});
		}

		public get count(): number
		{
			return this.names.length;
		}
	});
}

export default ZipFile;
