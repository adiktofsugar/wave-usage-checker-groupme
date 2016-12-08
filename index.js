#!/usr/bin/env node
// todo
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

var path = require('path');
var async = require('async');
var downloadAndSaveImages = require('./lib/download');
var groupMePost = require('./lib/groupme-post');


var shouldMockGroupMe = false;

var cli = require('cli');
cli.parse({
    debug:      ['d', 'Enable debug output', 'on'],
    credsFile:  ['c', 'Path to json file with username and password', 'file']
});
cli.enable('status');
cli.main(function (args, options) {
    if (!options.credsFile) {
        cli.fatal(`Creds file is required.`);
    }
    try {
        var creds = require(path.join(process.cwd(), options.credsFile));
    } catch (e) {
        cli.fatal(`Problem with creds file - ${e}`);
    }
    var imageDir = path.join(process.cwd(), 'images');
    async.series([
        async.apply(downloadAndSaveImages, {
            imageDir: imageDir,
            username: creds.username, 
            password: creds.password, 
            debug: options.debug, 
            logDebug:cli.debug, 
            logError:cli.error, 
            log:cli.ok
        }),
        async.apply(groupMePost, {
            shouldMock: shouldMockGroupMe,
            imageDir: imageDir,
            awsRegionName: creds['aws-region-name'],
            awsBucketName: creds['aws-bucket-name'],
            groupmeAccessToken: creds['groupme-accesstoken'],
            groupmeGroupId: creds['groupme-groupid'],
            logDebug:cli.debug, 
            logError:cli.error, 
            log:cli.ok
        })
    ], function (error, statuses) {
        statuses = statuses || [];
        var imageStatus = statuses[0];
        var groupmeStatus = statuses[1];

        imageStatus && cli.ok(`images - ${imageStatus}`);
        groupmeStatus && cli.ok(`groupme - ${groupmeStatus}`);

        if (error) cli.fatal(error);
        cli.ok("Images are saved and posted to groupme!");
    });
});
