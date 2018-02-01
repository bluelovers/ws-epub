"use strict";
/**
 * Created by user on 2018/2/1/001.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const libEPub = require("./epub");
const Promise = require("bluebird");
class EPub extends libEPub {
    static createAsync(epubfile, imagewebroot, chapterwebroot, ...argv) {
        const self = this;
        const p = self.libPromise;
        return new p(function (resolve, reject) {
            const epub = self.create(epubfile, imagewebroot, chapterwebroot, ...argv);
            const cb_err = function (err) {
                err.epub = epub;
                return reject(err);
            };
            epub.on('error', cb_err);
            epub.on('end', function (err) {
                if (err) {
                    cb_err(err);
                }
                else {
                    resolve(this);
                }
            });
            epub.parse();
        });
    }
    _p_method_cb(method, options = {}, ...argv) {
        const self = this;
        const p = EPub.libPromise;
        return Promise.fromCallback(method.bind(self, argv), options);
    }
    getChapterAsync(chapterId) {
        return this._p_method_cb(this.getChapter, null, chapterId);
    }
    getChapterRawAsync(chapterId) {
        return this._p_method_cb(this.getChapterRaw, null, chapterId);
    }
    getFileAsync(id) {
        return this._p_method_cb(this.getFile, {
            multiArgs: true,
        }, id);
    }
    getImageAsync(id) {
        return this._p_method_cb(this.getImage, {
            multiArgs: true,
        }, id);
    }
}
exports.EPub = EPub;
(function (EPub) {
    /**
     * allow change Promise class
     * @type {PromiseConstructor}
     */
    EPub.libPromise = Promise;
})(EPub = exports.EPub || (exports.EPub = {}));
exports.default = EPub;
