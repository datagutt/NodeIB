var express = require('express'),
  bodyParser = require('body-parser'),
  cookieParser = require('cookie-parser'),
  expressSession = require('express-session'),
  expressValidator = require('express-validator'),
	winston = require('winston'),
	fs = require('fs'),
	mongoose = require('mongoose'),
	mongooseRedisCache = require('throwsexception-mongoose-redis-cache');
var app,
	api = require('./api');
function setup(app, models){
	mongoose.connect('mongodb://localhost/nodeib');
	mongooseRedisCache(mongoose);

	app.set('views', __dirname + '/views');
	app.set('view engine', 'swig');
	app.use(bodyParser());
	app.use(expressValidator());
	app.use(cookieParser());
	app.use(expressSession({secret: 'secret'}));
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
			winston.info('API listening at 0.0.0.0:' + port);
		});
	})
}

module.exports = init;
