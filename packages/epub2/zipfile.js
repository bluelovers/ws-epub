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
            this.admZip.readFileAsync(this.admZip.getEntry(name), (buffer, error) => {
                if (error || !buffer) {
                    name = decodeURIComponent(name);
                    this.admZip.readFileAsync(this.admZip.getEntry(name), (buffer, error) => cb(error, buffer));
                }
                else {
                    cb(error, buffer);
                }
            });
        }
        get count() {
            return this.names.length;
        }
    });
}
exports.default = exports.ZipFile;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiemlwZmlsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInppcGZpbGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOztHQUVHOztBQVlILElBQ0E7SUFDQyxxQ0FBcUM7SUFDckMsZUFBTyxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxPQUFPLENBQUM7Q0FDckM7QUFDRCxPQUFPLEdBQUcsRUFDVjtJQUNDLHNDQUFzQztJQUN0QyxNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7SUFFbEMsYUFBYTtJQUNiLGVBQU8sR0FBRyxDQUFDO1FBS1YsWUFBWSxRQUFnQjtZQUUzQixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ25DLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQUUsQ0FBQyxHQUFHLENBQUMsVUFBVSxRQUFRO2dCQUUzRCxPQUFPLFFBQVEsQ0FBQyxTQUFTLENBQUM7WUFDM0IsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO1FBRU0sUUFBUSxDQUFDLElBQVksRUFBRSxFQUEyQjtZQUV4RCxJQUFJLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsRUFBRTtnQkFFdkUsSUFBSSxLQUFLLElBQUksQ0FBQyxNQUFNLEVBQ3BCO29CQUNDLElBQUksR0FBRyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztvQkFFaEMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7aUJBQzVGO3FCQUVEO29CQUNDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUM7aUJBQ2xCO1lBQ0YsQ0FBQyxDQUFDLENBQUM7UUFDSixDQUFDO1FBRUQsSUFBVyxLQUFLO1lBRWYsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQztRQUMxQixDQUFDO0tBQ0QsQ0FBQyxDQUFDO0NBQ0g7QUFFRCxrQkFBZSxlQUFPLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENyZWF0ZWQgYnkgdXNlciBvbiAyMDE4LzIvMS8wMDEuXG4gKi9cblxuZXhwb3J0IGxldCBaaXBGaWxlOiBJWmlwRmlsZTtcblxuZXhwb3J0IGludGVyZmFjZSBJWmlwRmlsZVxue1xuXHRuYW1lczogc3RyaW5nW107XG5cdGNvdW50OiBudW1iZXI7XG5cdGNvbnN0cnVjdG9yKGZpbGVuYW1lOiBzdHJpbmcpO1xuXHRyZWFkRmlsZShuYW1lOiBzdHJpbmcsIGNiOiAoZXJyb3IsIGJ1ZmZlcjogQnVmZmVyKSA9PiB2b2lkKTogdm9pZDtcbn1cblxudHJ5XG57XG5cdC8vIHppcGZpbGUgaXMgYW4gb3B0aW9uYWwgZGVwZW5kZW5jeTpcblx0WmlwRmlsZSA9IHJlcXVpcmUoXCJ6aXBmaWxlXCIpLlppcEZpbGU7XG59XG5jYXRjaCAoZXJyKVxue1xuXHQvLyBNb2NrIHppcGZpbGUgdXNpbmcgcHVyZS1KUyBhZG0temlwOlxuXHRjb25zdCBBZG1aaXAgPSByZXF1aXJlKCdhZG0temlwJyk7XG5cblx0Ly8gQHRzLWlnbm9yZVxuXHRaaXBGaWxlID0gKGNsYXNzXG5cdHtcblx0XHRwcm90ZWN0ZWQgYWRtWmlwO1xuXHRcdHB1YmxpYyBuYW1lczogc3RyaW5nW107XG5cblx0XHRjb25zdHJ1Y3RvcihmaWxlbmFtZTogc3RyaW5nKVxuXHRcdHtcblx0XHRcdHRoaXMuYWRtWmlwID0gbmV3IEFkbVppcChmaWxlbmFtZSk7XG5cdFx0XHR0aGlzLm5hbWVzID0gdGhpcy5hZG1aaXAuZ2V0RW50cmllcygpLm1hcChmdW5jdGlvbiAoemlwRW50cnkpXG5cdFx0XHR7XG5cdFx0XHRcdHJldHVybiB6aXBFbnRyeS5lbnRyeU5hbWU7XG5cdFx0XHR9KTtcblx0XHR9XG5cblx0XHRwdWJsaWMgcmVhZEZpbGUobmFtZTogc3RyaW5nLCBjYjogKGVycm9yLCBidWZmZXIpID0+IHZvaWQpXG5cdFx0e1xuXHRcdFx0dGhpcy5hZG1aaXAucmVhZEZpbGVBc3luYyh0aGlzLmFkbVppcC5nZXRFbnRyeShuYW1lKSwgKGJ1ZmZlciwgZXJyb3IpID0+XG5cdFx0XHR7XG5cdFx0XHRcdGlmIChlcnJvciB8fCAhYnVmZmVyKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0bmFtZSA9IGRlY29kZVVSSUNvbXBvbmVudChuYW1lKTtcblxuXHRcdFx0XHRcdHRoaXMuYWRtWmlwLnJlYWRGaWxlQXN5bmModGhpcy5hZG1aaXAuZ2V0RW50cnkobmFtZSksIChidWZmZXIsIGVycm9yKSA9PiBjYihlcnJvciwgYnVmZmVyKSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0Y2IoZXJyb3IsIGJ1ZmZlcik7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH1cblxuXHRcdHB1YmxpYyBnZXQgY291bnQoKTogbnVtYmVyXG5cdFx0e1xuXHRcdFx0cmV0dXJuIHRoaXMubmFtZXMubGVuZ3RoO1xuXHRcdH1cblx0fSk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IFppcEZpbGU7XG4iXX0=