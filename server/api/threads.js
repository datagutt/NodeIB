module.exports = function(db){
	var Schema = db.Schema;
	var ThreadSchema = new Schema({
		'op': Boolean,
		'sticky': Boolean,
		'ip': String,
		'name': String,
		'tripcode': String,
		'email': String,
		'subject': String,
		'comment': String,
		'time': {type: Date, default: Date.now},
		'closed': 0
	});
	ThreadSchema.set('redisCache', true);

	return {
		getThread: function(id){
			return {
				'thread': {
					'op': 1,
					'sticky': 0,
					'ip': '127.0.0.1',
					'name': 'Anonymous',
					'tripcode': 0,
					'email': '',
					'subject': 'test',
					'comment': 'this is a comment',
					'time': 1344570123,
					'closed': 0
				},
				'replies': {
					'2': {
						
					},
					'3': {
						
					}
				}
			};
		}
	};
};