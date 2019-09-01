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
        {
            options.iconvFn = options.iconvFn || {};
            let { tw = min_1.cn2tw_min, cn = min_1.tw2cn_min } = options.iconvFn;
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
                    fnIconv = options.iconvFn.tw || min_1.cn2tw_min;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVmZmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYnVmZmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7R0FFRzs7QUFFSCwrQkFBZ0M7QUFDaEMscUNBQXNDO0FBQ3RDLHFEQUFvQztBQUVwQyxxREFBbUU7QUFDbkUsMkRBQThFO0FBQzlFLHVDQUEwQztBQUUxQyxTQUFnQixhQUFhLENBQUMsU0FBZ0M7SUFFN0QsT0FBTyxRQUFRLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQztTQUNoQyxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQzlDO0FBQ0YsQ0FBQztBQUxELHNDQUtDO0FBYUQsU0FBZ0IsZUFBZSxDQUFDLEdBQXlCLEVBQUUsT0FBMkI7SUFFckYsT0FBTyxRQUFRLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQztTQUMxQixJQUFJLENBQUMsS0FBSyxFQUFFLEdBQUcsRUFBRSxFQUFFO1FBRW5CLElBQUksT0FBaUIsQ0FBQztRQUN0QixPQUFPLEdBQUcsdUJBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUVqQztZQUNDLE9BQU8sQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDLE9BQU8sSUFBSSxFQUFFLENBQUM7WUFFeEMsSUFBSSxFQUFFLEVBQUUsR0FBRyxlQUFTLEVBQUUsRUFBRSxHQUFHLGVBQVMsRUFBRSxHQUFHLE9BQVEsQ0FBQyxPQUFPLENBQUM7WUFFMUQsT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDO1lBQ3hCLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQztTQUN4QjtRQUFBLENBQUM7UUFFRixJQUFJLE9BQU8sQ0FBQyxPQUFPLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQ3JEO1lBQ0MsT0FBTyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQ3pDO2FBRUQ7WUFDQyxRQUFRLE9BQU8sQ0FBQyxLQUFLLEVBQ3JCO2dCQUNDLEtBQUssSUFBSTtvQkFDUixPQUFPLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLElBQUksZUFBUyxDQUFDO29CQUMxQyxNQUFNO2dCQUNQLEtBQUssSUFBSSxDQUFDO2dCQUNWO29CQUNDLE9BQU8sR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUUsSUFBSSxlQUFTLENBQUM7b0JBQzFDLE1BQU07YUFDUDtTQUNEO1FBRUQsTUFBTSxRQUFRO2FBQ1osT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsQ0FBQzthQUN2QyxHQUFHLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxFQUFFO1lBRXRCLElBQUksR0FBRyxHQUFHLE1BQU0sT0FBTztpQkFDckIsS0FBSyxDQUFDLFlBQVksQ0FBQztpQkFDbkIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMseUJBQUssQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxDQUFDO2lCQUN0QyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7aUJBQ3BDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FDOUI7WUFFRCxPQUFPLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUU7Z0JBQ2xDLElBQUksRUFBRSxPQUFPLENBQUMsSUFBSTtnQkFDbEIsYUFBYSxFQUFFLEtBQUs7YUFDcEIsQ0FBQyxDQUFBO1FBQ0gsQ0FBQyxDQUFDLENBQ0Y7UUFFRCxPQUFPLEdBQUcsQ0FBQztJQUNaLENBQUMsQ0FBQyxDQUNGO0FBQ0YsQ0FBQztBQXhERCwwQ0F3REM7QUFFRCxTQUFnQixlQUFlLENBQUMsU0FBZ0MsRUFBRSxPQUEyQjtJQUU1RixPQUFPLGFBQWEsQ0FBQyxTQUFTLENBQUM7U0FDN0IsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsZUFBZSxDQUFDLEdBQUcsRUFBRSxPQUFPLENBQUMsQ0FBQztTQUMxQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLG1DQUEyQixFQUFFLENBQUMsQ0FBQyxDQUM5RDtBQUNGLENBQUM7QUFORCwwQ0FNQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ3JlYXRlZCBieSB1c2VyIG9uIDIwMTkvNy8zMS5cbiAqL1xuXG5pbXBvcnQgSlNaaXAgPSByZXF1aXJlKCdqc3ppcCcpO1xuaW1wb3J0IEJsdWViaXJkID0gcmVxdWlyZSgnYmx1ZWJpcmQnKTtcbmltcG9ydCBJQ09OViBmcm9tICdpY29udi1qc2NoYXJkZXQnO1xuaW1wb3J0IHsgSVRTUmVzb2x2YWJsZSB9IGZyb20gJ3RzLXR5cGUnO1xuaW1wb3J0IHsgY24ydHdfbWluLCB0dzJjbl9taW4gfSBmcm9tICdjamstY29udi9saWIvemgvY29udmVydC9taW4nO1xuaW1wb3J0IHsgY3JlYXRlSlNaaXBHZW5lcmF0b3JPcHRpb25zIH0gZnJvbSAnQG5vZGUtbm92ZWwvZXB1Yi11dGlsL2xpYi9jb25zdCc7XG5pbXBvcnQgeyBoYW5kbGVPcHRpb25zIH0gZnJvbSAnLi9vcHRpb25zJztcblxuZXhwb3J0IGZ1bmN0aW9uIGxvYWRaaXBCdWZmZXIoemlwQnVmZmVyOiBJVFNSZXNvbHZhYmxlPEJ1ZmZlcj4pXG57XG5cdHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKHppcEJ1ZmZlcilcblx0XHQudGhlbih6aXBCdWZmZXIgPT4gSlNaaXAubG9hZEFzeW5jKHppcEJ1ZmZlcikpXG5cdDtcbn1cblxuZXhwb3J0IHR5cGUgSUljb252Rm4gPSAoKGlucHV0OiBzdHJpbmcpID0+IElUU1Jlc29sdmFibGU8c3RyaW5nPikgfCB0eXBlb2YgY24ydHdfbWluIHwgdHlwZW9mIHR3MmNuX21pbjtcblxuZXhwb3J0IGludGVyZmFjZSBJRXB1Ykljb252T3B0aW9uc1xue1xuXHRpY29udj86ICdjbicgfCAndHcnO1xuXHRpY29udkZuPzoge1xuXHRcdCdjbic/OiBJSWNvbnZGbixcblx0XHQndHcnPzogSUljb252Rm4sXG5cdH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGhhbmRsZVppcE9iamVjdCh6aXA6IElUU1Jlc29sdmFibGU8SlNaaXA+LCBvcHRpb25zPzogSUVwdWJJY29udk9wdGlvbnMpXG57XG5cdHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKHppcClcblx0XHQudGhlbihhc3luYyAoemlwKSA9PiB7XG5cblx0XHRcdGxldCBmbkljb252OiBJSWNvbnZGbjtcblx0XHRcdG9wdGlvbnMgPSBoYW5kbGVPcHRpb25zKG9wdGlvbnMpO1xuXG5cdFx0XHR7XG5cdFx0XHRcdG9wdGlvbnMuaWNvbnZGbiA9IG9wdGlvbnMuaWNvbnZGbiB8fCB7fTtcblxuXHRcdFx0XHRsZXQgeyB0dyA9IGNuMnR3X21pbiwgY24gPSB0dzJjbl9taW4gfSA9IG9wdGlvbnMhLmljb252Rm47XG5cblx0XHRcdFx0b3B0aW9ucy5pY29udkZuLnR3ID0gdHc7XG5cdFx0XHRcdG9wdGlvbnMuaWNvbnZGbi5jbiA9IGNuO1xuXHRcdFx0fTtcblxuXHRcdFx0aWYgKG9wdGlvbnMuaWNvbnZGbiAmJiBvcHRpb25zLmljb252Rm5bb3B0aW9ucy5pY29udl0pXG5cdFx0XHR7XG5cdFx0XHRcdGZuSWNvbnYgPSBvcHRpb25zLmljb252Rm5bb3B0aW9ucy5pY29udl07XG5cdFx0XHR9XG5cdFx0XHRlbHNlXG5cdFx0XHR7XG5cdFx0XHRcdHN3aXRjaCAob3B0aW9ucy5pY29udilcblx0XHRcdFx0e1xuXHRcdFx0XHRcdGNhc2UgJ2NuJzpcblx0XHRcdFx0XHRcdGZuSWNvbnYgPSBvcHRpb25zLmljb252Rm4uY24gfHwgdHcyY25fbWluO1xuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdFx0Y2FzZSAndHcnOlxuXHRcdFx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdFx0XHRmbkljb252ID0gb3B0aW9ucy5pY29udkZuLnR3IHx8IGNuMnR3X21pbjtcblx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdGF3YWl0IEJsdWViaXJkXG5cdFx0XHRcdC5yZXNvbHZlKHppcC5maWxlKC9cXC4oPzp4P2h0bWw/fHR4dCkkLykpXG5cdFx0XHRcdC5tYXAoYXN5bmMgKHppcEZpbGUpID0+IHtcblxuXHRcdFx0XHRcdGxldCBidWYgPSBhd2FpdCB6aXBGaWxlXG5cdFx0XHRcdFx0XHQuYXN5bmMoJ25vZGVidWZmZXInKVxuXHRcdFx0XHRcdFx0LnRoZW4oYnVmID0+IElDT05WLmVuY29kZShidWYsICd1dGY4JykpXG5cdFx0XHRcdFx0XHQudGhlbihidWYgPT4gZm5JY29udihidWYudG9TdHJpbmcoKSkpXG5cdFx0XHRcdFx0XHQudGhlbihidWYgPT4gQnVmZmVyLmZyb20oYnVmKSlcblx0XHRcdFx0XHQ7XG5cblx0XHRcdFx0XHRyZXR1cm4gemlwLmZpbGUoemlwRmlsZS5uYW1lLCBidWYsIHtcblx0XHRcdFx0XHRcdGRhdGU6IHppcEZpbGUuZGF0ZSxcblx0XHRcdFx0XHRcdGNyZWF0ZUZvbGRlcnM6IGZhbHNlLFxuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdH0pXG5cdFx0XHQ7XG5cblx0XHRcdHJldHVybiB6aXA7XG5cdFx0fSlcblx0O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaGFuZGxlWmlwQnVmZmVyKHppcEJ1ZmZlcjogSVRTUmVzb2x2YWJsZTxCdWZmZXI+LCBvcHRpb25zPzogSUVwdWJJY29udk9wdGlvbnMpXG57XG5cdHJldHVybiBsb2FkWmlwQnVmZmVyKHppcEJ1ZmZlcilcblx0XHQudGhlbihidWYgPT4gaGFuZGxlWmlwT2JqZWN0KGJ1Ziwgb3B0aW9ucykpXG5cdFx0LnRoZW4oemlwID0+IHppcC5nZW5lcmF0ZUFzeW5jKGNyZWF0ZUpTWmlwR2VuZXJhdG9yT3B0aW9ucygpKSlcblx0O1xufVxuXG4iXX0=