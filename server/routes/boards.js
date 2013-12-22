module.exports = function boards(app, api){
	app.get('/boards', function(req, res){
		var BoardApi = api.boards;
		BoardApi.getBoards(function(err, boards){
			res.send(boards);
		});
	});
}