var async = require('async');
var API = require('groupme').Stateless
var fs = require('fs');
var path = require('path');
var AWS = require('aws-sdk'); 

function createMessage(params, s3Urls, callback) {
    var {accessToken, groupId, imageDir, logger, shouldMock} = params;
    var options = {
        message: {
            attachments: s3Urls.map(function (s3Url) {
                return {
                    type: "image",
                    url: s3Url
                };
            })
        }
    };
    if (shouldMock) {
        callback(null, options.message);
        return;
    }
    API.Messages.create(accessToken, groupId, options, function(error, response) {
        if (error) return callback(error);
        callback(null, response.message);
    });
}

function uploadImages(params, callback) {
    var {regionName, bucketName, imageDir, logger, shouldMock} = params;
    var s3 = new AWS.S3({
        region: regionName
    }); 
    var now = new Date();
    
    function uploadImage (imageFilename, callback) {
        var imageKey = `wave-data-usage-${imageFilename}-${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}.png`;
        var imagePath = path.join(imageDir, imageFilename);
        var params = {
            Bucket: bucketName,
            Key: imageKey,
            ACL: 'public-read',
            Body: fs.createReadStream(imagePath),
            ContentType: 'image/png'
        };
        var publicUrl = `https://s3-${regionName}.amazonaws.com/${bucketName}/${imageKey}`;
        if (shouldMock) {
            logger.log(`Mock uploaded data to ${bucketName}/${imageKey}`);
            callback(null, publicUrl);
            return;
        }
        s3.putObject(params, function(error, data) {
            if (error) return callback(error);
            logger.log(`Successfully uploaded data to ${bucketName}/${imageKey}`);
            callback(null, publicUrl);
        });
    }
    var uploadFns = fs.readdirSync(imageDir).map(function (imageDir) {
        return async.apply(uploadImage, imageDir);
    });
    async.parallel(uploadFns, function (error, publicUrls) {
        if (error) return callback(error);
        callback(null, publicUrls);
    });
}

module.exports = function (options, callback) {
    var missingFields = ["awsRegionName", "awsBucketName", "groupmeAccessToken", "groupmeGroupId", "imageDir"].filter(function (optionName) {
        return !options[optionName];
    });
    if (missingFields.length) return callback("Missing required parameters " + missingFields.join(", "));

    var logger = {
        debug: options.logDebug || console.debug,
        error: options.logError || console.error,
        log: options.log || console.log
    };
    var {awsRegionName, awsBucketName,
        groupmeAccessToken, groupmeGroupId,
        imageDir, shouldMock} = options;
    
    async.waterfall([
        async.apply(uploadImages, {
                regionName: awsRegionName,
                bucketName: awsBucketName,
                imageDir,
                logger,
                shouldMock
            }),
        async.apply(createMessage, {
            accessToken: groupmeAccessToken,
            groupId: groupmeGroupId,
            imageDir,
            logger,
            shouldMock
        })
    ], function (error, message) {
        if (error) return callback(error);
        var s3Urls = message.attachments.map(function (attachment) {
            return attachment.url;
        });
        callback(null, `Successfully posted ${s3Urls.join(', ')} to group id ${groupmeGroupId}`);
    });

};
