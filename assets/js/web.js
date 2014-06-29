var web = angular.module('web', []);

// ----------
// Directives
// ----------

// web-header directive
web.directive('webHeader', function () {
	return {
		restrict: 'E',
		templateUrl: '/html/web-header.html'
	};
});

// web-footer directive
web.directive('webFooter', function() {
	return {
		restrict: 'E',
		templateUrl: '/html/web-footer.html'
	};
});


// -----------
// Controllers
// -----------

web.controller('ApiController', ['$http', function($http) {
	var api = this;
	api.system = [];
	
	setInterval(function() {
		$http.get('/api/system').success(function (data) {
			api.system = data;
		});
	}, 3000);
}]);
