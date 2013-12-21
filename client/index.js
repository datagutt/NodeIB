var express = require('express'),
	winston = require('winston'),
	fs = require('fs');
var app,
	apiClient = require('./apiClient');
function setup(app){
	app.use(express.logger({format: 'dev'}));
	app.set('views', __dirname + '/views');
	app.set('view engine', 'swig');
	app.use(express.static(__dirname + '/public'));
	app.use(express.methodOverride());
	app.use(express.urlencoded())
	app.use(express.json());
	app.use(express.cookieParser());
	app.use(express.session({secret: 'secret'}));
	app.use(app.router);
	
	setupRoutes();
	
	app.get('*', function(req, res){
		res.status(404);
		res.render('404');
	});
}

function setupRoutes(){
	require('./routes')(app, apiClient);
}

function init(port, host){
	if(!app){
		app = express();
	}
	
	setup(app);
		
	app.listen(port, function(){
		winston.info('Client listening at 0.0.0.0:' + port);
	});
}

module.exports = init;