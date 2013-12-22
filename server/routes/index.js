var async = require('async');
module.exports = function(app, api){
	var routes = [
		'threads',
		'boards'
	];
	
	async.forEach(routes, function(route, next){
		var file = require('./' + route)(app, api);
		next();
	}, function(err, results){
		console.log('All routes loaded!');
	});
};