var async = require('async'),
	_ = require('lodash');

module.exports = function threads(app, api){
	var ThreadApi = api.threads;
	var getThreadReplies = function(thread, index, _callback){
		var repliesShown = nconf.get('board:repliesShown');
		if(thread && typeof thread._id == 'number'){
			async.waterfall([
				function(cb){
					ThreadApi.getThreadReplies(thread._id, (index ? repliesShown : 0), cb);
				},
				function(replies, cb){
					if(replies){
						thread.replies = replies;
					}
					if(repliesShown == replies.length){
						ThreadApi.countThreadReplies(thread._id, function(err, totalReplies){
							thread.omitted = totalReplies - repliesShown;
							cb(err, thread);
						});
					}else{
						thread.omitted = 0;
						cb(null, thread);
					}
				}], _callback);
		}else{
			_callback(true);
		}
	};

	app.get('/clean/:board', function(req, res){
		ThreadApi.clean(req.params.board, null, function(result){
			res.send({'result': result})
		});
	})

	app.get('/totalThreads/:board?', function(req, res){
		var board = req.params.board;

		ThreadApi.getTotalThreads(board, function(err, total){
			if(err){
				res.status(500);
				res.send({'error': true, 'message': err.message});
			}
			res.send({'total': total});
		});
	});

	// The "?" after each parameter makes it optional
	app.get('/threads/:board?/:page?', function(req, res){
		var board = req.params.board,
			page = req.params.page;

		ThreadApi.getIndexThreads(board, page, function(err, threads){
			if(threads){
				async.map(threads, function(reply, cb){
						getThreadReplies(reply, true, cb);
					}, function(err, threads){
					if(err){
						res.status(500);
						res.send({'error': true, 'message': 'Error while retrieving replies'});
					}else{
						res.send(threads);
					}
				});
			}else{
				res.send([]);
			}
		});
	});

	app.get('/thread/:thread/:page?', function(req, res){
		var thread = req.params.thread,
			page = req.params.page;

		ThreadApi.getThread(thread, page, function(err, thread){
			if(thread){
				getThreadReplies(thread, false, function(err, threads){
					if(err){
						res.status(500);
						res.send({'error': true, 'message': 'Error while retrieving replies'});
					}else{
						res.send(thread);
					}
				});
			}else{
				res.send([]);
			}
		});
	});

	app.post('/newThread', function(req, res){

		req.checkBody('name', 'Name can not be empty.').notEmpty();
		req.checkBody('name', 'Too many characters in name field.').len(0, 100);

		if(req.body.email && req.body.email !== ''){
			req.checkBody('email', 'Email field most contain a valid email.').isEmail();
			req.checkBody('email', 'Too many characters in email field.').len(0, 100);
		}

		req.checkBody('subject', 'Subject field can not be empty.').notEmpty();
		req.checkBody('subject', 'Too many characters in subject field.').len(0, 100);

		req.checkBody('comment', 'Comment field can not be empty.').notEmpty();
		req.checkBody('comment', 'Too many characters in comment field.').len(0, 10000);

		if(nconf.get('board:op:fileRequired')){
			// MAJOR HACK!
			// Find out why this doesn't get sent in the first place
			if(!req.body.file){
				req.body.file = {
					'size': 0
				};
			}
			//req.assert(req.body.file, 'File is required').notEmpty();
			req.assert(0, 'File is required').notEmpty(req.body.file.size);
		}

		req.sanitize('name').escape();
		req.sanitize('subject').escape();
		req.sanitize('comment').escape();

		var errors = req.validationErrors(true);
		if(errors){
			res.status(500);
			return res.send({
				'error': true,
				'message': 'Validation error.',
				'errors': errors
			});
		}

		ThreadApi.newThread(req.body, function(err, thread){
			if(err){
				res.status(500);
				res.send({
					'error': true,
					'message': err.message
				});
			}else{
				ThreadApi.clean(req.body.board);
				res.send(thread || []);
			}
		});
	});

	app.post('/newReply', function(req, res){

			req.checkBody('name', 'Name can not be empty.').notEmpty();
			req.checkBody('name', 'Too many characters in name field.').len(0, 100);

			if(req.body.email && req.body.email !== ''){
				req.checkBody('email', 'Email field most contain a valid email.').isEmail();
				req.checkBody('email', 'Too many characters in email field.').len(0, 100);
			}

			req.checkBody('comment', 'Comment field can not be empty.').notEmpty();
			req.checkBody('comment', 'Too many characters in comment field.').len(0, 10000);

			req.sanitize('name').escape();
			req.sanitize('comment').escape();

			var errors = req.validationErrors(true);
			if(errors){
				res.status(500);
				return res.send({
					'error': true,
					'message': 'Validation error.',
					'errors': errors
				});
			}

			ThreadApi.newReply(req.body, function(err, post){
				if(err){
					res.status(500);
					res.send({
						'error': true,
						'message': err.message
					});
				}else{
					if(post && post.parent){
						console.log(post.parent);
						ThreadApi.bumpThread(post.parent);
					}else if(post.id && !post.parent){
						console.log(post._id);
						ThreadApi.bumpThread(post._id);
					}
					res.send(post || []);
				}
			});
		});
};
