module.exports = function config(app, api){
	app.route('/config')
	.get(function(req, res){
		var obj = {};
		['api', 'image', 'video', 'board'].forEach(function(type){
			obj[type] = nconf.get(type);
		});
		return res.send(obj);
	});
	app.route('/config/:type')
	.get(function(req, res){
		var type = req.params.type;
		var obj = {};
		obj[type] = nconf.get(type);
		return res.send(obj);
	});
}