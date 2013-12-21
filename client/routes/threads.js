module.exports = function threads(app, apiClient){
	app.get('/', function(req, res){
		var board = req.query.board,
			page = req.query.page;
		apiClient.getIndexThreads(board, page, function(err, threads){
			 console.log(threads);
			 res.render('threads', {
				 'threads': threads
			 });
		});
	});
}