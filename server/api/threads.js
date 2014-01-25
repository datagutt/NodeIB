var tripcode = require('tripcode'),
	tripsalt = nconf.get('api:tripsalt');
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
		'parent': Schema.ObjectId,
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
				threads[0] = formatPost(threads[0]);
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
				thread = formatPost(thread);
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
			var t = new Post(formatPost({
				'parent': 0,
				'op': 1,
				'name': params.name,
				'tripcode': '',
				'email': params.email,
				'subject': params.subject,
				'comment': params.comment,
				'sticky': params.sticky,
				'ip': params.ip,
				'closed': params.closed
			}));
			
			t.save(function(err, thread){
				_callback(err, thread);
			});
		}
	};
};