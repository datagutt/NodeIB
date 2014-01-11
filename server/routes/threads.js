var async = require('async');

module.exports = function threads(app, api){
	var ThreadApi = api.threads; 
	var getThreadReplies = function(thread, _callback){
		if(thread && thread._id){
			ThreadApi.getThreadReplies(thread._id, function(err, replies){
				if(replies){
					thread.replies = replies;
					_callback(null, thread);
				}else{
					_callback(err);
				}
			});
		}else{
			_callback(true);
		}
	};
	
	// The "?" after each parameter makes it optional
	app.get('/threads/:board?/:page?', function(req, res){
		var board = req.params.board,
			page = req.params.page,
			threads;
			
		ThreadApi.getIndexThreads(board, page, function(err, threads){
			if(threads){
				async.map(threads, getThreadReplies, function(err, threads){
					if(err){
						res.send({'error': true, 'message': 'Error while retrieving replies'});
					}else{
						res.send(threads);
					}
				});
			}else{
				res.send([]);
			}
		});
	});
	app.get('/test', function(req, res){
		api.threads.getThread('52b427ada90c424c1d000001', function(err, thread){
			if(err){
				res.send(err);
			}else{
				res.send(thread);
			}
		});
	});
}