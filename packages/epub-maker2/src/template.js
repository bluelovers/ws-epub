"use strict";
/**
 * Created by user on 2017/12/12/012.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.templateManagers = exports.TemplateManagers = exports.defaultList = exports.defaultPath = void 0;
const upath2_1 = __importDefault(require("upath2"));
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
                let b = await Promise.resolve().then(() => __importStar(require(t)));
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