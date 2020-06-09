/**
 * Created by user on 2018/2/1/001.
 */

import * as xml2js from 'xml2js';

var parseString = require('xml2js').parseString;
var xml = "<root><dc:description>译名：暗黒騎士物語  ~为了打败勇者，被魔王召唤了~\n" +
	"\n" +
	"这是主人公作为暗黑骑士，为了阻止勇者保护魔王而被召唤的故事。\n" +
	"\n" +
	"突然被召唤到异世界的黑树，以及召唤了黑树的魔王莫德斯。然后，现在魔王所支配的国家正处在眼看就要被勇者毁灭的时候。\n" +
	"拥有凶恶外表的魔王莫德斯，向黑树地下了头。\n" +
	"\n" +
	"「拜托您救救我吧！！救世主大人！！」\n" +
	"\n" +
	"于是黑树顺势成为了暗黑骑士去帮助魔王。</dc:description></root>"




let options = Object.assign({}, xml2js.defaults['0.1'], {
	normalize: null,
});



parseString(xml, options, function (err, result) {
	console.dir(result);
});

console.log(options);
