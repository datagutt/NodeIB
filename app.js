(function(){
	var nconf = require('nconf'),
		path = require('path'),
		async = require('async');
	
	global.env = process.env.NODE_ENV || 'production';
	
	nconf.argv().env();
	nconf.file('default', 'config/' + global.env + '.json');
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
			'upload_url':  '/public/uploads'
		}
	});

	global.nconf = nconf;
	
	var server = require('./server'),
		client = require('./client');
	server(nconf.get('api:port'));
	client(nconf.get('client:port'), nconf.get('client:siteName'));
}());