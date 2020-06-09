import EPub from '../../index';

EPub.createAsync("2d921902.epub", null, '')
	.then(async function (epub)
	{
		console.log(epub.filename);

		console.log("METADATA:\n");
		console.log(epub.metadata);

		console.log("\nSPINE:\n");
		console.log(epub.flow);

		console.log("\nTOC:\n");
		console.log(epub.toc);

		// get first chapter
		await epub.getChapterAsync(epub.spine.contents[0].id)
			.then(function (data)
			{
				console.log("\nFIRST CHAPTER:\n");
				console.log(data.substr(0, 512) + "..."); // first 512 bytes
			})
		;

		console.log("\nmanifest:\n");
		console.log(epub.manifest);

		console.log("\nlistImage:\n");
		let imgs = epub.listImage();
		console.log(imgs);

		await epub.getImageAsync(imgs[0].id).then( function([data, mimeType]){

			console.log(`\ngetImage: cover\n`);

			console.log(data);
			console.log(mimeType)
		});

	})
	.catch(function (err)
	{
		console.log("ERROR\n-----");
		throw err;
	})
;


