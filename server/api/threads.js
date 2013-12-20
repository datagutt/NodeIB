var tripc = require('tripcode');
module.exports = function(db){
	var Schema = db.Schema;
	var ThreadSchema = new Schema({
		'op': Boolean,
		'sticky': Boolean,
		'ip': String,
		'name': String,
		'tripcode': String,
		'email': String,
		'subject': String,
		'comment': String,
		'time': {type: Date, default: Date.now},
		'closed': 0
	}), Thread;
	ThreadSchema.set('redisCache', true);
	Thread = db.model('Thread', ThreadSchema);

	return {
		getIndexThreads: function(board, page, _callback){
			var page = page ? parseInt(page, 10) : 0,
				perPage = 10,
				offset = page * perPage,
				find = {};
			
			if(board){
				find['board'] = board;
			}
			
			Thread.find(find)
			.sort({lastUpdate: -1})
			.skip(offset)
			.limit(perPage)
			.lean()
			.exec(function(err, threads){
				_callback(err, threads);
			});
		},
		getThread: function(id, _callback){
			Thread.findOne({_id: id})
			.lean()
			.exec(function(err, thread){
				_callback(err, thread);
			});
		},
		newThread: function(params, _callback){
			var pp = params.name.split('#');
			if(pp.length > 1){
				var tripcode = tripc(pp[1]);
			}
			
			var t = new Thread({
				'name': params.name,
				'tripcode': tripcode,
				'email': params.email,
				'subject': params.subject,
				'comment': params.comment,
				'sticky': params.sticky,
				'ip': params.ip
				'closed': params.closed
			});
			
			thread.save(function(err, thread){
				_callback(err, thread);
			});
		}
	};
};