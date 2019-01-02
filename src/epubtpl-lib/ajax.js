"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
const fetch = require("isomorphic-fetch");
exports.fetch = fetch;
const path = require("path");
const fileType = require("file-type");
const hashSum = require("hash-sum");
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
        file.name = (file.basename || hashSum(file)) + file.ext;
    }
    file.data = _file;
    return file;
}
exports.fetchFile = fetchFile;
exports.default = fetch;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWpheC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImFqYXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFDQSwrQkFBK0I7QUFDL0IsMENBQTJDO0FBVWxDLHNCQUFLO0FBVGQsNkJBQTZCO0FBRTdCLHNDQUF1QztBQUN2QyxvQ0FBcUM7QUFDckMscUNBQXNDO0FBQ3RDLHNEQUF1RDtBQUN2RCxzREFBdUQ7QUFDdkQsb0RBQXFEO0FBSTlDLEtBQUssVUFBVSxTQUFTLENBQUMsSUFBWSxFQUFFLEdBQUcsSUFBSTtJQUVwRCxJQUFJLEtBQUssQ0FBQztJQUNWLElBQUksR0FBRyxDQUFDO0lBRVIsSUFBSSxJQUFJLENBQUMsSUFBSSxFQUNiO1FBQ0MsS0FBSyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7S0FDbEI7SUFFRCxJQUFJLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQyxHQUFHLEVBQ3RCO1FBQ0MsS0FBSyxHQUFHLE1BQU0sS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxJQUFJLENBQUM7YUFDcEMsSUFBSSxDQUFDLFVBQVUsR0FBRztZQUdsQixnREFBZ0Q7WUFFaEQsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQ2Q7Z0JBQ0MsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLENBQUM7Z0JBRXhDLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFDcEI7b0JBQ0MsSUFBSSxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7aUJBQ2pCO3FCQUNJLElBQUksT0FBTyxDQUFDLEtBQUssUUFBUSxFQUM5QjtvQkFDQyxJQUFJLENBQUMsSUFBSSxHQUFHLENBQUMsQ0FBQztpQkFDZDthQUNEO1lBRUQsSUFDQTtnQkFDQyxhQUFhO2dCQUNiLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsSUFB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O1lBQ0MsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxJQUFJLFNBQVMsQ0FBQztTQUNqQztLQUNEO0lBRUQsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQ2Q7UUFDQyxJQUFJLENBQUMsSUFBSSxHQUFHLENBQUMsSUFBSSxDQUFDLFFBQVEsSUFBSSxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDO0tBQ3hEO0lBRUQsSUFBSSxDQUFDLElBQUksR0FBRyxLQUFLLENBQUM7SUFFbEIsT0FBTyxJQUFJLENBQUM7QUFDYixDQUFDO0FBakpELDhCQWlKQztBQUVELGtCQUFlLEtBQUssQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIlxuaW1wb3J0ICogYXMgZnMgZnJvbSAnZnMtZXh0cmEnO1xuaW1wb3J0IGZldGNoID0gcmVxdWlyZSgnaXNvbW9ycGhpYy1mZXRjaCcpO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IHsgSUZpbGVzIH0gZnJvbSAnLi4vY29uZmlnJztcbmltcG9ydCBmaWxlVHlwZSA9IHJlcXVpcmUoJ2ZpbGUtdHlwZScpO1xuaW1wb3J0IGhhc2hTdW0gPSByZXF1aXJlKCdoYXNoLXN1bScpO1xuaW1wb3J0IGltYWdlbWluID0gcmVxdWlyZSgnaW1hZ2VtaW4nKTtcbmltcG9ydCBpbWFnZW1pbkpwZWd0cmFuID0gcmVxdWlyZSgnaW1hZ2VtaW4tanBlZ3RyYW4nKTtcbmltcG9ydCBpbWFnZW1pblBuZ3F1YW50ID0gcmVxdWlyZSgnaW1hZ2VtaW4tcG5ncXVhbnQnKTtcbmltcG9ydCBpbWFnZW1pbk9wdGlwbmcgPSByZXF1aXJlKCdpbWFnZW1pbi1vcHRpcG5nJyk7XG5cbmV4cG9ydCB7IGZldGNoIH1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGZldGNoRmlsZShmaWxlOiBJRmlsZXMsIC4uLmFyZ3YpXG57XG5cdGxldCBfZmlsZTtcblx0bGV0IGVycjtcblxuXHRpZiAoZmlsZS5kYXRhKVxuXHR7XG5cdFx0X2ZpbGUgPSBmaWxlLmRhdGE7XG5cdH1cblxuXHRpZiAoIV9maWxlICYmIGZpbGUudXJsKVxuXHR7XG5cdFx0X2ZpbGUgPSBhd2FpdCBmZXRjaChmaWxlLnVybCwgLi4uYXJndilcblx0XHRcdC50aGVuKGZ1bmN0aW9uIChyZXQpXG5cdFx0XHR7XG5cblx0XHRcdFx0Ly9jb25zb2xlLmxvZyhmaWxlLm5hbWUsIHJldC50eXBlLCByZXQuaGVhZGVycyk7XG5cblx0XHRcdFx0aWYgKCFmaWxlLm1pbWUpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRsZXQgYyA9IHJldC5oZWFkZXJzLmdldCgnY29udGVudC10eXBlJyk7XG5cblx0XHRcdFx0XHRpZiAoQXJyYXkuaXNBcnJheShjKSlcblx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRmaWxlLm1pbWUgPSBjWzBdO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlIGlmICh0eXBlb2YgYyA9PT0gJ3N0cmluZycpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0ZmlsZS5taW1lID0gYztcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR0cnlcblx0XHRcdFx0e1xuXHRcdFx0XHRcdC8vIEB0cy1pZ25vcmVcblx0XHRcdFx0XHRpZiAoIWZpbGUubmFtZSAmJiAhZmlsZS5iYXNlbmFtZSAmJiByZXQuaGVhZGVycy5yYXcoKVsnY29udGVudC1kaXNwb3NpdGlvbiddWzBdLm1hdGNoKC9maWxlbmFtZT0oWydcIl0pPyhbXlxcJ1wiXSspXFwxLykpXG5cdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0bGV0IGZpbGVuYW1lID0gUmVnRXhwLiQyO1xuXG5cdFx0XHRcdFx0XHRmaWxlLm5hbWUgPSBwYXRoLmJhc2VuYW1lKGZpbGVuYW1lKTtcblxuXHRcdFx0XHRcdFx0Ly9jb25zb2xlLmxvZyhmaWxlLm5hbWUpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XHRjYXRjaCAoZSlcblx0XHRcdFx0e1xuXG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvL2NvbnNvbGUubG9nKHJldC5oZWFkZXJzLCByZXQuaGVhZGVycy5yYXcoKVsnY29udGVudC1kaXNwb3NpdGlvbiddWzBdKTtcblx0XHRcdFx0Ly8uZ2V0UmVzcG9uc2VIZWFkZXIoJ0NvbnRlbnQtRGlzcG9zaXRpb24nKVxuXG5cdFx0XHRcdC8vIEB0cy1pZ25vcmVcblx0XHRcdFx0cmV0dXJuIHJldC5idWZmZXIoKVxuXHRcdFx0fSlcblx0XHRcdC5jYXRjaChmdW5jdGlvbiAoZSlcblx0XHRcdHtcblx0XHRcdFx0ZXJyID0gZTtcblx0XHRcdH0pXG5cblx0XHQ7XG5cdH1cblxuXHRpZiAoIV9maWxlICYmIGZpbGUuZmlsZSlcblx0e1xuXHRcdF9maWxlID0gYXdhaXQgZnMucmVhZEZpbGUoZmlsZS5maWxlKTtcblx0fVxuXG5cdGlmIChfZmlsZSlcblx0e1xuXHRcdC8qKlxuXHRcdCAqIOWmguaenOatpOmDqOWIhueZvOeUn+mMr+iqpOWJh+iHquWLleW/veeVpVxuXHRcdCAqL1xuXHRcdGF3YWl0IFByb21pc2Vcblx0XHRcdC5yZXNvbHZlKClcblx0XHRcdC50aGVuKGZ1bmN0aW9uICgpXG5cdFx0XHR7XG5cdFx0XHRcdHJldHVybiBpbWFnZW1pbi5idWZmZXIoX2ZpbGUsIHtcblx0XHRcdFx0XHRwbHVnaW5zOiBbXG5cdFx0XHRcdFx0XHRpbWFnZW1pbk9wdGlwbmcoKSxcblx0XHRcdFx0XHRcdGltYWdlbWluSnBlZ3RyYW4oKSxcblx0XHRcdFx0XHRcdGltYWdlbWluUG5ncXVhbnQoe3F1YWxpdHk6ICc2NS04MCd9KVxuXHRcdFx0XHRcdF1cblx0XHRcdFx0fSlcblx0XHRcdH0pXG5cdFx0XHQudGhlbihmdW5jdGlvbiAoYnVmKVxuXHRcdFx0e1xuXHRcdFx0XHRpZiAoQnVmZmVyLmlzQnVmZmVyKGJ1ZikpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRfZmlsZSA9IGJ1ZlxuXHRcdFx0XHR9XG5cdFx0XHR9KVxuXHRcdFx0LmNhdGNoKGZ1bmN0aW9uIChlKVxuXHRcdFx0e1xuXHRcdFx0XHRjb25zb2xlLmVycm9yKCdbRVJST1JdIGltYWdlbWluIOeZvOeUn+S4jeaYjumMr+iqpO+8jOacrOasoeWwh+W/veeVpeatpOmMr+iqpCcsIGUudG9TdHJpbmcoKS5yZXBsYWNlKC9eXFxzK3xcXHMrJC8sICcnKSk7XG5cdFx0XHRcdC8vY29uc29sZS5lcnJvcihlKTtcblx0XHRcdH0pXG5cdFx0O1xuXHR9XG5cblx0aWYgKCFfZmlsZSlcblx0e1xuXHRcdGxldCBlID0gZXJyIHx8IG5ldyBSZWZlcmVuY2VFcnJvcigpO1xuXHRcdGUuZGF0YSA9IGZpbGU7XG5cblx0XHR0aHJvdyBlO1xuXHR9XG5cblx0aWYgKGZpbGUubmFtZSAmJiBmaWxlLmV4dCAhPT0gJycpXG5cdHtcblx0XHRmaWxlLmV4dCA9IGZpbGUuZXh0IHx8IHBhdGguZXh0bmFtZShmaWxlLm5hbWUpO1xuXG5cdFx0aWYgKCFmaWxlLmV4dClcblx0XHR7XG5cdFx0XHRmaWxlLmV4dCA9IG51bGw7XG5cdFx0fVxuXHR9XG5cblx0aWYgKCFmaWxlLmV4dCB8fCAhZmlsZS5taW1lKVxuXHR7XG5cdFx0bGV0IGRhdGEgPSBmaWxlVHlwZShfZmlsZSk7XG5cblx0XHRpZiAoZGF0YSlcblx0XHR7XG5cdFx0XHRpZiAoZmlsZS5leHQgIT09ICcnKVxuXHRcdFx0e1xuXHRcdFx0XHRmaWxlLmV4dCA9IGZpbGUuZXh0IHx8ICcuJyArIGRhdGEuZXh0O1xuXHRcdFx0fVxuXG5cdFx0XHRmaWxlLm1pbWUgPSBmaWxlLm1pbWUgfHwgZGF0YS5taW1lO1xuXHRcdH1cblx0XHRlbHNlIGlmIChmaWxlLmV4dCAhPT0gJycpXG5cdFx0e1xuXHRcdFx0ZmlsZS5leHQgPSBmaWxlLmV4dCB8fCAnLnVua25vdyc7XG5cdFx0fVxuXHR9XG5cblx0aWYgKCFmaWxlLm5hbWUpXG5cdHtcblx0XHRmaWxlLm5hbWUgPSAoZmlsZS5iYXNlbmFtZSB8fCBoYXNoU3VtKGZpbGUpKSArIGZpbGUuZXh0O1xuXHR9XG5cblx0ZmlsZS5kYXRhID0gX2ZpbGU7XG5cblx0cmV0dXJuIGZpbGU7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGZldGNoO1xuIl19