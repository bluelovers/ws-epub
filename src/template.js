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
