var web = angular.module('web', []);


// -----------
// Controllers
// -----------

web.controller('ApiController', ['$http', function($http) {
	var api = this;
	api.system = [];
	
	setInterval(function() {
		$http.get('/api/data?system.status').success(function(data) {
			api.system = data[0];
		});
	}, 3000);
}]);



// ----------
// Directives
// ----------

// status-header directive
web.directive('statusHeader', function() {
	return {
		restrict: 'E',
		templateUrl: '/html/status-header.html'
	};
});


// web-header directive
web.directive('webHeader', function () {
	return {
		restrict: 'E',
		templateUrl: '/html/web-header.html',
		controller: function() {
			this.value = 0;

			// select menu
			this.set = function(val) {
				this.value = val;
			}

			// is selected?
			this.is = function(val) {
				return this.value === val;
			}
		},
		controllerAs: 'menu'
	};
});


// web-footer directive
web.directive('webFooter', function() {
	return {
		restrict: 'E',
		templateUrl: '/html/web-footer.html'
	};
});
