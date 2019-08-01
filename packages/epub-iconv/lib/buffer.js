"use strict";
/**
 * Created by user on 2019/7/31.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const JSZip = require("jszip");
const Bluebird = require("bluebird");
const iconv_jschardet_1 = require("iconv-jschardet");
const min_1 = require("cjk-conv/lib/zh/convert/min");
const const_1 = require("@node-novel/epub-util/lib/const");
const options_1 = require("./options");
function loadZipBuffer(zipBuffer) {
    return Bluebird.resolve(zipBuffer)
        .then(zipBuffer => JSZip.loadAsync(zipBuffer));
}
exports.loadZipBuffer = loadZipBuffer;
function handleZipObject(zip, options) {
    return Bluebird.resolve(zip)
        .then(async (zip) => {
        let fnIconv;
        options = options_1.handleOptions(options);
        switch (options.iconv) {
            case 'cn':
                fnIconv = min_1.tw2cn_min;
                break;
            case 'tw':
            default:
                fnIconv = min_1.cn2tw_min;
                break;
        }
        await Bluebird
            .resolve(zip.file(/\.(?:x?html?|txt)$/))
            .map(async (zipFile) => {
            let buf = await zipFile
                .async('nodebuffer')
                .then(buf => iconv_jschardet_1.default.encode(buf, 'utf8'))
                .then(buf => Buffer.from(fnIconv(buf.toString())));
            return zip.file(zipFile.name, buf, {
                date: zipFile.date,
                createFolders: false,
            });
        });
        return zip;
    });
}
exports.handleZipObject = handleZipObject;
function handleZipBuffer(zipBuffer, options) {
    return loadZipBuffer(zipBuffer)
        .then(buf => handleZipObject(buf, options))
        .then(zip => zip.generateAsync(const_1.createJSZipGeneratorOptions()));
}
exports.handleZipBuffer = handleZipBuffer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVmZmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYnVmZmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7R0FFRzs7QUFFSCwrQkFBZ0M7QUFDaEMscUNBQXNDO0FBQ3RDLHFEQUFvQztBQUVwQyxxREFBbUU7QUFDbkUsMkRBQThFO0FBQzlFLHVDQUEwQztBQUUxQyxTQUFnQixhQUFhLENBQUMsU0FBZ0M7SUFFN0QsT0FBTyxRQUFRLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQztTQUNoQyxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQzlDO0FBQ0YsQ0FBQztBQUxELHNDQUtDO0FBT0QsU0FBZ0IsZUFBZSxDQUFDLEdBQXlCLEVBQUUsT0FBMkI7SUFFckYsT0FBTyxRQUFRLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQztTQUMxQixJQUFJLENBQUMsS0FBSyxFQUFFLEdBQUcsRUFBRSxFQUFFO1FBRW5CLElBQUksT0FBNEMsQ0FBQztRQUNqRCxPQUFPLEdBQUcsdUJBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUVqQyxRQUFRLE9BQU8sQ0FBQyxLQUFLLEVBQ3JCO1lBQ0MsS0FBSyxJQUFJO2dCQUNSLE9BQU8sR0FBRyxlQUFTLENBQUM7Z0JBQ3BCLE1BQU07WUFDUCxLQUFLLElBQUksQ0FBQztZQUNWO2dCQUNDLE9BQU8sR0FBRyxlQUFTLENBQUM7Z0JBQ3BCLE1BQU07U0FDUDtRQUVELE1BQU0sUUFBUTthQUNaLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLENBQUM7YUFDdkMsR0FBRyxDQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUsRUFBRTtZQUV0QixJQUFJLEdBQUcsR0FBRyxNQUFNLE9BQU87aUJBQ3JCLEtBQUssQ0FBQyxZQUFZLENBQUM7aUJBQ25CLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLHlCQUFLLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsQ0FBQztpQkFDdEMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUNsRDtZQUVELE9BQU8sR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRTtnQkFDbEMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxJQUFJO2dCQUNsQixhQUFhLEVBQUUsS0FBSzthQUNwQixDQUFDLENBQUE7UUFDSCxDQUFDLENBQUMsQ0FDRjtRQUVELE9BQU8sR0FBRyxDQUFDO0lBQ1osQ0FBQyxDQUFDLENBQ0Y7QUFDRixDQUFDO0FBdkNELDBDQXVDQztBQUVELFNBQWdCLGVBQWUsQ0FBQyxTQUFnQyxFQUFFLE9BQTJCO0lBRTVGLE9BQU8sYUFBYSxDQUFDLFNBQVMsQ0FBQztTQUM3QixJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxlQUFlLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1NBQzFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsbUNBQTJCLEVBQUUsQ0FBQyxDQUFDLENBQzlEO0FBQ0YsQ0FBQztBQU5ELDBDQU1DIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDcmVhdGVkIGJ5IHVzZXIgb24gMjAxOS83LzMxLlxuICovXG5cbmltcG9ydCBKU1ppcCA9IHJlcXVpcmUoJ2pzemlwJyk7XG5pbXBvcnQgQmx1ZWJpcmQgPSByZXF1aXJlKCdibHVlYmlyZCcpO1xuaW1wb3J0IElDT05WIGZyb20gJ2ljb252LWpzY2hhcmRldCc7XG5pbXBvcnQgeyBJVFNSZXNvbHZhYmxlIH0gZnJvbSAndHMtdHlwZSc7XG5pbXBvcnQgeyBjbjJ0d19taW4sIHR3MmNuX21pbiB9IGZyb20gJ2Nqay1jb252L2xpYi96aC9jb252ZXJ0L21pbic7XG5pbXBvcnQgeyBjcmVhdGVKU1ppcEdlbmVyYXRvck9wdGlvbnMgfSBmcm9tICdAbm9kZS1ub3ZlbC9lcHViLXV0aWwvbGliL2NvbnN0JztcbmltcG9ydCB7IGhhbmRsZU9wdGlvbnMgfSBmcm9tICcuL29wdGlvbnMnO1xuXG5leHBvcnQgZnVuY3Rpb24gbG9hZFppcEJ1ZmZlcih6aXBCdWZmZXI6IElUU1Jlc29sdmFibGU8QnVmZmVyPilcbntcblx0cmV0dXJuIEJsdWViaXJkLnJlc29sdmUoemlwQnVmZmVyKVxuXHRcdC50aGVuKHppcEJ1ZmZlciA9PiBKU1ppcC5sb2FkQXN5bmMoemlwQnVmZmVyKSlcblx0O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElFcHViSWNvbnZPcHRpb25zXG57XG5cdGljb252PzogJ2NuJyB8ICd0dyc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBoYW5kbGVaaXBPYmplY3QoemlwOiBJVFNSZXNvbHZhYmxlPEpTWmlwPiwgb3B0aW9ucz86IElFcHViSWNvbnZPcHRpb25zKVxue1xuXHRyZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSh6aXApXG5cdFx0LnRoZW4oYXN5bmMgKHppcCkgPT4ge1xuXG5cdFx0XHRsZXQgZm5JY29udjogdHlwZW9mIGNuMnR3X21pbiB8IHR5cGVvZiB0dzJjbl9taW47XG5cdFx0XHRvcHRpb25zID0gaGFuZGxlT3B0aW9ucyhvcHRpb25zKTtcblxuXHRcdFx0c3dpdGNoIChvcHRpb25zLmljb252KVxuXHRcdFx0e1xuXHRcdFx0XHRjYXNlICdjbic6XG5cdFx0XHRcdFx0Zm5JY29udiA9IHR3MmNuX21pbjtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSAndHcnOlxuXHRcdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHRcdGZuSWNvbnYgPSBjbjJ0d19taW47XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHR9XG5cblx0XHRcdGF3YWl0IEJsdWViaXJkXG5cdFx0XHRcdC5yZXNvbHZlKHppcC5maWxlKC9cXC4oPzp4P2h0bWw/fHR4dCkkLykpXG5cdFx0XHRcdC5tYXAoYXN5bmMgKHppcEZpbGUpID0+IHtcblxuXHRcdFx0XHRcdGxldCBidWYgPSBhd2FpdCB6aXBGaWxlXG5cdFx0XHRcdFx0XHQuYXN5bmMoJ25vZGVidWZmZXInKVxuXHRcdFx0XHRcdFx0LnRoZW4oYnVmID0+IElDT05WLmVuY29kZShidWYsICd1dGY4JykpXG5cdFx0XHRcdFx0XHQudGhlbihidWYgPT4gQnVmZmVyLmZyb20oZm5JY29udihidWYudG9TdHJpbmcoKSkpKVxuXHRcdFx0XHRcdDtcblxuXHRcdFx0XHRcdHJldHVybiB6aXAuZmlsZSh6aXBGaWxlLm5hbWUsIGJ1Ziwge1xuXHRcdFx0XHRcdFx0ZGF0ZTogemlwRmlsZS5kYXRlLFxuXHRcdFx0XHRcdFx0Y3JlYXRlRm9sZGVyczogZmFsc2UsXG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0fSlcblx0XHRcdDtcblxuXHRcdFx0cmV0dXJuIHppcDtcblx0XHR9KVxuXHQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBoYW5kbGVaaXBCdWZmZXIoemlwQnVmZmVyOiBJVFNSZXNvbHZhYmxlPEJ1ZmZlcj4sIG9wdGlvbnM/OiBJRXB1Ykljb252T3B0aW9ucylcbntcblx0cmV0dXJuIGxvYWRaaXBCdWZmZXIoemlwQnVmZmVyKVxuXHRcdC50aGVuKGJ1ZiA9PiBoYW5kbGVaaXBPYmplY3QoYnVmLCBvcHRpb25zKSlcblx0XHQudGhlbih6aXAgPT4gemlwLmdlbmVyYXRlQXN5bmMoY3JlYXRlSlNaaXBHZW5lcmF0b3JPcHRpb25zKCkpKVxuXHQ7XG59XG5cbiJdfQ==