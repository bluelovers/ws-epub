"use strict";
/**
 * Created by user on 2017/12/12/012.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const util_1 = require("./lib/util");
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
    _get(t) {
        return util_1.BPromise.resolve().then(async function () {
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
        });
    }
    get(name) {
        const self = this;
        return util_1.BPromise.resolve().then(async function () {
            if (self.has(name)) {
                return self._get(self.list[name]);
            }
            return self._get(await self.search(name));
        });
    }
    exec(name, epub, options) {
        const self = this;
        return util_1.BPromise.resolve().then(async function () {
            let builder = await self.get(name);
            return builder.make(epub, options);
        });
    }
    search(name) {
        let self = this;
        const fn = function (id) {
            return util_1.BPromise.resolve(function () {
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
                return util_1.BPromise.any(ps);
            }
            return util_1.BPromise.reject(err);
        })
            // @ts-ignore
            .then(function (ret) {
            if (!ret || typeof ret !== 'string') {
                return util_1.BPromise.reject(`${ret} not a valid path`);
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
exports.default = self;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVtcGxhdGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ0ZW1wbGF0ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7O0FBRUgsNkJBQTZCO0FBQzdCLHFDQUFzQztBQUt6QixRQUFBLFdBQVcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxXQUFXLENBQVcsQ0FBQztBQUUxRCxRQUFBLFdBQVcsR0FBRztJQUMxQixnQkFBZ0IsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLG1CQUFXLEVBQUUsbUJBQW1CLENBQUM7SUFDN0QsWUFBWSxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsbUJBQVcsRUFBRSxjQUFjLENBQUM7Q0FDM0MsQ0FBQztBQWVYLE1BQWEsZ0JBQWdCO0lBTTVCLFlBQVksVUFBb0IsRUFBRTtRQUozQixhQUFRLEdBQUcsbUJBQVcsQ0FBQztRQUN2QixTQUFJLEdBQUcsbUJBQVcsQ0FBQztRQUNuQixVQUFLLEdBQWEsRUFBRSxDQUFDO1FBSTNCLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDeEMsQ0FBQztJQUVELEtBQUs7UUFFSixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUM7SUFDbEIsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsR0FBRyxDQUE4QixHQUFXLEVBQUUsS0FBUTtRQUVyRCxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEtBQUssQ0FBQztRQUV2QixPQUFPLElBQUksQ0FBQztJQUNiLENBQUM7SUFFRCxHQUFHLENBQThCLElBQVk7UUFFNUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUMxQixDQUFDO0lBRUQsSUFBSSxDQUFDLENBQUM7UUFFTCxPQUFPLGVBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSztZQUVuQyxJQUFJ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ZXIgb24gMjAxNy8xMi8xMi8wMTIuXG4gKi9cblxuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IEJQcm9taXNlIH0gZnJvbSAnLi9saWIvdXRpbCc7XG5pbXBvcnQgeyBJRXB1YkNvbmZpZywgSUJ1aWxkZXIgfSBmcm9tICcuL3Zhcic7XG5pbXBvcnQgeyBFcHViTWFrZXIgfSBmcm9tICcuL2luZGV4JztcbmltcG9ydCBKU1ppcCA9IHJlcXVpcmUoJ2pzemlwJyk7XG5cbmV4cG9ydCBjb25zdCBkZWZhdWx0UGF0aCA9IHBhdGguam9pbihfX2Rpcm5hbWUsICcuL2VwdWJ0cGwnKSBhcyBzdHJpbmc7XG5cbmV4cG9ydCBjb25zdCBkZWZhdWx0TGlzdCA9IHtcblx0J2lkcGYtd2FzdGVsYW5kJzogcGF0aC5qb2luKGRlZmF1bHRQYXRoLCAnLi9mcm9tX2lkcGZfZXB1YjMnKSxcblx0J2xpZ2h0bm92ZWwnOiBwYXRoLmpvaW4oZGVmYXVsdFBhdGgsICcuL2xpZ2h0bm92ZWwnKSxcbn0gYXMgSUxpc3Q7XG5cbmV4cG9ydCBpbnRlcmZhY2UgSU9wdGlvbnNcbntcblx0bGlzdD86IElMaXN0O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElMaXN0XG57XG5cdCdpZHBmLXdhc3RlbGFuZCc6IHN0cmluZztcblx0J2xpZ2h0bm92ZWwnOiBzdHJpbmc7XG5cblx0W2luZGV4OiBzdHJpbmddOiBhbnk7XG59XG5cbmV4cG9ydCBjbGFzcyBUZW1wbGF0ZU1hbmFnZXJzXG57XG5cdHB1YmxpYyBiYXNlUGF0aCA9IGRlZmF1bHRQYXRoO1xuXHRwdWJsaWMgbGlzdCA9IGRlZmF1bHRMaXN0O1xuXHRwdWJsaWMgcGF0aHM6IHN0cmluZ1tdID0gW107XG5cblx0Y29uc3RydWN0b3Iob3B0aW9uczogSU9wdGlvbnMgPSB7fSlcblx0e1xuXHRcdE9iamVjdC5hc3NpZ24odGhpcy5saXN0LCBvcHRpb25zLmxpc3QpO1xuXHR9XG5cblx0dmFsdWUoKVxuXHR7XG5cdFx0cmV0dXJuIHRoaXMubGlzdDtcblx0fVxuXG5cdC8qKlxuXHQgKlxuXHQgKiBAcGFyYW0ge3N0cmluZ30ga2V5XG5cdCAqIEBwYXJhbSB7YW55IHwgc3RyaW5nIHwgSUJ1aWxkZXJ9IHZhbHVlXG5cdCAqIEByZXR1cm5zIHt0aGlzfVxuXHQgKi9cblx0YWRkPFQgPSBhbnkgfCBzdHJpbmcgfCBJQnVpbGRlcj4oa2V5OiBzdHJpbmcsIHZhbHVlOiBUKVxuXHR7XG5cdFx0dGhpcy5saXN0W2tleV0gPSB2YWx1ZTtcblxuXHRcdHJldHVybiB0aGlzO1xuXHR9XG5cblx0aGFzPFQgPSBhbnkgfCBzdHJpbmcgfCBJQnVpbGRlcj4obmFtZTogc3RyaW5nKTogVFxuXHR7XG5cdFx0cmV0dXJuICh0aGlzLmxpc3RbbmFtZV0pO1xuXHR9XG5cblx0X2dldCh0KTogQlByb21pc2U8SUJ1aWxkZXI+XG5cdHtcblx0XHRyZXR1cm4gQlByb21pc2UucmVzb2x2ZSgpLnRoZW4oYXN5bmMgZnVuY3Rpb24gKClcblx0XHR7XG5cdFx0XHRsZXQgZm4gPSBhc3luYyBmdW5jdGlvbiAoYilcblx0XHRcdHtcblx0XHRcdFx0aWYgKCFiKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0Ly9cblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlIGlmIChiLmluaXQpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRyZXR1cm4gYXdhaXQgYi5pbml0KCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZSBpZiAoYi5idWlsZGVyKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0cmV0dXJuIGIuYnVpbGRlcjtcblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlIGlmIChiLkJ1aWxkZXIgJiYgdHlwZW9mIGIuQnVpbGRlci5tYWtlID09ICdmdW5jdGlvbicpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRyZXR1cm4gYi5CdWlsZGVyO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGVsc2UgaWYgKGIuQnVpbGRlcilcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHJldHVybiBhd2FpdCBuZXcgYi5CdWlsZGVyKCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZSBpZiAodHlwZW9mIGIgPT0gJ2Z1bmN0aW9uJylcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHJldHVybiBhd2FpdCBiKCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR0aHJvdyBuZXcgUmVmZXJlbmNlRXJyb3IoYHRwbCBcIiR7bmFtZX1cIiBub3QgZXhpc3RzYCk7XG5cdFx0XHR9O1xuXG5cdFx0XHRsZXQgcjogSUJ1aWxkZXI7XG5cblx0XHRcdGlmICghdClcblx0XHRcdHtcblx0XHRcdFx0Ly9cblx0XHRcdH1cblx0XHRcdGVsc2UgaWYgKHR5cGVvZiB0ID09ICdzdHJpbmcnKVxuXHRcdFx0e1xuXHRcdFx0XHRsZXQgYiA9IGF3YWl0IGltcG9ydCh0KTtcblxuXHRcdFx0XHRyID0gYXdhaXQgZm4oYik7XG5cdFx0XHR9XG5cdFx0XHRlbHNlXG5cdFx0XHR7XG5cdFx0XHRcdHIgPSBhd2FpdCBmbih0KTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKHIpXG5cdFx0XHR7XG5cdFx0XHRcdHJldHVybiByO1xuXHRcdFx0fVxuXG5cdFx0XHR0aHJvdyBuZXcgUmVmZXJlbmNlRXJyb3IoYHRwbCBcIiR7bmFtZX1cIiBub3QgZXhpc3RzYCk7XG5cdFx0fSlcblx0fVxuXG5cdGdldChuYW1lOiBzdHJpbmcpXG5cdHtcblx0XHRjb25zdCBzZWxmID0gdGhpcztcblxuXHRcdHJldHVybiBCUHJvbWlzZS5yZXNvbHZlKCkudGhlbihhc3luYyBmdW5jdGlvbiAoKVxuXHRcdHtcblx0XHRcdGlmIChzZWxmLmhhcyhuYW1lKSlcblx0XHRcdHtcblx0XHRcdFx0cmV0dXJuIHNlbGYuX2dldChzZWxmLmxpc3RbbmFtZV0pO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gc2VsZi5fZ2V0KGF3YWl0IHNlbGYuc2VhcmNoKG5hbWUpKTtcblx0XHR9KTtcblx0fVxuXG5cdGV4ZWMobmFtZTogc3RyaW5nLCBlcHViOiBFcHViTWFrZXIsIG9wdGlvbnM/KVxuXHR7XG5cdFx0Y29uc3Qgc2VsZiA9IHRoaXM7XG5cblx0XHRyZXR1cm4gQlByb21pc2UucmVzb2x2ZSgpLnRoZW4oYXN5bmMgZnVuY3Rpb24gKClcblx0XHR7XG5cdFx0XHRsZXQgYnVpbGRlciA9IGF3YWl0IHNlbGYuZ2V0KG5hbWUpO1xuXG5cdFx0XHRyZXR1cm4gYnVpbGRlci5tYWtlKGVwdWIsIG9wdGlvbnMpO1xuXHRcdH0pO1xuXHR9XG5cblx0c2VhcmNoKG5hbWU6IHN0cmluZyk6IHN0cmluZ1xuXHR7XG5cdFx0bGV0IHNlbGYgPSB0aGlzO1xuXG5cdFx0Y29uc3QgZm4gPSBmdW5jdGlvbiAoaWQpXG5cdFx0e1xuXHRcdFx0cmV0dXJuIEJQcm9taXNlLnJlc29sdmUoZnVuY3Rpb24gKClcblx0XHRcdHtcblx0XHRcdFx0Ly8gQHRzLWlnbm9yZVxuXHRcdFx0XHRyZXR1cm4gcmVxdWlyZS5yZXZlcnNlKGlkKTtcblx0XHRcdH0pO1xuXHRcdH07XG5cblx0XHRyZXR1cm4gZm4obmFtZSlcblx0XHRcdC5jYXRjaChmdW5jdGlvbiAoKVxuXHRcdFx0e1xuXHRcdFx0XHRyZXR1cm4gZm4ocGF0aC5qb2luKHNlbGYuYmFzZVBhdGgsIG5hbWUpKTtcblx0XHRcdH0pXG5cdFx0XHQuY2F0Y2goZnVuY3Rpb24gKGVycilcblx0XHRcdHtcblx0XHRcdFx0aWYgKEFycmF5LmlzQXJyYXkoc2VsZi5wYXRocykpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRsZXQgcHMgPSBbXTtcblxuXHRcdFx0XHRcdGZvciAobGV0IHYgb2Ygc2VsZi5wYXRocylcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRwcy5wdXNoKGZuKHBhdGguam9pbih2LCBuYW1lKSkpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdHJldHVybiBCUHJvbWlzZS5hbnkocHMpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0cmV0dXJuIEJQcm9taXNlLnJlamVjdChlcnIpO1xuXHRcdFx0fSlcblx0XHRcdC8vIEB0cy1pZ25vcmVcblx0XHRcdC50aGVuKGZ1bmN0aW9uIChyZXQpXG5cdFx0XHR7XG5cdFx0XHRcdGlmICghcmV0IHx8IHR5cGVvZiByZXQgIT09ICdzdHJpbmcnKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0cmV0dXJuIEJQcm9taXNlLnJlamVjdChgJHtyZXR9IG5vdCBhIHZhbGlkIHBhdGhgKTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHJldHVybiByZXQ7XG5cdFx0XHR9KVxuXHRcdFx0LmNhdGNoKGZ1bmN0aW9uICgpXG5cdFx0XHR7XG5cdFx0XHRcdHJldHVybiBmbihwYXRoLmpvaW4oJ0BlcHVidHBsJywgbmFtZSkpO1xuXHRcdFx0fSlcblx0XHRcdDtcblx0fVxufVxuXG5leHBvcnQgY29uc3QgdGVtcGxhdGVNYW5hZ2VycyA9IG5ldyBUZW1wbGF0ZU1hbmFnZXJzKCk7XG5cbmltcG9ydCBzZWxmID0gcmVxdWlyZSgnLi90ZW1wbGF0ZScpO1xuZXhwb3J0IGRlZmF1bHQgc2VsZjtcbiJdfQ==