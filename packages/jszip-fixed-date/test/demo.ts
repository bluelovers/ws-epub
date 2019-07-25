/**
 * Created by user on 2019/7/24.
 */

import JSZip = require('jszip');
import crypto = require('crypto');
import Bluebird = require('bluebird');
import { fixedJSZipDate } from '../index';

(async () => {

	await Bluebird.props({
		zip1: createZip()
			.tap((data) => {
				data.zip
					// @ts-ignore
					.folder("nested")
					.file("hello.txt", "Hello World\n")
				;
			})
			.then(generateZip),
		zip2: createZip()
			.tap((data) => {
				data.zip
					.file("nested/hello.txt", "Hello World\n")
				;
			})
			.then(generateZip),
			zip3: createZip()
				.tap((data) => {
					data.zip
						.file("nested/hello.txt", "Hello World\n")
					;
				})
				.then(generateZip),
			zip4: createZip()
				.tap((data) => {
					data.zip
						.folder("nested")
						.file("hello.txt", "Hello World\n")
					;
				})
				.then(generateZip),
	})
		.tap(ret => {

			let bool = ret.zip1.md5 === ret.zip2.md5;

			if (bool)
			{
				console.log(`zip1, zip2 md5 is same`)
			}
			else
			{
				console.error(`zip1, zip2 md5 is not same`)
			}

			let bool2 = ret.zip3.md5 === ret.zip2.md5;

			console.log(`zip3 is same as zip2`, ':', bool2);

			let bool3 = ret.zip1.md5 === ret.zip4.md5;

			console.log(`zip1 is same as zip4`, ':', bool3);

			console.dir(ret.zip1);
			console.dir(ret.zip2);

			console.dir({
				zip1: ret.zip1.md5,
				zip2: ret.zip2.md5,
				zip3: ret.zip3.md5,
				zip4: ret.zip4.md5,
			})

		})
	;

})();

export function createZip()
{
	return Bluebird.resolve()
		.then(() => {
			let zip = new JSZip();

			let date = new Date('2019-07-24 06:00:00Z');

			const options = {
				date,
				createFolders: false
			};

			zip.file("hello.txt", "Hello World\n", options);

			return {
				zip,
				options,
			}
		})
}

export function generateZip(data: {
	zip: JSZip,
	options,
})
{
	return Bluebird
		.resolve(fixedJSZipDate(data.zip, data.options.date))
		.then(() => {
			return Bluebird.props({
				...data,
				md5: data.zip.generateAsync({
						type: 'nodebuffer',
						mimeType: 'application/epub+zip',
						compression: 'DEFLATE',
						compressionOptions: {
							level: 9
						},
					})
					.then(buf => {
						const md5 = crypto.createHash('md5');
						let result = md5.update(buf).digest('hex');

						return result
					})
			})
		})
	;
}