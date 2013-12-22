(function(){
	var nconf = require('nconf'),
		async = require('async');
	
	global.env = process.env.NODE_ENV || 'production';
	
	nconf.argv().env();
	nconf.file('default', 'config/' + global.env + '.json');
	nconf.defaults({
		'api': {
			'port': 3000
		},
		'client': {
			'port': 3100,
			'siteName': 'NodeIB'
		}
	});
	
	var server = require('./server'),
		client = require('./client');
	server(nconf.get('api:port'));
	client(nconf.get('client:port'), nconf.get('client:siteName'));
}());