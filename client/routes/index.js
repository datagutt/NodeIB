var async = require('async');
module.exports = function(app, apiClient){
	var routes = [
		'threads',
		'boards'
	];
	
	async.forEach(routes, function(route, next){
		require('./' + route)(app, apiClient);
		next();
	}, function(err, results){
		console.log('All routes loaded!');
	});
};