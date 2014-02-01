module.exports = function multipart(req, res, next){
	if(!req.files){
		req.files = {};
	}
	if(!req.body){
		req.body = {};
	}

	if(req.busboy){
		req.busboy.on('file', function(fieldname, file, filename, encoding, mimetype){
			var filePath = path.join('../uploads/', filename || 'temp.tmp');

			file.on('limit', function(){
				var err = new Error('File size too large');
				err.status = 413;
				next(err);
			});

			file.on('end', function(){
				req.files[fieldname] = {
					type: mimetype,
					encoding: encoding,
					name: filename,
					path: filePath
				}
			});

			file.pipe(fs.createWriteStream(filePath));
		});
		req.busboy.on('field', function(fieldname, val) {
			req.body[fieldname] = val;
		});
		req.busboy.on('end', function(){
			next();
		});
		req.pipe(req.busboy);
	}else{
		next();
	}
};