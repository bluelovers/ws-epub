"use strict";
/**
 * Created by user on 2017/12/12/012.
 */
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-ignore
const path = require("path");
const Promise = require("bluebird");
// @ts-ignore
exports.defaultPath = path.join(__dirname, './epubtpl');
exports.defaultList = {
    'idpf-wasteland': path.join(exports.defaultPath, './from_idpf_epub3'),
    'lightnovel': path.join(exports.defaultPath, './lightnovel'),
};
class TemplateManagers {
    constructor(options = {}) {
        this.basePath = exports.defaultPath;
        this.list = exports.defaultList;
        this.paths = [];
        Object.assign(this.list, options.list);
    }
    value() {
        return this.list;
    }
    /**
     *
     * @param {string} key
     * @param {any | string | IBuilder} value
     * @returns {this}
     */
    add(key, value) {
        this.list[key] = value;
        return this;
    }
    has(name) {
        return (this.list[name]);
    }
    async _get(t) {
        let fn = async function (b) {
            if (!b) {
                //
            }
            else if (b.init) {
                return await b.init();
            }
            else if (b.builder) {
                return b.builder;
            }
            else if (b.Builder && typeof b.Builder.make == 'function') {
                return b.Builder;
            }
            else if (b.Builder) {
                return await new b.Builder();
            }
            else if (typeof b == 'function') {
                return await b();
            }
            throw new ReferenceError(`tpl "${name}" not exists`);
        };
        let r;
        if (!t) {
            //
        }
        else if (typeof t == 'string') {
            let b = await Promise.resolve().then(() => require(t));
            r = await fn(b);
        }
        else {
            r = await fn(t);
        }
        if (r) {
            return r;
        }
        throw new ReferenceError(`tpl "${name}" not exists`);
    }
    async get(name) {
        if (this.has(name)) {
            return await this._get(this.list[name]);
        }
        return await this._get(await this.search(name));
    }
    async exec(name, epub, options) {
        let builder = await this.get(name);
        return builder.make(epub, options);
    }
    search(name) {
        let self = this;
        const fn = function (id) {
            return Promise.resolve(function () {
                // @ts-ignore
                return require.reverse(id);
            });
        };
        return fn(name)
            .catch(function () {
            return fn(path.join(self.basePath, name));
        })
            .catch(function (err) {
            if (Array.isArray(self.paths)) {
                let ps = [];
                for (let v of self.paths) {
                    ps.push(fn(path.join(v, name)));
                }
                return Promise.any(ps);
            }
            return Promise.reject(err);
        })
            .then(function (ret) {
            if (!ret || typeof ret !== 'string') {
                return Promise.reject(`${ret} not a valid path`);
            }
            return ret;
        })
            .catch(function () {
            return fn(path.join('@epubtpl', name));
        });
    }
}
exports.TemplateManagers = TemplateManagers;
exports.templateManagers = new TemplateManagers();
const self = require("./template");
// @ts-ignore
exports.default = self;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVtcGxhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ0ZW1wbGF0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7O0FBRUgsYUFBYTtBQUNiLDZCQUE2QjtBQUM3QixvQ0FBb0M7QUFJcEMsYUFBYTtBQUNBLFFBQUEsV0FBVyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLFdBQVcsQ0FBVyxDQUFDO0FBRTFELFFBQUEsV0FBVyxHQUFHO0lBQzFCLGdCQUFnQixFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsbUJBQVcsRUFBRSxtQkFBbUIsQ0FBQztJQUM3RCxZQUFZLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxtQkFBVyxFQUFFLGNBQWMsQ0FBQztDQUMzQyxDQUFDO0FBZVgsTUFBYSxnQkFBZ0I7SUFNNUIsWUFBWSxVQUFvQixFQUFFO1FBSjNCLGFBQVEsR0FBRyxtQkFBVyxDQUFDO1FBQ3ZCLFNBQUksR0FBRyxtQkFBVyxDQUFDO1FBQ25CLFVBQUssR0FBYSxFQUFFLENBQUM7UUFJM0IsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN4QyxDQUFDO0lBRUQsS0FBSztRQUVKLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQztJQUNsQixDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCxHQUFHLENBQThCLEdBQVcsRUFBRSxLQUFRO1FBRXJELElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsS0FBSyxDQUFDO1FBRXZCLE9BQU8sSUFBSSxDQUFDO0lBQ2IsQ0FBQztJQUVELEdBQUcsQ0FBOEIsSUFBWTtRQUU1QyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQzFCLENBQUM7SUFFRCxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFWCxJQUFJLEVBQUUsR0FBRyxLQUFLLFdBQVcs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SSxDQUFDLEtBQUssRUFDeEI7b0JBQ0MsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2lCQUNoQztnQkFFRCxPQUFPLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7YUFDdkI7WUFFRCxPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDNUIsQ0FBQyxDQUFDO2FBQ0QsSUFBSSxDQUFDLFVBQVUsR0FBRztZQUVsQixJQUFJLENBQUMsR0FBRyxJQUFJLE9BQU8sR0FBRyxLQUFLLFFBQVEsRUFDbkM7Z0JBQ0MsT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsR0FBRyxtQkFBbUIsQ0FBQyxDQUFDO2FBQ2pEO1lBRUQsT0FBTyxHQUFHLENBQUM7UUFDWixDQUFDLENBQUM7YUFDRCxLQUFLLENBQUM7WUFFTixPQUFPLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO1FBQ3hDLENBQUMsQ0FBQyxDQUNEO0lBQ0gsQ0FBQztDQUNEO0FBN0pELDRDQTZKQztBQUVZLFFBQUEsZ0JBQWdCLEdBQUcsSUFBSSxnQkFBZ0IsRUFBRSxDQUFDO0FBRXZELG1DQUFtQztBQUNuQyxhQUFhO0FBQ2Isa0JBQWUsSUFBSSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDcmVhdGVkIGJ5IHVzZXIgb24gMjAxNy8xMi8xMi8wMTIuXG4gKi9cblxuLy8gQHRzLWlnbm9yZVxuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCAqIGFzIFByb21pc2UgZnJvbSAnYmx1ZWJpcmQnO1xuaW1wb3J0IHsgSUVwdWJDb25maWcsIElCdWlsZGVyIH0gZnJvbSAnLi92YXInO1xuaW1wb3J0IHsgRXB1Yk1ha2VyIH0gZnJvbSAnLi9pbmRleCc7XG5cbi8vIEB0cy1pZ25vcmVcbmV4cG9ydCBjb25zdCBkZWZhdWx0UGF0aCA9IHBhdGguam9pbihfX2Rpcm5hbWUsICcuL2VwdWJ0cGwnKSBhcyBzdHJpbmc7XG5cbmV4cG9ydCBjb25zdCBkZWZhdWx0TGlzdCA9IHtcblx0J2lkcGYtd2FzdGVsYW5kJzogcGF0aC5qb2luKGRlZmF1bHRQYXRoLCAnLi9mcm9tX2lkcGZfZXB1YjMnKSxcblx0J2xpZ2h0bm92ZWwnOiBwYXRoLmpvaW4oZGVmYXVsdFBhdGgsICcuL2xpZ2h0bm92ZWwnKSxcbn0gYXMgSUxpc3Q7XG5cbmV4cG9ydCBpbnRlcmZhY2UgSU9wdGlvbnNcbntcblx0bGlzdD86IElMaXN0O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElMaXN0XG57XG5cdCdpZHBmLXdhc3RlbGFuZCc6IHN0cmluZztcblx0J2xpZ2h0bm92ZWwnOiBzdHJpbmc7XG5cblx0W2luZGV4OiBzdHJpbmddOiBhbnk7XG59XG5cbmV4cG9ydCBjbGFzcyBUZW1wbGF0ZU1hbmFnZXJzXG57XG5cdHB1YmxpYyBiYXNlUGF0aCA9IGRlZmF1bHRQYXRoO1xuXHRwdWJsaWMgbGlzdCA9IGRlZmF1bHRMaXN0O1xuXHRwdWJsaWMgcGF0aHM6IHN0cmluZ1tdID0gW107XG5cblx0Y29uc3RydWN0b3Iob3B0aW9uczogSU9wdGlvbnMgPSB7fSlcblx0e1xuXHRcdE9iamVjdC5hc3NpZ24odGhpcy5saXN0LCBvcHRpb25zLmxpc3QpO1xuXHR9XG5cblx0dmFsdWUoKVxuXHR7XG5cdFx0cmV0dXJuIHRoaXMubGlzdDtcblx0fVxuXG5cdC8qKlxuXHQgKlxuXHQgKiBAcGFyYW0ge3N0cmluZ30ga2V5XG5cdCAqIEBwYXJhbSB7YW55IHwgc3RyaW5nIHwgSUJ1aWxkZXJ9IHZhbHVlXG5cdCAqIEByZXR1cm5zIHt0aGlzfVxuXHQgKi9cblx0YWRkPFQgPSBhbnkgfCBzdHJpbmcgfCBJQnVpbGRlcj4oa2V5OiBzdHJpbmcsIHZhbHVlOiBUKVxuXHR7XG5cdFx0dGhpcy5saXN0W2tleV0gPSB2YWx1ZTtcblxuXHRcdHJldHVybiB0aGlzO1xuXHR9XG5cblx0aGFzPFQgPSBhbnkgfCBzdHJpbmcgfCBJQnVpbGRlcj4obmFtZTogc3RyaW5nKTogVFxuXHR7XG5cdFx0cmV0dXJuICh0aGlzLmxpc3RbbmFtZV0pO1xuXHR9XG5cblx0YXN5bmMgX2dldCh0KTogUHJvbWlzZTxJQnVpbGRlcj5cblx0e1xuXHRcdGxldCBmbiA9IGFzeW5jIGZ1bmN0aW9uIChiKVxuXHRcdHtcblx0XHRcdGlmICghYilcblx0XHRcdHtcblx0XHRcdFx0Ly9cblx0XHRcdH1cblx0XHRcdGVsc2UgaWYgKGIuaW5pdClcblx0XHRcdHtcblx0XHRcdFx0cmV0dXJuIGF3YWl0IGIuaW5pdCgpO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSBpZiAoYi5idWlsZGVyKVxuXHRcdFx0e1xuXHRcdFx0XHRyZXR1cm4gYi5idWlsZGVyO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSBpZiAoYi5CdWlsZGVyICYmIHR5cGVvZiBiLkJ1aWxkZXIubWFrZSA9PSAnZnVuY3Rpb24nKVxuXHRcdFx0e1xuXHRcdFx0XHRyZXR1cm4gYi5CdWlsZGVyO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSBpZiAoYi5CdWlsZGVyKVxuXHRcdFx0e1xuXHRcdFx0XHRyZXR1cm4gYXdhaXQgbmV3IGIuQnVpbGRlcigpO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZSBpZiAodHlwZW9mIGIgPT0gJ2Z1bmN0aW9uJylcblx0XHRcdHtcblx0XHRcdFx0cmV0dXJuIGF3YWl0IGIoKTtcblx0XHRcdH1cblxuXHRcdFx0dGhyb3cgbmV3IFJlZmVyZW5jZUVycm9yKGB0cGwgXCIke25hbWV9XCIgbm90IGV4aXN0c2ApO1xuXHRcdH07XG5cblx0XHRsZXQgcjtcblxuXHRcdGlmICghdClcblx0XHR7XG5cdFx0XHQvL1xuXHRcdH1cblx0XHRlbHNlIGlmICh0eXBlb2YgdCA9PSAnc3RyaW5nJylcblx0XHR7XG5cdFx0XHRsZXQgYiA9IGF3YWl0IGltcG9ydCh0KTtcblxuXHRcdFx0ciA9IGF3YWl0IGZuKGIpO1xuXHRcdH1cblx0XHRlbHNlXG5cdFx0e1xuXHRcdFx0ciA9IGF3YWl0IGZuKHQpO1xuXHRcdH1cblxuXHRcdGlmIChyKVxuXHRcdHtcblx0XHRcdHJldHVybiByO1xuXHRcdH1cblxuXHRcdHRocm93IG5ldyBSZWZlcmVuY2VFcnJvcihgdHBsIFwiJHtuYW1lfVwiIG5vdCBleGlzdHNgKTtcblx0fVxuXG5cdGFzeW5jIGdldChuYW1lOiBzdHJpbmcpOiBQcm9taXNlPElCdWlsZGVyPlxuXHR7XG5cdFx0aWYgKHRoaXMuaGFzKG5hbWUpKVxuXHRcdHtcblx0XHRcdHJldHVybiBhd2FpdCB0aGlzLl9nZXQodGhpcy5saXN0W25hbWVdKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gYXdhaXQgdGhpcy5fZ2V0KGF3YWl0IHRoaXMuc2VhcmNoKG5hbWUpKTtcblx0fVxuXG5cdGFzeW5jIGV4ZWMobmFtZTogc3RyaW5nLCBlcHViOiBFcHViTWFrZXIsIG9wdGlvbnM/KVxuXHR7XG5cdFx0bGV0IGJ1aWxkZXIgPSBhd2FpdCB0aGlzLmdldChuYW1lKTtcblxuXHRcdHJldHVybiBidWlsZGVyLm1ha2UoZXB1Yiwgb3B0aW9ucyk7XG5cdH1cblxuXHRzZWFyY2gobmFtZTogc3RyaW5nKTogc3RyaW5nXG5cdHtcblx0XHRsZXQgc2VsZiA9IHRoaXM7XG5cblx0XHRjb25zdCBmbiA9IGZ1bmN0aW9uIChpZClcblx0XHR7XG5cdFx0XHRyZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGZ1bmN0aW9uICgpXG5cdFx0XHR7XG5cdFx0XHRcdC8vIEB0cy1pZ25vcmVcblx0XHRcdFx0cmV0dXJuIHJlcXVpcmUucmV2ZXJzZShpZCk7XG5cdFx0XHR9KTtcblx0XHR9O1xuXG5cdFx0cmV0dXJuIGZuKG5hbWUpXG5cdFx0XHQuY2F0Y2goZnVuY3Rpb24gKClcblx0XHRcdHtcblx0XHRcdFx0cmV0dXJuIGZuKHBhdGguam9pbihzZWxmLmJhc2VQYXRoLCBuYW1lKSk7XG5cdFx0XHR9KVxuXHRcdFx0LmNhdGNoKGZ1bmN0aW9uIChlcnIpXG5cdFx0XHR7XG5cdFx0XHRcdGlmIChBcnJheS5pc0FycmF5KHNlbGYucGF0aHMpKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0bGV0IHBzID0gW107XG5cblx0XHRcdFx0XHRmb3IgKGxldCB2IG9mIHNlbGYucGF0aHMpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0cHMucHVzaChmbihwYXRoLmpvaW4odiwgbmFtZSkpKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRyZXR1cm4gUHJvbWlzZS5hbnkocHMpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0cmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XG5cdFx0XHR9KVxuXHRcdFx0LnRoZW4oZnVuY3Rpb24gKHJldClcblx0XHRcdHtcblx0XHRcdFx0aWYgKCFyZXQgfHwgdHlwZW9mIHJldCAhPT0gJ3N0cmluZycpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRyZXR1cm4gUHJvbWlzZS5yZWplY3QoYCR7cmV0fSBub3QgYSB2YWxpZCBwYXRoYCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRyZXR1cm4gcmV0O1xuXHRcdFx0fSlcblx0XHRcdC5jYXRjaChmdW5jdGlvbiAoKVxuXHRcdFx0e1xuXHRcdFx0XHRyZXR1cm4gZm4ocGF0aC5qb2luKCdAZXB1YnRwbCcsIG5hbWUpKTtcblx0XHRcdH0pXG5cdFx0XHQ7XG5cdH1cbn1cblxuZXhwb3J0IGNvbnN0IHRlbXBsYXRlTWFuYWdlcnMgPSBuZXcgVGVtcGxhdGVNYW5hZ2VycygpO1xuXG5pbXBvcnQgKiBhcyBzZWxmIGZyb20gJy4vdGVtcGxhdGUnO1xuLy8gQHRzLWlnbm9yZVxuZXhwb3J0IGRlZmF1bHQgc2VsZjtcbiJdfQ==