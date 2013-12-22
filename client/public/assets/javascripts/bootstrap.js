(function(global){
	var Site = {};
	Site.queue = []; 
	Site.isDev = window.location.hostname == '127.0.0.1';
	Site.init = function(){
		/* 
			General initalization function,
			the rest should be added to the queue.
		*/
		window.scrollTo(0, 1);
	};
	Site.addToQueue = function(script){
		var queue = Site.queue;
		if(ID && ID.isHostMethod && ID.isHostMethod(queue, 'push')){
			if(queue.indexOf(script) == -1){
				queue.push(script);
			}
		}
	};
	if(ID && ID.areFeatures && ID.areFeatures('attachListener', 'forEach')){
		ID.attachListener(window, 'load', function ready(){
			Site.init();
			ID.forEach(Site.queue, function(script){
				if(typeof script == 'function'){
					script();
				}
			});
		});
	}
	global.Site = Site;
})(window);