var qs = require('qs'),
	apiUrl = 'http://localhost:3000',
    request = require('request').defaults({
        encoding: 'utf8',
        jar: false,
        timeout: 30 * 1000
    });
function checkResponse(err, apiRes, next){
    if(err) return next(err);

    if(apiRes && apiRes.statusCode === 500){
        next(new Error(apiRes.body));
        return false;
    }
    return true;
}
function parseJson(json, next, success){
    try{
        json = JSON.parse(json);
    }catch(e){
        return next(e);
    }
    success(json);
}
module.exports = {
	getBoards: function(_callback){
		var route = '/boards';

		request({
			method: 'get',
			uri: apiUrl + route
		}, function(err, response, json){
			if(!checkResponse(err, response, _callback)) return;

            parseJson(json, _callback, function(json){
                _callback(null, json);
            });
		});
	},
	getBoard: function(shortname, _callback){
		var route = '/board/';

		if(shortname){
			route += shortname;
		}
		
		request({
			method: 'get',
			uri: apiUrl + route
		}, function(err, response, json){
			if(!checkResponse(err, response, _callback)) return;

            parseJson(json, _callback, function(json){
                _callback(null, json);
            });
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

		request({
			method: 'get',
			uri: apiUrl + route
		}, function(err, response, json){
			if(!checkResponse(err, response, _callback)) return;

            parseJson(json, _callback, function(json){
                _callback(null, json);
            });
		});
	},
	newThread: function(params, _callback){
		var route = '/newThread/';

		if(!params){
			params = {};
		}
		var data = JSON.stringify(params);

		request.post(apiUrl + route, {form: params}, function(err, response, json){
			if(!checkResponse(err, response, _callback)) return;

			parseJson(json, _callback, function(json){
				_callback(null, json);
			});
		});
	}
};