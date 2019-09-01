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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVmZmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYnVmZmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7R0FFRzs7QUFFSCwrQkFBZ0M7QUFDaEMscUNBQXNDO0FBQ3RDLHFEQUFvQztBQUVwQyxxREFBbUU7QUFDbkUsMkRBQThFO0FBQzlFLHVDQUEwQztBQUUxQyxTQUFnQixhQUFhLENBQUMsU0FBZ0M7SUFFN0QsT0FBTyxRQUFRLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQztTQUNoQyxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQzlDO0FBQ0YsQ0FBQztBQUxELHNDQUtDO0FBYUQsU0FBZ0IsZUFBZSxDQUFDLEdBQXlCLEVBQUUsT0FBMkI7SUFFckYsT0FBTyxRQUFRLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQztTQUMxQixJQUFJLENBQUMsS0FBSyxFQUFFLEdBQUcsRUFBRSxFQUFFO1FBRW5CLElBQUksT0FBaUIsQ0FBQztRQUN0QixPQUFPLEdBQUcsdUJBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUVqQztZQUNDLElBQUksRUFBRSxFQUFFLEdBQUcsZUFBUyxFQUFFLEVBQUUsR0FBRyxlQUFTLEVBQUUsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDO1lBRXpELE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQztZQUN4QixPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUM7U0FDeEI7UUFBQSxDQUFDO1FBRUYsSUFBSSxPQUFPLENBQUMsT0FBTyxJQUFJLE9BQU8sQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUNyRDtZQUNDLE9BQU8sR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztTQUN6QzthQUVEO1lBQ0MsUUFBUSxPQUFPLENBQUMsS0FBSyxFQUNyQjtnQkFDQyxLQUFLLElBQUk7b0JBQ1IsT0FBTyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxJQUFJLGVBQVMsQ0FBQztvQkFDMUMsTUFBTTtnQkFDUCxLQUFLLElBQUksQ0FBQztnQkFDVjtvQkFDQyxPQUFPLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLElBQUksZUFBUyxDQUFDO29CQUMxQyxNQUFNO2FBQ1A7U0FDRDtRQUVELE1BQU0sUUFBUTthQUNaLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLENBQUM7YUFDdkMsR0FBRyxDQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUsRUFBRTtZQUV0QixJQUFJLEdBQUcsR0FBRyxNQUFNLE9BQU87aUJBQ3JCLEtBQUssQ0FBQyxZQUFZLENBQUM7aUJBQ25CLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLHlCQUFLLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsQ0FBQztpQkFDdEMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDO2lCQUNwQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQzlCO1lBRUQsT0FBTyxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFO2dCQUNsQyxJQUFJLEVBQUUsT0FBTyxDQUFDLElBQUk7Z0JBQ2xCLGFBQWEsRUFBRSxLQUFLO2FBQ3BCLENBQUMsQ0FBQTtRQUNILENBQUMsQ0FBQyxDQUNGO1FBRUQsT0FBTyxHQUFHLENBQUM7SUFDWixDQUFDLENBQUMsQ0FDRjtBQUNGLENBQUM7QUF0REQsMENBc0RDO0FBRUQsU0FBZ0IsZUFBZSxDQUFDLFNBQWdDLEVBQUUsT0FBMkI7SUFFNUYsT0FBTyxhQUFhLENBQUMsU0FBUyxDQUFDO1NBQzdCLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLGVBQWUsQ0FBQyxHQUFHLEVBQUUsT0FBTyxDQUFDLENBQUM7U0FDMUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxtQ0FBMkIsRUFBRSxDQUFDLENBQUMsQ0FDOUQ7QUFDRixDQUFDO0FBTkQsMENBTUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENyZWF0ZWQgYnkgdXNlciBvbiAyMDE5LzcvMzEuXG4gKi9cblxuaW1wb3J0IEpTWmlwID0gcmVxdWlyZSgnanN6aXAnKTtcbmltcG9ydCBCbHVlYmlyZCA9IHJlcXVpcmUoJ2JsdWViaXJkJyk7XG5pbXBvcnQgSUNPTlYgZnJvbSAnaWNvbnYtanNjaGFyZGV0JztcbmltcG9ydCB7IElUU1Jlc29sdmFibGUgfSBmcm9tICd0cy10eXBlJztcbmltcG9ydCB7IGNuMnR3X21pbiwgdHcyY25fbWluIH0gZnJvbSAnY2prLWNvbnYvbGliL3poL2NvbnZlcnQvbWluJztcbmltcG9ydCB7IGNyZWF0ZUpTWmlwR2VuZXJhdG9yT3B0aW9ucyB9IGZyb20gJ0Bub2RlLW5vdmVsL2VwdWItdXRpbC9saWIvY29uc3QnO1xuaW1wb3J0IHsgaGFuZGxlT3B0aW9ucyB9IGZyb20gJy4vb3B0aW9ucyc7XG5cbmV4cG9ydCBmdW5jdGlvbiBsb2FkWmlwQnVmZmVyKHppcEJ1ZmZlcjogSVRTUmVzb2x2YWJsZTxCdWZmZXI+KVxue1xuXHRyZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSh6aXBCdWZmZXIpXG5cdFx0LnRoZW4oemlwQnVmZmVyID0+IEpTWmlwLmxvYWRBc3luYyh6aXBCdWZmZXIpKVxuXHQ7XG59XG5cbmV4cG9ydCB0eXBlIElJY29udkZuID0gKChpbnB1dDogc3RyaW5nKSA9PiBJVFNSZXNvbHZhYmxlPHN0cmluZz4pIHwgdHlwZW9mIGNuMnR3X21pbiB8IHR5cGVvZiB0dzJjbl9taW47XG5cbmV4cG9ydCBpbnRlcmZhY2UgSUVwdWJJY29udk9wdGlvbnNcbntcblx0aWNvbnY/OiAnY24nIHwgJ3R3Jztcblx0aWNvbnZGbj86IHtcblx0XHQnY24nPzogSUljb252Rm4sXG5cdFx0J3R3Jz86IElJY29udkZuLFxuXHR9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBoYW5kbGVaaXBPYmplY3QoemlwOiBJVFNSZXNvbHZhYmxlPEpTWmlwPiwgb3B0aW9ucz86IElFcHViSWNvbnZPcHRpb25zKVxue1xuXHRyZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSh6aXApXG5cdFx0LnRoZW4oYXN5bmMgKHppcCkgPT4ge1xuXG5cdFx0XHRsZXQgZm5JY29udjogSUljb252Rm47XG5cdFx0XHRvcHRpb25zID0gaGFuZGxlT3B0aW9ucyhvcHRpb25zKTtcblxuXHRcdFx0e1xuXHRcdFx0XHRsZXQgeyB0dyA9IGNuMnR3X21pbiwgY24gPSB0dzJjbl9taW4gfSA9IG9wdGlvbnMuaWNvbnZGbjtcblxuXHRcdFx0XHRvcHRpb25zLmljb252Rm4udHcgPSB0dztcblx0XHRcdFx0b3B0aW9ucy5pY29udkZuLmNuID0gY247XG5cdFx0XHR9O1xuXG5cdFx0XHRpZiAob3B0aW9ucy5pY29udkZuICYmIG9wdGlvbnMuaWNvbnZGbltvcHRpb25zLmljb252XSlcblx0XHRcdHtcblx0XHRcdFx0Zm5JY29udiA9IG9wdGlvbnMuaWNvbnZGbltvcHRpb25zLmljb252XTtcblx0XHRcdH1cblx0XHRcdGVsc2Vcblx0XHRcdHtcblx0XHRcdFx0c3dpdGNoIChvcHRpb25zLmljb252KVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0Y2FzZSAnY24nOlxuXHRcdFx0XHRcdFx0Zm5JY29udiA9IG9wdGlvbnMuaWNvbnZGbi5jbiB8fCB0dzJjbl9taW47XG5cdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRjYXNlICd0dyc6XG5cdFx0XHRcdFx0ZGVmYXVsdDpcblx0XHRcdFx0XHRcdGZuSWNvbnYgPSBvcHRpb25zLmljb252Rm4udHcgfHwgY24ydHdfbWluO1xuXHRcdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0YXdhaXQgQmx1ZWJpcmRcblx0XHRcdFx0LnJlc29sdmUoemlwLmZpbGUoL1xcLig/Ong/aHRtbD98dHh0KSQvKSlcblx0XHRcdFx0Lm1hcChhc3luYyAoemlwRmlsZSkgPT4ge1xuXG5cdFx0XHRcdFx0bGV0IGJ1ZiA9IGF3YWl0IHppcEZpbGVcblx0XHRcdFx0XHRcdC5hc3luYygnbm9kZWJ1ZmZlcicpXG5cdFx0XHRcdFx0XHQudGhlbihidWYgPT4gSUNPTlYuZW5jb2RlKGJ1ZiwgJ3V0ZjgnKSlcblx0XHRcdFx0XHRcdC50aGVuKGJ1ZiA9PiBmbkljb252KGJ1Zi50b1N0cmluZygpKSlcblx0XHRcdFx0XHRcdC50aGVuKGJ1ZiA9PiBCdWZmZXIuZnJvbShidWYpKVxuXHRcdFx0XHRcdDtcblxuXHRcdFx0XHRcdHJldHVybiB6aXAuZmlsZSh6aXBGaWxlLm5hbWUsIGJ1Ziwge1xuXHRcdFx0XHRcdFx0ZGF0ZTogemlwRmlsZS5kYXRlLFxuXHRcdFx0XHRcdFx0Y3JlYXRlRm9sZGVyczogZmFsc2UsXG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0fSlcblx0XHRcdDtcblxuXHRcdFx0cmV0dXJuIHppcDtcblx0XHR9KVxuXHQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBoYW5kbGVaaXBCdWZmZXIoemlwQnVmZmVyOiBJVFNSZXNvbHZhYmxlPEJ1ZmZlcj4sIG9wdGlvbnM/OiBJRXB1Ykljb252T3B0aW9ucylcbntcblx0cmV0dXJuIGxvYWRaaXBCdWZmZXIoemlwQnVmZmVyKVxuXHRcdC50aGVuKGJ1ZiA9PiBoYW5kbGVaaXBPYmplY3QoYnVmLCBvcHRpb25zKSlcblx0XHQudGhlbih6aXAgPT4gemlwLmdlbmVyYXRlQXN5bmMoY3JlYXRlSlNaaXBHZW5lcmF0b3JPcHRpb25zKCkpKVxuXHQ7XG59XG5cbiJdfQ==