#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../lib/index");
const bluebird_1 = require("@bluelovers/fast-glob/bluebird");
index_1.console.setOptions({
    time: true,
});
const cwd = process.cwd();
bluebird_1.default([
    '*.epub'
], {
    cwd,
    absolute: true,
})
    .tap(ls => {
    index_1.console.info(cwd);
    index_1.console.info(`目前資料夾下找到`, ls.length, `epub`);
})
    .mapSeries(file => {
    index_1.console.log(file);
    return index_1.autoExtract(file);
})
    .then(ls => {
    if (ls.length) {
        index_1.console.success(`處理完成`, ls.length, `epub`);
    }
    else {
        index_1.console.red(`沒有找到任何 epub 檔案`);
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0cmFjdC1iYWQtZXB1Yi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImV4dHJhY3QtYmFkLWVwdWIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBRUEsd0NBQXNFO0FBQ3RFLDZEQUFzRDtBQUd0RCxlQUFPLENBQUMsVUFBVSxDQUFDO0lBQ2xCLElBQUksRUFBRSxJQUFJO0NBQ1YsQ0FBQyxDQUFDO0FBRUgsTUFBTSxHQUFHLEdBQUcsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBRTFCLGtCQUFRLENBQUM7SUFDUixRQUFRO0NBQ1IsRUFBRTtJQUNGLEdBQUc7SUFDSCxRQUFRLEVBQUUsSUFBSTtDQUNkLENBQUM7S0FDQSxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUU7SUFFVCxlQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ2xCLGVBQU8sQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLEVBQUUsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFFN0MsQ0FBQyxDQUFDO0tBQ0QsU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFO0lBQ2pCLGVBQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDbEIsT0FBTyxtQkFBVyxDQUFDLElBQUksQ0FBQyxDQUFBO0FBQ3pCLENBQUMsQ0FBQztLQUNELElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRTtJQUVWLElBQUksRUFBRSxDQUFDLE1BQU0sRUFDYjtRQUNDLGVBQU8sQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7S0FDM0M7U0FFRDtRQUNDLGVBQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztLQUM5QjtBQUVGLENBQUMsQ0FBQyxDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiIyEvdXNyL2Jpbi9lbnYgbm9kZVxuXG5pbXBvcnQgeyBsb2FkLCBzYXZlQXR0YWNoLCBhdXRvRXh0cmFjdCwgY29uc29sZSB9IGZyb20gJy4uL2xpYi9pbmRleCc7XG5pbXBvcnQgRmFzdEdsb2IgZnJvbSAnQGJsdWVsb3ZlcnMvZmFzdC1nbG9iL2JsdWViaXJkJztcbmltcG9ydCBCbHVlYmlyZCA9IHJlcXVpcmUoJ2JsdWViaXJkJyk7XG5cbmNvbnNvbGUuc2V0T3B0aW9ucyh7XG5cdHRpbWU6IHRydWUsXG59KTtcblxuY29uc3QgY3dkID0gcHJvY2Vzcy5jd2QoKTtcblxuRmFzdEdsb2IoW1xuXHQnKi5lcHViJ1xuXSwge1xuXHRjd2QsXG5cdGFic29sdXRlOiB0cnVlLFxufSlcblx0LnRhcChscyA9PiB7XG5cblx0XHRjb25zb2xlLmluZm8oY3dkKTtcblx0XHRjb25zb2xlLmluZm8oYOebruWJjeizh+aWmeWkvuS4i+aJvuWIsGAsIGxzLmxlbmd0aCwgYGVwdWJgKTtcblxuXHR9KVxuXHQubWFwU2VyaWVzKGZpbGUgPT4ge1xuXHRcdGNvbnNvbGUubG9nKGZpbGUpO1xuXHRcdHJldHVybiBhdXRvRXh0cmFjdChmaWxlKVxuXHR9KVxuXHQudGhlbihscyA9PiB7XG5cblx0XHRpZiAobHMubGVuZ3RoKVxuXHRcdHtcblx0XHRcdGNvbnNvbGUuc3VjY2Vzcyhg6JmV55CG5a6M5oiQYCwgbHMubGVuZ3RoLCBgZXB1YmApO1xuXHRcdH1cblx0XHRlbHNlXG5cdFx0e1xuXHRcdFx0Y29uc29sZS5yZWQoYOaykuacieaJvuWIsOS7u+S9lSBlcHViIOaqlOahiGApO1xuXHRcdH1cblxuXHR9KVxuO1xuIl19