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
			.exec(function(err, boards){
				_callback(err, boards);
			});
		}
	};
};