#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const update_notifier_1 = require("@yarn-tool/update-notifier");
const yargs = require("yargs");
const __1 = require("..");
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
    return __1.default(pattern, options);
})
    .argv;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXB1Yi1pY29udi1zZWdtZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZXB1Yi1pY29udi1zZWdtZW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUVBLGdFQUF3RDtBQUN4RCwrQkFBZ0M7QUFDaEMsMEJBQW1DO0FBQ25DLDZCQUE2QjtBQUU3Qix1Q0FBdUM7QUFFdkMseUJBQWMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO0FBRTNDLElBQUksSUFBSSxHQUFHLEtBQUs7S0FDZCxVQUFVLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQztLQUNwQixPQUFPLENBQUMsOEJBQThCLEVBQUUsRUFBRSxDQUFDO0tBQzNDLE1BQU0sQ0FBQyxLQUFLLEVBQUU7SUFDZCxTQUFTLEVBQUUsSUFBSTtJQUNmLElBQUksRUFBRSxhQUFhO0lBQ25CLE9BQU8sRUFBRSxPQUFPLENBQUMsR0FBRyxFQUFFO0NBQ3RCLENBQUM7S0FDRCxNQUFNLENBQUMsUUFBUSxFQUFFO0lBQ2pCLElBQUksRUFBRSxZQUFZO0lBQ2xCLFdBQVcsRUFBRSxJQUFJO0lBQ2pCLE1BQU0sRUFBRSxJQUFJO0NBQ1osQ0FBQztLQUNELE1BQU0sQ0FBQyxPQUFPLEVBQUU7SUFDaEIsSUFBSSxFQUFFLGFBQWE7SUFDbkIsV0FBVyxFQUFFLElBQUk7SUFDakIsTUFBTSxFQUFFLElBQUk7Q0FDWixDQUFDO0tBQ0QsTUFBTSxDQUFDLFNBQVMsRUFBRTtJQUNsQixJQUFJLEVBQUUsUUFBUTtJQUNkLE9BQU8sRUFBRSxJQUFJO0lBQ2IsT0FBTyxFQUFFLElBQUk7Q0FDYixDQUFDO0tBQ0QsY0FBYyxDQUFDLElBQUksQ0FBQztLQUNwQixPQUFPLEVBQUU7S0FDVCxPQUFPLENBQUMsSUFBSSxFQUFFLG1CQUFtQixFQUFFLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxLQUFLLEVBQUcsVUFBVSxJQUFJO0lBRXBFLElBQUksT0FBTyxHQUE0QztRQUN0RCxHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUc7UUFDYixNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU07UUFDbkIsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUF5RDtRQUNyRSxPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU87S0FDckIsQ0FBQztJQUVGLElBQUksT0FBTyxHQUFhLElBQUksQ0FBQyxDQUFDLENBQUM7SUFFL0IsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQ25CO1FBQ0MsT0FBTyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7S0FDckI7SUFFRCxPQUFPLFdBQWlCLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQzVDLENBQUMsQ0FBQztLQUNELElBQUksQ0FDTCIsInNvdXJjZXNDb250ZW50IjpbIiMhL3Vzci9iaW4vZW52IG5vZGVcblxuaW1wb3J0IHVwZGF0ZU5vdGlmaWVyIGZyb20gJ0B5YXJuLXRvb2wvdXBkYXRlLW5vdGlmaWVyJztcbmltcG9ydCB5YXJncyA9IHJlcXVpcmUoJ3lhcmdzJyk7XG5pbXBvcnQgaGFuZGxlR2xvYlNlZ21lbnQgZnJvbSAnLi4nO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IGNvbnNvbGUgfSBmcm9tICdkZWJ1Zy1jb2xvcjInO1xuaW1wb3J0ICogYXMgcGtnIGZyb20gJy4uL3BhY2thZ2UuanNvbic7XG5cbnVwZGF0ZU5vdGlmaWVyKHBhdGguam9pbihfX2Rpcm5hbWUsICcuLicpKTtcblxubGV0IGFyZ3YgPSB5YXJnc1xuXHQuc2NyaXB0TmFtZShwa2cubmFtZSlcblx0LmV4YW1wbGUoYGVwdWItaWNvbnYgLS1pY29udiBjbiAqLmVwdWJgLCBgYClcblx0Lm9wdGlvbignY3dkJywge1xuXHRcdG5vcm1hbGl6ZTogdHJ1ZSxcblx0XHRkZXNjOiBg5pCc5bCL5qqU5qGI5pmC55qE5Z+65rqW6LOH5paZ5aS+YCxcblx0XHRkZWZhdWx0OiBwcm9jZXNzLmN3ZCgpLFxuXHR9KVxuXHQub3B0aW9uKCdvdXRwdXQnLCB7XG5cdFx0ZGVzYzogYOiZleeQhuW+jOeahOaqlOahiOi8uOWHuui3r+W+kWAsXG5cdFx0cmVxdWlyZXNBcmc6IHRydWUsXG5cdFx0c3RyaW5nOiB0cnVlLFxuXHR9KVxuXHQub3B0aW9uKCdpY29udicsIHtcblx0XHRkZXNjOiBgY24g6L2J57ChIHR3IOi9iee5gWAsXG5cdFx0cmVxdWlyZXNBcmc6IHRydWUsXG5cdFx0c3RyaW5nOiB0cnVlLFxuXHR9KVxuXHQub3B0aW9uKCdzaG93TG9nJywge1xuXHRcdGRlc2M6IGDmmK/lkKbovLjlh7roqIrmga9gLFxuXHRcdGJvb2xlYW46IHRydWUsXG5cdFx0ZGVmYXVsdDogdHJ1ZSxcblx0fSlcblx0LnNob3dIZWxwT25GYWlsKHRydWUpXG5cdC52ZXJzaW9uKClcblx0LmNvbW1hbmQoJyQwJywgYGVwdWItaWNvbnYgKi5lcHViYCwgKHlhcmdzKSA9PiB5YXJncywgIGZ1bmN0aW9uIChhcmd2KVxuXHR7XG5cdFx0bGV0IG9wdGlvbnM6IFBhcmFtZXRlcnM8dHlwZW9mIGhhbmRsZUdsb2JTZWdtZW50PlsxXSA9IHtcblx0XHRcdGN3ZDogYXJndi5jd2QsXG5cdFx0XHRvdXRwdXQ6IGFyZ3Yub3V0cHV0LFxuXHRcdFx0aWNvbnY6IGFyZ3YuaWNvbnYgYXMgUGFyYW1ldGVyczx0eXBlb2YgaGFuZGxlR2xvYlNlZ21lbnQ+WzFdW1wiaWNvbnZcIl0sXG5cdFx0XHRzaG93TG9nOiBhcmd2LnNob3dMb2csXG5cdFx0fTtcblxuXHRcdGxldCBwYXR0ZXJuOiBzdHJpbmdbXSA9IGFyZ3YuXztcblxuXHRcdGlmICghcGF0dGVybi5sZW5ndGgpXG5cdFx0e1xuXHRcdFx0cGF0dGVybiA9IFsnKi5lcHViJ107XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGhhbmRsZUdsb2JTZWdtZW50KHBhdHRlcm4sIG9wdGlvbnMpO1xuXHR9KVxuXHQuYXJndlxuO1xuIl19