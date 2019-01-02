"use strict";
/**
 * Created by user on 2017/12/12/012.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const JSZip = require("jszip");
exports.JSZip = JSZip;
const path = require("path");
const ajax_1 = require("./ajax");
const util_1 = require("../lib/util");
/*
export async function addMimetype(zip: JSZip, epub: EpubMaker, options)
{
    return zip.file('mimetype', options.templates.mimetype);
}

export function addContainerInfo(zip: JSZip, epub: EpubMaker, options)
{
    return zip.folder('META-INF').file('container.xml', compileTpl(options.templates.container, epub.epubConfig));
}
*/
function parseFileSetting(coverUrl, epubConfig) {
    let cover;
    if (typeof coverUrl == 'string') {
        let r = /^(?:\w+:)?\/{2,3}.+/;
        //console.log(path.isAbsolute(coverUrl), coverUrl, r.exec(coverUrl));
        if (!path.isAbsolute(coverUrl) && r.exec(coverUrl)) {
            cover = {
                url: coverUrl,
            };
        }
        else {
            let cwd = epubConfig.cwd || process.cwd();
            cover = {
                file: path.isAbsolute(coverUrl) ? coverUrl : path.join(cwd, coverUrl),
            };
        }
        //console.log(cover);
    }
    else if (coverUrl && (coverUrl.url || coverUrl.file)) {
        cover = coverUrl;
    }
    return cover;
}
exports.parseFileSetting = parseFileSetting;
function addStaticFiles(zip, staticFiles) {
    let cache = {};
    return util_1.BPromise.mapSeries(staticFiles, async function (_file) {
        let file;
        if (!_file.data
            && _file.url
            && cache[_file.url]
            && cache[_file.url].data) {
            let cf = cache[_file.url];
            _file.data = cf.data;
            _file.mime = _file.mime || cf.mime;
        }
        file = await ajax_1.fetchFile(_file);
        if (_file.url) {
            cache[_file.url] = _file;
        }
        zip
            .folder(file.folder)
            .file(file.name, file.data);
        return file;
    })
        .tap(function () {
        cache = null;
    });
}
exports.addStaticFiles = addStaticFiles;
function addFiles(zip, epub, options) {
    let staticFiles = epub.epubConfig.additionalFiles.reduce(function (a, file) {
        a.push(Object.assign({}, file, {
            folder: file.folder ? path.join('EPUB', file.folder) : 'EPUB',
        }));
        return a;
    }, []);
    return addStaticFiles(zip, staticFiles)
        .then(function (staticFiles) {
        epub.epubConfig.additionalFiles.forEach((v, i) => {
            let s = staticFiles[i];
            v.mime = v.mime || s.mime;
            v.name = s.name;
            if (v.folder === null) {
                // @ts-ignore
                v.href = v.name;
            }
            else {
                // @ts-ignore
                v.href = [v.folder, v.name].join('/');
            }
            // @ts-ignore
            v.id = v.id || 'additionalFiles-' + util_1.hashSum(v.name);
        });
        //console.log(epub.epubConfig.additionalFiles, staticFiles);
        return staticFiles;
    });
}
exports.addFiles = addFiles;
async function addCover(zip, epub, options) {
    if (epub.epubConfig.cover) {
        epub.epubConfig.cover.basename = 'CoverDesign';
        let file = await ajax_1.fetchFile(epub.epubConfig.cover)
            .catch(e => {
            console.error(e && e.meggage || `can't fetch cover`);
            return null;
        });
        if (!file) {
            return false;
        }
        //file.name = `CoverDesign${file.ext}`;
        let filename = file.name = file.folder ? path.join(file.folder, file.name) : file.name;
        zip
            .folder('EPUB')
            //.folder('images')
            .file(filename, file.data);
        return filename;
    }
    return false;
}
exports.addCover = addCover;
function addSubSections(zip, section, cb, epub, options) {
    return util_1.BPromise
        .resolve(cb(zip, section, epub.epubConfig, options))
        .then(function () {
        return util_1.BPromise.mapSeries(section.subSections, function (subSection) {
            return addSubSections(zip, subSection, cb, epub, options);
        });
    });
}
exports.addSubSections = addSubSections;
const self = require("./zip");
exports.default = self;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiemlwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiemlwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7R0FFRzs7QUFFSCwrQkFBZ0M7QUFRdkIsc0JBQUs7QUFMZCw2QkFBNkI7QUFFN0IsaUNBQW1DO0FBQ25DLHNDQUFnRDtBQUloRDs7Ozs7Ozs7OztFQVVFO0FBRUYsU0FBZ0IsZ0JBQWdCLENBQUMsUUFBUSxFQUFFLFVBQXVCO0lBRWpFLElBQUksS0FBYSxDQUFDO0lBRWxCLElBQUksT0FBTyxRQUFRLElBQUksUUFBUSxFQUMvQjtRQUNDLElBQUksQ0FBQyxHQUFHLHFCQUFxQixDQUFDO1FBRTlCLHFFQUFxRTtRQUVyRSxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUNsRDtZQUNDLEtBQUssR0FBRztnQkFDUCxHQUFHLEVBQUUsUUFBUTthQUNiLENBQUM7U0FDRjthQUVEO1lBQ0MsSUFBSSxHQUFHLEdBQUcsVUFBVSxDQUFDLEdBQUcsSUFBSSxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUM7WUFFMUMsS0FBSyxHQUFHO2dCQUNQLElBQUksRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLFFBQVEsQ0FBQzthQUNyRSxDQUFDO1NBQ0Y7UUFFRCxxQkFBcUI7S0FDckI7U0FDSSxJQUFJLFFBQVEsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLElBQUksUUFBUSxDQUFDLElBQUksQ0FBQyxFQUNwRDtRQUNDLEtBQUssR0FBRyxRQUFRLENBQUM7S0FDakI7SUFFRCxPQUFPLEtBQUssQ0FBQztBQUNkLENBQUM7QUFqQ0QsNENBaUNDO0FBRUQsU0FBZ0IsY0FBYyxDQUFDLEdBQUcsRUFBRSxXQUFxQjtJQUV4RCxJQUFJLEtB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R1IsT0FBTyxlQUFRO1NBQ2IsT0FBTyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxVQUFVLEVBQUUsT0FBTyxDQUFDLENBQUM7U0FDbkQsSUFBSSxDQUFDO1FBRUwsT0FBTyxlQUFRLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsVUFBVSxVQUE2QjtZQUVyRixPQUFPLGNBQWMsQ0FBQyxHQUFHLEVBQUUsVUFBVSxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDM0QsQ0FBQyxDQUFDLENBQUM7SUFDSixDQUFDLENBQUMsQ0FDRDtBQUNILENBQUM7QUFqQkQsd0NBaUJDO0FBRUQsOEJBQThCO0FBRTlCLGtCQUFlLElBQUksQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ3JlYXRlZCBieSB1c2VyIG9uIDIwMTcvMTIvMTIvMDEyLlxuICovXG5cbmltcG9ydCBKU1ppcCA9IHJlcXVpcmUoJ2pzemlwJyk7XG5pbXBvcnQgeyBJRmlsZXMsIElDb3ZlciwgRXB1YkNvbmZpZywgSUVwdWJDb25maWcgfSBmcm9tICcuLi9jb25maWcnO1xuaW1wb3J0IHsgY29tcGlsZVRwbCB9IGZyb20gJy4vaGFuZGxlYmFyLWhlbHBlcnMnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IEVwdWJNYWtlciB9IGZyb20gJy4uL2luZGV4JztcbmltcG9ydCB7IGZldGNoRmlsZSB9IGZyb20gJy4vYWpheCc7XG5pbXBvcnQgeyBoYXNoU3VtLCBCUHJvbWlzZSB9IGZyb20gJy4uL2xpYi91dGlsJztcblxuZXhwb3J0IHsgSlNaaXAgfVxuXG4vKlxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGFkZE1pbWV0eXBlKHppcDogSlNaaXAsIGVwdWI6IEVwdWJNYWtlciwgb3B0aW9ucylcbntcblx0cmV0dXJuIHppcC5maWxlKCdtaW1ldHlwZScsIG9wdGlvbnMudGVtcGxhdGVzLm1pbWV0eXBlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFkZENvbnRhaW5lckluZm8oemlwOiBKU1ppcCwgZXB1YjogRXB1Yk1ha2VyLCBvcHRpb25zKVxue1xuXHRyZXR1cm4gemlwLmZvbGRlcignTUVUQS1JTkYnKS5maWxlKCdjb250YWluZXIueG1sJywgY29tcGlsZVRwbChvcHRpb25zLnRlbXBsYXRlcy5jb250YWluZXIsIGVwdWIuZXB1YkNvbmZpZykpO1xufVxuKi9cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlRmlsZVNldHRpbmcoY292ZXJVcmwsIGVwdWJDb25maWc6IElFcHViQ29uZmlnKTogSUZpbGVzXG57XG5cdGxldCBjb3ZlcjogSUNvdmVyO1xuXG5cdGlmICh0eXBlb2YgY292ZXJVcmwgPT0gJ3N0cmluZycpXG5cdHtcblx0XHRsZXQgciA9IC9eKD86XFx3KzopP1xcL3syLDN9LisvO1xuXG5cdFx0Ly9jb25zb2xlLmxvZyhwYXRoLmlzQWJzb2x1dGUoY292ZXJVcmwpLCBjb3ZlclVybCwgci5leGVjKGNvdmVyVXJsKSk7XG5cblx0XHRpZiAoIXBhdGguaXNBYnNvbHV0ZShjb3ZlclVybCkgJiYgci5leGVjKGNvdmVyVXJsKSlcblx0XHR7XG5cdFx0XHRjb3ZlciA9IHtcblx0XHRcdFx0dXJsOiBjb3ZlclVybCxcblx0XHRcdH07XG5cdFx0fVxuXHRcdGVsc2Vcblx0XHR7XG5cdFx0XHRsZXQgY3dkID0gZXB1YkNvbmZpZy5jd2QgfHwgcHJvY2Vzcy5jd2QoKTtcblxuXHRcdFx0Y292ZXIgPSB7XG5cdFx0XHRcdGZpbGU6IHBhdGguaXNBYnNvbHV0ZShjb3ZlclVybCkgPyBjb3ZlclVybCA6IHBhdGguam9pbihjd2QsIGNvdmVyVXJsKSxcblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0Ly9jb25zb2xlLmxvZyhjb3Zlcik7XG5cdH1cblx0ZWxzZSBpZiAoY292ZXJVcmwgJiYgKGNvdmVyVXJsLnVybCB8fCBjb3ZlclVybC5maWxlKSlcblx0e1xuXHRcdGNvdmVyID0gY292ZXJVcmw7XG5cdH1cblxuXHRyZXR1cm4gY292ZXI7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhZGRTdGF0aWNGaWxlcyh6aXAsIHN0YXRpY0ZpbGVzOiBJRmlsZXNbXSlcbntcblx0bGV0IGNhY2hlID0ge30gYXMge1xuXHRcdFtrOiBzdHJpbmddOiBJRmlsZXMsXG5cdH07XG5cblx0cmV0dXJuIEJQcm9taXNlLm1hcFNlcmllcyhzdGF0aWNGaWxlcywgYXN5bmMgZnVuY3Rpb24gKF9maWxlOiBJRmlsZXMpXG5cdFx0e1xuXHRcdFx0bGV0IGZpbGU6IElGaWxlcztcblxuXHRcdFx0aWYgKCFfZmlsZS5kYXRhXG5cdFx0XHRcdCYmIF9maWxlLnVybFxuXHRcdFx0XHQmJiBjYWNoZVtfZmlsZS51cmxdXG5cdFx0XHRcdCYmIGNhY2hlW19maWxlLnVybF0uZGF0YVxuXHRcdFx0KVxuXHRcdFx0e1xuXHRcdFx0XHRsZXQgY2YgPSBjYWNoZVtfZmlsZS51cmxdO1xuXG5cdFx0XHRcdF9maWxlLmRhdGEgPSBjZi5kYXRhO1xuXHRcdFx0XHRfZmlsZS5taW1lID0gX2ZpbGUubWltZSB8fCBjZi5taW1lO1xuXHRcdFx0fVxuXG5cdFx0XHRmaWxlID0gYXdhaXQgZmV0Y2hGaWxlKF9maWxlKTtcblxuXHRcdFx0aWYgKF9maWxlLnVybClcblx0XHRcdHtcblx0XHRcdFx0Y2FjaGVbX2ZpbGUudXJsXSA9IF9maWxlO1xuXHRcdFx0fVxuXG5cdFx0XHR6aXBcblx0XHRcdFx0LmZvbGRlcihmaWxlLmZvbGRlcilcblx0XHRcdFx0LmZpbGUoZmlsZS5uYW1lLCBmaWxlLmRhdGEpXG5cdFx0XHQ7XG5cblx0XHRcdHJldHVybiBmaWxlO1xuXHRcdH0pXG5cdFx0LnRhcChmdW5jdGlvbiAoKVxuXHRcdHtcblx0XHRcdGNhY2hlID0gbnVsbDtcblx0XHR9KVxuXHRcdDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFkZEZpbGVzKHppcDogSlNaaXAsIGVwdWI6IEVwdWJNYWtlciwgb3B0aW9ucylcbntcblx0bGV0IHN0YXRpY0ZpbGVzID0gZXB1Yi5lcHViQ29uZmlnLmFkZGl0aW9uYWxGaWxlcy5yZWR1Y2UoZnVuY3Rpb24gKGEsIGZpbGUpXG5cdHtcblx0XHRhLnB1c2goT2JqZWN0LmFzc2lnbih7fSwgZmlsZSwge1xuXHRcdFx0Zm9sZGVyOiBmaWxlLmZvbGRlciA/IHBhdGguam9pbignRVBVQicsIGZpbGUuZm9sZGVyKSA6ICdFUFVCJyxcblx0XHR9KSk7XG5cblx0XHRyZXR1cm4gYTtcblx0fSwgW10pO1xuXG5cdHJldHVybiBhZGRTdGF0aWNGaWxlcyh6aXAsIHN0YXRpY0ZpbGVzKVxuXHRcdC50aGVuKGZ1bmN0aW9uIChzdGF0aWNGaWxlcylcblx0XHR7XG5cblx0XHRcdGVwdWIuZXB1YkNvbmZpZy5hZGRpdGlvbmFsRmlsZXMuZm9yRWFjaCgodiwgaSkgPT5cblx0XHRcdHtcblxuXHRcdFx0XHRsZXQgcyA9IHN0YXRpY0ZpbGVzW2ldO1xuXG5cdFx0XHRcdHYubWltZSA9IHYubWltZSB8fCBzLm1pbWU7XG5cdFx0XHRcdHYubmFtZSA9IHMubmFtZTtcblxuXHRcdFx0XHRpZiAodi5mb2xkZXIgPT09IG51bGwpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHQvLyBAdHMtaWdub3JlXG5cdFx0XHRcdFx0di5ocmVmID0gdi5uYW1lO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGVsc2Vcblx0XHRcdFx0e1xuXHRcdFx0XHRcdC8vIEB0cy1pZ25vcmVcblx0XHRcdFx0XHR2LmhyZWYgPSBbdi5mb2xkZXIsIHYubmFtZV0uam9pbignLycpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gQHRzLWlnbm9yZVxuXHRcdFx0XHR2LmlkID0gdi5pZCB8fCAnYWRkaXRpb25hbEZpbGVzLScgKyBoYXNoU3VtKHYubmFtZSk7XG5cblx0XHRcdH0pO1xuXG5cdFx0XHQvL2NvbnNvbGUubG9nKGVwdWIuZXB1YkNvbmZpZy5hZGRpdGlvbmFsRmlsZXMsIHN0YXRpY0ZpbGVzKTtcblxuXHRcdFx0cmV0dXJuIHN0YXRpY0ZpbGVzO1xuXHRcdH0pXG5cdFx0O1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gYWRkQ292ZXIoemlwOiBKU1ppcCwgZXB1YjogRXB1Yk1ha2VyLCBvcHRpb25zKVxue1xuXHRpZiAoZXB1Yi5lcHViQ29uZmlnLmNvdmVyKVxuXHR7XG5cdFx0ZXB1Yi5lcHViQ29uZmlnLmNvdmVyLmJhc2VuYW1lID0gJ0NvdmVyRGVzaWduJztcblx0XHRsZXQgZmlsZSA9IGF3YWl0IGZldGNoRmlsZShlcHViLmVwdWJDb25maWcuY292ZXIpXG5cdFx0XHQuY2F0Y2goZSA9PlxuXHRcdFx0e1xuXHRcdFx0XHRjb25zb2xlLmVycm9yKGUgJiYgZS5tZWdnYWdlIHx8IGBjYW4ndCBmZXRjaCBjb3ZlcmApO1xuXHRcdFx0XHRyZXR1cm4gbnVsbDtcblx0XHRcdH0pXG5cdFx0O1xuXG5cdFx0aWYgKCFmaWxlKVxuXHRcdHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHQvL2ZpbGUubmFtZSA9IGBDb3ZlckRlc2lnbiR7ZmlsZS5leHR9YDtcblxuXHRcdGxldCBmaWxlbmFtZSA9IGZpbGUubmFtZSA9IGZpbGUuZm9sZGVyID8gcGF0aC5qb2luKGZpbGUuZm9sZGVyLCBmaWxlLm5hbWUpIDogZmlsZS5uYW1lO1xuXG5cdFx0emlwXG5cdFx0XHQuZm9sZGVyKCdFUFVCJylcblx0XHRcdC8vLmZvbGRlcignaW1hZ2VzJylcblx0XHRcdC5maWxlKGZpbGVuYW1lLCBmaWxlLmRhdGEpXG5cdFx0O1xuXG5cdFx0cmV0dXJuIGZpbGVuYW1lO1xuXHR9XG5cblx0cmV0dXJuIGZhbHNlO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElBZGRTdWJTZWN0aW9uc0NhbGxiYWNrXG57XG5cdCh6aXA6IEpTWmlwLCBzZWN0aW9uOiBFcHViTWFrZXIuU2VjdGlvbiwgZXB1YkNvbmZpZzogRXB1YkNvbmZpZywgb3B0aW9ucz8pXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhZGRTdWJTZWN0aW9ucyh6aXA6IEpTWmlwLFxuXHRzZWN0aW9uOiBFcHViTWFrZXIuU2VjdGlvbixcblx0Y2I6IElBZGRTdWJTZWN0aW9uc0NhbGxiYWNrLFxuXHRlcHViOiBFcHViTWFrZXIsXG5cdG9wdGlvbnM/LFxuKVxue1xuXHRyZXR1cm4gQlByb21pc2Vcblx0XHQucmVzb2x2ZShjYih6aXAsIHNlY3Rpb24sIGVwdWIuZXB1YkNvbmZpZywgb3B0aW9ucykpXG5cdFx0LnRoZW4oZnVuY3Rpb24gKClcblx0XHR7XG5cdFx0XHRyZXR1cm4gQlByb21pc2UubWFwU2VyaWVzKHNlY3Rpb24uc3ViU2VjdGlvbnMsIGZ1bmN0aW9uIChzdWJTZWN0aW9uOiBFcHViTWFrZXIuU2VjdGlvbilcblx0XHRcdHtcblx0XHRcdFx0cmV0dXJuIGFkZFN1YlNlY3Rpb25zKHppcCwgc3ViU2VjdGlvbiwgY2IsIGVwdWIsIG9wdGlvbnMpO1xuXHRcdFx0fSk7XG5cdFx0fSlcblx0XHQ7XG59XG5cbmltcG9ydCAqIGFzIHNlbGYgZnJvbSAnLi96aXAnO1xuXG5leHBvcnQgZGVmYXVsdCBzZWxmO1xuIl19