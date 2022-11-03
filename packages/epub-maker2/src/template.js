"use strict";
/**
 * Created by user on 2017/12/12/012.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.templateManagers = exports.TemplateManagers = exports.defaultList = exports.defaultPath = void 0;
const tslib_1 = require("tslib");
const upath2_1 = tslib_1.__importDefault(require("upath2"));
const util_1 = require("./lib/util");
exports.defaultPath = upath2_1.default.join(__dirname, './epubtpl');
exports.defaultList = {
    'idpf-wasteland': upath2_1.default.join(exports.defaultPath, './from_idpf_epub3'),
    'lightnovel': upath2_1.default.join(exports.defaultPath, './lightnovel'),
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
            var _a;
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
                let b = await (_a = t, Promise.resolve().then(() => tslib_1.__importStar(require(_a))));
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
        // @ts-ignore
        return fn(name)
            .catch(function () {
            return fn(upath2_1.default.join(self.basePath, name));
        })
            .catch(function (err) {
            if (Array.isArray(self.paths)) {
                let ps = [];
                for (let v of self.paths) {
                    ps.push(fn(upath2_1.default.join(v, name)));
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
            return fn(upath2_1.default.join('@epubtpl', name));
        });
    }
}
exports.TemplateManagers = TemplateManagers;
exports.templateManagers = new TemplateManagers();
exports.default = exports;
//# sourceMappingURL=template.js.map