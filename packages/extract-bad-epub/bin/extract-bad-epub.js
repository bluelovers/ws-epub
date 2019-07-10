"use strict";
/**
 * Created by user on 2019/7/10.
 */
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0cmFjdC1iYWQtZXB1Yi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImV4dHJhY3QtYmFkLWVwdWIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOztHQUVHOztBQUVILHdDQUFzRTtBQUN0RSw2REFBc0Q7QUFHdEQsZUFBTyxDQUFDLFVBQVUsQ0FBQztJQUNsQixJQUFJLEVBQUUsSUFBSTtDQUNWLENBQUMsQ0FBQztBQUVILE1BQU0sR0FBRyxHQUFHLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUUxQixrQkFBUSxDQUFDO0lBQ1IsUUFBUTtDQUNSLEVBQUU7SUFDRixHQUFHO0lBQ0gsUUFBUSxFQUFFLElBQUk7Q0FDZCxDQUFDO0tBQ0EsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFO0lBRVQsZUFBTyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNsQixlQUFPLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxFQUFFLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBRTdDLENBQUMsQ0FBQztLQUNELFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRTtJQUNqQixlQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2xCLE9BQU8sbUJBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQTtBQUN6QixDQUFDLENBQUM7S0FDRCxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUU7SUFFVixJQUFJLEVBQUUsQ0FBQyxNQUFNLEVBQ2I7UUFDQyxlQUFPLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0tBQzNDO1NBRUQ7UUFDQyxlQUFPLENBQUMsR0FBRyxDQUFDLGdCQUFnQixDQUFDLENBQUM7S0FDOUI7QUFFRixDQUFDLENBQUMsQ0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ3JlYXRlZCBieSB1c2VyIG9uIDIwMTkvNy8xMC5cbiAqL1xuXG5pbXBvcnQgeyBsb2FkLCBzYXZlQXR0YWNoLCBhdXRvRXh0cmFjdCwgY29uc29sZSB9IGZyb20gJy4uL2xpYi9pbmRleCc7XG5pbXBvcnQgRmFzdEdsb2IgZnJvbSAnQGJsdWVsb3ZlcnMvZmFzdC1nbG9iL2JsdWViaXJkJztcbmltcG9ydCBCbHVlYmlyZCA9IHJlcXVpcmUoJ2JsdWViaXJkJyk7XG5cbmNvbnNvbGUuc2V0T3B0aW9ucyh7XG5cdHRpbWU6IHRydWUsXG59KTtcblxuY29uc3QgY3dkID0gcHJvY2Vzcy5jd2QoKTtcblxuRmFzdEdsb2IoW1xuXHQnKi5lcHViJ1xuXSwge1xuXHRjd2QsXG5cdGFic29sdXRlOiB0cnVlLFxufSlcblx0LnRhcChscyA9PiB7XG5cblx0XHRjb25zb2xlLmluZm8oY3dkKTtcblx0XHRjb25zb2xlLmluZm8oYOebruWJjeizh+aWmeWkvuS4i+aJvuWIsGAsIGxzLmxlbmd0aCwgYGVwdWJgKTtcblxuXHR9KVxuXHQubWFwU2VyaWVzKGZpbGUgPT4ge1xuXHRcdGNvbnNvbGUubG9nKGZpbGUpO1xuXHRcdHJldHVybiBhdXRvRXh0cmFjdChmaWxlKVxuXHR9KVxuXHQudGhlbihscyA9PiB7XG5cblx0XHRpZiAobHMubGVuZ3RoKVxuXHRcdHtcblx0XHRcdGNvbnNvbGUuc3VjY2Vzcyhg6JmV55CG5a6M5oiQYCwgbHMubGVuZ3RoLCBgZXB1YmApO1xuXHRcdH1cblx0XHRlbHNlXG5cdFx0e1xuXHRcdFx0Y29uc29sZS5yZWQoYOaykuacieaJvuWIsOS7u+S9lSBlcHViIOaqlOahiGApO1xuXHRcdH1cblxuXHR9KVxuO1xuIl19