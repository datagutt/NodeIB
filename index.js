(function(){
	var nconf = require('nconf'),
		async = require('async');
	
	global.env = process.env.NODE_ENV || 'production';
	
	nconf.argv().env();
	nconf.file('default', 'config/' + global.env + '.json');
	nconf.defaults({
		'api': {
			'port': 3001
		}
	});
	
	var server = require('./server/');
	server(nconf.get('api:port'));
}());