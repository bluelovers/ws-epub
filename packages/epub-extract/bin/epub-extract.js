#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_novel_globby_1 = require("node-novel-globby");
const yargs = require("yargs");
const path = require("path");
const index_1 = require("../index");
const Promise = require("bluebird");
let cli = yargs
    .usage("$0 [-o dir] [-i file]")
    .example('$0 -o epub name.epub', 'extract name.epub to epub dir')
    .command('all', 'extract all epub')
    .alias('a', 'all')
    .command('v', 'show log')
    .alias('o', 'output')
    .nargs('o', 1)
    .describe('o', 'output dir path')
    .alias('i', 'input')
    .nargs('i', 1)
    .describe('i', 'input file path');
//console.log(cli.argv);
let srcFile = (cli.argv.input || cli.argv._[0]);
let outputDir = cli.argv.output;
(async () => {
    let cwd = process.cwd();
    console.log(cwd);
    {
        let chk = path.relative(cwd, __dirname);
        if (['', '.', '..'].includes(chk)) {
            return Promise.reject(`not allow cwd path "${cwd}"`);
        }
    }
    let ls;
    let options = {
        cwd,
        outputDir,
        log: cli.argv.v,
    };
    if (!srcFile) {
        ls = await node_novel_globby_1.globby([
            '*.epub',
        ], {
            cwd,
            absolute: true,
        });
        if (cli.argv.all === true) {
            if (!ls.length) {
                return Promise.reject(`can't found any epub file in "${cwd}"`);
            }
            return Promise
                .map(ls, function (srcFile) {
                return index_1.default(srcFile, options);
            })
                .then(function (ls) {
                return ls.join("\n");
            });
        }
        else {
            srcFile = ls[0];
        }
    }
    if (!srcFile) {
        cli.showHelp('log');
        console.log(['current epub list:'].concat(ls || []).join("\n- "));
    }
    else {
        return await index_1.default(srcFile, options);
    }
})()
    .catch(function (e) {
    cli.showHelp();
    if (e instanceof Error) {
        console.trace(e);
    }
    else {
        console.error('[ERROR]', e);
    }
})
    .then(function (ls) {
    console.log('[DONE]\n', ls);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXB1Yi1leHRyYWN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZXB1Yi1leHRyYWN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUVBLHlEQUEyQztBQUMzQywrQkFBK0I7QUFDL0IsNkJBQTZCO0FBQzdCLG9DQUFpRDtBQUNqRCxvQ0FBb0M7QUFFcEMsSUFBSSxHQUFHLEdBQUcsS0FBSztLQUNiLEtBQUssQ0FBQyx1QkFBdUIsQ0FBQztLQUM5QixPQUFPLENBQUMsc0JBQXNCLEVBQUUsK0JBQStCLENBQUM7S0FFaEUsT0FBTyxDQUFDLEtBQUssRUFBRSxrQkFBa0IsQ0FBQztLQUNsQyxLQUFLLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQztLQUVqQixPQUFPLENBQUMsR0FBRyxFQUFFLFVBQVUsQ0FBQztLQUV4QixLQUFLLENBQUMsR0FBRyxFQUFFLFFBQVEsQ0FBQztLQUNwQixLQUFLLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQztLQUNiLFFBQVEsQ0FBQyxHQUFHLEVBQUUsaUJBQWlCLENBQUM7S0FFaEMsS0FBSyxDQUFDLEdBQUcsRUFBRSxPQUFPLENBQUM7S0FDbkIsS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUM7S0FDYixRQUFRLENBQUMsR0FBRyxFQUFFLGlCQUFpQixDQUFDLENBQ2pDO0FBRUQsd0JBQXdCO0FBRXhCLElBQUksT0FBTyxHQUFXLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQVcsQ0FBQztBQUNsRSxJQUFJLFNBQVMsR0FBVyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQWdCLENBQUM7QUFFbEQsQ0FBQyxLQUFLLElBQUksRUFBRTtJQUVYLElBQUksR0FBRyxHQUFHLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQztJQUV4QixPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBRWpCO1FBQ0MsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDeEMsSUFBSSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxFQUNqQztZQUNDLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyx1QkFBdUIsR0FBRyxHQUFHLENBQUMsQ0FBQztTQUNyRDtLQUNEO0lBRUQsSUFBSSxFQUFZLENBQUM7SUFFakIsSUFBSSxPQUFPLEdBQWE7UUFDdkIsR0FBRztRQUNILFNBQVM7UUFDVCxHQUFHLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFZO0tBQzFCLENBQUM7SUFFRixJQUFJLENBQUMsT0FBTyxFQUNaO1FBQ0MsRUFBRSxHQUFHLE1BQU0sMEJBQU0sQ0FBQztZQUNqQixRQUFRO1NBQ1IsRUFBRTtZQUNGLEdBQUc7WUFDSCxRQUFRLEVBQUUsSUFBSTtTQUNkLENBQUMsQ0FBQztRQUVILElBQUksR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLEtBQUssSUFBSSxFQUN6QjtZQUNDLElBQUksQ0FBQyxFQUFFLENBQUMsTUFBTSxFQUNkO2dCQUNDLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxpQ0FBaUMsR0FBRyxHQUFHLENBQUMsQ0FBQTthQUM5RDtZQUVELE9BQU8sT0FBTztpQkFDWixHQUFHLENBQUMsRUFBRSxFQUFFLFVBQVUsT0FBTztnQkFFMUIsT0FBTyxlQUFXLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQ3RDLENBQUMsQ0FBQztpQkFDQSxJQUFJLENBQUMsVUFBVSxFQUFFO2dCQUVqQixPQUFPLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDdEIsQ0FBQyxDQUFDLENBQ0Q7U0FDRjthQUVEO1lBQ0MsT0FBTyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUNoQjtLQUNEO0lBRUQsSUFBSSxDQUFDLE9BQU8sRUFDWjtRQUNDLEdBQUcsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7UUFFcEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLG9CQUFvQixDQUFDLENBQUMsTUFBTSxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztLQUNsRTtTQUVEO1FBQ0MsT0FBTyxNQUFNLGVBQVcsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7S0FDM0M7QUFDRixDQUFDLENBQUMsRUFBRTtLQUNGLEtBQUssQ0FBQyxVQUFVLENBQUM7SUFFakIsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBRWYsSUFBSSxDQUFDLFlBQVksS0FBSyxFQUN0QjtRQUNDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDakI7U0FFRDtRQUNDLE9BQU8sQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDO0tBQzVCO0FBQ0YsQ0FBQyxDQUFDO0tBQ0QsSUFBSSxDQUFDLFVBQVUsRUFBRTtJQUVqQixPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRSxFQUFFLENBQUMsQ0FBQztBQUM3QixDQUFDLENBQUMsQ0FDRiIsInNvdXJjZXNDb250ZW50IjpbIiMhL3Vzci9iaW4vZW52IG5vZGVcblxuaW1wb3J0IHsgZ2xvYmJ5IH0gZnJvbSAnbm9kZS1ub3ZlbC1nbG9iYnknO1xuaW1wb3J0ICogYXMgeWFyZ3MgZnJvbSAneWFyZ3MnO1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCBlcHViRXh0cmFjdCwgeyBJT3B0aW9ucyB9IGZyb20gJy4uL2luZGV4JztcbmltcG9ydCAqIGFzIFByb21pc2UgZnJvbSAnYmx1ZWJpcmQnO1xuXG5sZXQgY2xpID0geWFyZ3Ncblx0LnVzYWdlKFwiJDAgWy1vIGRpcl0gWy1pIGZpbGVdXCIpXG5cdC5leGFtcGxlKCckMCAtbyBlcHViIG5hbWUuZXB1YicsICdleHRyYWN0IG5hbWUuZXB1YiB0byBlcHViIGRpcicpXG5cblx0LmNvbW1hbmQoJ2FsbCcsICdleHRyYWN0IGFsbCBlcHViJylcblx0LmFsaWFzKCdhJywgJ2FsbCcpXG5cblx0LmNvbW1hbmQoJ3YnLCAnc2hvdyBsb2cnKVxuXG5cdC5hbGlhcygnbycsICdvdXRwdXQnKVxuXHQubmFyZ3MoJ28nLCAxKVxuXHQuZGVzY3JpYmUoJ28nLCAnb3V0cHV0IGRpciBwYXRoJylcblxuXHQuYWxpYXMoJ2knLCAnaW5wdXQnKVxuXHQubmFyZ3MoJ2knLCAxKVxuXHQuZGVzY3JpYmUoJ2knLCAnaW5wdXQgZmlsZSBwYXRoJylcbjtcblxuLy9jb25zb2xlLmxvZyhjbGkuYXJndik7XG5cbmxldCBzcmNGaWxlOiBzdHJpbmcgPSAoY2xpLmFyZ3YuaW5wdXQgfHwgY2xpLmFyZ3YuX1swXSkgYXMgc3RyaW5nO1xubGV0IG91dHB1dERpcjogc3RyaW5nID0gY2xpLmFyZ3Yub3V0cHV0IGFzIHN0cmluZztcblxuKGFzeW5jICgpID0+XG57XG5cdGxldCBjd2QgPSBwcm9jZXNzLmN3ZCgpO1xuXG5cdGNvbnNvbGUubG9nKGN3ZCk7XG5cblx0e1xuXHRcdGxldCBjaGsgPSBwYXRoLnJlbGF0aXZlKGN3ZCwgX19kaXJuYW1lKTtcblx0XHRpZiAoWycnLCAnLicsICcuLiddLmluY2x1ZGVzKGNoaykpXG5cdFx0e1xuXHRcdFx0cmV0dXJuIFByb21pc2UucmVqZWN0KGBub3QgYWxsb3cgY3dkIHBhdGggXCIke2N3ZH1cImApO1xuXHRcdH1cblx0fVxuXG5cdGxldCBsczogc3RyaW5nW107XG5cblx0bGV0IG9wdGlvbnM6IElPcHRpb25zID0ge1xuXHRcdGN3ZCxcblx0XHRvdXRwdXREaXIsXG5cdFx0bG9nOiBjbGkuYXJndi52IGFzIGJvb2xlYW4sXG5cdH07XG5cblx0aWYgKCFzcmNGaWxlKVxuXHR7XG5cdFx0bHMgPSBhd2FpdCBnbG9iYnkoW1xuXHRcdFx0JyouZXB1YicsXG5cdFx0XSwge1xuXHRcdFx0Y3dkLFxuXHRcdFx0YWJzb2x1dGU6IHRydWUsXG5cdFx0fSk7XG5cblx0XHRpZiAoY2xpLmFyZ3YuYWxsID09PSB0cnVlKVxuXHRcdHtcblx0XHRcdGlmICghbHMubGVuZ3RoKVxuXHRcdFx0e1xuXHRcdFx0XHRyZXR1cm4gUHJvbWlzZS5yZWplY3QoYGNhbid0IGZvdW5kIGFueSBlcHViIGZpbGUgaW4gXCIke2N3ZH1cImApXG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBQcm9taXNlXG5cdFx0XHRcdC5tYXAobHMsIGZ1bmN0aW9uIChzcmNGaWxlKVxuXHRcdFx0e1xuXHRcdFx0XHRyZXR1cm4gZXB1YkV4dHJhY3Qoc3JjRmlsZSwgb3B0aW9ucyk7XG5cdFx0XHR9KVxuXHRcdFx0XHQudGhlbihmdW5jdGlvbiAobHMpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHRyZXR1cm4gbHMuam9pbihcIlxcblwiKTtcblx0XHRcdFx0fSlcblx0XHRcdFx0O1xuXHRcdH1cblx0XHRlbHNlXG5cdFx0e1xuXHRcdFx0c3JjRmlsZSA9IGxzWzBdO1xuXHRcdH1cblx0fVxuXG5cdGlmICghc3JjRmlsZSlcblx0e1xuXHRcdGNsaS5zaG93SGVscCgnbG9nJyk7XG5cblx0XHRjb25zb2xlLmxvZyhbJ2N1cnJlbnQgZXB1YiBsaXN0OiddLmNvbmNhdChscyB8fCBbXSkuam9pbihcIlxcbi0gXCIpKTtcblx0fVxuXHRlbHNlXG5cdHtcblx0XHRyZXR1cm4gYXdhaXQgZXB1YkV4dHJhY3Qoc3JjRmlsZSwgb3B0aW9ucyk7XG5cdH1cbn0pKClcblx0LmNhdGNoKGZ1bmN0aW9uIChlKVxuXHR7XG5cdFx0Y2xpLnNob3dIZWxwKCk7XG5cblx0XHRpZiAoZSBpbnN0YW5jZW9mIEVycm9yKVxuXHRcdHtcblx0XHRcdGNvbnNvbGUudHJhY2UoZSk7XG5cdFx0fVxuXHRcdGVsc2Vcblx0XHR7XG5cdFx0XHRjb25zb2xlLmVycm9yKCdbRVJST1JdJywgZSk7XG5cdFx0fVxuXHR9KVxuXHQudGhlbihmdW5jdGlvbiAobHMpXG5cdHtcblx0XHRjb25zb2xlLmxvZygnW0RPTkVdXFxuJywgbHMpO1xuXHR9KVxuO1xuIl19