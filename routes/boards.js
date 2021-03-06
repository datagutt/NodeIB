module.exports = function boards(app, api){
	app.get('/boards', function(req, res){
		var BoardApi = api.boards;
		BoardApi.getBoards(function(err, boards){
			res.send(boards);
		});
	});
	app.get('/board/:shortname', function(req, res){
		var BoardApi = api.boards,
			shortname = req.params.shortname;
		BoardApi.getBoard(shortname, function(err, board){
			res.send(board);
		});
	});
	app.get('/newBoard/:name/:shortname', function(req, res){
		var BoardApi = api.boards;
		BoardApi.newBoard({
		'name': req.params.name,
		'shortname': req.params.shortname
		}, function(err, board){
			res.send(board);
		});
	});
}
