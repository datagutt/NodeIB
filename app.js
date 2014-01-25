(function(){
	var nconf = require('nconf'),
		async = require('async');
	
	global.env = process.env.NODE_ENV || 'production';
	
	nconf.argv().env();
	nconf.file('default', 'config/' + global.env + '.json');
	nconf.defaults({
		'api': {
			'port': 3000,
			'tripsalt': '3895ha985hva9v5hav5+jav5'
		},
		'client': {
			'port': 3100,
			'siteName': 'NodeIB'
		}
	});
	global.nconf = nconf;
	
	var server = require('./server'),
		client = require('./client');
	server(nconf.get('api:port'));
	client(nconf.get('client:port'), nconf.get('client:siteName'));
}());