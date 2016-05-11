// todo
// Make this a cli tool
// clear the images first
// post to groupme after downloading
// have username / password be passed into it
// make it run from...my computer, i guess.
//     i could just do a cron but if my computer happens to not be on at that time im screwed
//     have a plist file that starts up and records when it was last run, trying to run
//     at noon every day..
//      assuming it ran mon at noon, tue at noon, but then my computer was off wednesday until 2
//      it would see that it had run last more than 24 hours ago, so it would run immediately
//      otherwise it would wait until 3
//      so, it sounds like a cron and this extra thing for when it boots up and sees the cron
//      didn't run
//    or i could just make a cron and have a message on my terminal saying how long it's 
//      been since it ran last

var fs = require('fs');
var request = require('request');
var async = require('async');
var toMarkdown = require('to-markdown');
var jsdom = require('jsdom');
var cookies = request.jar();

var SHOULD_DEBUG = false;
request.debug = SHOULD_DEBUG;

username = "adiktofsugar";
password = "ZbtMwiszXn6R72dw1br7";

var toMarkdownConverters = [
    {
        filter: function (node) {
            var shouldFilter = false;
            var name = node.nodeName.toLowerCase();
            var classNamesArray = node.className.split(/\s+/);
            var classNames = {};
            classNamesArray.forEach(function (className) {
                classNames[className] = true;
            });
            if (name == 'div') shouldFilter = true;
            if (name == 'footer') return true;
            if (name == 'header') return true;
            return shouldFilter;
        },
        replacement: function (innerHTML, node) {
            return innerHTML;
        }
    }
];

function log() {
    if (!SHOULD_DEBUG) return;
    console.log.apply(console, arguments);
}

function logResponse(response, body) {
    if (!SHOULD_DEBUG) return;
    if (!response) return;
    log('status code', response.statusCode);
    log('headers', response.headers);
    log('body');
    log('================');
    log(body);
    //log(body ? toMarkdown(body, {converters: toMarkdownConverters}) : "no body");
}

function login(callback) {
    request({
        uri: 'https://secure.wavecable.com/iam/iam/login',
        method: "post",
        form: {
            username: username,
            password: password
        },
        jar: cookies
    }, function (error, response, body) {
        logResponse(response, body);
        callback(error, response, body);
    });
}
function getDataPage(callback) {
    request({
        uri: 'https://secure.wavecable.com/iam/usage/data',
        jar: cookies
    }, function (error, response, body) {
        logResponse(response, body);
        if (error) {
            return callback(error, response);
        }
        jsdom.env(body, function (error, win) {
            if (error) return callback(error, response);
            var body = win.document.body;
            var faqLink = Array.from(body.querySelectorAll('a')).find(function (link) {
                return link.href && link.href.match(/data_transfer_faqs/);
            });
            if (!faqLink) return callback("no faq link", response);
            
            var table = faqLink.parentNode.parentNode.querySelectorAll('table')[0];
            log('table is ', table)
            var images = Array.from(table.querySelectorAll('img')).map(function (img) {
                return img.src;
            });
            log('images are', images);
            win.close();
            callback(error, response, images);
        });
    });
}

async.series([
    login,
    getDataPage
], function (error, responses) {
    if (error) {
        console.error("error", error);
        return process.exit(1);
    }
    var dataResponse = responses[1];
    var images = dataResponse[1];
    log("===");
    log("images to download are:", images);

    async.parallel(
        images.map(function (image, index) {
            return function (callback) {
                request({
                    uri: image,
                    jar: cookies
                }).pipe(fs.createWriteStream('image' + index + '.png')).on('close', callback);
            }
        }), function (error) {
            console.log(`Done. You should have ${images.length} image[n].png files now.`);
        }
    );
});
