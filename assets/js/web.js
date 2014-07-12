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
	's':      1,
	'min':    1 / 60,
	'hr':     1 / (60*60),
	'day(s)': 1 / (60*60*24),

	// fraction
	'%': 100
};



// charting options
app.chart = {};
app.chart.datasets = [
    {
        label:                "Item 1",
        fillColor:            "rgba(220,220,220,0.2)",
        strokeColor:          "rgba(220,220,220,1)",
        pointColor:           "rgba(220,220,220,1)",
        pointStrokeColor:     "#fff",
        pointHighlightFill:   "#fff",
        pointHighlightStroke: "rgba(220,220,220,1)",
        data: []
    },
    {
        label:                "Item 2",
        fillColor:            "rgba(151,187,205,0.2)",
        strokeColor:          "rgba(151,187,205,1)",
        pointColor:           "rgba(151,187,205,1)",
        pointStrokeColor:     "#fff",
        pointHighlightFill:   "#fff",
        pointHighlightStroke: "rgba(151,187,205,1)",
        data: []
    }
];



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
		return (data*sf).toPrecision(precis);
	}

	// process array
	for (var i=data.length-1; i>=0; i--) {
		data[i] = (data[i]*sf).toPrecision(precis);
	};
	return data;
}



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
		controller: function($scope) {

			// initialize
			var o = $scope;
			o.value = 0;

			// select menu
			o.select = function(val) {
				o.value = val;
			}

			// is selected?
			o.is = function(val) {
				return o.value === val;
			}
		}
	};
});



// status-header directive
web.directive('statusHeader', function() {
	return {

		// use controller scope
		scope: true,

		// use element only
		restrict: 'E',

		// content from html
		templateUrl: '/html/status-header.html',

		// controller function
		controller: function($scope) {

			// initialize
			var o = $scope;
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
		}
	};
});



// status-system directive
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

            
            
			// format status data (scale)
			o.formatStatus = function() {
				o.status.time   = app.formatData(o.status.time,   'hr', 3);
				o.status.uptime = app.formatData(o.status.uptime, 'hr', 3);
				o.status.load = app.formatData(o.status.load, '%', 3);
				o.status.mem.free  = app.formatData(o.status.mem.free,  'GB', 3);
				o.status.mem.total = app.formatData(o.status.mem.total, 'GB', 3);
			};

            
            
			// format history data (scale)
			o.formatHistory = function() {
				app.formatData(o.history.time, 'hr', 4);
				app.formatData(o.history.load, '%', 4)
				app.formatData(o.history.mem.free, 'GB', 4);
			};

            
            
			// update system status
			o.updateStatus = function() {
				$http.get('/api/data?system.status').success(function(data) {

					// initialize and format
					o.status = data[0];
					o.formatStatus();
				});
			};

            
            
            // update system history
            o.updateHistory = function() {
                $http.get('/api/data?system.history').success(function(data) {
                   
                    // initialize and format
                    o.history = data[0];
                    o.formatHistory();
                    
                    // create charts
                    if(!o.loadChart) {
                        
                        // get canvas functionality
                        
                        // set chart options
                        var options = {
                            labels: o.history.time,
                            datasets: [app.objbuild.copy([app.chart.datasets[0]])]
                        };
                        
                        // initialize line chart
                        $('#systemLoadChart').highcharts({
                            chart: {
                                type: 'area'
                            },
                            title: {
                                text: 'US and USSR nuclear stockpiles'
                            },
                            subtitle: {
                                text: 'Source: <a href="http://thebulletin.metapress.com/content/c4120650912x74k7/fulltext.pdf">'+
                                    'thebulletin.metapress.com</a>'
                            },
                            xAxis: {
                                allowDecimals: false,
                                labels: {
                                    formatter: function() {
                                        return this.value; // clean, unformatted number for year
                                    }
                                }
                            },
                            yAxis: {
                                title: {
                                    text: 'Nuclear weapon states'
                                },
                                labels: {
                                    formatter: function() {
                                        return this.value / 1000 +'k';
                                    }
                                }
                            },
                            tooltip: {
                                pointFormat: '{series.name} produced <b>{point.y:,.0f}</b><br/>warheads in {point.x}'
                            },
                            plotOptions: {
                                area: {
                                    pointStart: 1940,
                                    marker: {
                                        enabled: false,
                                        symbol: 'circle',
                                        radius: 2,
                                        states: {
                                            hover: {
                                                enabled: true
                                            }
                                        }
                                    }
                                }
                            },
                            series: [{
                                name: 'USA',
                                data: [null, null, null, null, null, 6 , 11, 32, 110, 235, 369, 640,
                                    1005, 1436, 2063, 3057, 4618, 6444, 9822, 15468, 20434, 24126,
                                    27387, 29459, 31056, 31982, 32040, 31233, 29224, 27342, 26662,
                                    26956, 27912, 28999, 28965, 27826, 25579, 25722, 24826, 24605,
                                    24304, 23464, 23708, 24099, 24357, 24237, 24401, 24344, 23586,
                                    22380, 21004, 17287, 14747, 13076, 12555, 12144, 11009, 10950,
                                    10871, 10824, 10577, 10527, 10475, 10421, 10358, 10295, 10104 ]
                            }, {
                                name: 'USSR/Russia',
                                data: [null, null, null, null, null, null, null , null , null ,null,
                                5, 25, 50, 120, 150, 200, 426, 660, 869, 1060, 1605, 2471, 3322,
                                4238, 5221, 6129, 7089, 8339, 9399, 10538, 11643, 13092, 14478,
                                15915, 17385, 19055, 21205, 23044, 25393, 27935, 30062, 32049,
                                33952, 35804, 37431, 39197, 45000, 43000, 41000, 39000, 37000,
                                35000, 33000, 31000, 29000, 27000, 25000, 24000, 23000, 22000,
                                21000, 20000, 19000, 18000, 18000, 17000, 16000]
                            }]
                        });
                        o.loadChart.options = options;
                    }
                    
                    // drop new data into chart and update
                    // o.loadChart.options.datasets[0].data = [0, 1, 2, 3]; // o.history.load;
                    o.loadChart.update();
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
