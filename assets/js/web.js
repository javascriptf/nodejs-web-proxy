/* --------------------
 * Main Frontend Script
 * --------------------
 * 
 * This is the main frontend javascript file.
 * 
 * License:
 * Web Proxy, Copyright (c) 2010-2014, Subhajit Sahu, All Rights Reserved.
 * see: /LICENSE.txt for details.
 */



// module definition
var web = angular.module('web', []);



// application data
var app = {};

// datastore
app.data = {
	'system': {},
	'process': {},
	'proxy': {},
	'config': {},
	'log': {}
};



// unit scale values
app.format = {};
app.format.unit = {
	
	// size
	'B':  1,
	'KB': 1 / Math.pow(1024, 1),
	'MB': 1 / Math.pow(1024, 2),
	'GB': 1 / Math.pow(1024, 3),
	'TB': 1 / Math.pow(1024, 4),

	// time
	's':	  1,
	'min':	  1 / 60,
	'hr':	  1 / (60*60),
	'day(s)': 1 / (60*60*24),

	// fraction
	'%': 100
};



// charting options
app.chart = {};
app.chart.options = {
	chart: {
		backgroundColor: 'rgba(235,235,235,0.2)',
		type: 'area'
	},
	title: {
		text: '',
		x: -20 // center
	},
	xAxis: {
		title: {
			text: 'X'
		},
		categories: null
	},
	yAxis: {
		title: {
			text: 'Y'
		},
		min: 0
	},
	tooltip: {},
	legend: {
		layout: 'vertical',
		align: 'right',
		verticalAlign: 'middle',
		borderWidth: 0
	},
	series: []
};



// object builder
app.objbuild = {};

// get a deep copied, merged JSON object
app.objbuild.copy = function(arr) {
	
	// init merge string
	var mrg = '';

	// loop through array of json objects
	for(var i=0; i<arr.length; i++) {

		// stringify and concat with ','
		var str = JSON.stringify(arr[i]);
		mrg += ((i > 0)? ',':'') + str.slice(1, str.length-1);
	}

	// return parsed and merged object
	return JSON.parse('{'+mrg+'}');
}



// format a type of data
app.formatData = function(data, scale, precis) {

	// get scale factor
	var sf = (typeof scale === 'string')?
		app.format.unit[scale] : scale;

	// process single number
	if(typeof data === 'number') {
		return (data*sf);
	}

	// process array
	for (var i=data.length-1; i>=0; i--) {
		data[i] = (data[i]*sf);
	};
	return data;
}



// menu controller
web.controller('menuCtrl', ['$scope', function($scope) {

	// initialize
	var o = $scope;
	o.value = 0;

	// set menu value
	o.set = function(val) {
		o.value = val;
	}

	// get menu value
	o.get = function() {
		return o.value;
	}

	// is selected?
	o.is = function(val) {
		return o.value === val;
	}
}]);



// web-footer element directive
web.directive('webFooter', function() {
	return {

		// use element only
		restrict: 'E',

		// content from html
		templateUrl: '/html/web-footer.html'
	};
});



// web-header element directive
web.directive('webHeader', function () {
	return {

		// use controller scope
		scope: true,

		// use element only
		restrict: 'E',

		// content from html
		templateUrl: '/html/web-header.html',
		
		// controller function
		controller: 'menuCtrl'
	};
});



// status-header directive
web.directive('statusHeader', function() {
	return {

		// use element only
		restrict: 'E',

		// content from html
		templateUrl: '/html/status-header.html',
	};
});



// system-status directive
web.directive('systemStatus', ['$http', function($http) {
	return {

		// use controller scope
		scope: true,

		// use element only
		restrict: 'E',

		// content from html
		templateUrl: '/html/system-status.html',

		// controller function
		controller: function($scope) {

			// initialize
			var o = $scope;
			o.active = false;

			
			
			// format status data (scale)
			o.formatStatus = function() {
				o.status.time	= app.formatData(o.status.time,	  'hr');
				o.status.uptime = app.formatData(o.status.uptime, 'hr');
				o.status.load = app.formatData(o.status.load, '%');
				o.status.mem.free  = app.formatData(o.status.mem.free,	'GB');
				o.status.mem.total = app.formatData(o.status.mem.total, 'GB');
			};

			
			
			// format history data (scale)
			o.formatHistory = function() {
				app.formatData(o.history.time, 'hr');
				app.formatData(o.history.load, '%')
				app.formatData(o.history.mem.free, 'GB');
			};

			
			
			// update system status
			o.updateStatus = function() {
				$http.get('/api/data?system.status').success(function(data) {

					// initialize and format
					o.status = data[0];
					o.formatStatus();
				});
			};



			// initialize system load chart
			o.initLoadChart = function() {

				// set default options
				var options = app.objbuild.copy([app.chart.options]);
				options.xAxis.title.text = 'Time';
				options.yAxis.title.text = 'Load (%)';
				options.yAxis.max = 100;
				options.tooltip.formatter = function() {
					return this.y.toFixed(2)+' %';
				};
				options.series = [{ name: 'Load', data: o.history.load }];

				// create chart and set
				$('#systemLoad').highcharts(options);
				o.loadChart = $('#systemLoad').highcharts();
			};



			// initialize system memory chart
			o.initMemChart = function() {

				// set default options
				var options = app.objbuild.copy([app.chart.options]);
				options.xAxis.title.text = 'Time';
				options.yAxis.title.text = 'Memory (GB)';
				options.yAxis.max = o.status.mem.total;
				options.tooltip.formatter = function() {
					return this.y.toFixed(2)+' GB';
				};
				options.series = [{ name: 'Free', data: o.history.mem.free }];

				// create chart and set
				$('#systemMem').highcharts(options);
				o.memChart = $('#systemMem').highcharts();
			};


			
			// update system history
			o.updateHistory = function() {
				$http.get('/api/data?system.history').success(function(data) {
				   
					// initialize and format
					o.history = data[0];
					o.formatHistory();
				
					// initialize charts if required
					if(!o.loadChart) o.initLoadChart();
					if(!o.memChart) o.initMemChart();

					// update all charts
					o.loadChart.series[0].setData(o.history.load);
					o.memChart.series[0].setData(o.history.mem.free);
				});
			};



			// initialize data
			o.updateStatus();
			o.updateHistory();

			// update every 5 seconds
			setInterval(o.updateStatus, 5*1000);
			setInterval(o.updateHistory, 1*60*1000);
		}
	};
}]);



// process-status directive
web.directive('processStatus', ['$http', function($http) {
	return {

		// use controller scope
		scope: true,

		// use element only
		restrict: 'E',

		// content from html
		templateUrl: '/html/process-status.html',

		// controller function
		controller: function($scope) {

			// initialize
			var o = $scope;

			
			
			// format status data (scale)
			o.formatStatus = function() {
				o.status.time	= app.formatData(o.status.time,	  'hr');
				o.status.start  = app.formatData(o.status.start,  'hr');
				o.status.uptime = app.formatData(o.status.uptime, 'hr');
				o.status.mem.rss        = app.formatData(o.status.mem.rss,	      'MB');
				o.status.mem.heap.used  = app.formatData(o.status.mem.heap.used,  'MB');
				o.status.mem.heap.total = app.formatData(o.status.mem.heap.total, 'MB');
				if(o.status.env['Path']) o.status.env['Path'] = o.status.env['Path'].replace(/;/g, '; ');
			};

			
			
			// format history data (scale)
			o.formatHistory = function() {
				app.formatData(o.history.time, 'hr');
				app.formatData(o.history.mem.rss,        'MB');
				app.formatData(o.history.mem.heap.used,  'MB');
				app.formatData(o.history.mem.heap.total, 'MB');
			};

			
			
			// update process status
			o.updateStatus = function() {
				$http.get('/api/data?process.status').success(function(data) {

					// initialize and format
					o.status = data[0];
					o.formatStatus();
				});
			};


			// initialize process memory chart
			o.initMemChart = function() {

				// set default options
				var options = app.objbuild.copy([app.chart.options]);
				options.xAxis.title.text = 'Time';
				options.yAxis.title.text = 'Memory (MB)';
				options.tooltip.formatter = function() {
					return this.y.toFixed(2)+' MB';
				};
				options.series = [
					{ name: 'RSS', data: o.history.mem.rss },
					{ name: 'Heap Total', data: o.history.mem.heap.total },
					{ name: 'Heap Used', data: o.history.mem.heap.used }
				];

				// create chart and set
				$('#processMem').highcharts(options);
				o.memChart = $('#processMem').highcharts();
			};


			
			// update process history
			o.updateHistory = function() {
				$http.get('/api/data?process.history').success(function(data) {
				   
					// initialize and format
					o.history = data[0];
					o.formatHistory();
				
					// initialize charts if required
					if(!o.memChart) o.initMemChart();

					// update all charts
					o.memChart.series[0].setData(o.history.mem.rss, false);
					o.memChart.series[1].setData(o.history.mem.heap.total, false);
					o.memChart.series[2].setData(o.history.mem.heap.used, true);
				});
			};



			// initialize data
			o.updateStatus();
			o.updateHistory();

			// update every 5 seconds
			setInterval(o.updateStatus, 5*1000);
			setInterval(o.updateHistory, 1*60*1000);
		}
	};
}]);



// request-details directive
web.directive('requestDetails', function() {
	return {

		// use element only
		restrict: 'E',

		// content from html
		templateUrl: '/html/request-details.html',
	};
});



// response-details directive
web.directive('responseDetails', function() {
	return {

		// use element only
		restrict: 'E',

		// content from html
		templateUrl: '/html/response-details.html',
	};
});



// proxy-status directive
web.directive('proxyStatus', ['$http', function($http) {
	return {

		// use controller scope
		scope: true,

		// use element only
		restrict: 'E',

		// content from html
		templateUrl: '/html/proxy-status.html',

		// controller function
		controller: function($scope) {

			// initialize
			var o = $scope;

			
			
			// update proxy status
			o.updateStatus = function() {
				$http.get('/api/data?proxy.status&proxy.record').success(function(data) {

					// initialize
					o.status = data[0];
					o.record = data[1]
				});
			};



			// initialize proxy client chart
			o.initClientChart = function() {

				// set default options
				var options = app.objbuild.copy([app.chart.options]);
				options.xAxis.title.text = 'Time';
				options.yAxis.title.text = 'Number';
				options.tooltip.formatter = function() {
					return this.y+'';
				};
				options.series = [
					{ name: 'Requests', data: o.history.client.request },
					{ name: 'Responses', data: o.history.client.response }
				];

				// create chart and set
				$('#proxyClient').highcharts(options);
				o.clientChart = $('#proxyClient').highcharts();
			};



			// initialize proxy proxy chart
			o.initProxyChart = function() {

				// set default options
				var options = app.objbuild.copy([app.chart.options]);
				options.xAxis.title.text = 'Time';
				options.yAxis.title.text = 'Number';
				options.tooltip.formatter = function() {
					return this.y+'';
				};
				options.series = [
					{ name: 'Requests', data: o.history.proxy.request },
					{ name: 'Responses', data: o.history.proxy.response }
				];

				// create chart and set
				$('#proxyProxy').highcharts(options);
				o.proxyChart = $('#proxyProxy').highcharts();
			};


			
			// update proxy history
			o.updateHistory = function() {
				$http.get('/api/data?proxy.history').success(function(data) {
				   
					// initialize and format
					o.history = data[0];
				
					// initialize charts if required
					if(!o.clientChart) o.initClientChart();
					if(!o.proxyChart) o.initProxyChart();

					// update all charts
					o.clientChart.series[0].setData(o.history.client.request, false);
					o.clientChart.series[1].setData(o.history.client.response, false);
					o.proxyChart.series[0].setData(o.history.proxy.request, false);
					o.proxyChart.series[1].setData(o.history.proxy.response, true);
				});
			};



			// initialize data
			o.updateStatus();
			o.updateHistory();

			// update every 5 seconds
			setInterval(o.updateStatus, 1*60*1000);
			setInterval(o.updateHistory, 1*60*1000);
		}
	};
}]);



// log-status directive
web.directive('logStatus', ['$http', function($http) {
	return {

		// use controller scope
		scope: true,

		// use element only
		restrict: 'E',

		// content from html
		templateUrl: '/html/log-status.html',

		// controller function
		controller: function($scope) {

			// initialize
			var o = $scope;



			// update logs
			o.update = function() {
				$http.get('/api/data?log.data').success(function(data) {

					// initialize
					o.data = data[0];
				});
			};



			// initialize data
			o.update();

			// update every 5 seconds
			setInterval(o.update, 5*1000);
		}
	};
}]);



// config-status directive
web.directive('configStatus', ['$http', function($http) {
	return {

		// use controller scope
		scope: true,

		// use element only
		restrict: 'E',

		// content from html
		templateUrl: '/html/config-status.html',

		// controller function
		controller: function($scope) {

			// initialize
			var o = $scope;



			// update logs
			o.update = function() {
				$http.get('/api/data?config').success(function(data) {

					// initialize
					o.data = data[0];
				});
			};



			// initialize data
			o.update();
		}
	};
}]);
