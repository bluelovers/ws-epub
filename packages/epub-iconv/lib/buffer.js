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
function cn2tw_min(input) {
    return min_1.cn2tw_min(input, {
        safe: false
    });
}
function handleZipObject(zip, options) {
    return Bluebird.resolve(zip)
        .then(async (zip) => {
        let fnIconv;
        options = options_1.handleOptions(options);
        {
            options.iconvFn = options.iconvFn || {};
            let { tw = cn2tw_min, cn = min_1.tw2cn_min } = options.iconvFn;
            options.iconvFn.tw = tw;
            options.iconvFn.cn = cn;
        }
        ;
        if (options.iconvFn && options.iconvFn[options.iconv]) {
            fnIconv = options.iconvFn[options.iconv];
        }
        else {
            switch (options.iconv) {
                case 'cn':
                    fnIconv = options.iconvFn.cn || min_1.tw2cn_min;
                    break;
                case 'tw':
                default:
                    fnIconv = options.iconvFn.tw || cn2tw_min;
                    break;
            }
        }
        await Bluebird
            .resolve(zip.file(/\.(?:x?html?|txt)$/))
            .map(async (zipFile) => {
            let buf = await zipFile
                .async('nodebuffer')
                .then(buf => iconv_jschardet_1.default.encode(buf, 'utf8'))
                .then(buf => fnIconv(buf.toString()))
                .then(buf => Buffer.from(buf));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVmZmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYnVmZmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7R0FFRzs7QUFFSCwrQkFBZ0M7QUFDaEMscUNBQXNDO0FBQ3RDLHFEQUFvQztBQUVwQyxxREFBaUY7QUFDakYsMkRBQThFO0FBQzlFLHVDQUEwQztBQUUxQyxTQUFnQixhQUFhLENBQUMsU0FBZ0M7SUFFN0QsT0FBTyxRQUFRLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQztTQUNoQyxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQzlDO0FBQ0YsQ0FBQztBQUxELHNDQUtDO0FBRUQsU0FBUyxTQUFTLENBQUMsS0FBYTtJQUUvQixPQUFPLGVBQVUsQ0FBQyxLQUFLLEVBQUU7UUFDeEIsSUFBSSxFQUFFLEtBQUs7S0FDWCxDQUFDLENBQUE7QUFDSCxDQUFDO0FBYUQsU0FBZ0IsZUFBZSxDQUFDLEdBQXlCLEVBQUUsT0FBMkI7SUFFckYsT0FBTyxRQUFRLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQztTQUMxQixJQUFJLENBQUMsS0FBSyxFQUFFLEdBQUcsRUFBRSxFQUFFO1FBRW5CLElBQUksT0FBaUIsQ0FBQztRQUN0QixPQUFPLEdBQUcsdUJBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUVqQztZQUNDLE9BQU8sQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDLE9BQU8sSUFBSSxFQUFFLENBQUM7WUFFeEMsSUFBSSxFQUFFLEVBQUUsR0FBRyxTQUFTLEVBQUUsRUFBRSxHQUFHLGVBQVMsRUFBRSxHQUFHLE9BQVEsQ0FBQyxPQUFPLENBQUM7WUFFMUQsT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDO1lBQ3hCLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQztTQUN4QjtRQUFBLENBQUM7UUFFRixJQUFJLE9BQU8sQ0FBQyxPQUFPLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQ3JEO1lBQ0MsT0FBTyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQ3pDO2FBRUQ7WUFDQyxRQUFRLE9BQU8sQ0FBQyxLQUFLLEVBQ3JCO2dCQUNDLEtBQUssSUFBSTtvQkFDUixPQUFPLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLElBQUksZUFBUyxDQUFDO29CQUMxQyxNQUFNO2dCQUNQLEtBQUssSUFBSSxDQUFDO2dCQUNWO29CQUNDLE9BQU8sR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUUsSUFBSSxTQUFTLENBQUM7b0JBQzFDLE1BQU07YUFDUDtTQUNEO1FBRUQsTUFBTSxRQUFRO2FBQ1osT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsQ0FBQzthQUN2QyxHQUFHLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxFQUFFO1lBRXRCLElBQUksR0FBRyxHQUFHLE1BQU0sT0FBTztpQkFDckIsS0FBSyxDQUFDLFlBQVksQ0FBQztpQkFDbkIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMseUJBQUssQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxDQUFDO2lCQUN0QyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7aUJBQ3BDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FDOUI7WUFFRCxPQUFPLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUU7Z0JBQ2xDLElBQUksRUFBRSxPQUFPLENBQUMsSUFBSTtnQkFDbEIsYUFBYSxFQUFFLEtBQUs7YUFDcEIsQ0FBQyxDQUFBO1FBQ0gsQ0FBQyxDQUFDLENBQ0Y7UUFFRCxPQUFPLEdBQUcsQ0FBQztJQUNaLENBQUMsQ0FBQyxDQUNGO0FBQ0YsQ0FBQztBQXhERCwwQ0F3REM7QUFFRCxTQUFnQixlQUFlLENBQUMsU0FBZ0MsRUFBRSxPQUEyQjtJQUU1RixPQUFPLGFBQWEsQ0FBQyxTQUFTLENBQUM7U0FDN0IsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsZUFBZSxDQUFDLEdBQUcsRUFBRSxPQUFPLENBQUMsQ0FBQztTQUMxQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLG1DQUEyQixFQUFFLENBQUMsQ0FBQyxDQUM5RDtBQUNGLENBQUM7QUFORCwwQ0FNQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ3JlYXRlZCBieSB1c2VyIG9uIDIwMTkvNy8zMS5cbiAqL1xuXG5pbXBvcnQgSlNaaXAgPSByZXF1aXJlKCdqc3ppcCcpO1xuaW1wb3J0IEJsdWViaXJkID0gcmVxdWlyZSgnYmx1ZWJpcmQnKTtcbmltcG9ydCBJQ09OViBmcm9tICdpY29udi1qc2NoYXJkZXQnO1xuaW1wb3J0IHsgSVRTUmVzb2x2YWJsZSB9IGZyb20gJ3RzLXR5cGUnO1xuaW1wb3J0IHsgY24ydHdfbWluIGFzIF9jbjJ0d19taW4sIHR3MmNuX21pbiB9IGZyb20gJ2Nqay1jb252L2xpYi96aC9jb252ZXJ0L21pbic7XG5pbXBvcnQgeyBjcmVhdGVKU1ppcEdlbmVyYXRvck9wdGlvbnMgfSBmcm9tICdAbm9kZS1ub3ZlbC9lcHViLXV0aWwvbGliL2NvbnN0JztcbmltcG9ydCB7IGhhbmRsZU9wdGlvbnMgfSBmcm9tICcuL29wdGlvbnMnO1xuXG5leHBvcnQgZnVuY3Rpb24gbG9hZFppcEJ1ZmZlcih6aXBCdWZmZXI6IElUU1Jlc29sdmFibGU8QnVmZmVyPilcbntcblx0cmV0dXJuIEJsdWViaXJkLnJlc29sdmUoemlwQnVmZmVyKVxuXHRcdC50aGVuKHppcEJ1ZmZlciA9PiBKU1ppcC5sb2FkQXN5bmMoemlwQnVmZmVyKSlcblx0O1xufVxuXG5mdW5jdGlvbiBjbjJ0d19taW4oaW5wdXQ6IHN0cmluZyk6IHN0cmluZ1xue1xuXHRyZXR1cm4gX2NuMnR3X21pbihpbnB1dCwge1xuXHRcdHNhZmU6IGZhbHNlXG5cdH0pXG59XG5cbmV4cG9ydCB0eXBlIElJY29udkZuID0gKChpbnB1dDogc3RyaW5nKSA9PiBJVFNSZXNvbHZhYmxlPHN0cmluZz4pIHwgdHlwZW9mIGNuMnR3X21pbiB8IHR5cGVvZiB0dzJjbl9taW47XG5cbmV4cG9ydCBpbnRlcmZhY2UgSUVwdWJJY29udk9wdGlvbnNcbntcblx0aWNvbnY/OiAnY24nIHwgJ3R3Jztcblx0aWNvbnZGbj86IHtcblx0XHQnY24nPzogSUljb252Rm4sXG5cdFx0J3R3Jz86IElJY29udkZuLFxuXHR9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBoYW5kbGVaaXBPYmplY3QoemlwOiBJVFNSZXNvbHZhYmxlPEpTWmlwPiwgb3B0aW9ucz86IElFcHViSWNvbnZPcHRpb25zKVxue1xuXHRyZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSh6aXApXG5cdFx0LnRoZW4oYXN5bmMgKHppcCkgPT4ge1xuXG5cdFx0XHRsZXQgZm5JY29udjogSUljb252Rm47XG5cdFx0XHRvcHRpb25zID0gaGFuZGxlT3B0aW9ucyhvcHRpb25zKTtcblxuXHRcdFx0e1xuXHRcdFx0XHRvcHRpb25zLmljb252Rm4gPSBvcHRpb25zLmljb252Rm4gfHwge307XG5cblx0XHRcdFx0bGV0IHsgdHcgPSBjbjJ0d19taW4sIGNuID0gdHcyY25fbWluIH0gPSBvcHRpb25zIS5pY29udkZuO1xuXG5cdFx0XHRcdG9wdGlvbnMuaWNvbnZGbi50dyA9IHR3O1xuXHRcdFx0XHRvcHRpb25zLmljb252Rm4uY24gPSBjbjtcblx0XHRcdH07XG5cblx0XHRcdGlmIChvcHRpb25zLmljb252Rm4gJiYgb3B0aW9ucy5pY29udkZuW29wdGlvbnMuaWNvbnZdKVxuXHRcdFx0e1xuXHRcdFx0XHRmbkljb252ID0gb3B0aW9ucy5pY29udkZuW29wdGlvbnMuaWNvbnZdO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZVxuXHRcdFx0e1xuXHRcdFx0XHRzd2l0Y2ggKG9wdGlvbnMuaWNvbnYpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRjYXNlICdjbic6XG5cdFx0XHRcdFx0XHRmbkljb252ID0gb3B0aW9ucy5pY29udkZuLmNuIHx8IHR3MmNuX21pbjtcblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdGNhc2UgJ3R3Jzpcblx0XHRcdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHRcdFx0Zm5JY29udiA9IG9wdGlvbnMuaWNvbnZGbi50dyB8fCBjbjJ0d19taW47XG5cdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRhd2FpdCBCbHVlYmlyZFxuXHRcdFx0XHQucmVzb2x2ZSh6aXAuZmlsZSgvXFwuKD86eD9odG1sP3x0eHQpJC8pKVxuXHRcdFx0XHQubWFwKGFzeW5jICh6aXBGaWxlKSA9PiB7XG5cblx0XHRcdFx0XHRsZXQgYnVmID0gYXdhaXQgemlwRmlsZVxuXHRcdFx0XHRcdFx0LmFzeW5jKCdub2RlYnVmZmVyJylcblx0XHRcdFx0XHRcdC50aGVuKGJ1ZiA9PiBJQ09OVi5lbmNvZGUoYnVmLCAndXRmOCcpKVxuXHRcdFx0XHRcdFx0LnRoZW4oYnVmID0+IGZuSWNvbnYoYnVmLnRvU3RyaW5nKCkpKVxuXHRcdFx0XHRcdFx0LnRoZW4oYnVmID0+IEJ1ZmZlci5mcm9tKGJ1ZikpXG5cdFx0XHRcdFx0O1xuXG5cdFx0XHRcdFx0cmV0dXJuIHppcC5maWxlKHppcEZpbGUubmFtZSwgYnVmLCB7XG5cdFx0XHRcdFx0XHRkYXRlOiB6aXBGaWxlLmRhdGUsXG5cdFx0XHRcdFx0XHRjcmVhdGVGb2xkZXJzOiBmYWxzZSxcblx0XHRcdFx0XHR9KVxuXHRcdFx0XHR9KVxuXHRcdFx0O1xuXG5cdFx0XHRyZXR1cm4gemlwO1xuXHRcdH0pXG5cdDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGhhbmRsZVppcEJ1ZmZlcih6aXBCdWZmZXI6IElUU1Jlc29sdmFibGU8QnVmZmVyPiwgb3B0aW9ucz86IElFcHViSWNvbnZPcHRpb25zKVxue1xuXHRyZXR1cm4gbG9hZFppcEJ1ZmZlcih6aXBCdWZmZXIpXG5cdFx0LnRoZW4oYnVmID0+IGhhbmRsZVppcE9iamVjdChidWYsIG9wdGlvbnMpKVxuXHRcdC50aGVuKHppcCA9PiB6aXAuZ2VuZXJhdGVBc3luYyhjcmVhdGVKU1ppcEdlbmVyYXRvck9wdGlvbnMoKSkpXG5cdDtcbn1cblxuIl19