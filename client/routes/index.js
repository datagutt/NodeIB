var async = require('async'),
	apiClient = require('../apiClient');
module.exports = function(app, _callback){
	var routes = [
		'threads',
		'boards'
	];

	async.forEach(routes, function(route, next){
		require('./' + route)(app, apiClient);
		next();
	}, function(err, results){
		console.log('All routes loaded!');
		_callback();
	});
};
