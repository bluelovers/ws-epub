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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVmZmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYnVmZmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7R0FFRzs7QUFFSCwrQkFBZ0M7QUFDaEMscUNBQXNDO0FBQ3RDLHFEQUFvQztBQUVwQyxxREFBbUU7QUFFbkUsU0FBZ0IsYUFBYSxDQUFDLFNBQWdDO0lBRTdELE9BQU8sUUFBUSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUM7U0FDaEMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUM5QztBQUNGLENBQUM7QUFMRCxzQ0FLQztBQU9ELFNBQWdCLGVBQWUsQ0FBQyxHQUF5QixFQUFFLE9BQTJCO0lBRXJGLE9BQU8sUUFBUSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUM7U0FDMUIsSUFBSSxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUUsRUFBRTtRQUVuQixJQUFJLE9BQTRDLENBQUM7UUFDakQsT0FBTyxHQUFHLE9BQU8sSUFBSSxFQUFFLENBQUM7UUFFeEIsUUFBUSxPQUFPLENBQUMsS0FBSyxFQUNyQjtZQUNDLEtBQUssSUFBSTtnQkFDUixPQUFPLEdBQUcsZUFBUyxDQUFDO2dCQUNwQixNQUFNO1lBQ1AsS0FBSyxJQUFJLENBQUM7WUFDVjtnQkFDQyxPQUFPLEdBQUcsZUFBUyxDQUFDO2dCQUNwQixNQUFNO1NBQ1A7UUFFRCxNQUFNLFFBQVE7YUFDWixPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO2FBQ3ZDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLEVBQUU7WUFFdEIsSUFBSSxHQUFHLEdBQUcsTUFBTSxPQUFPO2lCQUNyQixLQUFLLENBQUMsWUFBWSxDQUFDO2lCQUNuQixJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyx5QkFBSyxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsTUFBTSxDQUFDLENBQUM7aUJBQ3RDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FDbEQ7WUFFRCxPQUFPLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUU7Z0JBQ2xDLElBQUksRUFBRSxPQUFPLENBQUMsSUFBSTtnQkFDbEIsYUFBYSxFQUFFLEtBQUs7YUFDcEIsQ0FBQyxDQUFBO1FBQ0gsQ0FBQyxDQUFDLENBQ0Y7UUFFRCxPQUFPLEdBQUcsQ0FBQztJQUNaLENBQUMsQ0FBQyxDQUNGO0FBQ0YsQ0FBQztBQXZDRCwwQ0F1Q0M7QUFFRCxTQUFnQixlQUFlLENBQUMsU0FBZ0MsRUFBRSxPQUEyQjtJQUU1RixPQUFPLGFBQWEsQ0FBQyxTQUFTLENBQUM7U0FDN0IsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsZUFBZSxDQUFDLEdBQUcsRUFBRSxPQUFPLENBQUMsQ0FBQztTQUMxQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDO1FBQzlCLElBQUksRUFBRSxZQUFZO1FBQ2xCLFFBQVEsRUFBRSxzQkFBc0I7UUFDaEMsV0FBVyxFQUFFLFNBQVM7UUFDdEIsa0JBQWtCLEVBQUU7WUFDbkIsS0FBSyxFQUFFLENBQUM7U0FDUjtLQUNELENBQUMsQ0FBQyxDQUNIO0FBQ0YsQ0FBQztBQWJELDBDQWFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDcmVhdGVkIGJ5IHVzZXIgb24gMjAxOS83LzMxLlxuICovXG5cbmltcG9ydCBKU1ppcCA9IHJlcXVpcmUoJ2pzemlwJyk7XG5pbXBvcnQgQmx1ZWJpcmQgPSByZXF1aXJlKCdibHVlYmlyZCcpO1xuaW1wb3J0IElDT05WIGZyb20gJ2ljb252LWpzY2hhcmRldCc7XG5pbXBvcnQgeyBJVFNSZXNvbHZhYmxlIH0gZnJvbSAndHMtdHlwZSc7XG5pbXBvcnQgeyBjbjJ0d19taW4sIHR3MmNuX21pbiB9IGZyb20gJ2Nqay1jb252L2xpYi96aC9jb252ZXJ0L21pbic7XG5cbmV4cG9ydCBmdW5jdGlvbiBsb2FkWmlwQnVmZmVyKHppcEJ1ZmZlcjogSVRTUmVzb2x2YWJsZTxCdWZmZXI+KVxue1xuXHRyZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSh6aXBCdWZmZXIpXG5cdFx0LnRoZW4oemlwQnVmZmVyID0+IEpTWmlwLmxvYWRBc3luYyh6aXBCdWZmZXIpKVxuXHQ7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgSUVwdWJJY29udk9wdGlvbnNcbntcblx0aWNvbnY/OiAnY24nIHwgJ3R3Jztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGhhbmRsZVppcE9iamVjdCh6aXA6IElUU1Jlc29sdmFibGU8SlNaaXA+LCBvcHRpb25zPzogSUVwdWJJY29udk9wdGlvbnMpXG57XG5cdHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKHppcClcblx0XHQudGhlbihhc3luYyAoemlwKSA9PiB7XG5cblx0XHRcdGxldCBmbkljb252OiB0eXBlb2YgY24ydHdfbWluIHwgdHlwZW9mIHR3MmNuX21pbjtcblx0XHRcdG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG5cdFx0XHRzd2l0Y2ggKG9wdGlvbnMuaWNvbnYpXG5cdFx0XHR7XG5cdFx0XHRcdGNhc2UgJ2NuJzpcblx0XHRcdFx0XHRmbkljb252ID0gdHcyY25fbWluO1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRjYXNlICd0dyc6XG5cdFx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdFx0Zm5JY29udiA9IGNuMnR3X21pbjtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdH1cblxuXHRcdFx0YXdhaXQgQmx1ZWJpcmRcblx0XHRcdFx0LnJlc29sdmUoemlwLmZpbGUoL1xcLig/Ong/aHRtbD98dHh0KSQvKSlcblx0XHRcdFx0Lm1hcChhc3luYyAoemlwRmlsZSkgPT4ge1xuXG5cdFx0XHRcdFx0bGV0IGJ1ZiA9IGF3YWl0IHppcEZpbGVcblx0XHRcdFx0XHRcdC5hc3luYygnbm9kZWJ1ZmZlcicpXG5cdFx0XHRcdFx0XHQudGhlbihidWYgPT4gSUNPTlYuZW5jb2RlKGJ1ZiwgJ3V0ZjgnKSlcblx0XHRcdFx0XHRcdC50aGVuKGJ1ZiA9PiBCdWZmZXIuZnJvbShmbkljb252KGJ1Zi50b1N0cmluZygpKSkpXG5cdFx0XHRcdFx0O1xuXG5cdFx0XHRcdFx0cmV0dXJuIHppcC5maWxlKHppcEZpbGUubmFtZSwgYnVmLCB7XG5cdFx0XHRcdFx0XHRkYXRlOiB6aXBGaWxlLmRhdGUsXG5cdFx0XHRcdFx0XHRjcmVhdGVGb2xkZXJzOiBmYWxzZSxcblx0XHRcdFx0XHR9KVxuXHRcdFx0XHR9KVxuXHRcdFx0O1xuXG5cdFx0XHRyZXR1cm4gemlwO1xuXHRcdH0pXG5cdDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGhhbmRsZVppcEJ1ZmZlcih6aXBCdWZmZXI6IElUU1Jlc29sdmFibGU8QnVmZmVyPiwgb3B0aW9ucz86IElFcHViSWNvbnZPcHRpb25zKVxue1xuXHRyZXR1cm4gbG9hZFppcEJ1ZmZlcih6aXBCdWZmZXIpXG5cdFx0LnRoZW4oYnVmID0+IGhhbmRsZVppcE9iamVjdChidWYsIG9wdGlvbnMpKVxuXHRcdC50aGVuKHppcCA9PiB6aXAuZ2VuZXJhdGVBc3luYyh7XG5cdFx0XHR0eXBlOiAnbm9kZWJ1ZmZlcicsXG5cdFx0XHRtaW1lVHlwZTogJ2FwcGxpY2F0aW9uL2VwdWIremlwJyxcblx0XHRcdGNvbXByZXNzaW9uOiAnREVGTEFURScsXG5cdFx0XHRjb21wcmVzc2lvbk9wdGlvbnM6IHtcblx0XHRcdFx0bGV2ZWw6IDlcblx0XHRcdH0sXG5cdFx0fSkpXG5cdDtcbn1cbiJdfQ==