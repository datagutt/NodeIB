module.exports = function threads(api){
	return {
		index: function(req, res){
			var ThreadApi = api.threads;
			res.send(ThreadApi.getThread(1));
		}
	};
}