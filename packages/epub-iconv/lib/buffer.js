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
function loadZipBuffer(zipBuffer) {
    return Bluebird.resolve(zipBuffer)
        .then(zipBuffer => JSZip.loadAsync(zipBuffer));
}
exports.loadZipBuffer = loadZipBuffer;
function handleZipObject(zip, options) {
    return Bluebird.resolve(zip)
        .then(async (zip) => {
        let fnIconv;
        options = options || {};
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVmZmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYnVmZmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7R0FFRzs7QUFFSCwrQkFBZ0M7QUFDaEMscUNBQXNDO0FBQ3RDLHFEQUFvQztBQUVwQyxxREFBbUU7QUFDbkUsMkRBQThFO0FBRTlFLFNBQWdCLGFBQWEsQ0FBQyxTQUFnQztJQUU3RCxPQUFPLFFBQVEsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDO1NBQ2hDLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FDOUM7QUFDRixDQUFDO0FBTEQsc0NBS0M7QUFPRCxTQUFnQixlQUFlLENBQUMsR0FBeUIsRUFBRSxPQUEyQjtJQUVyRixPQUFPLFFBQVEsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDO1NBQzFCLElBQUksQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFFLEVBQUU7UUFFbkIsSUFBSSxPQUE0QyxDQUFDO1FBQ2pELE9BQU8sR0FBRyxPQUFPLElBQUksRUFBRSxDQUFDO1FBRXhCLFFBQVEsT0FBTyxDQUFDLEtBQUssRUFDckI7WUFDQyxLQUFLLElBQUk7Z0JBQ1IsT0FBTyxHQUFHLGVBQVMsQ0FBQztnQkFDcEIsTUFBTTtZQUNQLEtBQUssSUFBSSxDQUFDO1lBQ1Y7Z0JBQ0MsT0FBTyxHQUFHLGVBQVMsQ0FBQztnQkFDcEIsTUFBTTtTQUNQO1FBRUQsTUFBTSxRQUFRO2FBQ1osT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsQ0FBQzthQUN2QyxHQUFHLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxFQUFFO1lBRXRCLElBQUksR0FBRyxHQUFHLE1BQU0sT0FBTztpQkFDckIsS0FBSyxDQUFDLFlBQVksQ0FBQztpQkFDbkIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMseUJBQUssQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxDQUFDO2lCQUN0QyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQ2xEO1lBRUQsT0FBTyxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFO2dCQUNsQyxJQUFJLEVBQUUsT0FBTyxDQUFDLElBQUk7Z0JBQ2xCLGFBQWEsRUFBRSxLQUFLO2FBQ3BCLENBQUMsQ0FBQTtRQUNILENBQUMsQ0FBQyxDQUNGO1FBRUQsT0FBTyxHQUFHLENBQUM7SUFDWixDQUFDLENBQUMsQ0FDRjtBQUNGLENBQUM7QUF2Q0QsMENBdUNDO0FBRUQsU0FBZ0IsZUFBZSxDQUFDLFNBQWdDLEVBQUUsT0FBMkI7SUFFNUYsT0FBTyxhQUFhLENBQUMsU0FBUyxDQUFDO1NBQzdCLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLGVBQWUsQ0FBQyxHQUFHLEVBQUUsT0FBTyxDQUFDLENBQUM7U0FDMUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxtQ0FBMkIsRUFBRSxDQUFDLENBQUMsQ0FDOUQ7QUFDRixDQUFDO0FBTkQsMENBTUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENyZWF0ZWQgYnkgdXNlciBvbiAyMDE5LzcvMzEuXG4gKi9cblxuaW1wb3J0IEpTWmlwID0gcmVxdWlyZSgnanN6aXAnKTtcbmltcG9ydCBCbHVlYmlyZCA9IHJlcXVpcmUoJ2JsdWViaXJkJyk7XG5pbXBvcnQgSUNPTlYgZnJvbSAnaWNvbnYtanNjaGFyZGV0JztcbmltcG9ydCB7IElUU1Jlc29sdmFibGUgfSBmcm9tICd0cy10eXBlJztcbmltcG9ydCB7IGNuMnR3X21pbiwgdHcyY25fbWluIH0gZnJvbSAnY2prLWNvbnYvbGliL3poL2NvbnZlcnQvbWluJztcbmltcG9ydCB7IGNyZWF0ZUpTWmlwR2VuZXJhdG9yT3B0aW9ucyB9IGZyb20gJ0Bub2RlLW5vdmVsL2VwdWItdXRpbC9saWIvY29uc3QnO1xuXG5leHBvcnQgZnVuY3Rpb24gbG9hZFppcEJ1ZmZlcih6aXBCdWZmZXI6IElUU1Jlc29sdmFibGU8QnVmZmVyPilcbntcblx0cmV0dXJuIEJsdWViaXJkLnJlc29sdmUoemlwQnVmZmVyKVxuXHRcdC50aGVuKHppcEJ1ZmZlciA9PiBKU1ppcC5sb2FkQXN5bmMoemlwQnVmZmVyKSlcblx0O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElFcHViSWNvbnZPcHRpb25zXG57XG5cdGljb252PzogJ2NuJyB8ICd0dyc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBoYW5kbGVaaXBPYmplY3QoemlwOiBJVFNSZXNvbHZhYmxlPEpTWmlwPiwgb3B0aW9ucz86IElFcHViSWNvbnZPcHRpb25zKVxue1xuXHRyZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSh6aXApXG5cdFx0LnRoZW4oYXN5bmMgKHppcCkgPT4ge1xuXG5cdFx0XHRsZXQgZm5JY29udjogdHlwZW9mIGNuMnR3X21pbiB8IHR5cGVvZiB0dzJjbl9taW47XG5cdFx0XHRvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuXHRcdFx0c3dpdGNoIChvcHRpb25zLmljb252KVxuXHRcdFx0e1xuXHRcdFx0XHRjYXNlICdjbic6XG5cdFx0XHRcdFx0Zm5JY29udiA9IHR3MmNuX21pbjtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0Y2FzZSAndHcnOlxuXHRcdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHRcdGZuSWNvbnYgPSBjbjJ0d19taW47XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHR9XG5cblx0XHRcdGF3YWl0IEJsdWViaXJkXG5cdFx0XHRcdC5yZXNvbHZlKHppcC5maWxlKC9cXC4oPzp4P2h0bWw/fHR4dCkkLykpXG5cdFx0XHRcdC5tYXAoYXN5bmMgKHppcEZpbGUpID0+IHtcblxuXHRcdFx0XHRcdGxldCBidWYgPSBhd2FpdCB6aXBGaWxlXG5cdFx0XHRcdFx0XHQuYXN5bmMoJ25vZGVidWZmZXInKVxuXHRcdFx0XHRcdFx0LnRoZW4oYnVmID0+IElDT05WLmVuY29kZShidWYsICd1dGY4JykpXG5cdFx0XHRcdFx0XHQudGhlbihidWYgPT4gQnVmZmVyLmZyb20oZm5JY29udihidWYudG9TdHJpbmcoKSkpKVxuXHRcdFx0XHRcdDtcblxuXHRcdFx0XHRcdHJldHVybiB6aXAuZmlsZSh6aXBGaWxlLm5hbWUsIGJ1Ziwge1xuXHRcdFx0XHRcdFx0ZGF0ZTogemlwRmlsZS5kYXRlLFxuXHRcdFx0XHRcdFx0Y3JlYXRlRm9sZGVyczogZmFsc2UsXG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0fSlcblx0XHRcdDtcblxuXHRcdFx0cmV0dXJuIHppcDtcblx0XHR9KVxuXHQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBoYW5kbGVaaXBCdWZmZXIoemlwQnVmZmVyOiBJVFNSZXNvbHZhYmxlPEJ1ZmZlcj4sIG9wdGlvbnM/OiBJRXB1Ykljb252T3B0aW9ucylcbntcblx0cmV0dXJuIGxvYWRaaXBCdWZmZXIoemlwQnVmZmVyKVxuXHRcdC50aGVuKGJ1ZiA9PiBoYW5kbGVaaXBPYmplY3QoYnVmLCBvcHRpb25zKSlcblx0XHQudGhlbih6aXAgPT4gemlwLmdlbmVyYXRlQXN5bmMoY3JlYXRlSlNaaXBHZW5lcmF0b3JPcHRpb25zKCkpKVxuXHQ7XG59XG5cbiJdfQ==