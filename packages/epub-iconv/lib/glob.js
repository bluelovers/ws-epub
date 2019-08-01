"use strict";
/**
 * Created by user on 2019/7/31.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const fast_glob_1 = require("@bluelovers/fast-glob");
const fs_1 = require("./fs");
const path = require("upath2");
const fs_extra_1 = require("fs-extra");
const debug_color2_1 = require("debug-color2");
const options_1 = require("./options");
const Bluebird = require("bluebird");
function handleGlob(pattern, options) {
    options = options || {};
    let { cwd = process.cwd(), showLog = true } = options;
    cwd = path.resolve(cwd);
    let { output = cwd } = options;
    options = options_1.handleOptions(options, {
        cwd,
        output: path.resolve(cwd, output),
        showLog,
    });
    ({ cwd, output } = options);
    const startTime = Date.now();
    return Bluebird.resolve(pattern)
        .then(pattern => options_1.handlePattern(pattern))
        .tap(pattern => {
        if (showLog) {
            debug_color2_1.console.dir({
                pattern,
                options,
            });
        }
    })
        .then(pattern => fast_glob_1.default.async(pattern, {
        cwd,
    }))
        .tap(ls => {
        if (!ls.length) {
            return Bluebird.reject(`沒有找到任何符合條件的 epub`);
        }
    })
        .map(file => {
        const fullpath = path.resolve(cwd, file);
        return Bluebird.props({
            root: cwd,
            file,
            fullpath,
            buffer: fs_1.handleZipFile(fullpath, options),
        })
            .then(async (ret) => {
            let output_path;
            let { name, ext } = path.parse(ret.file);
            let idx = 0;
            do {
                let padend = '';
                if (idx) {
                    padend = `_${idx}`;
                }
                output_path = path.join(output, name + padend + ext);
                idx++;
            } while (fs_extra_1.pathExistsSync(output_path));
            await fs_extra_1.outputFile(output_path, ret.buffer);
            if (showLog) {
                debug_color2_1.console.info(ret.file, `=>`, path.normalize(output_path));
            }
            return {
                ...ret,
                output_path,
            };
        });
    })
        .tap(ls => {
        if (showLog) {
            debug_color2_1.console.success(`處理完成，總共處理 ${ls.length} 檔案`, `費時`, Date.now() - startTime, 'ms');
        }
    });
}
exports.handleGlob = handleGlob;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2xvYi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImdsb2IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOztHQUVHOztBQUVILHFEQUE2QztBQUc3Qyw2QkFBcUM7QUFDckMsK0JBQStCO0FBQy9CLHVDQUFzRDtBQUN0RCwrQ0FBdUM7QUFDdkMsdUNBQXlEO0FBQ3pELHFDQUFzQztBQVN0QyxTQUFnQixVQUFVLENBQUMsT0FBK0MsRUFBRSxPQUErQjtJQUUxRyxPQUFPLEdBQUcsT0FBTyxJQUFJLEVBQUUsQ0FBQztJQUN4QixJQUFJLEVBQUUsR0FBRyxHQUFHLE9BQU8sQ0FBQyxHQUFHLEVBQUUsRUFBRSxPQUFPLEdBQUcsSUFBSSxFQUFFLEdBQUcsT0FBTyxDQUFDO0lBQ3RELEdBQUcsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ3hCLElBQUksRUFBRSxNQUFNLEdBQUcsR0FBRyxFQUFFLEdBQUcsT0FBTyxDQUFDO0lBRS9CLE9BQU8sR0FBRyx1QkFBYSxDQUFDLE9BQU8sRUFBRTtRQUNoQyxHQUFHO1FBQ0gsTUFBTSxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQztRQUNqQyxPQUFPO0tBQ1AsQ0FBQyxDQUFDO0lBRUgsQ0FBQyxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUUsR0FBRyxPQUFPLENBQUMsQ0FBQztJQUU1QixNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7SUFFN0IsT0FBTyxRQUFRLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQztTQUM5QixJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyx1QkFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1NBQ3ZDLEdBQUcsQ0FBQyxPQUFPLENBQUMsRUFBRTtRQUVkLElBQUksT0FBTyxFQUNYO1lBQ0Msc0JBQU8sQ0FBQyxHQUFHLENBQUM7Z0JBQ1gsT0FBTztnQkFDUCxPQUFPO2FBQ1AsQ0FBQyxDQUFDO1NBQ0g7SUFFRixDQUFDLENBQUM7U0FDRCxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxtQkFBUSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUU7UUFDeEMsR0FBRztLQUNILENBQUMsQ0FBQztTQUNGLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRTtRQUVULElBQUksQ0FBQyxFQUFFLENBQUMsTUFBTSxFQUNkO1lBQ0MsT0FBTyxRQUFRLENBQUMsTUFBTSxDQUFDLGtCQUFrQixDQUFDLENBQUE7U0FDMUM7SUFFRixDQUFDLENBQUM7U0FDRCxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUU7UUFDWCxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUV6QyxPQUFPLFFBQVEsQ0FBQyxLQUFLLENBQUM7WUFDckIsSUFBSSxFQUFFLEdBQUc7WUFDVCxJQUFJO1lBQ0osUUFBUTtZQUNSLE1BQU0sRUFBRSxrQkFBYSxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUM7U0FDeEMsQ0FBQzthQUNBLElBQUksQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFFLEVBQUU7WUFFbkIsSUFBSSxXQUFtQixDQUFDO1lBQ3hCLElBQUksRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7WUFFekMsSUFBSSxHQUFHLEdBQUcsQ0FBQyxDQUFDO1lBRVosR0FDQTtnQkFDQyxJQUFJLE1BQU0sR0FBVyxFQUFFLENBQUM7Z0JBRXhCLElBQUksR0FBRyxFQUNQO29CQUNDLE1BQU0sR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFDO2lCQUNuQjtnQkFFRCxXQUFXLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxHQUFHLE1BQU0sR0FBRyxHQUFHLENBQUMsQ0FBQztnQkFDckQsR0FBRyxFQUFFLENBQUM7YUFDTixRQUNNLHlCQUFjLENBQUMsV0FBVyxDQUFDLEVBQUU7WUFFcEMsTUFBTSxxQkFBVSxDQUFDLFdBQVcsRUFBRSxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7WUFFMUMsSUFBSSxPQUFPLEVBQ1g7Z0JBQ0Msc0JBQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFBO2FBQ3pEO1lBRUQsT0FBTztnQkFDTixHQUFHLEdBQUc7Z0JBQ04sV0FBVzthQUNYLENBQUE7UUFDRixDQUFDLENBQUMsQ0FDRDtJQUNILENBQUMsQ0FBQztTQUNELEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRTtRQUVULElBQUksT0FBTyxFQUNYO1lBQ0Msc0JBQU8sQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUFFLENBQUMsTUFBTSxLQUFLLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUE7U0FDaEY7SUFFRixDQUFDLENBQUMsQ0FDRjtBQUNGLENBQUM7QUE5RkQsZ0NBOEZDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDcmVhdGVkIGJ5IHVzZXIgb24gMjAxOS83LzMxLlxuICovXG5cbmltcG9ydCBGYXN0R2xvYiBmcm9tICdAYmx1ZWxvdmVycy9mYXN0LWdsb2InO1xuaW1wb3J0IHsgSVRTUmVzb2x2YWJsZSwgSVRTVmFsdWVPckFycmF5IH0gZnJvbSAndHMtdHlwZSc7XG5pbXBvcnQgeyBJRXB1Ykljb252T3B0aW9ucyB9IGZyb20gJy4vYnVmZmVyJztcbmltcG9ydCB7IGhhbmRsZVppcEZpbGUgfSBmcm9tICcuL2ZzJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAndXBhdGgyJztcbmltcG9ydCB7IG91dHB1dEZpbGUsIHBhdGhFeGlzdHNTeW5jIH0gZnJvbSAnZnMtZXh0cmEnO1xuaW1wb3J0IHsgY29uc29sZSB9IGZyb20gJ2RlYnVnLWNvbG9yMic7XG5pbXBvcnQgeyBoYW5kbGVPcHRpb25zLCBoYW5kbGVQYXR0ZXJuIH0gZnJvbSAnLi9vcHRpb25zJztcbmltcG9ydCBCbHVlYmlyZCA9IHJlcXVpcmUoJ2JsdWViaXJkJyk7XG5cbmV4cG9ydCBpbnRlcmZhY2UgSUVwdWJJY29udkdsb2JPcHRpb25zIGV4dGVuZHMgSUVwdWJJY29udk9wdGlvbnNcbntcblx0Y3dkPzogc3RyaW5nLFxuXHRvdXRwdXQ/OiBzdHJpbmcsXG5cdHNob3dMb2c/OiBib29sZWFuLFxufVxuXG5leHBvcnQgZnVuY3Rpb24gaGFuZGxlR2xvYihwYXR0ZXJuOiBJVFNSZXNvbHZhYmxlPElUU1ZhbHVlT3JBcnJheTxzdHJpbmc+Piwgb3B0aW9ucz86IElFcHViSWNvbnZHbG9iT3B0aW9ucylcbntcblx0b3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cdGxldCB7IGN3ZCA9IHByb2Nlc3MuY3dkKCksIHNob3dMb2cgPSB0cnVlIH0gPSBvcHRpb25zO1xuXHRjd2QgPSBwYXRoLnJlc29sdmUoY3dkKTtcblx0bGV0IHsgb3V0cHV0ID0gY3dkIH0gPSBvcHRpb25zO1xuXG5cdG9wdGlvbnMgPSBoYW5kbGVPcHRpb25zKG9wdGlvbnMsIHtcblx0XHRjd2QsXG5cdFx0b3V0cHV0OiBwYXRoLnJlc29sdmUoY3dkLCBvdXRwdXQpLFxuXHRcdHNob3dMb2csXG5cdH0pO1xuXG5cdCh7IGN3ZCwgb3V0cHV0IH0gPSBvcHRpb25zKTtcblxuXHRjb25zdCBzdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuXG5cdHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKHBhdHRlcm4pXG5cdFx0LnRoZW4ocGF0dGVybiA9PiBoYW5kbGVQYXR0ZXJuKHBhdHRlcm4pKVxuXHRcdC50YXAocGF0dGVybiA9PiB7XG5cblx0XHRcdGlmIChzaG93TG9nKVxuXHRcdFx0e1xuXHRcdFx0XHRjb25zb2xlLmRpcih7XG5cdFx0XHRcdFx0cGF0dGVybixcblx0XHRcdFx0XHRvcHRpb25zLFxuXHRcdFx0XHR9KTtcblx0XHRcdH1cblxuXHRcdH0pXG5cdFx0LnRoZW4ocGF0dGVybiA9PiBGYXN0R2xvYi5hc3luYyhwYXR0ZXJuLCB7XG5cdFx0XHRjd2QsXG5cdFx0fSkpXG5cdFx0LnRhcChscyA9PiB7XG5cblx0XHRcdGlmICghbHMubGVuZ3RoKVxuXHRcdFx0e1xuXHRcdFx0XHRyZXR1cm4gQmx1ZWJpcmQucmVqZWN0KGDmspLmnInmib7liLDku7vkvZXnrKblkIjmop3ku7bnmoQgZXB1YmApXG5cdFx0XHR9XG5cblx0XHR9KVxuXHRcdC5tYXAoZmlsZSA9PiB7XG5cdFx0XHRjb25zdCBmdWxscGF0aCA9IHBhdGgucmVzb2x2ZShjd2QsIGZpbGUpO1xuXG5cdFx0XHRyZXR1cm4gQmx1ZWJpcmQucHJvcHMoe1xuXHRcdFx0XHRyb290OiBjd2QsXG5cdFx0XHRcdGZpbGUsXG5cdFx0XHRcdGZ1bGxwYXRoLFxuXHRcdFx0XHRidWZmZXI6IGhhbmRsZVppcEZpbGUoZnVsbHBhdGgsIG9wdGlvbnMpLFxuXHRcdFx0fSlcblx0XHRcdFx0LnRoZW4oYXN5bmMgKHJldCkgPT4ge1xuXG5cdFx0XHRcdFx0bGV0IG91dHB1dF9wYXRoOiBzdHJpbmc7XG5cdFx0XHRcdFx0bGV0IHsgbmFtZSwgZXh0IH0gPSBwYXRoLnBhcnNlKHJldC5maWxlKTtcblxuXHRcdFx0XHRcdGxldCBpZHggPSAwO1xuXG5cdFx0XHRcdFx0ZG9cblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRsZXQgcGFkZW5kOiBzdHJpbmcgPSAnJztcblxuXHRcdFx0XHRcdFx0aWYgKGlkeClcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0cGFkZW5kID0gYF8ke2lkeH1gO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRvdXRwdXRfcGF0aCA9IHBhdGguam9pbihvdXRwdXQsIG5hbWUgKyBwYWRlbmQgKyBleHQpO1xuXHRcdFx0XHRcdFx0aWR4Kys7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHdoaWxlIChwYXRoRXhpc3RzU3luYyhvdXRwdXRfcGF0aCkpO1xuXG5cdFx0XHRcdFx0YXdhaXQgb3V0cHV0RmlsZShvdXRwdXRfcGF0aCwgcmV0LmJ1ZmZlcik7XG5cblx0XHRcdFx0XHRpZiAoc2hvd0xvZylcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRjb25zb2xlLmluZm8ocmV0LmZpbGUsIGA9PmAsIHBhdGgubm9ybWFsaXplKG91dHB1dF9wYXRoKSlcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdFx0Li4ucmV0LFxuXHRcdFx0XHRcdFx0b3V0cHV0X3BhdGgsXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KVxuXHRcdFx0XHQ7XG5cdFx0fSlcblx0XHQudGFwKGxzID0+IHtcblxuXHRcdFx0aWYgKHNob3dMb2cpXG5cdFx0XHR7XG5cdFx0XHRcdGNvbnNvbGUuc3VjY2Vzcyhg6JmV55CG5a6M5oiQ77yM57i95YWx6JmV55CGICR7bHMubGVuZ3RofSDmqpTmoYhgLCBg6LK75pmCYCwgRGF0ZS5ub3coKSAtIHN0YXJ0VGltZSwgJ21zJylcblx0XHRcdH1cblxuXHRcdH0pXG5cdDtcbn0iXX0=