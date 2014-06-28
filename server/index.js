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

  app.set('json spaces', 1);
  app.disable('x-powered-by');
  app.use(bodyParser.urlencoded());
  app.use(bodyParser.json());
	app.use(expressValidator());
	app.use(cookieParser());
	app.use(expressSession({secret: 'secret'}));
	app.use(function(req, res, next){
    res.setHeader('X-powered-by', 'NodeIB');
		res.type('json');
		next();
	});

	setupRoutes(models);

	app.get('*', function(req, res){
		res.send([], 404);
	});
}

function setupRoutes(models){
	require('./routes')(app, models);
}

expressValidator.validator.extend('notNull', function (a, b){
  return b !== null && b !== '0';
});

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
