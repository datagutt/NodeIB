var async = require('async');
module.exports = function threads(app, apiClient){
	app.get('/:shortname', function(req, res){
		var shortName = req.params.shortname,
			page = req.query.page;
		
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
			}
		], function(err, board, threads){
			if(board){
				res.render('threads.html', {
					'board': board,
					'threads': threads
				});
			}else{
				res.render('404.html');
			}
		});
	});
	app.post('/:shortname', function(req, res, next){
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
				console.log(err);
				res.json(JSON.parse(err.message));
			}

			if(thread){
				res.redirect('/' + shortName);
			}
		});
	});
};