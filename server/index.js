var express = require('express'),
	resource = require('express-resource'),
	fs = require('fs'),
	async = require('async'),
	mongoose = require('mongoose'),
	mongooseRedisCache = require('throwsexception-mongoose-redis-cache');

var app,
	api = require('./api');
function setup(app, models){
	mongoose.connect('mongodb://localhost/nodeib');
	mongooseRedisCache(mongoose);

	app.use(express.logger({format: 'dev'}));
	app.set('views', __dirname + '/views');
	app.set('view engine', 'swig');
	app.use(express.urlencoded())
	app.use(express.json());
	app.use(express.cookieParser());
	app.use(express.session({secret: 'secret'}));
	app.use(app.router);
	app.use(function(req, res, next){
		res.type('json');
		next();
	});
	
	setupRoutes(models);
	
	app.get('*', function(req, res){
		res.send({}, 404);
	});
}

function setupRoutes(models){
	require('./routes')(app, models);
}

function init(port, host){
	if(!app){
		app = express();
	}
	
	api(mongoose, function(err, models){
		setup(app, models);
		
		app.listen(port, function(){
			console.log('%s listening at %s', 'NodeIB', '0.0.0.0:' + port);
		});
	})
}

module.exports = init;