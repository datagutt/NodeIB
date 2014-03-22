var async = require('async'),
	pagination = require('pure-css-pagination');
module.exports = function threads(app, apiClient){
	app.route('/:shortname')
	.get(function(req, res){
		var shortName = req.params.shortname,
			page = req.query.page ? parseInt(req.query.page, 10) : 1
			perPage = 10,
			offset = (page - 1) * perPage;

		async.waterfall([
			function(_callback){
				apiClient.getBoard(shortName, function(err, board){
					_callback(err, board);
				});
			},
			function(board, _callback){
				var boardName = board.name.toLowerCase();
				apiClient.getIndexThreads(boardName, page, function(err, threads){
					_callback(err, board, threads);
				});
			},
			function(board, threads, _callback){
				var boardName = board.name.toLowerCase();
				apiClient.getTotalThreads(boardName, function(err, json){
					_callback(err, board, threads, json.total);
				});
			}
		], function(err, board, threads, total){
			if(board){
				var paginator = new pagination.SearchPaginator({
					'prelink': '/' + shortName + '/',
					'current': page,
					'rowsPerPage': perPage,
					'totalResult': total
				});
				res.render('threads.html', {
					'board': board,
					'threads': threads,
					'pagination': paginator.render()
				});
			}else{
				res.render('404.html');
			}
		});
	})
	.post(function(req, res, next){
		var shortName = req.params.shortname;

		async.waterfall([
			function(_callback){
				apiClient.getBoard(shortName, function(err, board){
					var boardName;
					if(board && board.name){
						boardName = board.name.toLowerCase();
					}
					_callback(err, boardName);
				});
			},
			function(boardName, _callback){
				apiClient.newThread({
					'board': boardName,
					'name': req.body.name,
					'email': req.body.email,
					'subject': req.body.subject,
					'comment': req.body.comment,
					'file': req.files.image,
					'sticky': 0,
					'ip': req.connection.remoteAddress,
					'closed': 0
				}, _callback);
			}
		], function(err, thread){
			if(err){
				return res.json(JSON.parse(err.message));
			}

			if(thread){
				res.redirect('/' + shortName);
			}
		});
	});
	app.get('/:shortname/thread/:thread', function(req, res){
		var shortName = req.params.shortname,
			thread = req.params.thread,
			page = req.query.page ? parseInt(req.query.page, 10) : 1
			perPage = 10,
			offset = (page - 1) * perPage;

		async.waterfall([
			function(_callback){
				apiClient.getBoard(shortName, function(err, board){
					_callback(err, board);
				});
			},
			function(board, _callback){
				var boardName = board.name.toLowerCase();
				apiClient.getThread(thread, boardName, page, function(err, thread){
					_callback(err, board, thread);
				});
			}
		], function(err, board, thread){
			if(board){
				var paginator = new pagination.SearchPaginator({
					'prelink': '/' + shortName + '/thread/' + thread,
					'current': page,
					'rowsPerPage': perPage,
					'totalResult': thread.length
				});
				res.render('thread.html', {
					'board': board,
					'thread': thread,
					'pagination': paginator.render()
				});
			}else{
				res.render('404.html');
			}
		});
	});
};
