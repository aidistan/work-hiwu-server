var url = require('url')

module.exports = function(Photo) {
  // Upload the data to Aliyun OSS after creation
  Photo.on('dataSourceAttached', function(obj){
    var create = Photo.create;
    Photo.create = function(data, options, cb) {
      var app = Photo.app;
      var bin = data.data;
      delete data.data;

      return(create.apply(this, [data, function(err, obj) {
        if (!err) {
          // Update the url
          var path = app.env + '/' + obj.id;
          obj.updateAttribute('url', 'http://hiwu.oss-cn-beijing.aliyuncs.com/' + path);
          // Save the image
          app.aliyun.oss.putObject({
            Bucket: 'hiwu',
            Key: path,
            Body: bin,
            // AccessControlAllowOrigin: '',
            ContentType: 'image/jpeg',
            // CacheControl: 'no-cache',
            // ContentDisposition: '',
            ContentEncoding: 'utf-8',
            ServerSideEncryption: 'AES256'
            // Expires: ''
          }, function (err, data) {
            if (err) {
              console.log('Error raised when uploading a photo to Aliyun OSS:', err);
            }
          });
        }
        return(cb(err,obj));
      }]));
    };
  });

  // Delete the data from Aliyun OSS before deletion
  Photo.observe('before delete', function(ctx, next) {
    Photo.find({ where: ctx.where }, function(err, photos) {
      if (!err) {
        for (i in photos) {
          Photo.app.aliyun.oss.deleteObject({
            Bucket: 'hiwu',
            Key: url.parse(photos[i].url).pathname.replace(/^\//, '')
          },
          function (err, data) {
            if (err) {
              console.log('Error raised when deleting a photo from Aliyun OSS:', err);
            }
          });
        }
      }
      next();
    });
  });
};
