#!/usr/bin/env node
var cheerio = require('cheerio');
var fs = require('fs');
var path = require('path');

var plistPath = path.join(__dirname, 'TEMPLATE.plist');
var plistFile = fs.readFileSync(plistPath);
var $ = cheerio.load(plistFile, {
    xmlMode: true
});
$('plist > dict > key').each((index, node) => {
    var $node = $(node);
    var keyType = $node.text();
    var $valueNode = $node.next();
    if (keyType == 'WorkingDirectory') {
        $valueNode.text(__dirname);
    } else if (keyType == 'EnvironmentVariables') {
        $valueNode.find('key').each((envIndex, envNode) => {
            var $envNode = $(envNode);
            if ($envNode.text() == 'PATH') {
                $envNode.next().text(process.env.PATH);
            }
        });
    }
});
console.log($.html());
