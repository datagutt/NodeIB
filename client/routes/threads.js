module.exports = function threads(app, apiClient){
	app.get('/:shortname', function(req, res){
		var shortName = req.params.shortname,
			page = req.query.page;
		
		apiClient.getBoard(shortName, function(err, board){
			var boardName;
			if(board && board.name){
				boardName = board.name.toLowerCase();
			}
			apiClient.getIndexThreads(boardName, page, function(err, threads){
				res.render('threads.html', {
					'board': board,
					'threads': threads
				});
			});
		});
	});
	app.post('/:board', function(req, res){
		var board = req.params.board;
		apiClient.newThread(board, {});
	});
}