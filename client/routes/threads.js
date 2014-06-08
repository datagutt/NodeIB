var async = require('async'),
	pagination = require('pagination');
var template = '<ul class="pure-paginator">'
	+ '<% if (first) { %>'
	+ '<li><a href="<%-preparedPreLink + first %>" class="pure-button first">First</a></li>'
	+ '<% } %>'
	+ '<% if (previous) {%>'
	+ '<li><a href="<%-preparedPreLink + previous %>" class="pure-button prev">&#171</a></li>'
	+ '<% } %> '
	+ '<% for ( var i = 0; i < range.length; i++ ) { %>'
	+ '<% if (range[i] == current) { %>'
	+ '<li><a href="<%-preparedPreLink %><%=range[i]%>" class="pure-button pure-button-active"><%=range[i]%></a></li>'
	+ '<% }else{ %>'
	+ '<li><a href="<%-preparedPreLink %><%=range[i]%>" class="pure-button"><%=range[i]%></a></li>'
	+ '<% } %>'
	+ '<% } %>'
	+ '<% if (next) { %>'
	+ '<li><a href="<%-preparedPreLink + next %>" class="pure-button">&#187;</a></li>'
	+ '<% } %>'
	+ '<% if (last) {%>'
	+ '<li><a href="<%-preparedPreLink + last %>" class="pure-button last">Last</a></li>'
	+ '<% } %>'
	+ '</ul>';
module.exports = function threads(app, apiClient){
	app.route('/:shortname')
	.get(function(req, res){
		var shortName = req.params.shortname,
			page = req.query.page ? parseInt(req.query.page, 10) : 1
			perPage = nconf.get('board:threadsPerPage'),
			offset = (page - 1) * perPage;

		async.waterfall([
			function(_callback){
				apiClient.getBoard(shortName, _callback);
			},
			function(board, _callback){
				if(!board || !board.hasOwnProperty('name')){
					var e = new Error('Board not found');
					return _callback(e);
				}
				var boardName = board.name.toLowerCase();
				apiClient.getIndexThreads(boardName, page, function(err, threads){
					_callback(err, board, threads);
				});
			},
			function(board, threads, _callback){
				if(!board || !board.hasOwnProperty('name')){
					var e = new Error('Board not found');
					return _callback(e);
				}
				var boardName = board.name.toLowerCase();
				apiClient.getTotalThreads(boardName, function(err, json){
					_callback(err, board, threads, json.total);
				});
			}
		], function(err, board, threads, total){
			if(board){
				var paginator = new pagination.TemplatePaginator({
					'prelink': '/' + shortName + '/',
					'current': page,
					'rowsPerPage': perPage,
					'totalResult': total || 0,
					'template': template
				});
				res.render('threads.html', {
					'board': board,
					'threads': threads,
					'pagination': paginator.render()
				});
			}else{
				res.render('404.html');
			}
		});
	})
	.post(function(req, res){
		var shortName = req.params.shortname;

		async.waterfall([
			function(_callback){
				apiClient.getBoard(shortName, _callback);
			},
			function(board, _callback){
				if(!board || !board.hasOwnProperty('name')){
					var e = new Error('Board not found');
					return _callback(e);
				}
				var boardName = board.name.toLowerCase();
				apiClient.newThread({
					'board': boardName,
					'name': req.body.name,
					'email': req.body.email,
					'subject': req.body.subject,
					'comment': req.body.comment,
					'file': req.files.image,
					'sticky': 0,
					'ip': req.connection.remoteAddress,
					'closed': 0
				}, _callback);
			}
		], function(err, thread){
			if(err){
				return res.json(JSON.parse(err.message));
			}

			if(thread){
				res.redirect('/' + shortName);
			}
		});
	});
	app.route('/:shortname/thread/:thread')
	.get(function(req, res){
		var shortName = req.params.shortname,
			thread = req.params.thread,
			page = req.query.page ? parseInt(req.query.page, 10) : 1
			perPage = nconf.get('board:threadsPerPage'),
			offset = (page - 1) * perPage;

		async.waterfall([
			function(_callback){
				apiClient.getBoard(shortName, _callback);
			},
			function(board, _callback){
				if(!board || !board.hasOwnProperty('name')){
					var e = new Error('Board not found');
					return _callback(e);
				}
				var boardName = board.name.toLowerCase();
				apiClient.getThread(thread, page, function(err, thread){
					_callback(err, board, thread);
				});
			}
		], function(err, board, thread){
			if(board && Object.keys(thread).length){
				if(thread && threads.replies && thread.replies.length){
					var totalResult = thread.replies.length;
				}else{
					var totalResult = 0;
				}
				var paginator = new pagination.TemplatePaginator({
					'prelink': '/' + shortName + '/thread/' + thread,
					'current': page,
					'rowsPerPage': perPage,
					'totalResult': totalResult,
					'template': template
				});
				res.render('thread.html', {
					'board': board,
					'thread': thread,
					'pagination': paginator.render()
				});
			}else{
				res.render('404.html');
			}
		});
	})
	.post(function(req, res){
		var shortName = req.params.shortname,
			thread = req.params.thread;

		async.waterfall([
			function(_callback){
				apiClient.getBoard(shortName, _callback);
			},
			function(board, _callback){
				apiClient.getThread(thread, 0, function(err, thread){
					_callback(err, board, thread);
				});
			},
			function(board, thread, _callback){
				var boardName = board.name.toLowerCase();
				apiClient.newReply({
					'hasParent': true,
					'parent': thread._id,
					'board': boardName,
					'name': req.body.name,
					'email': req.body.email,
					'comment': req.body.comment,
					'file': req.files.image,
					'ip': req.connection.remoteAddress
				}, _callback);
			}
		], function(err, thread){
			if(err){
				return res.json(JSON.parse(err.message));
			}

			if(thread){
				res.redirect('/' + shortName + '/thread/' + thread.parent);
			}
		});
	});
};
