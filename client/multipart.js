var BusBoy = require('busboy'),
	path = require('path'),
	fs = require('fs'),
	os = require('os');

var RE_MIME = /^(?:multipart\/.+)|(?:application\/x-www-form-urlencoded)$/i;
module.exports = function multipart(req, res, next){
	var busboy,
		tmpDir = os.tmpdir();

	if(req.method && !req.method.match(/post/i)){
 		return next();
  	}

	if(!req.files){
		req.files = {};
	}
	if(!req.body){
		req.body = {};
	}

	var busboy = new BusBoy({headers: req.headers});

	busboy.on('file', function(fieldname, file, filename, encoding, mimetype){
		var filePath = path.join(tmpDir, filename || 'temp.tmp');

		if(!filename){
			return busboy.emit('finish');
		}

		file.on('end', function(){
			req.files[fieldname] = {
				type: mimetype,
				encoding: encoding,
				name: filename,
				path: filePath
			};
		});

		busboy.on('limit', function(){
			res.status(413);
			res.send({
				errorCode: 413,
				message: 'File size limit reached'
			});
		});

		file.pipe(fs.createWriteStream(filePath)); 
	});

	busboy.on('field', function(fieldname, val) {
		req.body[fieldname] = val;
	});

	busboy.on('finish', function(){
		next();
	});

	req.pipe(busboy);
};

// utility functions copied from Connect
function hasBody(req){
	var encoding = 'transfer-encoding' in req.headers,
		length = 'content-length' in req.headers
			&& req.headers['content-length'] !== '0';
	return encoding || length;
};
function mime(req){
	var str = req.headers['content-type'] || '';
	return str.split(';')[0];
};