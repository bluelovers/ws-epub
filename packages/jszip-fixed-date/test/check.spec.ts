import { fixedJSZipDate } from '../index';
import Bluebird from 'bluebird';
import JSZip from 'jszip';
import crypto from 'crypto';

test(`check`, async (done) =>
{

	let ret = await Bluebird.props({
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
	});

	let expected;

	expect(ret.zip1.md5).toStrictEqual(ret.zip2.md5);
	expect(ret.zip3.md5).toStrictEqual(ret.zip2.md5);
	expect(ret.zip1.md5).toStrictEqual(ret.zip4.md5);

	//expect(actual).toBeInstanceOf(Date);
	expect(ret.zip1.md5).toMatchSnapshot();
	expect(ret.zip3.md5).toMatchSnapshot();

	done();
});

function createZip()
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

function generateZip(data: {
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
