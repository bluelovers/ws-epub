#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const update_notifier_1 = require("@yarn-tool/update-notifier");
const yargs = require("yargs");
const glob_1 = require("../lib/glob");
const path = require("path");
const debug_color2_1 = require("debug-color2");
const pkg = require("../package.json");
update_notifier_1.default(path.join(__dirname, '..'));
let argv = yargs
    .scriptName(pkg.name)
    .example(`epub-iconv --iconv cn *.epub`, ``)
    .option('cwd', {
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
    debug_color2_1.console.dir({
        pattern,
        options,
    });
    return glob_1.handleGlob(pattern, options);
})
    .argv;
;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXB1Yi1pY29udi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImVwdWItaWNvbnYudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBRUEsZ0VBQXdEO0FBQ3hELCtCQUFnQztBQUNoQyxzQ0FBZ0U7QUFDaEUsNkJBQTZCO0FBQzdCLCtDQUF1QztBQUN2Qyx1Q0FBdUM7QUFFdkMseUJBQWMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO0FBRTNDLElBQUksSUFBSSxHQUFHLEtBQUs7S0FDZCxVQUFVLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQztLQUNwQixPQUFPLENBQUMsOEJBQThCLEVBQUUsRUFBRSxDQUFDO0tBQzNDLE1BQU0sQ0FBQyxLQUFLLEVBQUU7SUFDZCxJQUFJLEVBQUUsYUFBYTtJQUNuQixPQUFPLEVBQUUsT0FBTyxDQUFDLEdBQUcsRUFBRTtDQUN0QixDQUFDO0tBQ0QsTUFBTSxDQUFDLFFBQVEsRUFBRTtJQUNqQixJQUFJLEVBQUUsWUFBWTtJQUNsQixXQUFXLEVBQUUsSUFBSTtJQUNqQixNQUFNLEVBQUUsSUFBSTtDQUNaLENBQUM7S0FDRCxNQUFNLENBQUMsT0FBTyxFQUFFO0lBQ2hCLElBQUksRUFBRSxhQUFhO0lBQ25CLFdBQVcsRUFBRSxJQUFJO0lBQ2pCLE1BQU0sRUFBRSxJQUFJO0NBQ1osQ0FBQztLQUNELE1BQU0sQ0FBQyxTQUFTLEVBQUU7SUFDbEIsSUFBSSxFQUFFLFFBQVE7SUFDZCxPQUFPLEVBQUUsSUFBSTtJQUNiLE9BQU8sRUFBRSxJQUFJO0NBQ2IsQ0FBQztLQUNELGNBQWMsQ0FBQyxJQUFJLENBQUM7S0FDcEIsT0FBTyxFQUFFO0tBQ1QsT0FBTyxDQUFDLElBQUksRUFBRSxtQkFBbUIsRUFBRSxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsS0FBSyxFQUFHLFVBQVUsSUFBSTtJQUVwRSxJQUFJLE9BQU8sR0FBMEI7UUFDcEMsR0FBRyxFQUFFLElBQUksQ0FBQyxHQUFHO1FBQ2IsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNO1FBQ25CLEtBQUssRUFBRSxJQUFJLENBQUMsS0FBdUM7UUFDbkQsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPO0tBQ3JCLENBQUM7SUFFRixJQUFJLE9BQU8sR0FBYSxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBRS9CLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUNuQjtRQUNDLE9BQU8sR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0tBQ3JCO0lBRUQsc0JBQU8sQ0FBQyxHQUFHLENBQUM7UUFDWCxPQUFPO1FBQ1AsT0FBTztLQUNQLENBQUMsQ0FBQztJQUVILE9BQU8saUJBQVUsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFDckMsQ0FBQyxDQUFDO0tBQ0QsSUFBSSxDQUFDO0FBQ1AsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIiMhL3Vzci9iaW4vZW52IG5vZGVcblxuaW1wb3J0IHVwZGF0ZU5vdGlmaWVyIGZyb20gJ0B5YXJuLXRvb2wvdXBkYXRlLW5vdGlmaWVyJztcbmltcG9ydCB5YXJncyA9IHJlcXVpcmUoJ3lhcmdzJyk7XG5pbXBvcnQgeyBoYW5kbGVHbG9iLCBJRXB1Ykljb252R2xvYk9wdGlvbnMgfSBmcm9tICcuLi9saWIvZ2xvYic7XG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgY29uc29sZSB9IGZyb20gJ2RlYnVnLWNvbG9yMic7XG5pbXBvcnQgKiBhcyBwa2cgZnJvbSAnLi4vcGFja2FnZS5qc29uJztcblxudXBkYXRlTm90aWZpZXIocGF0aC5qb2luKF9fZGlybmFtZSwgJy4uJykpO1xuXG5sZXQgYXJndiA9IHlhcmdzXG5cdC5zY3JpcHROYW1lKHBrZy5uYW1lKVxuXHQuZXhhbXBsZShgZXB1Yi1pY29udiAtLWljb252IGNuICouZXB1YmAsIGBgKVxuXHQub3B0aW9uKCdjd2QnLCB7XG5cdFx0ZGVzYzogYOaQnOWwi+aqlOahiOaZgueahOWfuua6luizh+aWmeWkvmAsXG5cdFx0ZGVmYXVsdDogcHJvY2Vzcy5jd2QoKSxcblx0fSlcblx0Lm9wdGlvbignb3V0cHV0Jywge1xuXHRcdGRlc2M6IGDomZXnkIblvoznmoTmqpTmoYjovLjlh7rot6/lvpFgLFxuXHRcdHJlcXVpcmVzQXJnOiB0cnVlLFxuXHRcdHN0cmluZzogdHJ1ZSxcblx0fSlcblx0Lm9wdGlvbignaWNvbnYnLCB7XG5cdFx0ZGVzYzogYGNuIOi9ieewoSB0dyDovYnnuYFgLFxuXHRcdHJlcXVpcmVzQXJnOiB0cnVlLFxuXHRcdHN0cmluZzogdHJ1ZSxcblx0fSlcblx0Lm9wdGlvbignc2hvd0xvZycsIHtcblx0XHRkZXNjOiBg5piv5ZCm6Ly45Ye66KiK5oGvYCxcblx0XHRib29sZWFuOiB0cnVlLFxuXHRcdGRlZmF1bHQ6IHRydWUsXG5cdH0pXG5cdC5zaG93SGVscE9uRmFpbCh0cnVlKVxuXHQudmVyc2lvbigpXG5cdC5jb21tYW5kKCckMCcsIGBlcHViLWljb252ICouZXB1YmAsICh5YXJncykgPT4geWFyZ3MsICBmdW5jdGlvbiAoYXJndilcblx0e1xuXHRcdGxldCBvcHRpb25zOiBJRXB1Ykljb252R2xvYk9wdGlvbnMgPSB7XG5cdFx0XHRjd2Q6IGFyZ3YuY3dkLFxuXHRcdFx0b3V0cHV0OiBhcmd2Lm91dHB1dCxcblx0XHRcdGljb252OiBhcmd2Lmljb252IGFzIElFcHViSWNvbnZHbG9iT3B0aW9uc1tcImljb252XCJdLFxuXHRcdFx0c2hvd0xvZzogYXJndi5zaG93TG9nLFxuXHRcdH07XG5cblx0XHRsZXQgcGF0dGVybjogc3RyaW5nW10gPSBhcmd2Ll87XG5cblx0XHRpZiAoIXBhdHRlcm4ubGVuZ3RoKVxuXHRcdHtcblx0XHRcdHBhdHRlcm4gPSBbJyouZXB1YiddO1xuXHRcdH1cblxuXHRcdGNvbnNvbGUuZGlyKHtcblx0XHRcdHBhdHRlcm4sXG5cdFx0XHRvcHRpb25zLFxuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIGhhbmRsZUdsb2IocGF0dGVybiwgb3B0aW9ucyk7XG5cdH0pXG5cdC5hcmd2O1xuO1xuIl19