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



// define angular module
var web = angular.module('web', []);



// function store
var app = {};



// get size in appropriate units
app.formatSize = function(val, precis) {

	// initialize
	var o = {};

	do {

		// calculate size in bytes
		o.val = val;
		o.unit = 'B';
		if(o.val < 1024) break;

		// calculate time in minutes
		o.val /= 1024;
		o.unit = 'KiB';
		if(o.val < 1024) break;
		
		// calculate time in hours
		o.val /= 1024;
		o.unit = 'MiB';
		if(o.val < 1024) break;

		// calculate time in days
		o.val /= 1024;
		o.unit = 'GiB';
	} while(null);

	// set precision
	o.val = (new Number(o.val)).toPrecision(precis);

	// return
	return o;
};



// get time in appropriate units
app.formatTime = function(val, precis) {

	// initialize
	var o = {};

	do {

		// calculate time in seconds
		o.val = val;
		o.unit = 's';
		if(o.val < 60) break;

		// calculate time in minutes
		o.val /= 60;
		o.unit = 'min';
		if(o.val < 60) break;
		
		// calculate time in hours
		o.val /= 60;
		o.unit = 'hr';
		if(o.val < 24) break;

		// calculate time in days
		o.val /= 24;
		o.unit = 'day(s)';
	} while(null);

	// set precision
	o.val = (new Number(o.val)).toPrecision(precis);

	// return
	return o;
};



// get fraction in percent
app.formatFraction = function(val, precis) {

	// initialize
	var o = {
		'val': val,
		'unit': '%'
	};

	// set precision
	o.val = (new Number(o.val)).toPrecision(precis);

	// return
	return o;
};



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

		// use element only
		restrict: 'E',

		// content from html
		templateUrl: '/html/web-header.html',
		
		// controller function
		controller: function() {

			// initialize
			var o = this;
			o.value = 0;

			// select menu
			o.select = function(val) {
				o.value = val;
			}

			// is selected?
			o.is = function(val) {
				return o.value === val;
			}
		},
		controllerAs: 'webHdr'
	};
});



// status-system directive
web.directive('statusSystem', ['$http', function($http) {
	return {

		// use element only
		restrict: 'E',

		// content from html
		templateUrl: '/html/status-system.html',

		// controller function
		controller: function() {

			// initialize
			var o = this;
			o.status = {
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
			o.history = {
				'time': [],
				'mem':  { 'free': [] },
				'load': []
			};

			o.updateStatus = function(data) {
				o.status.time = app.formatTime(data.time);
				o.status.uptime = app.formatTime(data.uptime);
				o.status.mem.total = 
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
					obj.status.time = (new Number(obj.status.time / (60*60))).toPrecision(4) + ' hr';
					obj.status.uptime = (new Number(obj.status.uptime / (60*60))).toPrecision(4) + ' hr';
					obj.status.load = (new Number(obj.status.load*100)).toPrecision(3) + ' %';
					obj.status.mem.free = (new Number(obj.status.mem.free/(1024*1024*1024))).toPrecision(3) + ' GB';
					obj.status.mem.total = (new Number(obj.status.mem.total/(1024*1024*1024))).toPrecision(3) + ' GB';
				});
			}, 5000);
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
			var o = this;
			o.menu   = { 'value': 0 };
			o.button = { 'value': false };

			// select menu
			o.menu.select = function(val) {
				o.menu.value = val;
			};

			// is menu selected?
			o.menu.is = function(val) {
				return o.menu.value === val;
			};

			// toggle button
			o.button.toggle = function() {
				o.button.value = !o.button.value;
			};

			// is button selected?
			o.button.is = function() {
				return o.button.value;
			};
		},
		controllerAs: 'stHdr'
	};
});
