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
web.directive('statusSystem', ['$http', function($http) {
	return {
		restrict: 'E',
		templateUrl: '/html/status-system.html',
		controller: function() {
			var obj = this;
			obj.status = {
				'name': '-',
				'tmpdir': '-',
				'time': '-',
				'uptime': '-',
				'mem': {
					'free': '-',
					'total': '-'
				},
				'load': '-',
				'os': {
					'type': '-',
					'release': '-',
					'platform': '-'
				},
				'cpu': {
					'type': [],
					'arch': '-',
					'endian': '-'
				},
				'network': []
			};

			var ctx = document.getElementById("myChart").getContext("2d");
			var myNewChart = new Chart(ctx).Line({
				labels: ["January", "February", "March", "April", "May", "June", "July"],
				datasets: [
				{
					label: "My First dataset",
					fillColor: "rgba(220,220,220,0.2)",
					strokeColor: "rgba(220,220,220,1)",
					pointColor: "rgba(220,220,220,1)",
					pointStrokeColor: "#fff",
					pointHighlightFill: "#fff",
					pointHighlightStroke: "rgba(220,220,220,1)",
					data: [65, 59, 80, 81, 56, 55, 40]
				},
				{
					label: "My Second dataset",
					fillColor: "rgba(151,187,205,0.2)",
					strokeColor: "rgba(151,187,205,1)",
					pointColor: "rgba(151,187,205,1)",
					pointStrokeColor: "#fff",
					pointHighlightFill: "#fff",
					pointHighlightStroke: "rgba(151,187,205,1)",
					data: [28, 48, 40, 19, 86, 27, 90]
				}
				]
			}, {});
	
			setInterval(function() {
				$http.get('/api/data?system.status').success(function(data) {
					obj.status = data[0];
				});
			}, 3000);
		},
		controllerAs: 'stSys'
	};
}]);


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
