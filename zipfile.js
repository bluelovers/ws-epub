"use strict";
/**
 * Created by user on 2018/2/1/001.
 */
Object.defineProperty(exports, "__esModule", { value: true });
try {
    // zipfile is an optional dependency:
    exports.ZipFile = require("zipfile").ZipFile;
}
catch (err) {
    // Mock zipfile using pure-JS adm-zip:
    const AdmZip = require('adm-zip');
    // @ts-ignore
    exports.ZipFile = (class {
        constructor(filename) {
            this.admZip = new AdmZip(filename);
            this.names = this.admZip.getEntries().map(function (zipEntry) {
                return zipEntry.entryName;
            });
        }
        readFile(name, cb) {
            this.admZip.readFileAsync(this.admZip.getEntry(name), function (buffer, error) {
                // `error` is bogus right now, so let's just drop it.
                // see https://github.com/cthackers/adm-zip/pull/88
                return cb(null, buffer);
            });
        }
        get count() {
            return this.names.length;
        }
    });
}
exports.default = exports.ZipFile;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiemlwZmlsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInppcGZpbGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOztHQUVHOztBQVlILElBQ0E7SUFDQyxxQ0FBcUM7SUFDckMsZUFBTyxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxPQUFPLENBQUM7Q0FDckM7QUFDRCxPQUFPLEdBQUcsRUFDVjtJQUNDLHNDQUFzQztJQUN0QyxNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7SUFFbEMsYUFBYTtJQUNiLGVBQU8sR0FBRyxDQUFDO1FBS1YsWUFBWSxRQUFnQjtZQUUzQixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ25DLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQUUsQ0FBQyxHQUFHLENBQUMsVUFBVSxRQUFRO2dCQUUzRCxPQUFPLFFBQVEsQ0FBQyxTQUFTLENBQUM7WUFDM0IsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO1FBRU0sUUFBUSxDQUFDLElBQVksRUFBRSxFQUEyQjtZQUV4RCxJQUFJLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRSxVQUFVLE1BQU0sRUFBRSxLQUFLO2dCQUU1RSxxREFBcUQ7Z0JBQ3JELG1EQUFtRDtnQkFDbkQsT0FBTyxFQUFFLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQ3pCLENBQUMsQ0FBQyxDQUFDO1FBQ0osQ0FBQztRQUVELElBQVcsS0FBSztZQUVmLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUM7UUFDMUIsQ0FBQztLQUNELENBQUMsQ0FBQztDQUNIO0FBRUQsa0JBQWUsZUFBTyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDcmVhdGVkIGJ5IHVzZXIgb24gMjAxOC8yLzEvMDAxLlxuICovXG5cbmV4cG9ydCBsZXQgWmlwRmlsZTogSVppcEZpbGU7XG5cbmV4cG9ydCBpbnRlcmZhY2UgSVppcEZpbGVcbntcblx0bmFtZXM6IHN0cmluZ1tdO1xuXHRjb3VudDogbnVtYmVyO1xuXHRjb25zdHJ1Y3RvcihmaWxlbmFtZTogc3RyaW5nKTtcblx0cmVhZEZpbGUobmFtZTogc3RyaW5nLCBjYjogKGVycm9yLCBidWZmZXI6IEJ1ZmZlcikgPT4gdm9pZCk6IHZvaWQ7XG59XG5cbnRyeVxue1xuXHQvLyB6aXBmaWxlIGlzIGFuIG9wdGlvbmFsIGRlcGVuZGVuY3k6XG5cdFppcEZpbGUgPSByZXF1aXJlKFwiemlwZmlsZVwiKS5aaXBGaWxlO1xufVxuY2F0Y2ggKGVycilcbntcblx0Ly8gTW9jayB6aXBmaWxlIHVzaW5nIHB1cmUtSlMgYWRtLXppcDpcblx0Y29uc3QgQWRtWmlwID0gcmVxdWlyZSgnYWRtLXppcCcpO1xuXG5cdC8vIEB0cy1pZ25vcmVcblx0WmlwRmlsZSA9IChjbGFzc1xuXHR7XG5cdFx0cHJvdGVjdGVkIGFkbVppcDtcblx0XHRwdWJsaWMgbmFtZXM6IHN0cmluZ1tdO1xuXG5cdFx0Y29uc3RydWN0b3IoZmlsZW5hbWU6IHN0cmluZylcblx0XHR7XG5cdFx0XHR0aGlzLmFkbVppcCA9IG5ldyBBZG1aaXAoZmlsZW5hbWUpO1xuXHRcdFx0dGhpcy5uYW1lcyA9IHRoaXMuYWRtWmlwLmdldEVudHJpZXMoKS5tYXAoZnVuY3Rpb24gKHppcEVudHJ5KVxuXHRcdFx0e1xuXHRcdFx0XHRyZXR1cm4gemlwRW50cnkuZW50cnlOYW1lO1xuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0cHVibGljIHJlYWRGaWxlKG5hbWU6IHN0cmluZywgY2I6IChlcnJvciwgYnVmZmVyKSA9PiB2b2lkKVxuXHRcdHtcblx0XHRcdHRoaXMuYWRtWmlwLnJlYWRGaWxlQXN5bmModGhpcy5hZG1aaXAuZ2V0RW50cnkobmFtZSksIGZ1bmN0aW9uIChidWZmZXIsIGVycm9yKVxuXHRcdFx0e1xuXHRcdFx0XHQvLyBgZXJyb3JgIGlzIGJvZ3VzIHJpZ2h0IG5vdywgc28gbGV0J3MganVzdCBkcm9wIGl0LlxuXHRcdFx0XHQvLyBzZWUgaHR0cHM6Ly9naXRodWIuY29tL2N0aGFja2Vycy9hZG0temlwL3B1bGwvODhcblx0XHRcdFx0cmV0dXJuIGNiKG51bGwsIGJ1ZmZlcik7XG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHRwdWJsaWMgZ2V0IGNvdW50KCk6IG51bWJlclxuXHRcdHtcblx0XHRcdHJldHVybiB0aGlzLm5hbWVzLmxlbmd0aDtcblx0XHR9XG5cdH0pO1xufVxuXG5leHBvcnQgZGVmYXVsdCBaaXBGaWxlO1xuIl19