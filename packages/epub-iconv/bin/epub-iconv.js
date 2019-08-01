#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const update_notifier_1 = require("@yarn-tool/update-notifier");
const yargs = require("yargs");
const glob_1 = require("../lib/glob");
const path = require("path");
const pkg = require("../package.json");
update_notifier_1.default(path.join(__dirname, '..'));
let argv = yargs
    .scriptName(pkg.name)
    .example(`epub-iconv --iconv cn *.epub`, ``)
    .option('cwd', {
    normalize: true,
    desc: `搜尋檔案時的基準資料夾`,
    default: process.cwd(),
})
    .option('output', {
    desc: `處理後的檔案輸出路徑`,
    requiresArg: true,
    string: true,
})
    .option('iconv', {
    desc: `cn 轉簡 tw 轉繁`,
    requiresArg: true,
    string: true,
})
    .option('showLog', {
    desc: `是否輸出訊息`,
    boolean: true,
    default: true,
})
    .showHelpOnFail(true)
    .version()
    .command('$0', `epub-iconv *.epub`, (yargs) => yargs, function (argv) {
    let options = {
        cwd: argv.cwd,
        output: argv.output,
        iconv: argv.iconv,
        showLog: argv.showLog,
    };
    let pattern = argv._;
    if (!pattern.length) {
        pattern = ['*.epub'];
    }
    return glob_1.handleGlob(pattern, options);
})
    .argv;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXB1Yi1pY29udi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImVwdWItaWNvbnYudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBRUEsZ0VBQXdEO0FBQ3hELCtCQUFnQztBQUNoQyxzQ0FBZ0U7QUFDaEUsNkJBQTZCO0FBRTdCLHVDQUF1QztBQUV2Qyx5QkFBYyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7QUFFM0MsSUFBSSxJQUFJLEdBQUcsS0FBSztLQUNkLFVBQVUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDO0tBQ3BCLE9BQU8sQ0FBQyw4QkFBOEIsRUFBRSxFQUFFLENBQUM7S0FDM0MsTUFBTSxDQUFDLEtBQUssRUFBRTtJQUNkLFNBQVMsRUFBRSxJQUFJO0lBQ2YsSUFBSSxFQUFFLGFBQWE7SUFDbkIsT0FBTyxFQUFFLE9BQU8sQ0FBQyxHQUFHLEVBQUU7Q0FDdEIsQ0FBQztLQUNELE1BQU0sQ0FBQyxRQUFRLEVBQUU7SUFDakIsSUFBSSxFQUFFLFlBQVk7SUFDbEIsV0FBVyxFQUFFLElBQUk7SUFDakIsTUFBTSxFQUFFLElBQUk7Q0FDWixDQUFDO0tBQ0QsTUFBTSxDQUFDLE9BQU8sRUFBRTtJQUNoQixJQUFJLEVBQUUsYUFBYTtJQUNuQixXQUFXLEVBQUUsSUFBSTtJQUNqQixNQUFNLEVBQUUsSUFBSTtDQUNaLENBQUM7S0FDRCxNQUFNLENBQUMsU0FBUyxFQUFFO0lBQ2xCLElBQUksRUFBRSxRQUFRO0lBQ2QsT0FBTyxFQUFFLElBQUk7SUFDYixPQUFPLEVBQUUsSUFBSTtDQUNiLENBQUM7S0FDRCxjQUFjLENBQUMsSUFBSSxDQUFDO0tBQ3BCLE9BQU8sRUFBRTtLQUNULE9BQU8sQ0FBQyxJQUFJLEVBQUUsbUJBQW1CLEVBQUUsQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLEtBQUssRUFBRyxVQUFVLElBQUk7SUFFcEUsSUFBSSxPQUFPLEdBQTBCO1FBQ3BDLEdBQUcsRUFBRSxJQUFJLENBQUMsR0FBRztRQUNiLE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTTtRQUNuQixLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQXVDO1FBQ25ELE9BQU8sRUFBRSxJQUFJLENBQUMsT0FBTztLQUNyQixDQUFDO0lBRUYsSUFBSSxPQUFPLEdBQWEsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUUvQixJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFDbkI7UUFDQyxPQUFPLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztLQUNyQjtJQUVELE9BQU8saUJBQVUsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFDckMsQ0FBQyxDQUFDO0tBQ0QsSUFBSSxDQUNMIiwic291cmNlc0NvbnRlbnQiOlsiIyEvdXNyL2Jpbi9lbnYgbm9kZVxuXG5pbXBvcnQgdXBkYXRlTm90aWZpZXIgZnJvbSAnQHlhcm4tdG9vbC91cGRhdGUtbm90aWZpZXInO1xuaW1wb3J0IHlhcmdzID0gcmVxdWlyZSgneWFyZ3MnKTtcbmltcG9ydCB7IGhhbmRsZUdsb2IsIElFcHViSWNvbnZHbG9iT3B0aW9ucyB9IGZyb20gJy4uL2xpYi9nbG9iJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBjb25zb2xlIH0gZnJvbSAnZGVidWctY29sb3IyJztcbmltcG9ydCAqIGFzIHBrZyBmcm9tICcuLi9wYWNrYWdlLmpzb24nO1xuXG51cGRhdGVOb3RpZmllcihwYXRoLmpvaW4oX19kaXJuYW1lLCAnLi4nKSk7XG5cbmxldCBhcmd2ID0geWFyZ3Ncblx0LnNjcmlwdE5hbWUocGtnLm5hbWUpXG5cdC5leGFtcGxlKGBlcHViLWljb252IC0taWNvbnYgY24gKi5lcHViYCwgYGApXG5cdC5vcHRpb24oJ2N3ZCcsIHtcblx0XHRub3JtYWxpemU6IHRydWUsXG5cdFx0ZGVzYzogYOaQnOWwi+aqlOahiOaZgueahOWfuua6luizh+aWmeWkvmAsXG5cdFx0ZGVmYXVsdDogcHJvY2Vzcy5jd2QoKSxcblx0fSlcblx0Lm9wdGlvbignb3V0cHV0Jywge1xuXHRcdGRlc2M6IGDomZXnkIblvoznmoTmqpTmoYjovLjlh7rot6/lvpFgLFxuXHRcdHJlcXVpcmVzQXJnOiB0cnVlLFxuXHRcdHN0cmluZzogdHJ1ZSxcblx0fSlcblx0Lm9wdGlvbignaWNvbnYnLCB7XG5cdFx0ZGVzYzogYGNuIOi9ieewoSB0dyDovYnnuYFgLFxuXHRcdHJlcXVpcmVzQXJnOiB0cnVlLFxuXHRcdHN0cmluZzogdHJ1ZSxcblx0fSlcblx0Lm9wdGlvbignc2hvd0xvZycsIHtcblx0XHRkZXNjOiBg5piv5ZCm6Ly45Ye66KiK5oGvYCxcblx0XHRib29sZWFuOiB0cnVlLFxuXHRcdGRlZmF1bHQ6IHRydWUsXG5cdH0pXG5cdC5zaG93SGVscE9uRmFpbCh0cnVlKVxuXHQudmVyc2lvbigpXG5cdC5jb21tYW5kKCckMCcsIGBlcHViLWljb252ICouZXB1YmAsICh5YXJncykgPT4geWFyZ3MsICBmdW5jdGlvbiAoYXJndilcblx0e1xuXHRcdGxldCBvcHRpb25zOiBJRXB1Ykljb252R2xvYk9wdGlvbnMgPSB7XG5cdFx0XHRjd2Q6IGFyZ3YuY3dkLFxuXHRcdFx0b3V0cHV0OiBhcmd2Lm91dHB1dCxcblx0XHRcdGljb252OiBhcmd2Lmljb252IGFzIElFcHViSWNvbnZHbG9iT3B0aW9uc1tcImljb252XCJdLFxuXHRcdFx0c2hvd0xvZzogYXJndi5zaG93TG9nLFxuXHRcdH07XG5cblx0XHRsZXQgcGF0dGVybjogc3RyaW5nW10gPSBhcmd2Ll87XG5cblx0XHRpZiAoIXBhdHRlcm4ubGVuZ3RoKVxuXHRcdHtcblx0XHRcdHBhdHRlcm4gPSBbJyouZXB1YiddO1xuXHRcdH1cblxuXHRcdHJldHVybiBoYW5kbGVHbG9iKHBhdHRlcm4sIG9wdGlvbnMpO1xuXHR9KVxuXHQuYXJndlxuO1xuIl19