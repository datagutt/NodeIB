var async = require('async'),
	_ = require('lodash');

module.exports = function threads(app, api){
	var ThreadApi = api.threads; 
	var getThreadReplies = function(thread, _callback){
		if(thread && thread._id){
			ThreadApi.getThreadReplies(thread._id, function(err, replies){
				if(replies){
					thread.replies = replies;
					_callback(null, thread);
				}else{
					_callback(err);
				}
			});
		}else{
			_callback(true);
		}
	};
	
	app.get('/totalThreads/:board?', function(req, res){
		var board = req.params.board;
			
		ThreadApi.getTotalThreads(board, function(total){
			res.send(total);
		});
	});
	
	// The "?" after each parameter makes it optional
	app.get('/threads/:board?/:page?', function(req, res){
		var board = req.params.board,
			page = req.params.page,
			threads;
			
		ThreadApi.getIndexThreads(board, page, function(err, threads){
			if(threads){
				async.map(threads, getThreadReplies, function(err, threads){
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

	app.post('/newThread', function(req, res){

		req.checkBody('name', 'Name can not be empty.').notEmpty();
		req.checkBody('name', 'Too many characters in name field.').len(0, 100);

		if(req.body.email !== ''){
			req.checkBody('email', 'Email field most contain a valid email.').isEmail();
			req.checkBody('email', 'Too many characters in email field.').len(0, 100);
		}

		req.checkBody('subject', 'Subject field can not be empty.').notEmpty();
		req.checkBody('subject', 'Too many characters in subject field.').len(0, 100);

		req.checkBody('comment', 'Comment field can not be empty.').notEmpty();
		req.checkBody('comment', 'Too many characters in comment field.').len(0, 10000);

		req.sanitize('name').escape();
		req.sanitize('subject').escape();
		req.sanitize('comment').escape();
		
		var errors = req.validationErrors(true);
		if(errors){
			res.status(500);
			res.send({
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
				res.send(thread || []);
			}
		});
	})
};