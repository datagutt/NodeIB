module.exports = function threads(app, apiClient){
	app.get('/:board', function(req, res){
		var board = req.params.board,
			page = req.query.page;
		apiClient.getIndexThreads(board, page, function(err, threads){
			res.render('threads.html', {
				'board': board,
				'threads': threads
			});
		});
	});
}