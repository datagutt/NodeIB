module.exports = function(db){
	var Schema = db.Schema;
	var BoardSchema = new Schema({
		'name': String,
		'shortname': String
	}), Board;
	BoardSchema.set('redisCache', true);
	Board = db.model('Board', BoardSchema);

	return {
		getBoards: function(_callback){
			Board.find()
			.lean()
			.exec(_callback);
		},
		getBoard: function(shortname, _callback){
			Board.findOne({'shortname': shortname})
			.lean()
			.exec(_callback);
		},
		newBoard: function(params, _callback){
			var b = new Board(params);
			b.save(_callback);
		},
		removeBoard: function(shortname, _callback){
			Board.remove({'shortname': shortname}, function(err){
				console.log(err);
			});
		}
	};
};
