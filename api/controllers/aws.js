/**
 * Created by pdyxs on 3/09/2016.
 */
'use strict';

var AWS = require('aws-sdk');

AWS.config.region = 'ap-southeast-2';

module.exports = {
  s3_signed_url: s3_signed_url
};

function s3_signed_url(req, res) {
  var s3 = new AWS.S3();
  var body = req.swagger.params.body.value;
  var params = {ACL: 'public-read', Bucket: body.bucket,
    Key: body.filename, ContentType: body.type};
  s3.getSignedUrl('putObject', params, function(err, url) {
    res.json(url);
  });
}
