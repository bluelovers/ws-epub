"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
const fetch = require("isomorphic-fetch");
exports.fetch = fetch;
const path = require("path");
const fileType = require("file-type");
const hashSum = require("hash-sum");
async function fetchFile(file, ...argv) {
    let _file;
    let err;
    if (file.data) {
        _file = file.data;
    }
    if (!_file && file.url) {
        _file = await fetch(file.url, ...argv)
            .then(function (ret) {
            try {
                if (!file.name && !file.basename && ret.headers.raw()['content-disposition'][0].match(/filename=(['"])?([^\'"]+)\1/)) {
                    let filename = RegExp.$2;
                    file.name = path.basename(filename);
                    //console.log(file.name);
                }
            }
            catch (e) {
            }
            //console.log(ret.headers, ret.headers.raw()['content-disposition'][0]);
            //.getResponseHeader('Content-Disposition')
            return ret.buffer();
        })
            .catch(function (e) {
            err = e;
        });
    }
    if (!_file && file.file) {
        _file = await fs.readFile(file.file);
    }
    if (!_file) {
        let e = err || new ReferenceError();
        e.data = file;
        throw e;
    }
    if (file.name && file.ext !== '') {
        file.ext = file.ext || path.extname(file.name);
        if (!file.ext) {
            file.ext = null;
        }
    }
    if (!file.ext || file.mime) {
        let data = fileType(_file);
        if (data) {
            if (file.ext !== '') {
                file.ext = file.ext || '.' + data.ext;
            }
            file.mime = file.mime || data.mime;
        }
        else if (file.ext !== '') {
            file.ext = file.ext || '.unknow';
        }
    }
    if (!file.name) {
        file.name = (file.basename || hashSum(file)) + file.ext;
    }
    file.data = _file;
    return file;
}
exports.fetchFile = fetchFile;
exports.default = fetch;
