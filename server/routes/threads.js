module.exports = function threads(api){
	return {
		index: function(req, res){
			var ThreadApi = api.threads,
				page = 0;
			ThreadApi.getIndexThreads(false, page, function(err, threads){
				res.send(threads);
			});
		}
	};
}