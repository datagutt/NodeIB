(function(){
	var nconf = require('nconf'),
		path = require('path'),
		async = require('async'),
		cluster = require('cluster');
	var server = require('./worker');

	global.env = process.env.NODE_ENV || 'production';

	nconf.argv().env();
	nconf.file('default', path.join('config', path.sep, global.env + '.json'));
	nconf.set('base_dir', __dirname);
	nconf.set('client_dir', path.join(nconf.get('base_dir'), path.sep, '../NodeIB-client'));
	console.log(path.join(nconf.get('client_dir'), 'public', 'uploads'));
	nconf.defaults({
		'api': {
			'port': 3000,
			'tripsalt': '3895ha985hva9v5hav5+jav5',
			'upload_path': path.join(nconf.get('client_dir'), 'public', 'uploads'),
			'cluster': false
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

	// Count the machine's CPUs
	var cpuCount = require('os').cpus().length;

	if(cluster.isMaster && nconf.get('client:cluster')){
		// Create a worker for each CPU
		for(var i = 0; i <cpuCount; i += 1){
			cluster.fork();
		}

		// Restart dead workers
		cluster.on('exit', function(worker){
			console.log('Worker ' + worker.id + ' died :(');
			cluster.fork();
		});

		console.log('Master process started');
	}else{
		server(nconf.get('api:port'));
	}
}());
