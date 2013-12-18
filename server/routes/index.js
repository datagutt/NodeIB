var async = require('async');
module.exports = function(app, api){
	var routes = [
		'threads'
	];
	
	async.forEach(routes, function(route, next){
		var file = require('./' + route)(api);
		app.resource(route, file);
		next();
	}, function(err, results){
		console.log('All routes loaded!');
	});
};