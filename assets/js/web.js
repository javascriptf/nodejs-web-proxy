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

// status-system directive
web.directive('statusSystem', function() {
	return {
		restrict: 'E',
		templateUrl: '/html/status-system.html'
	};
});


// status-header directive
web.directive('statusHeader', function() {
	return {
		restrict: 'E',
		templateUrl: '/html/status-header.html',
		controller: function() {
			var obj = this;
			obj.menu = { 'value': 0 };
			obj.button = { 'value': false };

			// select menu
			this.menu.select = function(val) {
				obj.menu.value = val;
			};

			// is menu selected?
			this.menu.is = function(val) {
				return obj.menu.value === val;
			};

			// toggle button
			this.button.toggle = function() {
				obj.button.value = !obj.button.value;
			};

			// is button selected?
			this.button.is = function() {
				return obj.button.value;
			};
		},
		controllerAs: 'stHdr'
	};
});


// web-header directive
web.directive('webHeader', function () {
	return {
		restrict: 'E',
		templateUrl: '/html/web-header.html',
		controller: function() {
			var obj = this;
			obj.value = 0;

			// select menu
			this.select = function(val) {
				obj.value = val;
			}

			// is selected?
			this.is = function(val) {
				return obj.value === val;
			}
		},
		controllerAs: 'webHdr'
	};
});


// web-footer directive
web.directive('webFooter', function() {
	return {
		restrict: 'E',
		templateUrl: '/html/web-footer.html'
	};
});
