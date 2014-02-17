var BusBoy = require('busboy'),
	path = require('path'),
	os = require('os'),
	tmpDir = os.tmpdir();
module.exports = function multipart(req, res, next){
	var hasError = false,
	    busboy;

    if(req.method && !req.method.match(/post/i)){
        return next();
    }

	if(!req.files){
		req.files = {};
	}
	if(!req.body){
		req.body = {};
	}

    var busboy = new BusBoy({ headers: req.headers });

	if(busboy){
		busboy.on('file', function(fieldname, file, filename, encoding, mimetype){
			var filePath = path.join(tmpDir, filename || 'temp.tmp');

			if(!filename){
				return file.emit('end');
			}

			file.on('limit', function(){
				res.send(413, {
					errorCode: 413,
					message: 'File size limit reached'
				});
			});

			file.on('end', function(){
				req.files[fieldname] = {
					type: mimetype,
					encoding: encoding,
					name: filename,
					path: filePath
				};
			});

			file.pipe(fs.createWriteStream(filePath));
		});

		busboy.on('field', function(fieldname, val) {
			req.body[fieldname] = val;
		});

		busboy.on('end', function(){
			next();
		});

		req.pipe(busboy);
	}else{
		next();
	}
};