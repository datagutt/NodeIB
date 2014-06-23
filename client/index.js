var express = require('express'),
	bodyParser = require('body-parser'),
	cookieParser = require('cookie-parser'),
	expressSession = require('express-session'),
	staticFavicon = require('static-favicon'),
	expressCsrf = require('csurf'),
	multer = require('multer'),
	swig = require('swig'),
	winston = require('winston'),
	expressWinston = require('express-winston'),
	path = require('path'),
	fs = require('fs'),
	async = require('async'),
	lessMiddleware = require('less-middleware');
var app,
	apiClient = require('./apiClient');
function setup(app, siteName){
	app.engine('html', swig.renderFile);
	app.set('view engine', 'html');
	app.set('view cache', false);
	app.set('views', __dirname + '/views');
	app.disable('x-powered-by');
	swig.setDefaults({cache: false});
	app.use(lessMiddleware(path.join(__dirname, 'less'), {
			dest: path.join(__dirname, 'public'),
			preprocess: {
				path: function(pathname, req){
				 	return pathname.replace(/\/assets\/stylesheets\//, '/');
				}
			},
			force: true
		}
	));
	app.use(express.static(path.join(__dirname, 'public')));
	app.use(express.static('uploads', nconf.get('api:upload_url')));
	app.use(bodyParser());
	app.use(cookieParser());
	app.use(expressSession({
		secret: 'secret',
		cookie: {
			httpOnly: true
		}
	}));
	if(nconf.get('client:use_csrf')){
		app.use(expressCsrf());
		app.use(function(req, res, next){
			res.locals.csrftoken = req.csrfToken();

			// Disable framing
			res.setHeader('X-Frame-Options', 'SAMEORIGIN');

			next();
		});
	}
	app.use(multer());
	//app.use(staticFavicon());
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
	app.use(function(req, res, next){
		res.setHeader('X-powered-by', 'NodeIB');
		next();
	});

	// Config
	app.locals.siteName = siteName;
	// Helpers
	app.locals.slug = require('slug');
	app.locals.now = function(){
		return new Date();
	};
	/* Wrap in function because timeago doesn't handle undefined */
	var timeago = require('timeago');
	app.locals.timeago = function(time){
		var ago = timeago(new Date(time));
		return ago;
	};

	async.waterfall([
		setupRoutes,
		apiClient.getBoards,
		function(boards, _callback){
			app.get('*', function(req, res, next){
				res.status(404);
				res.render('404.html');
			});
			_callback(boards);
		}
	], function(boards){
		async.map(boards, function(board, cb){
			cb(board.shortname);
		}, function(results){
			app.locals.boardNames = results;
		})
		app.locals.boards = boards;
	});

	// MAJOR HACK: Too tired to do this properly
	app.use(function(req, res, next){
			var currentBoard;
			try{
				var url = req.url.split('/')[1],
					match = url.match(/\w/);
				if(url.length == match[0].length){
					currentBoard = match[0];
				}
			}catch(e){}

			if(app.locals.boardNames && app.locals.boardNames.indexOf(currentBoard) > -1){
				res.locals.currentBoard = currentBoard;
			}

			next();
	});
}

function setupRoutes(_callback){
	require('./routes')(app, _callback);
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
