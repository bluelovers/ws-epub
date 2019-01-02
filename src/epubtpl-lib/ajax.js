"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
const fetch = require("isomorphic-fetch");
exports.fetch = fetch;
const path = require("path");
const fileType = require("file-type");
const util_1 = require("../lib/util");
const imagemin = require("imagemin");
const imageminJpegtran = require("imagemin-jpegtran");
const imageminPngquant = require("imagemin-pngquant");
const imageminOptipng = require("imagemin-optipng");
async function fetchFile(file, ...argv) {
    let _file;
    let err;
    if (file.data) {
        _file = file.data;
    }
    if (!_file && file.url) {
        _file = await fetch(file.url, ...argv)
            .then(function (ret) {
            //console.log(file.name, ret.type, ret.headers);
            if (!file.mime) {
                let c = ret.headers.get('content-type');
                if (Array.isArray(c)) {
                    file.mime = c[0];
                }
                else if (typeof c === 'string') {
                    file.mime = c;
                }
            }
            try {
                // @ts-ignore
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
            // @ts-ignore
            return ret.buffer();
        })
            .catch(function (e) {
            err = e;
        });
    }
    if (!_file && file.file) {
        _file = await fs.readFile(file.file);
    }
    if (_file) {
        /**
         * 如果此部分發生錯誤則自動忽略
         */
        await Promise
            .resolve()
            .then(function () {
            return imagemin.buffer(_file, {
                plugins: [
                    imageminOptipng(),
                    imageminJpegtran(),
                    imageminPngquant({ quality: '65-80' })
                ]
            });
        })
            .then(function (buf) {
            if (Buffer.isBuffer(buf)) {
                _file = buf;
            }
        })
            .catch(function (e) {
            console.error('[ERROR] imagemin 發生不明錯誤，本次將忽略此錯誤', e.toString().replace(/^\s+|\s+$/, ''));
            //console.error(e);
        });
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
    if (!file.ext || !file.mime) {
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
        file.name = (file.basename || util_1.hashSum(file)) + file.ext;
    }
    file.data = _file;
    return file;
}
exports.fetchFile = fetchFile;
exports.default = fetch;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWpheC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImFqYXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFDQSwrQkFBK0I7QUFDL0IsMENBQTJDO0FBVWxDLHNCQUFLO0FBVGQsNkJBQTZCO0FBRTdCLHNDQUF1QztBQUN2QyxzQ0FBc0M7QUFDdEMscUNBQXNDO0FBQ3RDLHNEQUF1RDtBQUN2RCxzREFBdUQ7QUFDdkQsb0RBQXFEO0FBSTlDLEtBQUssVUFBVSxTQUFTLENBQUMsSUFBWSxFQUFFLEdBQUcsSUFBSTtJQUVwRCxJQUFJLEtBQUssQ0FBQztJQUNWLElBQUksR0FBRyxDQUFDO0lBRVIsSUFBSSxJQUFJLENBQUMsSUFBSSxFQUNiO1FBQ0MsS0FBSyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7S0FDbEI7SUFFRCxJQUFJLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQyxHQUFHLEVBQ3RCO1FBQ0MsS0FBSyxHQUFHLE1BQU0sS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxJQUFJLENBQUM7YUFDcEMsSUFBSSxDQUFDLFVBQVUsR0FBRztZQUdsQixnREFBZ0Q7WUFFaEQsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQ2Q7Z0JBQ0MsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLENBQUM7Z0JBRXhDLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFDcEI7b0JBQ0MsSUFBSSxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7aUJBQ2pCO3FCQUNJLElBQUksT0FBTyxDQUFDLEtBQUssUUFBUSxFQUM5QjtvQkFDQyxJQUFJLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQztpQkFDZDthQUNEO1lBRUQsSUFDQTtnQkFDQyxhQUFhO2dCQUNiLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsSUFB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O1lBQ0MsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxJQUFJLFNBQVMsQ0FBQztTQUNqQztLQUNEO0lBRUQsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQ2Q7UUFDQyxJQUFJLENBQUMsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLFFBQVEsSUFBSSxjQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDO0tBQ3hEO0lBRUQsSUFBSSxDQUFDLElBQUksR0FBRyxLQUFLLENBQUM7SUFFbEIsT0FBTyxJQUFJLENBQUM7QUFDYixDQUFDO0FBakpELDhCQWlKQztBQUVELGtCQUFlLEtBQUssQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIlxuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMtZXh0cmEnO1xuaW1wb3J0IGZldGNoID0gcmVxdWlyZSgnaXNvbW9ycGhpYy1mZXRjaCcpO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IHsgSUZpbGVzIH0gZnJvbSAnLi4vY29uZmlnJztcbmltcG9ydCBmaWxlVHlwZSA9IHJlcXVpcmUoJ2ZpbGUtdHlwZScpO1xuaW1wb3J0IHsgaGFzaFN1bSB9IGZyb20gJy4uL2xpYi91dGlsJztcbmltcG9ydCBpbWFnZW1pbiA9IHJlcXVpcmUoJ2ltYWdlbWluJyk7XG5pbXBvcnQgaW1hZ2VtaW5KcGVndHJhbiA9IHJlcXVpcmUoJ2ltYWdlbWluLWpwZWd0cmFuJyk7XG5pbXBvcnQgaW1hZ2VtaW5QbmdxdWFudCA9IHJlcXVpcmUoJ2ltYWdlbWluLXBuZ3F1YW50Jyk7XG5pbXBvcnQgaW1hZ2VtaW5PcHRpcG5nID0gcmVxdWlyZSgnaW1hZ2VtaW4tb3B0aXBuZycpO1xuXG5leHBvcnQgeyBmZXRjaCB9XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBmZXRjaEZpbGUoZmlsZTogSUZpbGVzLCAuLi5hcmd2KVxue1xuXHRsZXQgX2ZpbGU7XG5cdGxldCBlcnI7XG5cblx0aWYgKGZpbGUuZGF0YSlcblx0e1xuXHRcdF9maWxlID0gZmlsZS5kYXRhO1xuXHR9XG5cblx0aWYgKCFfZmlsZSAmJiBmaWxlLnVybClcblx0e1xuXHRcdF9maWxlID0gYXdhaXQgZmV0Y2goZmlsZS51cmwsIC4uLmFyZ3YpXG5cdFx0XHQudGhlbihmdW5jdGlvbiAocmV0KVxuXHRcdFx0e1xuXG5cdFx0XHRcdC8vY29uc29sZS5sb2coZmlsZS5uYW1lLCByZXQudHlwZSwgcmV0LmhlYWRlcnMpO1xuXG5cdFx0XHRcdGlmICghZmlsZS5taW1lKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0bGV0IGMgPSByZXQuaGVhZGVycy5nZXQoJ2NvbnRlbnQtdHlwZScpO1xuXG5cdFx0XHRcdFx0aWYgKEFycmF5LmlzQXJyYXkoYykpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0ZmlsZS5taW1lID0gY1swXTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZSBpZiAodHlwZW9mIGMgPT09ICdzdHJpbmcnKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGZpbGUubWltZSA9IGM7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdFx0dHJ5XG5cdFx0XHRcdHtcblx0XHRcdFx0XHQvLyBAdHMtaWdub3JlXG5cdFx0XHRcdFx0aWYgKCFmaWxlLm5hbWUgJiYgIWZpbGUuYmFzZW5hbWUgJiYgcmV0LmhlYWRlcnMucmF3KClbJ2NvbnRlbnQtZGlzcG9zaXRpb24nXVswXS5tYXRjaCgvZmlsZW5hbWU9KFsnXCJdKT8oW15cXCdcIl0rKVxcMS8pKVxuXHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdGxldCBmaWxlbmFtZSA9IFJlZ0V4cC4kMjtcblxuXHRcdFx0XHRcdFx0ZmlsZS5uYW1lID0gcGF0aC5iYXNlbmFtZShmaWxlbmFtZSk7XG5cblx0XHRcdFx0XHRcdC8vY29uc29sZS5sb2coZmlsZS5uYW1lKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0Y2F0Y2ggKGUpXG5cdFx0XHRcdHtcblxuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly9jb25zb2xlLmxvZyhyZXQuaGVhZGVycywgcmV0LmhlYWRlcnMucmF3KClbJ2NvbnRlbnQtZGlzcG9zaXRpb24nXVswXSk7XG5cdFx0XHRcdC8vLmdldFJlc3BvbnNlSGVhZGVyKCdDb250ZW50LURpc3Bvc2l0aW9uJylcblxuXHRcdFx0XHQvLyBAdHMtaWdub3JlXG5cdFx0XHRcdHJldHVybiByZXQuYnVmZmVyKClcblx0XHRcdH0pXG5cdFx0XHQuY2F0Y2goZnVuY3Rpb24gKGUpXG5cdFx0XHR7XG5cdFx0XHRcdGVyciA9IGU7XG5cdFx0XHR9KVxuXG5cdFx0O1xuXHR9XG5cblx0aWYgKCFfZmlsZSAmJiBmaWxlLmZpbGUpXG5cdHtcblx0XHRfZmlsZSA9IGF3YWl0IGZzLnJlYWRGaWxlKGZpbGUuZmlsZSk7XG5cdH1cblxuXHRpZiAoX2ZpbGUpXG5cdHtcblx0XHQvKipcblx0XHQgKiDlpoLmnpzmraTpg6jliIbnmbznlJ/pjK/oqqTliYfoh6rli5Xlv73nlaVcblx0XHQgKi9cblx0XHRhd2FpdCBQcm9taXNlXG5cdFx0XHQucmVzb2x2ZSgpXG5cdFx0XHQudGhlbihmdW5jdGlvbiAoKVxuXHRcdFx0e1xuXHRcdFx0XHRyZXR1cm4gaW1hZ2VtaW4uYnVmZmVyKF9maWxlLCB7XG5cdFx0XHRcdFx0cGx1Z2luczogW1xuXHRcdFx0XHRcdFx0aW1hZ2VtaW5PcHRpcG5nKCksXG5cdFx0XHRcdFx0XHRpbWFnZW1pbkpwZWd0cmFuKCksXG5cdFx0XHRcdFx0XHRpbWFnZW1pblBuZ3F1YW50KHtxdWFsaXR5OiAnNjUtODAnfSlcblx0XHRcdFx0XHRdXG5cdFx0XHRcdH0pXG5cdFx0XHR9KVxuXHRcdFx0LnRoZW4oZnVuY3Rpb24gKGJ1Zilcblx0XHRcdHtcblx0XHRcdFx0aWYgKEJ1ZmZlci5pc0J1ZmZlcihidWYpKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0X2ZpbGUgPSBidWZcblx0XHRcdFx0fVxuXHRcdFx0fSlcblx0XHRcdC5jYXRjaChmdW5jdGlvbiAoZSlcblx0XHRcdHtcblx0XHRcdFx0Y29uc29sZS5lcnJvcignW0VSUk9SXSBpbWFnZW1pbiDnmbznlJ/kuI3mmI7pjK/oqqTvvIzmnKzmrKHlsIflv73nlaXmraTpjK/oqqQnLCBlLnRvU3RyaW5nKCkucmVwbGFjZSgvXlxccyt8XFxzKyQvLCAnJykpO1xuXHRcdFx0XHQvL2NvbnNvbGUuZXJyb3IoZSk7XG5cdFx0XHR9KVxuXHRcdDtcblx0fVxuXG5cdGlmICghX2ZpbGUpXG5cdHtcblx0XHRsZXQgZSA9IGVyciB8fCBuZXcgUmVmZXJlbmNlRXJyb3IoKTtcblx0XHRlLmRhdGEgPSBmaWxlO1xuXG5cdFx0dGhyb3cgZTtcblx0fVxuXG5cdGlmIChmaWxlLm5hbWUgJiYgZmlsZS5leHQgIT09ICcnKVxuXHR7XG5cdFx0ZmlsZS5leHQgPSBmaWxlLmV4dCB8fCBwYXRoLmV4dG5hbWUoZmlsZS5uYW1lKTtcblxuXHRcdGlmICghZmlsZS5leHQpXG5cdFx0e1xuXHRcdFx0ZmlsZS5leHQgPSBudWxsO1xuXHRcdH1cblx0fVxuXG5cdGlmICghZmlsZS5leHQgfHwgIWZpbGUubWltZSlcblx0e1xuXHRcdGxldCBkYXRhID0gZmlsZVR5cGUoX2ZpbGUpO1xuXG5cdFx0aWYgKGRhdGEpXG5cdFx0e1xuXHRcdFx0aWYgKGZpbGUuZXh0ICE9PSAnJylcblx0XHRcdHtcblx0XHRcdFx0ZmlsZS5leHQgPSBmaWxlLmV4dCB8fCAnLicgKyBkYXRhLmV4dDtcblx0XHRcdH1cblxuXHRcdFx0ZmlsZS5taW1lID0gZmlsZS5taW1lIHx8IGRhdGEubWltZTtcblx0XHR9XG5cdFx0ZWxzZSBpZiAoZmlsZS5leHQgIT09ICcnKVxuXHRcdHtcblx0XHRcdGZpbGUuZXh0ID0gZmlsZS5leHQgfHwgJy51bmtub3cnO1xuXHRcdH1cblx0fVxuXG5cdGlmICghZmlsZS5uYW1lKVxuXHR7XG5cdFx0ZmlsZS5uYW1lID0gKGZpbGUuYmFzZW5hbWUgfHwgaGFzaFN1bShmaWxlKSkgKyBmaWxlLmV4dDtcblx0fVxuXG5cdGZpbGUuZGF0YSA9IF9maWxlO1xuXG5cdHJldHVybiBmaWxlO1xufVxuXG5leHBvcnQgZGVmYXVsdCBmZXRjaDtcbiJdfQ==