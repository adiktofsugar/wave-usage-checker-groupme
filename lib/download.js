var fs = require('fs');
var path = require('path');
var request = require('request');
var async = require('async');
var jsdom = require('jsdom');
var rimraf = require('rimraf');

function downloadAndSaveImages(options, callback) {
    if (callback === undefined) {
        callback = options;
        options = {};
    }
    var defaults = {
        username: null,
        password: null,
        imageDir: path.join(process.cwd(), 'images'),
        debug: false,
        logDebug: console.debug,
        logError: console.error,
        log: console.log
    };
    options = Object.assign({}, defaults, options);
    var username = options.username;
    var password = options.password;
    var imageDir = options.imageDir;
    var logDebug = options.logDebug;
    var logError = options.logError;
    var log = options.log;

    var cookies = request.jar();
    request.debug = options.debug;

    function logResponse(response, body) {
        if (!response) return;
        logDebug('status code', response.statusCode);
        logDebug('headers', response.headers);
        logDebug('body');
        logDebug('================');
        logDebug(body);
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
                logDebug('table is ', table)
                var images = Array.from(table.querySelectorAll('img')).map(function (img) {
                    return img.src;
                });
                logDebug('images are', images);
                win.close();
                callback(error, response, images);
            });
        });
    }

    
    async.series([
        login,
        getDataPage
    ], function (error, responses) {
        if (error) return callback(error);
        var dataResponse = responses[1];
        var images = dataResponse[1];
        logDebug("===");
        logDebug("images to download are:", images);

        rimraf.sync(imageDir);
        fs.mkdirSync(imageDir);
        var writeImageToFileFns = images.map(function (image, index) {
            var imagePath = path.join(imageDir, 'image' + index + '.png');
            return function (callback) {
                request({
                    uri: image,
                    jar: cookies
                }).pipe(fs.createWriteStream(imagePath)).on('close', callback);
            }
        });
        async.parallel(writeImageToFileFns, function (error) {
            log("Downloaded images from wave");
            if (error) return callback(error);
            callback(null, `Done. You should have ${images.length} image files in your "${path.relative(process.cwd(), imageDir)}" directory now.`);
        });
    });
}

module.exports = downloadAndSaveImages;
