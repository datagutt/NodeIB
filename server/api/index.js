var async = require('async');
module.exports = function(db, _callback){
	var files = {
		'threads': 'threads.js',
		'boards': 'boards.js'
	};
	var models = {};
	
	for(var model in files){
		var file = files[model];
		models[model] = require('./' + file)(db);
	};
	
	console.log('All models loaded!');
	_callback(null, models);
	
};