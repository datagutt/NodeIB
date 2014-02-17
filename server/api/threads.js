var tripcode = require('tripcode'),
	uuid = require('node-uuid'),
	easyimg = require('easyimage'),
	path = require('path'),
	async = require('async')
	tripsalt = nconf.get('api:tripsalt');

const MAX_FILE_SIZE = 2 * 1024; /* 2 MB */

var uploadFile = function(file, _callback){
	if(file && file.path && file.name && file.type.match(/^image\//i)){
		var filename = 'upload-' + uuid.v1() + '.png';

		fs.readFile(file.path, function(err, buffer){
			var uploadPath = path.join(nconf.get('base_dir'), nconf.get('api:upload_path')),
				full = path.join(uploadPath, 'full', filename),
				thumb = path.join(uploadPath, 'thumb', filename);

			if(buffer.length > parseInt(MAX_FILE_SIZE, 10) * 1024){
				return _callback(new Error('File too big'));
			}

			async.parallel([function(cb){
				easyimg.thumbnail({
					'src': file.path,
					'dst': thumb,
					'width': 128,
					'height': 128,
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
		_callback(new Error('Invalid file'));
	}
};
var formatPost = function(post){
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
	return post;
};
module.exports = function(db){
	var Schema = db.Schema;
	var PostSchema = new Schema({
		'board': String,
		'isParent': Boolean,
		'parent': {type: Schema.ObjectId, required: false},
		'op': {type: Boolean, default: 0},
		'ip': String,
		'name': String,
		'tripcode': String,
		'email': String,
		'subject': String,
		'comment': String,
		'file': String,
		'time': {type: Date, default: Date.now},
		'closed': 0
	}), Post;
	PostSchema.set('redisCache', true);
	Post = db.model('Post', PostSchema);

	return {
		getIndexThreads: function(board, page, _callback){
			var page = page ? parseInt(page, 10) : 0,
				perPage = 10,
				offset = page * perPage,
				find = {};
			
			if(board && board !== 'all'){
				find['board'] = board;
			}
			find['isParent'] = false;
			
			Post.find(find)
			.sort({lastUpdate: -1})
			.skip(offset)
			.limit(perPage)
			.lean()
			.exec(function(err, threads){
				_callback(err, threads);
			});
		},
		getThread: function(id, _callback){
			var find = {};
			
			find['_id'] = id;
			find['isParent'] = false;

			Post.findOne(find)
			.lean()
			.exec(function(err, thread){
				if(thread){
					thread = formatPost(thread);
				}
				_callback(err, thread);
			});
		},
		getThreadReplies: function(id, _callback){
			var find = {};
			
			find['parent'] = id;
			find['isParent'] = true;
			
			Post.find(find)
			.lean()
			.exec(function(err, replies){
				_callback(err, replies);
			});
		},
		newThread: function(params, _callback){
			var p = {
				'board': params.board,
				'op': 1,
				'isParent': false,
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
					p['file'] = filename;
				}
				var t = new Post(formatPost(p));

				t.save(function(err, thread){
					_callback(err, thread);
				});
			});
		}
	};
};