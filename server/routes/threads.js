module.exports = function threads(app, api){
	app.get('/threads', function(req, res){
		var ThreadApi = api.threads,
			board,
			page = 0;
		ThreadApi.getIndexThreads(board, page, function(err, threads){
			res.send(threads);
		});
	});
	app.get('/threads/:board', function(req, res){
		var ThreadApi = api.threads,
			board = req.params.board,
			page = 0;
		ThreadApi.getIndexThreads(board, page, function(err, threads){
			res.send(threads);
		});
	});
	app.get('/threads/:board/:page', function(req, res){
		var ThreadApi = api.threads,
			board = req.params.board,
			page = req.params.page;
		ThreadApi.getIndexThreads(board, page, function(err, threads){
			res.send(threads);
		});
	});
}