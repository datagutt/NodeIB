var express = require('express'),
	multipart = require('./multipart'),
	swig = require('swig'),
	winston = require('winston'),
	expressWinston = require('express-winston'),
	path = require('path'),
	fs = require('fs');
var app,
	apiClient = require('./apiClient');
function setup(app, siteName){
	app.engine('html', swig.renderFile);
	app.set('view engine', 'html');
	app.set('view cache', false);
	app.set('views', __dirname + '/views');
	swig.setDefaults({cache: false});
	app.use(require('less-middleware')({
        src: __dirname + '/less',
    	dest: __dirname + "/public/assets/stylesheets",
        prefix: '/assets/stylesheets',
		yuicompress: app.enabled('minification') ? true : false,
		force: true
	}));
	app.use(express.static('uploads', nconf.get('api:upload_url')));
	app.use(express.static(__dirname + '/public'));
	app.use(express.methodOverride());
	app.use(express.urlencoded())
	app.use(express.json());
	app.use(express.cookieParser());
	app.use(express.session({
		secret: 'secret',
		cookie: {
			httpOnly: true
		}
	}));
	if(nconf.get('client:use_csrf')){
		app.use(express.csrf());
		app.use(function(req, res, next){
			res.locals.csrftoken = req.csrfToken();

			// Disable framing
			res.setHeader('X-Frame-Options', 'SAMEORIGIN');

			next();
		});
	}
	app.use(multipart);
	app.use(express.favicon());
	app.use(app.router);
	app.use(expressWinston.errorLogger({
		transports: [
			new winston.transports.Console({
				json: true,
				colorize: true
			})
		],
		meta: true,
		msg: "HTTP {{req.method}} {{req.url}}"
	}));
	
	// Config
	app.locals.siteName = siteName;
	// Helpers
	app.locals.now = function(){
		return new Date();
	};
	/* Wrap in function because timeago doesn't handle undefined */
	var timeago = require('timeago');
	app.locals.timeago = function(time){
		var ago = timeago(new Date(time));
		return ago;
	};

	setupRoutes();
	
	app.get('*', function(req, res){
		res.status(404);
		res.render('404.html');
	});
}

function setupRoutes(){
	require('./routes')(app, apiClient);
}

function init(port, siteName){
	if(!app){
		app = express();
	}
	
	setup(app, siteName);
		
	app.listen(port, function(){
		winston.info('Client listening at 0.0.0.0:' + port);
	});
}

module.exports = init;