var qs = require('qs'),
	apiUrl = 'http://localhost:3000',
	request = require('request-json'),
	client = request.newClient(apiUrl);
function checkResponse(err, apiRes, next){
    if(err) return next(err);

    if(apiRes && [500, 401, 404].indexOf(apiRes.statusCode) > -1){
				console.log(apiRes.body);
        next(new Error(JSON.stringify(apiRes.body)));
        return false;
    }
    return true;
}
module.exports = {
	getBoards: function(_callback){
		var route = '/boards';

		client.get(route, function(err, response, json){
			if(!checkResponse(err, response, _callback)) return;

			_callback(null, json);
		});
	},
	getBoard: function(shortname, _callback){
		var route = '/board/';

		if(shortname){
			route += shortname;
		}

		client.get(route, function(err, response, json){
			if(!checkResponse(err, response, _callback)) return;

			_callback(null, json);
		});
	},
	getThread: function(thread, page, _callback){
		var route = '/thread/';

		if(thread){
			route += thread;
		}

		if(page){
			route += '/' + page;
		}

		client.get(route, function(err, response, json){
			if(!checkResponse(err, response, _callback)) return;

			_callback(null, json);
		});
	},
	getIndexThreads: function(board, page, _callback){
		var route = '/threads/';

		if(board){
			route += board;
		}else{
			route += 'all';
		}

		if(page){
			route += '/' + page;
		}

		client.get(route, function(err, response, json){
			if(!checkResponse(err, response, _callback)) return;

			_callback(null, json);
		});
	},
	getTotalThreads: function(board, _callback){
		var route = '/totalThreads/';

		if(board){
			route += board;
		}else{
			route += 'all';
		}

		client.get(route, function(err, response, json){
			if(!checkResponse(err, response, _callback)) return;

			_callback(null, json);
		});
	},
	newThread: function(params, _callback){
		var route = '/newThread';

		if(!params){
			params = {};
		}

		client.post(route, params, function(err, response, json){
			if(!checkResponse(err, response, _callback)) return;

			_callback(null, json);
		});
	},
	newReply: function(params, _callback){
		var route = '/newReply';

		if(!params){
			params = {};
		}

		client.post(route, params, function(err, response, json){
			if(!checkResponse(err, response, _callback)) return;

			_callback(null, json);
		});
	}
};
