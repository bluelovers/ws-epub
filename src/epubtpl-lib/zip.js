"use strict";
/**
 * Created by user on 2017/12/12/012.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const JSZip = require("jszip");
exports.JSZip = JSZip;
const path = require("path");
const BPromise = require("bluebird");
const ajax_1 = require("./ajax");
const hashSum = require("hash-sum");
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
    return BPromise.mapSeries(staticFiles, async function (_file) {
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
            v.id = v.id || 'additionalFiles-' + hashSum(v.name);
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
    return BPromise
        .resolve(cb(zip, section, epub.epubConfig, options))
        .then(function () {
        return BPromise.mapSeries(section.subSections, function (subSection) {
            return addSubSections(zip, subSection, cb, epub, options);
        });
    });
}
exports.addSubSections = addSubSections;
const self = require("./zip");
exports.default = self;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiemlwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiemlwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7R0FFRzs7QUFFSCwrQkFBZ0M7QUFTdkIsc0JBQUs7QUFOZCw2QkFBNkI7QUFDN0IscUNBQXNDO0FBRXRDLGlDQUFtQztBQUNuQyxvQ0FBcUM7QUFJckM7Ozs7Ozs7Ozs7RUFVRTtBQUVGLFNBQWdCLGdCQUFnQixDQUFDLFFBQVEsRUFBRSxVQUF1QjtJQUVqRSxJQUFJLEtBQWEsQ0FBQztJQUVsQixJQUFJLE9BQU8sUUFBUSxJQUFJLFFBQVEsRUFDL0I7UUFDQyxJQUFJLENBQUMsR0FBRyxxQkFBcUIsQ0FBQztRQUU5QixxRUFBcUU7UUFFckUsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsRUFDbEQ7WUFDQyxLQUFLLEdBQUc7Z0JBQ1AsR0FBRyxFQUFFLFFBQVE7YUFDYixDQUFDO1NBQ0Y7YUFFRDtZQUNDLElBQUksR0FBRyxHQUFHLFVBQVUsQ0FBQyxHQUFHLElBQUksT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDO1lBRTFDLEtBQUssR0FBRztnQkFDUCxJQUFJLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxRQUFRLENBQUM7YUFDckUsQ0FBQztTQUNGO1FBRUQscUJBQXFCO0tBQ3JCO1NBQ0ksSUFBSSxRQUFRLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxJQUFJLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFDcEQ7UUFDQyxLQUFLLEdBQUcsUUFBUSxDQUFDO0tBQ2pCO0lBRUQsT0FBTyxLQUFLLENBQUM7QUFDZCxDQUFDO0FBakNELDRDQWlDQztBQUVELFNBQWdCLGNBQWMsQ0FBQyxHQUFHLEVBQUUsV0FBcUI7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LEVBQ2YsT0FBUTtJQUdSLE9BQU8sUUFBUTtTQUNiLE9BQU8sQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsVUFBVSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1NBQ25ELElBQUksQ0FBQztRQUVMLE9BQU8sUUFBUSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLFVBQVUsVUFBNkI7WUFFckYsT0FBTyxjQUFjLENBQUMsR0FBRyxFQUFFLFVBQVUsRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBQzNELENBQUMsQ0FBQyxDQUFDO0lBQ0osQ0FBQyxDQUFDLENBQ0Q7QUFDSCxDQUFDO0FBakJELHdDQWlCQztBQUVELDhCQUE4QjtBQUU5QixrQkFBZSxJQUFJLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENyZWF0ZWQgYnkgdXNlciBvbiAyMDE3LzEyLzEyLzAxMi5cbiAqL1xuXG5pbXBvcnQgSlNaaXAgPSByZXF1aXJlKCdqc3ppcCcpO1xuaW1wb3J0IHsgSUZpbGVzLCBJQ292ZXIsIEVwdWJDb25maWcsIElFcHViQ29uZmlnIH0gZnJvbSAnLi4vY29uZmlnJztcbmltcG9ydCB7IGNvbXBpbGVUcGwgfSBmcm9tICcuL2hhbmRsZWJhci1oZWxwZXJzJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgQlByb21pc2UgPSByZXF1aXJlKCdibHVlYmlyZCcpO1xuaW1wb3J0IHsgRXB1Yk1ha2VyIH0gZnJvbSAnLi4vaW5kZXgnO1xuaW1wb3J0IHsgZmV0Y2hGaWxlIH0gZnJvbSAnLi9hamF4JztcbmltcG9ydCBoYXNoU3VtID0gcmVxdWlyZSgnaGFzaC1zdW0nKTtcblxuZXhwb3J0IHsgSlNaaXAgfVxuXG4vKlxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGFkZE1pbWV0eXBlKHppcDogSlNaaXAsIGVwdWI6IEVwdWJNYWtlciwgb3B0aW9ucylcbntcblx0cmV0dXJuIHppcC5maWxlKCdtaW1ldHlwZScsIG9wdGlvbnMudGVtcGxhdGVzLm1pbWV0eXBlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFkZENvbnRhaW5lckluZm8oemlwOiBKU1ppcCwgZXB1YjogRXB1Yk1ha2VyLCBvcHRpb25zKVxue1xuXHRyZXR1cm4gemlwLmZvbGRlcignTUVUQS1JTkYnKS5maWxlKCdjb250YWluZXIueG1sJywgY29tcGlsZVRwbChvcHRpb25zLnRlbXBsYXRlcy5jb250YWluZXIsIGVwdWIuZXB1YkNvbmZpZykpO1xufVxuKi9cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlRmlsZVNldHRpbmcoY292ZXJVcmwsIGVwdWJDb25maWc6IElFcHViQ29uZmlnKTogSUZpbGVzXG57XG5cdGxldCBjb3ZlcjogSUNvdmVyO1xuXG5cdGlmICh0eXBlb2YgY292ZXJVcmwgPT0gJ3N0cmluZycpXG5cdHtcblx0XHRsZXQgciA9IC9eKD86XFx3KzopP1xcL3syLDN9LisvO1xuXG5cdFx0Ly9jb25zb2xlLmxvZyhwYXRoLmlzQWJzb2x1dGUoY292ZXJVcmwpLCBjb3ZlclVybCwgci5leGVjKGNvdmVyVXJsKSk7XG5cblx0XHRpZiAoIXBhdGguaXNBYnNvbHV0ZShjb3ZlclVybCkgJiYgci5leGVjKGNvdmVyVXJsKSlcblx0XHR7XG5cdFx0XHRjb3ZlciA9IHtcblx0XHRcdFx0dXJsOiBjb3ZlclVybCxcblx0XHRcdH07XG5cdFx0fVxuXHRcdGVsc2Vcblx0XHR7XG5cdFx0XHRsZXQgY3dkID0gZXB1YkNvbmZpZy5jd2QgfHwgcHJvY2Vzcy5jd2QoKTtcblxuXHRcdFx0Y292ZXIgPSB7XG5cdFx0XHRcdGZpbGU6IHBhdGguaXNBYnNvbHV0ZShjb3ZlclVybCkgPyBjb3ZlclVybCA6IHBhdGguam9pbihjd2QsIGNvdmVyVXJsKSxcblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0Ly9jb25zb2xlLmxvZyhjb3Zlcik7XG5cdH1cblx0ZWxzZSBpZiAoY292ZXJVcmwgJiYgKGNvdmVyVXJsLnVybCB8fCBjb3ZlclVybC5maWxlKSlcblx0e1xuXHRcdGNvdmVyID0gY292ZXJVcmw7XG5cdH1cblxuXHRyZXR1cm4gY292ZXI7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhZGRTdGF0aWNGaWxlcyh6aXAsIHN0YXRpY0ZpbGVzOiBJRmlsZXNbXSlcbntcblx0bGV0IGNhY2hlID0ge30gYXMge1xuXHRcdFtrOiBzdHJpbmddOiBJRmlsZXMsXG5cdH07XG5cblx0cmV0dXJuIEJQcm9taXNlLm1hcFNlcmllcyhzdGF0aWNGaWxlcywgYXN5bmMgZnVuY3Rpb24gKF9maWxlOiBJRmlsZXMpXG5cdFx0e1xuXHRcdFx0bGV0IGZpbGU6IElGaWxlcztcblxuXHRcdFx0aWYgKCFfZmlsZS5kYXRhXG5cdFx0XHRcdCYmIF9maWxlLnVybFxuXHRcdFx0XHQmJiBjYWNoZVtfZmlsZS51cmxdXG5cdFx0XHRcdCYmIGNhY2hlW19maWxlLnVybF0uZGF0YVxuXHRcdFx0KVxuXHRcdFx0e1xuXHRcdFx0XHRsZXQgY2YgPSBjYWNoZVtfZmlsZS51cmxdO1xuXG5cdFx0XHRcdF9maWxlLmRhdGEgPSBjZi5kYXRhO1xuXHRcdFx0XHRfZmlsZS5taW1lID0gX2ZpbGUubWltZSB8fCBjZi5taW1lO1xuXHRcdFx0fVxuXG5cdFx0XHRmaWxlID0gYXdhaXQgZmV0Y2hGaWxlKF9maWxlKTtcblxuXHRcdFx0aWYgKF9maWxlLnVybClcblx0XHRcdHtcblx0XHRcdFx0Y2FjaGVbX2ZpbGUudXJsXSA9IF9maWxlO1xuXHRcdFx0fVxuXG5cdFx0XHR6aXBcblx0XHRcdFx0LmZvbGRlcihmaWxlLmZvbGRlcilcblx0XHRcdFx0LmZpbGUoZmlsZS5uYW1lLCBmaWxlLmRhdGEpXG5cdFx0XHQ7XG5cblx0XHRcdHJldHVybiBmaWxlO1xuXHRcdH0pXG5cdFx0LnRhcChmdW5jdGlvbiAoKVxuXHRcdHtcblx0XHRcdGNhY2hlID0gbnVsbDtcblx0XHR9KVxuXHRcdDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFkZEZpbGVzKHppcDogSlNaaXAsIGVwdWI6IEVwdWJNYWtlciwgb3B0aW9ucylcbntcblx0bGV0IHN0YXRpY0ZpbGVzID0gZXB1Yi5lcHViQ29uZmlnLmFkZGl0aW9uYWxGaWxlcy5yZWR1Y2UoZnVuY3Rpb24gKGEsIGZpbGUpXG5cdHtcblx0XHRhLnB1c2goT2JqZWN0LmFzc2lnbih7fSwgZmlsZSwge1xuXHRcdFx0Zm9sZGVyOiBmaWxlLmZvbGRlciA/IHBhdGguam9pbignRVBVQicsIGZpbGUuZm9sZGVyKSA6ICdFUFVCJyxcblx0XHR9KSk7XG5cblx0XHRyZXR1cm4gYTtcblx0fSwgW10pO1xuXG5cdHJldHVybiBhZGRTdGF0aWNGaWxlcyh6aXAsIHN0YXRpY0ZpbGVzKVxuXHRcdC50aGVuKGZ1bmN0aW9uIChzdGF0aWNGaWxlcylcblx0XHR7XG5cblx0XHRcdGVwdWIuZXB1YkNvbmZpZy5hZGRpdGlvbmFsRmlsZXMuZm9yRWFjaCgodiwgaSkgPT5cblx0XHRcdHtcblxuXHRcdFx0XHRsZXQgcyA9IHN0YXRpY0ZpbGVzW2ldO1xuXG5cdFx0XHRcdHYubWltZSA9IHYubWltZSB8fCBzLm1pbWU7XG5cdFx0XHRcdHYubmFtZSA9IHMubmFtZTtcblxuXHRcdFx0XHRpZiAodi5mb2xkZXIgPT09IG51bGwpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHQvLyBAdHMtaWdub3JlXG5cdFx0XHRcdFx0di5ocmVmID0gdi5uYW1lO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGVsc2Vcblx0XHRcdFx0e1xuXHRcdFx0XHRcdC8vIEB0cy1pZ25vcmVcblx0XHRcdFx0XHR2LmhyZWYgPSBbdi5mb2xkZXIsIHYubmFtZV0uam9pbignLycpO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly8gQHRzLWlnbm9yZVxuXHRcdFx0XHR2LmlkID0gdi5pZCB8fCAnYWRkaXRpb25hbEZpbGVzLScgKyBoYXNoU3VtKHYubmFtZSk7XG5cblx0XHRcdH0pO1xuXG5cdFx0XHQvL2NvbnNvbGUubG9nKGVwdWIuZXB1YkNvbmZpZy5hZGRpdGlvbmFsRmlsZXMsIHN0YXRpY0ZpbGVzKTtcblxuXHRcdFx0cmV0dXJuIHN0YXRpY0ZpbGVzO1xuXHRcdH0pXG5cdFx0O1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gYWRkQ292ZXIoemlwOiBKU1ppcCwgZXB1YjogRXB1Yk1ha2VyLCBvcHRpb25zKVxue1xuXHRpZiAoZXB1Yi5lcHViQ29uZmlnLmNvdmVyKVxuXHR7XG5cdFx0ZXB1Yi5lcHViQ29uZmlnLmNvdmVyLmJhc2VuYW1lID0gJ0NvdmVyRGVzaWduJztcblx0XHRsZXQgZmlsZSA9IGF3YWl0IGZldGNoRmlsZShlcHViLmVwdWJDb25maWcuY292ZXIpXG5cdFx0XHQuY2F0Y2goZSA9PlxuXHRcdFx0e1xuXHRcdFx0XHRjb25zb2xlLmVycm9yKGUgJiYgZS5tZWdnYWdlIHx8IGBjYW4ndCBmZXRjaCBjb3ZlcmApO1xuXHRcdFx0XHRyZXR1cm4gbnVsbDtcblx0XHRcdH0pXG5cdFx0O1xuXG5cdFx0aWYgKCFmaWxlKVxuXHRcdHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHQvL2ZpbGUubmFtZSA9IGBDb3ZlckRlc2lnbiR7ZmlsZS5leHR9YDtcblxuXHRcdGxldCBmaWxlbmFtZSA9IGZpbGUubmFtZSA9IGZpbGUuZm9sZGVyID8gcGF0aC5qb2luKGZpbGUuZm9sZGVyLCBmaWxlLm5hbWUpIDogZmlsZS5uYW1lO1xuXG5cdFx0emlwXG5cdFx0XHQuZm9sZGVyKCdFUFVCJylcblx0XHRcdC8vLmZvbGRlcignaW1hZ2VzJylcblx0XHRcdC5maWxlKGZpbGVuYW1lLCBmaWxlLmRhdGEpXG5cdFx0O1xuXG5cdFx0cmV0dXJuIGZpbGVuYW1lO1xuXHR9XG5cblx0cmV0dXJuIGZhbHNlO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIElBZGRTdWJTZWN0aW9uc0NhbGxiYWNrXG57XG5cdCh6aXA6IEpTWmlwLCBzZWN0aW9uOiBFcHViTWFrZXIuU2VjdGlvbiwgZXB1YkNvbmZpZzogRXB1YkNvbmZpZywgb3B0aW9ucz8pXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhZGRTdWJTZWN0aW9ucyh6aXA6IEpTWmlwLFxuXHRzZWN0aW9uOiBFcHViTWFrZXIuU2VjdGlvbixcblx0Y2I6IElBZGRTdWJTZWN0aW9uc0NhbGxiYWNrLFxuXHRlcHViOiBFcHViTWFrZXIsXG5cdG9wdGlvbnM/LFxuKVxue1xuXHRyZXR1cm4gQlByb21pc2Vcblx0XHQucmVzb2x2ZShjYih6aXAsIHNlY3Rpb24sIGVwdWIuZXB1YkNvbmZpZywgb3B0aW9ucykpXG5cdFx0LnRoZW4oZnVuY3Rpb24gKClcblx0XHR7XG5cdFx0XHRyZXR1cm4gQlByb21pc2UubWFwU2VyaWVzKHNlY3Rpb24uc3ViU2VjdGlvbnMsIGZ1bmN0aW9uIChzdWJTZWN0aW9uOiBFcHViTWFrZXIuU2VjdGlvbilcblx0XHRcdHtcblx0XHRcdFx0cmV0dXJuIGFkZFN1YlNlY3Rpb25zKHppcCwgc3ViU2VjdGlvbiwgY2IsIGVwdWIsIG9wdGlvbnMpO1xuXHRcdFx0fSk7XG5cdFx0fSlcblx0XHQ7XG59XG5cbmltcG9ydCAqIGFzIHNlbGYgZnJvbSAnLi96aXAnO1xuXG5leHBvcnQgZGVmYXVsdCBzZWxmO1xuIl19