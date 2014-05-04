var tripcode = require('tripcode'),
	uuid = require('node-uuid'),
	easyimg = require('easyimage'),
	path = require('path'),
	fs = require('fs-extra'),
	async = require('async'),
	timestamps = require('mongoose-timestamp'),
	FFmpeg = require('fluent-ffmpeg'),
	Metadata = FFmpeg.Metadata,
	tripsalt = nconf.get('api:tripsalt');

const MAX_IMAGE_SIZE = 2 * 1024; /* 2 MB */
const MAX_VIDEO_SIZE = 3 * 1024; /* 3 MB */

var validateVideo = function validateVideo(file, filename, _callback){
	//console.log('a', file, filename);
	var uploadPath = nconf.get('api:upload_path'),
		full = path.join(uploadPath, 'full', filename);

	new Metadata(file.path, function(metadata){
		var errors = [];
		if(!metadata){
			return _callback(new Error('Could not find metadata'), file, filename);
		}

		if(metadata.video && metadata.video.resolution){
			var res = metadata.video.resolution;
			if(res.w > 2048 || res.h > 2048){
				errors.push('Max video resolution is 2048x2048');
			}
		}

		if(metadata.video && metadata.video.codec !== 'vp8'){
			errors.push('Video must be in WebM format');
		}

		if(parseInt(metadata.durationsec, 10) > 120){
			errors.push('Max video duration is 120 sec');
		}

		if(metadata.audio && metadata.audio.stream){
			errors.push('Video can not contain an audio track')
		}

		if(errors.length > 0){
			return _callback(new Error(errors.join('\n')), file, filename);
		}else{
			fs.copy(file.path, full, function(err){
				_callback(err, file, filename);
			});
		}
	});
};
var generateVideoThumb = function generateVideoThumb(file, filename, _callback){
	var uploadPath = nconf.get('api:upload_path'),
		thumb = filename.replace('.webm', '');

	new FFmpeg({
		source: file.path
	})
	.withSize(nconf.get('video:thumbnail:width') + 'x' + nconf.get('video:thumbnail:height'))
	.on('error', function(err){
		_callback(err, filename, null);
	})
	.on('end', function(filenames){
		_callback(null, filename, filenames[0]);
	})
  .takeScreenshots({
		count: 1,
  	filename: thumb,
		fileextension: '.png'
	}, path.join(uploadPath, 'thumb'));
};
var uploadImage = function uploadImage(file, _callback){
	if(file && file.path && file.name){
		var filename = 'upload-' + uuid.v1() + '.png';

		fs.readFile(file.path, function(err, buffer){
			var uploadPath = nconf.get('api:upload_path'),
				full = path.join(uploadPath, 'full', filename),
				thumb = path.join(uploadPath, 'thumb', filename);

			if(!file.mimetype.match(/^image\//i)){
				return _callback(new Error('Invalid file format'));
			}
			if(buffer.length > parseInt(MAX_IMAGE_SIZE, 10) * 1024){
				return _callback(new Error('File too big'));
			}

			async.parallel([function(cb){
				easyimg.thumbnail({
					'src': file.path,
					'dst': thumb,
					'width': nconf.get('image:thumbnail:width'),
					'height': nconf.get('image:thumbnail:height'),
					'x': 0,
					'y': 0
				}, cb);
			}, function(cb){
				easyimg.convert({
					'src': file.path,
					'dst': full
				}, cb);
			}], function(err){
				_callback(err, filename);
			});
		});
	}else{
		_callback(null);
	}
};
var uploadVideo = function uploadVideo(file, _callback){
	//return _callback(new Error('Video upload is not supported yet'))
	if(file && file.path && file.name){
		var filename = 'upload-' + uuid.v1() + '.webm';
			async.waterfall([
				function(cb){
					fs.readFile(file.path, function(err, buffer){
						if(file.mimetype !== 'video/webm'){
							return cb(new Error('Invalid file format'), null, null);
						}
						if(buffer.length > parseInt(MAX_VIDEO_SIZE, 10) * 1024){
							return cb(new Error('File too big'), null, null);
						}
						cb(null, file, filename);
					});
				},
				validateVideo,
				generateVideoThumb
			], function(err, filename, thumb){
				console.log(err, filename, thumb);
				_callback(err, filename);
			});
	}else{
		_callback(null);
	}
};
var uploadFile = function uploadFile(file, _callback){
	if(file && file.mimetype){
		if(file.mimetype.match(/^image\//i)){
			return uploadImage(file, _callback);
		}else if(file.mimetype == 'video/webm'){
			return uploadVideo(file, _callback);
		}else{
			_callback(null);
		}
	}else{
		_callback(null);
	}
};
var formatPost = function formatPost(post, _callback){
	var tripindex = post.name.indexOf('#');
	if(tripindex > -1){
		var trip = post.name.substr(tripindex + 1),
			secure = trip.indexOf('#') === 0;

		if(secure){
			trip = crypto.createHash('sha1')
			.update(trip.substr(1) + tripsalt)
			.digest('base64')
			.toString();
		}

		post.tripcode = (secure ? '!!' : '!') + tripcode(trip);
		post.name = post.name.slice(0, tripindex);
	}

	if(post.ext){
		post.type = post.ext == 'webm' ? 'video' : 'image';
	}else{
		post.type = 'text';
	}

	if(_callback){
		_callback(null, post);
	}

	return post;
};
module.exports = function(db){
	var Schema = db.Schema;
	var PostSchema = new Schema({
		'board': String,
		'hasParent': Boolean,
		'parent': {type: Schema.ObjectId, required: false},
		'op': {type: Boolean, default: 0},
		'ip': String,
		'name': String,
		'tripcode': String,
		'email': String,
		'subject': String,
		'comment': String,
		'file': String,
		'ext': String,
		'time': {type: Date, default: Date.now},
		'closed': 0
	}), Post;
	PostSchema.plugin(timestamps);
	PostSchema.set('redisCache', true);
	Post = db.model('Post', PostSchema);

	return {
		getIndexThreads: function getIndexThreads(board, page, _callback){
			var page = page ? parseInt(page, 10) : 1,
				perPage = nconf.get('board:threadsPerpage'),
				offset = (page - 1) * perPage,
				find = {};

			if(board){
				find['board'] = board;
			}
			find['hasParent'] = false;

			Post.find(find)
			.sort({updatedAt: -1})
			.skip(offset)
			.limit(perPage)
			.lean()
			.exec(_callback);
		},
		getTotalThreads: function getTotalThreads(board, _callback){
			var find = {};

			if(board){
				find['board'] = board;
			}

			find['hasParent'] = false;

			Post.count(find)
			.lean()
			.exec(function(err, total){
				if(!total){
					total = 0;
				}
				_callback(err, {'total': total});
			});
		},
		getThread: function getThread(id, page, _callback){
			var page = page ? parseInt(page, 10) : 1,
				perPage = nconf.get('board:threadsPerPage'),
				offset = (page - 1) * perPage,
				find = {};

			find['_id'] = id;
			find['hasParent'] = false;

			Post.findOne(find)
			.sort({updatedAt: -1})
			.skip(offset)
			.limit(perPage)
			.lean()
			.exec(function(err, thread){
				if(thread){
					thread = formatPost(thread);
				}
				_callback(err, thread);
			});
		},
		getThreadReplies: function getThreadReplies(id, limit, _callback){
			var find = {};

			find['parent'] = id;
			find['hasParent'] = true;

			Post.find(find)
			.sort({updatedAt: 1})
			.limit(limit)
			.lean()
			.exec(function(err, replies){
				if(replies){
					async.map(replies, formatPost, function(e, replies){
						_callback(err, replies);
					});
				}else{
					_callback(err);
				}
			});
		},
		countThreadReplies: function countThreadReplies(id, _callback){
			var find = {};

			find['parent'] = id;
			find['hasParent'] = true;

			Post.count(find)
			.lean()
			.exec(function(err, total){
				if(!total){
					total = 0;
				}
				_callback(err, total);
			});

		},
		newThread: function newThread(params, _callback){
			var p = {
				'board': params.board,
				'op': 1,
				'hasParent': false,
				'name': params.name,
				'tripcode': '',
				'email': params.email,
				'subject': params.subject,
				'comment': params.comment,
				'sticky': params.sticky,
				'ip': params.ip,
				'closed': params.closed
			};

			uploadFile(params.file, function(err, filename){
				if(err){
					return _callback(err);
				}

				if(filename){
					var ext = path.extname(filename) || '.png';
					p['ext'] = ext;
					p['file'] = path.basename(filename, ext);
				}
				var t = new Post(formatPost(p));

				t.save(_callback);
			});
		},
		newReply: function newReply(params, _callback){
			var p = {
				'hasParent': true,
				'parent': params.parent,
				'op': 1,
				'board': params.board,
				'name': params.name,
				'email': params.email,
				'comment': params.comment,
				'ip': params.ip
			};

			uploadFile(params.file, function(err, filename){
				if(err){
					return _callback(err);
				}

				if(filename){
					var ext = path.extname(filename) || '.png';
					p['ext'] = ext;
					p['file'] = path.basename(filename, ext);
				}
				var t = new Post(formatPost(p));

				t.save(_callback);
			});
		}
	};
};
