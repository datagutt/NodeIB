(function(){
	var nconf = require('nconf'),
		path = require('path'),
		async = require('async');

	global.env = process.env.NODE_ENV || 'production';

	nconf.argv().env();
	nconf.file('default', path.join('config', path.sep, global.env + '.json'));
	nconf.set('base_dir', __dirname);
	nconf.set('server_dir', path.join(nconf.get('base_dir'), path.sep, 'server'));
	nconf.set('client_dir', path.join(nconf.get('base_dir'), path.sep, 'client'));
	nconf.defaults({
		'api': {
			'port': 3000,
			'tripsalt': '3895ha985hva9v5hav5+jav5',
			'upload_path': path.join(nconf.get('client_dir'), 'public', 'uploads')
		},
		'client': {
			'port': 3100,
			'siteName': 'NodeIB',
			'upload_url':  '/public/uploads',
			'date_format': 'm/d/y (D) G:H'
		},
		'image': {
			'thumbnail': {
				'width': 128,
				'height': 128
			}
		},
		'video': {
			'thumbnail': {
				'width': 128,
				'height': 128
			}
		},
		'board': {
			'threadsPerPage': 10,
			'repliesShown': 5,
			'maxThreads': 100,
			'op': {
				'fileRequired': true
			}
		}
	});

	global.nconf = nconf;

	var server = require('./server'),
		client = require('./client');
	server(nconf.get('api:port'));
	client(nconf.get('client:port'), nconf.get('client:siteName'));
}());
