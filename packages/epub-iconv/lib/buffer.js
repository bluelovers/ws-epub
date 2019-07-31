"use strict";
/**
 * Created by user on 2019/7/31.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const JSZip = require("jszip");
const Bluebird = require("bluebird");
const iconv_jschardet_1 = require("iconv-jschardet");
const min_1 = require("cjk-conv/lib/zh/convert/min");
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
            return zip.file(zipFile.name, buf);
        });
        return zip;
    });
}
exports.handleZipObject = handleZipObject;
function handleZipBuffer(zipBuffer, options) {
    return loadZipBuffer(zipBuffer)
        .then(buf => handleZipObject(buf, options))
        .then(zip => zip.generateAsync({
        type: 'nodebuffer',
        mimeType: 'application/epub+zip',
        compression: 'DEFLATE',
        compressionOptions: {
            level: 9
        },
    }));
}
exports.handleZipBuffer = handleZipBuffer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVmZmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYnVmZmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7R0FFRzs7QUFFSCwrQkFBZ0M7QUFDaEMscUNBQXNDO0FBQ3RDLHFEQUFvQztBQUVwQyxxREFBbUU7QUFFbkUsU0FBZ0IsYUFBYSxDQUFDLFNBQWdDO0lBRTdELE9BQU8sUUFBUSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUM7U0FDaEMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUM5QztBQUNGLENBQUM7QUFMRCxzQ0FLQztBQU9ELFNBQWdCLGVBQWUsQ0FBQyxHQUF5QixFQUFFLE9BQTJCO0lBRXJGLE9BQU8sUUFBUSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUM7U0FDMUIsSUFBSSxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUUsRUFBRTtRQUVuQixJQUFJLE9BQTRDLENBQUM7UUFDakQsT0FBTyxHQUFHLE9BQU8sSUFBSSxFQUFFLENBQUM7UUFFeEIsUUFBUSxPQUFPLENBQUMsS0FBSyxFQUNyQjtZQUNDLEtBQUssSUFBSTtnQkFDUixPQUFPLEdBQUcsZUFBUyxDQUFDO2dCQUNwQixNQUFNO1lBQ1AsS0FBSyxJQUFJLENBQUM7WUFDVjtnQkFDQyxPQUFPLEdBQUcsZUFBUyxDQUFDO2dCQUNwQixNQUFNO1NBQ1A7UUFFRCxNQUFNLFFBQVE7YUFDWixPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO2FBQ3ZDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLEVBQUU7WUFFdEIsSUFBSSxHQUFHLEdBQUcsTUFBTSxPQUFPO2lCQUNyQixLQUFLLENBQUMsWUFBWSxDQUFDO2lCQUNuQixJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyx5QkFBSyxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsTUFBTSxDQUFDLENBQUM7aUJBQ3RDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FDbEQ7WUFFRCxPQUFPLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQTtRQUNuQyxDQUFDLENBQUMsQ0FDRjtRQUVELE9BQU8sR0FBRyxDQUFDO0lBQ1osQ0FBQyxDQUFDLENBQ0Y7QUFDRixDQUFDO0FBcENELDBDQW9DQztBQUVELFNBQWdCLGVBQWUsQ0FBQyxTQUFnQyxFQUFFLE9BQTJCO0lBRTVGLE9BQU8sYUFBYSxDQUFDLFNBQVMsQ0FBQztTQUM3QixJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxlQUFlLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1NBQzFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUM7UUFDOUIsSUFBSSxFQUFFLFlBQVk7UUFDbEIsUUFBUSxFQUFFLHNCQUFzQjtRQUNoQyxXQUFXLEVBQUUsU0FBUztRQUN0QixrQkFBa0IsRUFBRTtZQUNuQixLQUFLLEVBQUUsQ0FBQztTQUNSO0tBQ0QsQ0FBQyxDQUFDLENBQ0g7QUFDRixDQUFDO0FBYkQsMENBYUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENyZWF0ZWQgYnkgdXNlciBvbiAyMDE5LzcvMzEuXG4gKi9cblxuaW1wb3J0IEpTWmlwID0gcmVxdWlyZSgnanN6aXAnKTtcbmltcG9ydCBCbHVlYmlyZCA9IHJlcXVpcmUoJ2JsdWViaXJkJyk7XG5pbXBvcnQgSUNPTlYgZnJvbSAnaWNvbnYtanNjaGFyZGV0JztcbmltcG9ydCB7IElUU1Jlc29sdmFibGUgfSBmcm9tICd0cy10eXBlJztcbmltcG9ydCB7IGNuMnR3X21pbiwgdHcyY25fbWluIH0gZnJvbSAnY2prLWNvbnYvbGliL3poL2NvbnZlcnQvbWluJztcblxuZXhwb3J0IGZ1bmN0aW9uIGxvYWRaaXBCdWZmZXIoemlwQnVmZmVyOiBJVFNSZXNvbHZhYmxlPEJ1ZmZlcj4pXG57XG5cdHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKHppcEJ1ZmZlcilcblx0XHQudGhlbih6aXBCdWZmZXIgPT4gSlNaaXAubG9hZEFzeW5jKHppcEJ1ZmZlcikpXG5cdDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJRXB1Ykljb252T3B0aW9uc1xue1xuXHRpY29udj86ICdjbicgfCAndHcnO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaGFuZGxlWmlwT2JqZWN0KHppcDogSVRTUmVzb2x2YWJsZTxKU1ppcD4sIG9wdGlvbnM/OiBJRXB1Ykljb252T3B0aW9ucylcbntcblx0cmV0dXJuIEJsdWViaXJkLnJlc29sdmUoemlwKVxuXHRcdC50aGVuKGFzeW5jICh6aXApID0+IHtcblxuXHRcdFx0bGV0IGZuSWNvbnY6IHR5cGVvZiBjbjJ0d19taW4gfCB0eXBlb2YgdHcyY25fbWluO1xuXHRcdFx0b3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cblx0XHRcdHN3aXRjaCAob3B0aW9ucy5pY29udilcblx0XHRcdHtcblx0XHRcdFx0Y2FzZSAnY24nOlxuXHRcdFx0XHRcdGZuSWNvbnYgPSB0dzJjbl9taW47XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgJ3R3Jzpcblx0XHRcdFx0ZGVmYXVsdDpcblx0XHRcdFx0XHRmbkljb252ID0gY24ydHdfbWluO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0fVxuXG5cdFx0XHRhd2FpdCBCbHVlYmlyZFxuXHRcdFx0XHQucmVzb2x2ZSh6aXAuZmlsZSgvXFwuKD86eD9odG1sP3x0eHQpJC8pKVxuXHRcdFx0XHQubWFwKGFzeW5jICh6aXBGaWxlKSA9PiB7XG5cblx0XHRcdFx0XHRsZXQgYnVmID0gYXdhaXQgemlwRmlsZVxuXHRcdFx0XHRcdFx0LmFzeW5jKCdub2RlYnVmZmVyJylcblx0XHRcdFx0XHRcdC50aGVuKGJ1ZiA9PiBJQ09OVi5lbmNvZGUoYnVmLCAndXRmOCcpKVxuXHRcdFx0XHRcdFx0LnRoZW4oYnVmID0+IEJ1ZmZlci5mcm9tKGZuSWNvbnYoYnVmLnRvU3RyaW5nKCkpKSlcblx0XHRcdFx0XHQ7XG5cblx0XHRcdFx0XHRyZXR1cm4gemlwLmZpbGUoemlwRmlsZS5uYW1lLCBidWYpXG5cdFx0XHRcdH0pXG5cdFx0XHQ7XG5cblx0XHRcdHJldHVybiB6aXA7XG5cdFx0fSlcblx0O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaGFuZGxlWmlwQnVmZmVyKHppcEJ1ZmZlcjogSVRTUmVzb2x2YWJsZTxCdWZmZXI+LCBvcHRpb25zPzogSUVwdWJJY29udk9wdGlvbnMpXG57XG5cdHJldHVybiBsb2FkWmlwQnVmZmVyKHppcEJ1ZmZlcilcblx0XHQudGhlbihidWYgPT4gaGFuZGxlWmlwT2JqZWN0KGJ1Ziwgb3B0aW9ucykpXG5cdFx0LnRoZW4oemlwID0+IHppcC5nZW5lcmF0ZUFzeW5jKHtcblx0XHRcdHR5cGU6ICdub2RlYnVmZmVyJyxcblx0XHRcdG1pbWVUeXBlOiAnYXBwbGljYXRpb24vZXB1Yit6aXAnLFxuXHRcdFx0Y29tcHJlc3Npb246ICdERUZMQVRFJyxcblx0XHRcdGNvbXByZXNzaW9uT3B0aW9uczoge1xuXHRcdFx0XHRsZXZlbDogOVxuXHRcdFx0fSxcblx0XHR9KSlcblx0O1xufVxuIl19